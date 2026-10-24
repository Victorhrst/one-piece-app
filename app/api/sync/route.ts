import arcsSource from "../../../content/arcs.json";
import curatedCrews from "../../../content/crews.json";
import curatedCharacters from "../../../content/characters.json";
import curatedFruits from "../../../content/fruits.json";
import curatedShips from "../../../content/ships.json";
import fruitTimelineSource from "../../../content/fruits-timeline.json";
import characterLoreSource from "../../../content/character-lore.json";
import { arcForChapter, chapterFromAppearance, DATA_SOURCE, getDb, jsonResponse, localized, numeric, rowsFromPayload, safeLabel, type ArcRecord } from "../_lib";

const ONEPIECE_API = "https://onepieceapi.com/api";
const EPISODE_API = "https://api.api-onepiece.com/v2";
const NOW = () => new Date().toISOString();
const SAFE_REMOTE_IMAGE = /^https:\/\//i;
const IMAGE_LOOKUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
const IMAGE_RETRY_INTERVAL_MS = 10 * 60 * 1000;
const FANDOM_IMAGE_TIMEOUT_MS = 3500;
const FANDOM_IMAGE_CONCURRENCY = 6;
const curatedCharacterImages: Record<string, FandomImage> = {
  donquixotedoflamingo: {
    image: "https://static.wikia.nocookie.net/onepiece/images/7/7e/Donquixote_Doflamingo_Anime_Infobox.png/revision/latest?cb=20220521220453&path-prefix=es",
    sourceUrl: "https://onepiece.fandom.com/es/wiki/Donquixote_Doflamingo",
  },
};

type ApiRecord = Record<string, unknown>;
type FandomImage = { image: string; sourceUrl: string };
type FandomImageTarget = { key: string; titles: string[] };
type CuratedCrew = { name: string; description: string; tag?: string; knownAt: number; members: [string, string, number][]; achievements?: { chapter: number; text: string }[] };
type CuratedCharacter = [string, string, string, number];
type CuratedCharacterLore = { name: string; aliases?: string[]; role?: string; group?: string; knownAt: number; firstChapter: number };
type CuratedFruit = { name: string; firstSeen?: number; firstChapter?: number; knownAs?: string; canonStatus?: string; typeHistory?: { from: number; label: string }[]; user?: string; apiNames?: string[]; apiName?: string; apiModel?: string | null };
type CuratedShip = { id: string; name: string; aliases?: string[]; firstChapter: number; crewId?: string; type?: string; description?: string; achievements?: { chapter: number; text: string }[] };

const arcs = arcsSource as ArcRecord[];
const crews = curatedCrews as CuratedCrew[];
const knownCharacters = curatedCharacters as CuratedCharacter[];
const characterLore = characterLoreSource as CuratedCharacterLore[];
const curatedPeople = Array.from(new Map([
  ...knownCharacters.map((row) => [normalize(row[0]), row] as const),
  ...crews.flatMap((crew) => crew.members.map(([name, role, knownAt]) => [normalize(name), [name, role, crew.name, knownAt] as CuratedCharacter] as const)),
  ...characterLore.map((row) => [normalize(row.name), [row.name, row.role ?? "Personnage", row.group ?? "Personnage", row.knownAt] as CuratedCharacter] as const),
]).values());
const timelineRows = fruitTimelineSource as [number, string, string?, string?, string?][];
const timelineFruits: CuratedFruit[] = timelineRows.map(([firstChapter, name, model, user, canonStatus]) => {
  const modelMatch = name.match(/, modèle (.+)$/i);
  const apiModel = model || (modelMatch ? modelMatch[1] : null);
  const apiName = modelMatch ? name.slice(0, modelMatch.index).trim() : name;
  return { name, firstChapter, apiName, apiModel, user: user || undefined, canonStatus: canonStatus || undefined };
});
const curatedFruitEntries = (curatedFruits as CuratedFruit[]).map((known) => {
  const timeline = timelineFruits.find((fruit) => normalize(fruit.name) === normalize(known.name));
  return timeline ? Object.assign({}, timeline, known, { firstChapter:known.firstChapter ?? timeline.firstChapter, apiName:timeline.apiName, apiModel:timeline.apiModel }) : known;
});
const knownFruits = curatedFruitEntries.concat(timelineFruits.filter((fruit) => !curatedFruitEntries.some((known) => normalize(known.name) === normalize(fruit.name))));
const knownShips = curatedShips as CuratedShip[];

function isMissingShipsTable(error: unknown) {
  return error instanceof Error && /no such table:\s*ships\b/i.test(error.message);
}

async function shipsTableExists(db: D1Database) {
  try {
    await db.prepare("SELECT 1 FROM ships LIMIT 1").first();
    return true;
  } catch (error) {
    if (isMissingShipsTable(error)) return false;
    throw error;
  }
}

function normalize(value: unknown) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function safeImage(value: unknown): string | null {
  if (typeof value !== "string" || !SAFE_REMOTE_IMAGE.test(value)) return null;
  try { return new URL(value).toString(); } catch { return null; }
}

function sourceId(item: ApiRecord, prefix: string, name: string) {
  const id = safeLabel(item.id);
  return id || `${prefix}:${normalize(name)}`;
}

async function fetchJson(url: string, timeout = 20000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { headers: { Accept: "application/json" }, signal: controller.signal });
    if (!response.ok) {
      const detail = (await response.text()).replace(/\s+/g, " ").slice(0, 180);
      throw new Error(`La source a répondu ${response.status}${detail ? ` : ${detail}` : "."}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchPaged(resource: string, maxPages = 80, pageSize = 50): Promise<ApiRecord[]> {
  const all: ApiRecord[] = [];
  for (let page = 1; page <= maxPages; page += 3) {
    const pages = [page, page + 1, page + 2].filter((value) => value <= maxPages);
    const timeout = resource === "characters" || resource === "devil-fruits" ? 30000 : 20000;
    const results = await Promise.allSettled(pages.map(async (number) => rowsFromPayload(await fetchJson(`${ONEPIECE_API}/${resource}?limit=${pageSize}&page=${number}`, timeout)) as ApiRecord[]));
    const rejected = results.filter((result): result is PromiseRejectedResult => result.status === "rejected");
    const fulfilled = results.filter((result): result is PromiseFulfilledResult<ApiRecord[]> => result.status === "fulfilled");
    for (const result of fulfilled) all.push(...result.value);
    if (!fulfilled.length) {
      if (!all.length) throw rejected[0]?.reason ?? new Error(`La source ${resource} n’a renvoyé aucun résultat.`);
      break;
    }
    // A failed page must not discard the other successful pages in its batch.
    // Continue past it, and stop only after a complete batch reaches the end.
    if (!rejected.length && fulfilled.some((result) => result.value.length < pageSize)) break;
  }
  return all;
}

function findArcId(chapter: number | null) {
  return arcForChapter(chapter, arcs)?.id ?? null;
}

function curatedFruit(name: string, model: string) {
  const keys = [name, model].map(normalize).filter(Boolean);
  const sourceName = normalize(name);
  const sourceModel = normalize(model);
  const modelKnown = sourceModel && sourceModel !== "unknown" && sourceModel !== "inconnu";
  const modeledFruit = knownFruits.find((fruit) => {
    if (!fruit.apiModel) return false;
    const expectedModel = normalize(fruit.apiModel);
    const canonicalName = normalize(fruit.name);
    const apiName = normalize(fruit.apiName);
    const nameMatches = sourceName === apiName || sourceName === canonicalName || (sourceModel && apiName && sourceName.indexOf(apiName) === 0 && sourceName.indexOf(sourceModel) >= 0);
    return Boolean(nameMatches && (modelKnown ? sourceModel === expectedModel : sourceName === canonicalName));
  });
  if (modeledFruit) return modeledFruit;
  if (modelKnown) return null;
  return knownFruits.find((fruit) => !fruit.apiModel && [fruit.name, ...(fruit.apiNames ?? [])].map(normalize).some((key) => keys.includes(key))) ?? null;
}

function curatedShip(name: string) {
  const key = normalize(name);
  return knownShips.find((ship) => [ship.name, ...(ship.aliases ?? [])].some((alias) => normalize(alias) === key)) ?? null;
}

function localizedVariants(value: unknown): string[] {
  if (typeof value === "string") return value.trim() ? [value.trim()] : [];
  if (!value || typeof value !== "object") return [];
  return [...new Set(Object.values(value as ApiRecord).filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim()))];
}

function fandomLocalizedVariants(value: unknown): string[] {
  if (typeof value === "string") return value.trim() ? [value.trim()] : [];
  if (!value || typeof value !== "object") return [];
  const record = value as ApiRecord;
  return [...new Set(["romaji", "en", "fr", "jp"].map((key) => record[key]).filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim()))];
}

function fandomTitleCandidates(names: string[], models: string[] = []): string[] {
  const titles: string[] = [];
  const add = (value: string) => {
    const title = value.trim().replace(/_/g, " ").replace(/,\s*mod[eè]le\s+/i, ", Model: ").replace(/,\s*model\s+(?!:)/i, ", Model: ");
    if (!title || /fruit (?:zoan )?non nomm|fruit aperçu|pouvoir de fruit non nommé|utilisateur à confirmer/i.test(title)) return;
    if (!titles.some((existing) => normalize(existing) === normalize(title))) titles.push(title);
  };

  const nameList = [...new Set(names.map((name) => name.trim()).filter(Boolean))];
  const modelList = [...new Set(models.map((model) => model.trim()).filter(Boolean))];
  for (const name of nameList) {
    add(name);
    const base = name.replace(/,\s*(?:mod[eè]le|model)\s*:?\s*.+$/i, "");
    for (const model of modelList) add(`${base}, Model: ${model}`);
    if (titles.length >= 4) break;
  }
  return titles.slice(0, 4);
}

async function fetchFandomImageFallbacks(targets: FandomImageTarget[]): Promise<Map<string, FandomImage>> {
  const titleTargets = new Map<string, FandomImageTarget[]>();
  const titleLabels = new Map<string, string>();
  for (const target of targets) {
    for (const title of target.titles) {
      const key = normalize(title);
      if (!key) continue;
      titleLabels.set(key, title);
      const existing = titleTargets.get(key) ?? [];
      if (!existing.some((item) => item.key === target.key)) existing.push(target);
      titleTargets.set(key, existing);
    }
  }
  const titles = [...titleLabels.values()];
  const chunks: string[][] = [];
  for (let offset = 0; offset < titles.length; offset += 50) chunks.push(titles.slice(offset, offset + 50));
  const images = new Map<string, FandomImage>();

  for (let offset = 0; offset < chunks.length; offset += FANDOM_IMAGE_CONCURRENCY) {
    const results = await Promise.allSettled(chunks.slice(offset, offset + FANDOM_IMAGE_CONCURRENCY).map(async (chunk) => {
      const params = new URLSearchParams({ action: "query", format: "json", prop: "pageimages", piprop: "thumbnail|original", pithumbsize: "900", redirects: "1", titles: chunk.join("|") });
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FANDOM_IMAGE_TIMEOUT_MS);
      try {
        const response = await fetch(`https://onepiece.fandom.com/api.php?${params}`, {
          headers: { Accept: "application/json", "User-Agent": "GrandLineWiki/1.0 (One Piece reference catalog; image attribution links included)" },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Fandom a répondu ${response.status}.`);
        return await response.json() as { query?: { redirects?: { from: string; to: string }[]; pages?: Record<string, { title?: string; pageimage?: string; thumbnail?: { source?: string }; original?: { source?: string } }> } };
      } finally {
        clearTimeout(timer);
      }
    }));

    for (const result of results) {
      if (result.status !== "fulfilled") continue;
      for (const page of Object.values(result.value.query?.pages ?? {})) {
        const titleKey = normalize(page.title);
        const image = page.thumbnail?.source ?? page.original?.source;
        // PageImages already returns images for the exact queried/redirected page.
        // Requiring the image filename to contain the article title rejected valid
        // infobox artwork (the wiki often uses unrelated upload names).
        if (!titleKey || !image || !SAFE_REMOTE_IMAGE.test(image)) continue;
        const sourceUrl = `https://onepiece.fandom.com/wiki/${encodeURIComponent(String(page.title).replace(/ /g, "_"))}`;
        const pageAliases = [titleKey, ...(result.value.query?.redirects ?? []).flatMap((redirect) => normalize(redirect.to) === titleKey ? [normalize(redirect.from), normalize(redirect.to)] : [])];
        for (const alias of pageAliases) {
          for (const target of titleTargets.get(alias) ?? []) {
            if (!images.has(target.key)) images.set(target.key, { image, sourceUrl });
          }
        }
      }
    }
  }
  return images;
}

function curatedFruitForItem(item: ApiRecord) {
  const names = localizedVariants(item.name);
  const models = ["", ...localizedVariants(item.model)];
  for (const name of names) {
    for (const model of models) {
      const match = curatedFruit(name, model);
      if (match) return match;
    }
  }
  return null;
}

function curatedCharacterProfile(name: string) {
  const key = normalize(name);
  return characterLore.find((item) => normalize(item.name) === key || (item.aliases ?? []).some((alias) => normalize(alias) === key)) ?? null;
}

function curatedCharacter(name: string) {
  const key = normalize(name);
  const direct = curatedPeople.find((item) => normalize(item[0]) === key);
  if (direct) return direct;
  const profile = curatedCharacterProfile(name);
  return profile ? curatedPeople.find((item) => normalize(item[0]) === normalize(profile.name)) ?? null : null;
}

function curatedCrew(name: string) {
  const key = normalize(name);
  const aliases: Record<string, string[]> = {
    "straw-hats": ["Straw Hat Pirates", "Straw Hat Crew", "Mugiwara Pirates"], "red-hair": ["Red Hair Pirates"], "buggy": ["Buggy Pirates"],
    "black-cat": ["Black Cat Pirates"], "krieg": ["Krieg Pirates"], "arlong": ["Arlong Pirates"], "baroque": ["Baroque Works"],
    "giant-warriors": ["Giant Warrior Pirates", "Giant Warriors"], "blackbeard": ["Blackbeard Pirates"], "whitebeard": ["Whitebeard Pirates"],
    "kuja": ["Kuja Pirates"], "heart": ["Heart Pirates"], "kid": ["Kid Pirates"], "donquixote": ["Donquixote Pirates"],
    "grand-fleet": ["Straw Hat Grand Fleet"], "firetank": ["Fire Tank Pirates", "Firetank Pirates"], "big-mom": ["Big Mom Pirates"],
    "beasts": ["Beasts Pirates", "Animal Kingdom Pirates"], "roger": ["Roger Pirates"], "sun-pirates": ["Sun Pirates"],
    "moria": ["Thriller Bark Pirates", "Moria Pirates"], "foxy": ["Foxy Pirates"], "rumbar": ["Rumbar Pirates"], "germa": ["Germa 66"],
    "hawkins": ["Hawkins Pirates"], "bonney": ["Bonney Pirates"], "cross-guild": ["Cross Guild"], "drake": ["Drake Pirates"],
    "gyro-pirates": ["Gyro Pirates"], "fake-straw-hat-crew": ["Fake Straw Hat Crew"], "peachbeard-pirates": ["Peachbeard Pirates"],
  };
  return crews.find((item) => normalize(item.name) === key || (aliases[item.id] ?? []).some((alias) => normalize(alias) === key)) ?? null;
}

async function runBatch(db: D1Database, statements: D1PreparedStatement[]) {
  for (let offset = 0; offset < statements.length; offset += 50) {
    await db.batch(statements.slice(offset, offset + 50));
  }
}

async function upsertSyncState(db: D1Database, source: string, count: number) {
  await db.prepare("INSERT INTO sync_state (source, synced_at, record_count, status) VALUES (?, ?, ?, 'ok') ON CONFLICT(source) DO UPDATE SET synced_at=excluded.synced_at, record_count=excluded.record_count, status='ok'")
    .bind(source, NOW(), count).run();
}

async function importArcs(db: D1Database) {
  const statements = arcs.map((arc, index) => db.prepare("INSERT INTO arcs (id, name, saga, sort_order, chapter_start, chapter_end, episode_start, episode_end) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, saga=excluded.saga, sort_order=excluded.sort_order, chapter_start=excluded.chapter_start, chapter_end=excluded.chapter_end, episode_start=excluded.episode_start, episode_end=excluded.episode_end")
    .bind(arc.id, arc.name, arc.saga, index, arc.chapterStart, arc.chapterEnd, arc.episodeStart, arc.episodeEnd));
  await runBatch(db, statements);
}

async function importCharacters(db: D1Database, items: ApiRecord[]) {
  const now = NOW();
  const imageTargets: FandomImageTarget[] = items.filter((item) => !safeImage(item.image_url)).map((item) => {
    const name = localized(item.name);
    const curated = curatedCharacter(name);
    const profile = curatedCharacterProfile(name);
    return { key: `character:${sourceId(item, "character", name)}`, titles: [...new Set([...localizedVariants(item.name), ...(curated ? [curated[0]] : []), ...(profile?.aliases ?? [])])] };
  }).filter((target) => target.titles.length > 0);
  const importedNames = new Set(items.map((item) => normalize(localized(item.name))));
  for (const [name] of curatedPeople) {
    if (!importedNames.has(normalize(name))) {
      const profile = curatedCharacterProfile(name);
      imageTargets.push({ key: `curated-character:${normalize(name)}`, titles: [...new Set([name, ...(profile?.aliases ?? [])])] });
    }
  }
  const fandomImages = await fetchFandomImageFallbacks(imageTargets);
  const statements = items.flatMap((item) => {
    const name = localized(item.name);
    if (!name) return [];
    const extra = (item.extra_data && typeof item.extra_data === "object" ? item.extra_data : {}) as ApiRecord;
    const curatedProfile = curatedCharacterProfile(name);
    const chapter = curatedProfile?.firstChapter ?? chapterFromAppearance(extra.first_appearance);
    const arcId = findArcId(chapter);
    const curated = curatedCharacter(name);
    const description = curated ? curated[1] : chapter ? `Première apparition manga : chapitre ${chapter}.` : "Personnage répertorié par une base communautaire; repère narratif à confirmer.";
    const key = sourceId(item, "character", name);
    const fandomImage = fandomImages.get(`character:${key}`);
    const curatedImage = curatedCharacterImages[normalize(curatedProfile?.name ?? name)];
    const image = safeImage(item.image_url) ?? fandomImage?.image ?? curatedImage?.image ?? null;
    const imageSource = safeImage(item.image_url) ? DATA_SOURCE : fandomImage?.sourceUrl ?? curatedImage?.sourceUrl ?? DATA_SOURCE;
    return [db.prepare("INSERT INTO characters (id, name, image_url, description, first_chapter, first_arc_id, source_url, source_payload, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, image_url=COALESCE(excluded.image_url, characters.image_url), description=COALESCE(excluded.description, characters.description), first_chapter=COALESCE(excluded.first_chapter, characters.first_chapter), first_arc_id=COALESCE(excluded.first_arc_id, characters.first_arc_id), source_url=excluded.source_url, source_payload=excluded.source_payload, updated_at=excluded.updated_at")
      .bind(key, name, image, description, chapter, arcId, imageSource, JSON.stringify(item), now)];
  });
  for (const [name] of curatedPeople) {
    if (importedNames.has(normalize(name))) {
      const curatedId = `curated-character:${normalize(name)}`;
      statements.push(db.prepare("DELETE FROM affiliation_members WHERE character_id=?").bind(curatedId));
      statements.push(db.prepare("DELETE FROM characters WHERE id=?").bind(curatedId));
    }
  }
  for (const [name, role, group, knownAt] of curatedPeople) {
    if (importedNames.has(normalize(name))) continue;
    const key = normalize(name);
    const arc = arcs[knownAt];
    const chapter = curatedCharacterProfile(name)?.firstChapter ?? arc?.chapterStart ?? null;
    const image = fandomImages.get(`curated-character:${key}`) ?? curatedCharacterImages[normalize(curatedCharacterProfile(name)?.name ?? name)];
    statements.push(db.prepare("INSERT INTO characters (id, name, image_url, description, first_chapter, first_arc_id, source_url, source_payload, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, '{}', ?) ON CONFLICT(id) DO UPDATE SET image_url=COALESCE(excluded.image_url, characters.image_url), description=excluded.description, first_chapter=excluded.first_chapter, first_arc_id=excluded.first_arc_id, source_url=CASE WHEN excluded.image_url IS NOT NULL THEN excluded.source_url ELSE characters.source_url END, updated_at=excluded.updated_at")
      .bind(`curated-character:${key}`, name, image?.image ?? null, `${role} · ${group}`, chapter, findArcId(chapter) ?? arc?.id ?? null, image?.sourceUrl ?? "https://onepiece.fandom.com/wiki/Category:Characters", now));
  }
  await runBatch(db, statements);
  return { count: items.length || curatedPeople.length, imageCount: fandomImages.size };
}

async function importFruits(db: D1Database, items: ApiRecord[]) {
  const now = NOW();
  const hasSourceRecord = (fruit: CuratedFruit) => items.some((item) => curatedFruitForItem(item)?.name === fruit.name);
  const imageTargets: FandomImageTarget[] = items.filter((item) => !safeImage(item.image_url)).map((item) => {
    const curated = curatedFruitForItem(item);
    return {
      key: `api:${sourceId(item, "fruit", localized(item.name))}`,
      titles: fandomTitleCandidates(
        [...(curated ? [curated.name, curated.apiName ?? "", ...(curated.apiNames ?? [])] : []), ...fandomLocalizedVariants(item.name)],
        [...(curated?.apiModel ? [curated.apiModel] : []), ...fandomLocalizedVariants(item.model)],
      ),
    };
  }).filter((target) => target.titles.length > 0);
  for (const fruit of knownFruits) {
    if (hasSourceRecord(fruit)) continue;
    imageTargets.push({
      key: `curated:${normalize(fruit.name)}`,
      titles: fandomTitleCandidates([fruit.name, fruit.apiName ?? "", ...(fruit.apiNames ?? [])], fruit.apiModel ? [fruit.apiModel] : []),
    });
  }
  const fandomImages = await fetchFandomImageFallbacks(imageTargets);
  const statements = items.flatMap((item) => {
    const name = localized(item.name);
    if (!name) return [];
    const model = localized(item.model);
    const curated = curatedFruitForItem(item);
    const extra = (item.extra_data && typeof item.extra_data === "object" ? item.extra_data : {}) as ApiRecord;
    const chapter = curated ? (curated.firstChapter ?? (curated.firstSeen == null ? null : arcs[curated.firstSeen]?.chapterStart) ?? null) : chapterFromAppearance(extra.first_appearance);
    const arcId = curated && curated.firstSeen != null ? (arcs[curated.firstSeen]?.id ?? findArcId(chapter)) : findArcId(chapter);
    const description = curated?.knownAs ?? (curated ? `Fruit connu depuis le chapitre ${chapter}.` : null);
    const canonStatus = curated?.canonStatus ?? (curated ? "Canon manga" : "À confirmer");
    const key = `api:${sourceId(item, "fruit", name)}`;
    const fandomImage = fandomImages.get(key);
    const image = safeImage(item.image_url) ?? fandomImage?.image ?? null;
    const imageSource = safeImage(item.image_url) ? DATA_SOURCE : fandomImage?.sourceUrl ?? DATA_SOURCE;
    return [db.prepare("INSERT INTO devil_fruits (id, name, model, type, sub_type, image_url, first_chapter, first_arc_id, canon_status, description, source_url, source_payload, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, model=excluded.model, type=excluded.type, sub_type=excluded.sub_type, image_url=COALESCE(excluded.image_url, devil_fruits.image_url), first_chapter=COALESCE(excluded.first_chapter, devil_fruits.first_chapter), first_arc_id=COALESCE(excluded.first_arc_id, devil_fruits.first_arc_id), canon_status=CASE WHEN excluded.canon_status='Canon manga' THEN excluded.canon_status ELSE devil_fruits.canon_status END, description=COALESCE(excluded.description, devil_fruits.description), source_url=CASE WHEN excluded.image_url IS NOT NULL THEN excluded.source_url ELSE devil_fruits.source_url END, source_payload=excluded.source_payload, updated_at=excluded.updated_at")
      .bind(sourceId(item, "fruit", name), curated?.name ?? name, model || null, safeLabel(item.type) || null, safeLabel(item.sub_type) || null, image, chapter, arcId, canonStatus, description, imageSource, JSON.stringify(item), now)];
  });
  const insertedNames = new Set<string>();
  for (const fruit of knownFruits) {
    const fruitKey = normalize(fruit.name);
    if (insertedNames.has(fruitKey) || hasSourceRecord(fruit)) continue;
    insertedNames.add(fruitKey);
    const arc = fruit.firstSeen == null ? arcs.find((item) => fruit.firstChapter != null && fruit.firstChapter >= item.chapterStart && fruit.firstChapter <= item.chapterEnd) : arcs[fruit.firstSeen];
    if (!arc) continue;
    const canonStatus = fruit.canonStatus ?? "Canon manga";
    const firstChapter = fruit.firstChapter ?? arc.chapterStart;
    const fandomImage = fandomImages.get(`curated:${fruitKey}`);
    statements.push(db.prepare("INSERT INTO devil_fruits (id, name, model, type, sub_type, image_url, first_chapter, first_arc_id, canon_status, description, source_url, source_payload, updated_at) VALUES (?, ?, NULL, ?, NULL, ?, ?, ?, ?, ?, ?, '{}', ?) ON CONFLICT(id) DO UPDATE SET image_url=COALESCE(excluded.image_url, devil_fruits.image_url), first_chapter=excluded.first_chapter, first_arc_id=excluded.first_arc_id, canon_status=excluded.canon_status, description=excluded.description, source_url=CASE WHEN excluded.image_url IS NOT NULL THEN excluded.source_url ELSE devil_fruits.source_url END, updated_at=excluded.updated_at")
      .bind(`curated-fruit:${fruitKey}`, fruit.name, fruit.typeHistory?.[0]?.label ?? null, fandomImage?.image ?? null, firstChapter, arc.id, canonStatus, fruit.knownAs ?? `Fruit répertorié à partir du chapitre ${firstChapter}.`, fandomImage?.sourceUrl ?? "https://onepiece.fandom.com/wiki/Category:Devil_Fruits", now));
  }
  await runBatch(db, statements);
  await upsertSyncState(db, "devil-fruit-images", fandomImages.size);
}

async function importShips(db: D1Database, items: ApiRecord[]) {
  const now = NOW();
  const matchedShips = new Set<string>();
  for (const item of items) {
    const curated = curatedShip(localized(item.name));
    if (curated) matchedShips.add(curated.id);
  }
  const imageTargets: FandomImageTarget[] = items.filter((item) => !safeImage(item.image_url)).map((item) => {
    const name = localized(item.name);
    const curated = curatedShip(name);
    return {
      key: `api-ship:${sourceId(item, "ship", name)}`,
      titles: [...new Set([...(curated ? [curated.name, ...(curated.aliases ?? [])] : []), ...localizedVariants(item.name)])],
    };
  }).filter((target) => target.titles.length > 0);
  for (const ship of knownShips) {
    if (!matchedShips.has(ship.id)) imageTargets.push({ key: `curated-ship:${ship.id}`, titles: [ship.name, ...(ship.aliases ?? [])] });
  }
  const fandomImages = await fetchFandomImageFallbacks(imageTargets);
  const statements: D1PreparedStatement[] = [];
  const importedIds = new Set<string>();
  for (const item of items) {
    const name = localized(item.name);
    if (!name) continue;
    const curated = curatedShip(name);
    const id = curated ? `curated-ship:${curated.id}` : sourceId(item, "ship", name);
    importedIds.add(curated?.id ?? normalize(name));
    const extra = item.extra_data && typeof item.extra_data === "object" ? item.extra_data as ApiRecord : {};
    const chapter = curated?.firstChapter ?? chapterFromAppearance(safeLabel(extra.first_appearance) || JSON.stringify(extra.first_appearance ?? ""));
    const image = safeImage(item.image_url) ?? fandomImages.get(`api-ship:${sourceId(item, "ship", name)}`)?.image ?? fandomImages.get(`curated-ship:${curated?.id}`)?.image ?? null;
    const imageSource = safeImage(item.image_url) ? DATA_SOURCE : fandomImages.get(`api-ship:${sourceId(item, "ship", name)}`)?.sourceUrl ?? fandomImages.get(`curated-ship:${curated?.id}`)?.sourceUrl ?? DATA_SOURCE;
    const affiliation = affiliationNames(extra.affiliation).join(" · ") || null;
    statements.push(db.prepare("INSERT INTO ships (id, name, type, image_url, first_chapter, first_arc_id, affiliation, source_url, source_payload, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, type=COALESCE(excluded.type, ships.type), image_url=COALESCE(excluded.image_url, ships.image_url), first_chapter=COALESCE(excluded.first_chapter, ships.first_chapter), first_arc_id=COALESCE(excluded.first_arc_id, ships.first_arc_id), affiliation=COALESCE(excluded.affiliation, ships.affiliation), source_url=CASE WHEN excluded.image_url IS NOT NULL THEN excluded.source_url ELSE ships.source_url END, source_payload=excluded.source_payload, updated_at=excluded.updated_at")
      .bind(id, curated?.name ?? name, safeLabel(item.type) || curated?.type || null, image, chapter, findArcId(chapter), affiliation, imageSource, JSON.stringify(item), now));
  }
  for (const ship of knownShips) {
    if (importedIds.has(ship.id)) continue;
    const chapter = ship.firstChapter;
    const image = fandomImages.get(`curated-ship:${ship.id}`);
    statements.push(db.prepare("INSERT INTO ships (id, name, type, image_url, first_chapter, first_arc_id, affiliation, source_url, source_payload, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, '{}', ?) ON CONFLICT(id) DO UPDATE SET type=COALESCE(excluded.type, ships.type), image_url=COALESCE(excluded.image_url, ships.image_url), first_chapter=COALESCE(excluded.first_chapter, ships.first_chapter), first_arc_id=COALESCE(excluded.first_arc_id, ships.first_arc_id), source_url=CASE WHEN excluded.image_url IS NOT NULL THEN excluded.source_url ELSE ships.source_url END, updated_at=excluded.updated_at")
      .bind(`curated-ship:${ship.id}`, ship.name, ship.type ?? null, image?.image ?? null, chapter, findArcId(chapter), null, image?.sourceUrl ?? "https://onepiece.fandom.com/wiki/Category:Ships", now));
  }
  await runBatch(db, statements);
  await upsertSyncState(db, "ships", items.length || knownShips.length);
  await upsertSyncState(db, "ship-images", fandomImages.size);
  return { count: items.length || knownShips.length, imageCount: fandomImages.size };
}

function affiliationNames(value: unknown): string[] {
  if (typeof value === "string") return value.split(/[,;|]/).map((part) => part.trim()).filter(Boolean);
  if (Array.isArray(value)) return value.map(localized).filter(Boolean);
  if (value && typeof value === "object") return Object.values(value as ApiRecord).map(localized).filter(Boolean);
  return [];
}

async function importAffiliations(db: D1Database, items: ApiRecord[], characters: ApiRecord[]) {
  const now = NOW();
  const matchedCurated = new Set<string>();
  const imageTargets: FandomImageTarget[] = items.filter((item) => !safeImage(item.image_url)).map((item) => {
    const name = localized(item.name);
    const curated = curatedCrew(name);
    if (curated) matchedCurated.add(curated.id);
    return { key: `affiliation:${sourceId(item, "affiliation", name)}`, titles: [...new Set([...localizedVariants(item.name), ...(curated ? [curated.name] : [])])] };
  }).filter((target) => target.titles.length > 0);
  for (const crew of crews) {
    if (!matchedCurated.has(crew.id)) imageTargets.push({ key: `curated-affiliation:${normalize(crew.name)}`, titles: [crew.name] });
  }
  const fandomImages = await fetchFandomImageFallbacks(imageTargets);
  const affiliationByName = new Map<string, { id: string; name: string; curated: CuratedCrew | null }>();
  const statements: D1PreparedStatement[] = [];
  for (const item of items) {
    const name = localized(item.name);
    if (!name) continue;
    const id = sourceId(item, "affiliation", name);
    const curated = curatedCrew(name);
    const image = safeImage(item.image_url) ?? fandomImages.get(`affiliation:${id}`)?.image ?? null;
    const imageSource = safeImage(item.image_url) ? DATA_SOURCE : fandomImages.get(`affiliation:${id}`)?.sourceUrl ?? DATA_SOURCE;
    const record = { id, name, curated };
    affiliationByName.set(normalize(name), record);
    if (curated) affiliationByName.set(normalize(curated.name), record);
    statements.push(db.prepare("INSERT INTO affiliations (id, name, kind, description, image_url, first_arc_id, source_url, source_payload, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, kind=excluded.kind, description=COALESCE(excluded.description, affiliations.description), image_url=COALESCE(excluded.image_url, affiliations.image_url), first_arc_id=COALESCE(excluded.first_arc_id, affiliations.first_arc_id), source_url=CASE WHEN excluded.image_url IS NOT NULL THEN excluded.source_url ELSE affiliations.source_url END, source_payload=excluded.source_payload, updated_at=excluded.updated_at")
      .bind(id, name, curated?.tag ?? "Équipage ou organisation", curated?.description ?? "Équipage ou organisation répertorié dans la base communautaire. Les membres sont dévoilés au fil de leurs premières apparitions.", image, curated ? arcs[curated.knownAt]?.id ?? null : null, imageSource, JSON.stringify(item), now));
  }

  // Les fiches éditoriales enrichissent l’index de la source lorsque celle-ci a un nom localisé différent.
  for (const crew of crews) {
    const key = normalize(crew.name);
    if (affiliationByName.has(key)) continue;
    const id = `curated:${key}`;
    const image = fandomImages.get(`curated-affiliation:${key}`);
    affiliationByName.set(key, { id, name: crew.name, curated: crew });
    statements.push(db.prepare("INSERT INTO affiliations (id, name, kind, description, image_url, first_arc_id, source_url, source_payload, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, '{}', ?) ON CONFLICT(id) DO UPDATE SET description=excluded.description, image_url=COALESCE(excluded.image_url, affiliations.image_url), first_arc_id=excluded.first_arc_id, source_url=CASE WHEN excluded.image_url IS NOT NULL THEN excluded.source_url ELSE affiliations.source_url END, updated_at=excluded.updated_at")
      .bind(id, crew.name, crew.tag || "Équipage", crew.description, image?.image ?? null, arcs[crew.knownAt]?.id ?? null, image?.sourceUrl ?? "https://onepiece.fandom.com/wiki/Category:Crews", now));
  }
  await runBatch(db, statements);

  // Rebuild source membership only when both feeds succeeded; curated members
  // can still be indexed when a remote feed is temporarily unavailable.
  if (items.length && characters.length) await db.prepare("DELETE FROM affiliation_members").run();
  const characterByName = new Map<string, { id: string; arcId: string | null }>();
  for (const character of characters) {
    const name = localized(character.name);
    if (!name) continue;
    const extra = (character.extra_data && typeof character.extra_data === "object" ? character.extra_data : {}) as ApiRecord;
    const chapter = curatedCharacterProfile(name)?.firstChapter ?? chapterFromAppearance(extra.first_appearance);
    characterByName.set(normalize(name), { id: sourceId(character, "character", name), arcId: findArcId(chapter) });
  }
  for (const item of curatedPeople) {
    const key = normalize(item[0]);
    if (!characterByName.has(key)) {
      const profile = curatedCharacterProfile(item[0]);
      characterByName.set(key, { id: `curated-character:${key}`, arcId: arcs[item[3]]?.id ?? (profile ? findArcId(profile.firstChapter) : null) });
    }
  }

  const memberStatements: D1PreparedStatement[] = [];
  for (const character of characters) {
    const name = localized(character.name);
    if (!name) continue;
    const extra = (character.extra_data && typeof character.extra_data === "object" ? character.extra_data : {}) as ApiRecord;
    const person = characterByName.get(normalize(name));
    if (!person) continue;
    for (const groupName of affiliationNames(extra.affiliation)) {
      const group = affiliationByName.get(normalize(groupName));
      if (!group || group.curated) continue;
      memberStatements.push(db.prepare("INSERT OR REPLACE INTO affiliation_members (affiliation_id, character_id, role, known_arc_id) VALUES (?, ?, ?, ?)")
        .bind(group.id, person.id, "Membre", person.arcId));
    }
  }
  for (const crew of crews) {
    const groups = [...new Map([...affiliationByName.values()]
      .filter((group) => group.curated?.id === crew.id)
      .map((group) => [group.id, group] as const)).values()];
    for (const group of groups) {
      for (const [name, role, knownAt] of crew.members) {
        const person = characterByName.get(normalize(name));
        if (!person) continue;
        memberStatements.push(db.prepare("INSERT OR REPLACE INTO affiliation_members (affiliation_id, character_id, role, known_arc_id) VALUES (?, ?, ?, ?)")
          .bind(group.id, person.id, safeLabel(role) || "Membre", arcs[knownAt]?.id ?? person.arcId));
      }
    }
  }
  await runBatch(db, memberStatements);
  await db.prepare("UPDATE affiliations SET first_arc_id=(SELECT am.known_arc_id FROM affiliation_members am JOIN arcs a ON a.id=am.known_arc_id WHERE am.affiliation_id=affiliations.id AND am.known_arc_id IS NOT NULL ORDER BY a.sort_order LIMIT 1) WHERE id NOT LIKE 'curated:%'").run();
  await upsertSyncState(db, "affiliations", items.length || crews.length);
  await upsertSyncState(db, "crew-images", fandomImages.size);
  return items.length;
}

async function importGuideList(db: D1Database, resource: "episodes" | "chapters", items: ApiRecord[]) {
  const now = NOW();
  const statements = items.flatMap((item) => {
    const number = numeric(item.number ?? item.episode_number ?? item.chapter_number ?? item.id);
    if (!number) return [];
    const rawArcName = localized((item.arc && typeof item.arc === "object" ? (item.arc as ApiRecord).title : item.arc) ?? "");
    const arc = arcs.find((entry) => normalize(entry.name) === normalize(rawArcName.replace(/^arc\s+/i, "")));
    const id = safeLabel(item.id) || `${resource}:${number}`;
    if (resource === "episodes") {
      return [db.prepare("INSERT INTO episodes (id, number, title, chapter_text, arc_id, source_payload, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET number=excluded.number, title=excluded.title, chapter_text=excluded.chapter_text, arc_id=COALESCE(excluded.arc_id, episodes.arc_id), source_payload=excluded.source_payload, updated_at=excluded.updated_at")
        .bind(id, number, safeLabel(item.title) || null, safeLabel(item.chapter) || null, arc?.id ?? null, JSON.stringify(item), now)];
    }
    return [db.prepare("INSERT INTO chapters (id, number, title, volume, arc_id, source_payload, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET number=excluded.number, title=excluded.title, volume=COALESCE(excluded.volume, chapters.volume), arc_id=COALESCE(excluded.arc_id, chapters.arc_id), source_payload=excluded.source_payload, updated_at=excluded.updated_at")
      .bind(id, number, safeLabel(item.title) || null, numeric(item.volume), arc?.id ?? null, JSON.stringify(item), now)];
  });
  await runBatch(db, statements);
  await upsertSyncState(db, resource, items.length);
  return items.length;
}

async function seedCuratedFruitTimeline(db: D1Database) {
  const [existing, imageSync] = await Promise.all([
    db.prepare("SELECT id, name, model, image_url AS image, source_payload AS sourcePayload FROM devil_fruits").all<{ id: string; name: string; model: string | null; image: string | null; sourcePayload: string | null }>(),
    db.prepare("SELECT synced_at AS syncedAt, record_count AS recordCount FROM sync_state WHERE source = 'devil-fruit-images'").first<{ syncedAt: string; recordCount: number }>(),
  ]);
  const known = new Set<string>();
  const statements: D1PreparedStatement[] = [];
  for (const row of existing.results ?? []) {
    let source: ApiRecord = {};
    try { source = JSON.parse(row.sourcePayload || "{}"); } catch { /* Fall back to the indexed labels. */ }
    const fruit = curatedFruitForItem(source.name ? source : { name:row.name, model:row.model });
    if (!fruit) continue;
    known.add(fruit.name);
    const chapter = fruit.firstChapter ?? (fruit.firstSeen == null ? null : arcs[fruit.firstSeen]?.chapterStart) ?? null;
    const arc = fruit.firstSeen == null ? arcs.find((item) => chapter != null && chapter >= item.chapterStart && chapter <= item.chapterEnd) : arcs[fruit.firstSeen];
    if (!arc) continue;
    const status = fruit.canonStatus ?? "Canon manga";
    const description = fruit.knownAs ?? (chapter ? `Fruit répertorié à partir du chapitre ${chapter}.` : null);
    statements.push(db.prepare("UPDATE devil_fruits SET first_chapter=COALESCE(?, first_chapter), first_arc_id=COALESCE(?, first_arc_id), canon_status=CASE WHEN ? IS NOT NULL THEN ? ELSE canon_status END, description=COALESCE(?, description) WHERE id=?")
      .bind(chapter, arc.id, fruit.canonStatus ?? null, status, description, row.id));
  }
  const lastImageSync = imageSync?.syncedAt ? Date.parse(imageSync.syncedAt) : 0;
  const imageLookupInterval = imageSync?.recordCount ? IMAGE_LOOKUP_INTERVAL_MS : IMAGE_RETRY_INTERVAL_MS;
  const shouldLookupImages = !lastImageSync || Date.now() - lastImageSync >= imageLookupInterval;
  const imageTargets: FandomImageTarget[] = [];
  if (shouldLookupImages) {
    for (const row of existing.results ?? []) {
      if (safeImage(row.image)) continue;
      let source: ApiRecord = {};
      try { source = JSON.parse(row.sourcePayload || "{}"); } catch { /* Use indexed fruit names below. */ }
      const curated = curatedFruitForItem(source.name ? source : { name:row.name, model:row.model });
      imageTargets.push({
        key: `row:${row.id}`,
        titles: fandomTitleCandidates(
          [...(curated ? [curated.name, curated.apiName ?? "", ...(curated.apiNames ?? [])] : []), ...fandomLocalizedVariants(source.name ?? row.name)],
          [...(curated?.apiModel ? [curated.apiModel] : []), ...fandomLocalizedVariants(source.model ?? row.model)],
        ),
      });
    }
    for (const fruit of knownFruits) {
      if (known.has(fruit.name)) continue;
      imageTargets.push({
        key: `curated:${normalize(fruit.name)}`,
        titles: fandomTitleCandidates([fruit.name, fruit.apiName ?? "", ...(fruit.apiNames ?? [])], fruit.apiModel ? [fruit.apiModel] : []),
      });
    }
  }
  const fandomImages = shouldLookupImages ? await fetchFandomImageFallbacks(imageTargets) : new Map<string, FandomImage>();
  if (shouldLookupImages) {
    for (const row of existing.results ?? []) {
      const image = fandomImages.get(`row:${row.id}`);
      if (!image || safeImage(row.image)) continue;
      statements.push(db.prepare("UPDATE devil_fruits SET image_url=?, source_url=?, updated_at=? WHERE id=? AND image_url IS NULL")
        .bind(image.image, image.sourceUrl, NOW(), row.id));
    }
  }
  for (const fruit of knownFruits) {
    if (known.has(fruit.name)) continue;
    const arc = fruit.firstSeen == null ? arcs.find((item) => fruit.firstChapter != null && fruit.firstChapter >= item.chapterStart && fruit.firstChapter <= item.chapterEnd) : arcs[fruit.firstSeen];
    if (!arc) continue;
    known.add(fruit.name);
    const chapter = fruit.firstChapter ?? arc.chapterStart;
    const image = fandomImages.get(`curated:${normalize(fruit.name)}`);
    statements.push(db.prepare("INSERT OR IGNORE INTO devil_fruits (id, name, model, type, sub_type, image_url, first_chapter, first_arc_id, canon_status, description, source_url, source_payload, updated_at) VALUES (?, ?, NULL, ?, NULL, ?, ?, ?, ?, ?, ?, '{}', ?)")
      .bind(`curated-fruit:${normalize(fruit.name)}`, fruit.name, fruit.typeHistory?.[0]?.label ?? null, image?.image ?? null, chapter, arc.id, fruit.canonStatus ?? "Canon manga", fruit.knownAs ?? `Fruit répertorié à partir du chapitre ${chapter}.`, image?.sourceUrl ?? "https://onepiece.fandom.com/wiki/Category:Devil_Fruits", NOW()));
  }
  await runBatch(db, statements);
  if (shouldLookupImages) await upsertSyncState(db, "devil-fruit-images", fandomImages.size);
}

async function fetchGuide(resource: "episodes" | "chapters") {
  const response = await fetchJson(`${EPISODE_API}/${resource}/fr`, 25000);
  return rowsFromPayload(response) as ApiRecord[];
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  try {
    if (!origin || new URL(origin).origin !== new URL(request.url).origin) return jsonResponse({ error: "Origine refusée." }, 403);
  } catch {
    return jsonResponse({ error: "Origine refusée." }, 403);
  }
  try {
    const db = getDb();
    const last = await db.prepare("SELECT MAX(synced_at) AS syncedAt FROM sync_state").first<{ syncedAt: string | null }>();
    const lastTime = last?.syncedAt ? Date.parse(last.syncedAt) : 0;
    const hasShipsTable = await shipsTableExists(db);
    if (Date.now() - lastTime < 120000) {
      await seedCuratedFruitTimeline(db);
      if (hasShipsTable) await importShips(db, []);
      return jsonResponse({
        skipped: true,
        syncedAt: last?.syncedAt,
        message: "Les données viennent d’être actualisées.",
        ...(!hasShipsTable ? { errors: ["bateaux"], diagnostics: { bateaux: "La migration de la table des bateaux doit être appliquée à la base locale." } } : {}),
      });
    }

    await importArcs(db);
    const errors: string[] = [];
    const diagnostics: Record<string, string> = {};
    const counts: Record<string, number> = {};
    const failureMessage = (result: PromiseRejectedResult) => result.reason instanceof Error ? result.reason.message.slice(0, 180) : "échec de la source";

    const [charactersResult, fruitsResult, shipsResult, affiliationsResult, episodesResult, chaptersResult] = await Promise.allSettled([
      fetchPaged("characters"), fetchPaged("devil-fruits"), fetchPaged("ships"), fetchPaged("affiliations"), fetchGuide("episodes"), fetchGuide("chapters"),
    ]);

    let characters: ApiRecord[] = [];
    let affiliations: ApiRecord[] = [];
    if (charactersResult.status === "fulfilled") {
      characters = charactersResult.value;
      const imported = await importCharacters(db, characters);
      counts.characters = imported.count;
      counts.characterImages = imported.imageCount;
      await upsertSyncState(db, "characters", characters.length);
    } else {
      errors.push("personnages");
      diagnostics.personnages = failureMessage(charactersResult);
      const imported = await importCharacters(db, []);
      counts.characters = imported.count;
      counts.characterImages = imported.imageCount;
    }
    if (fruitsResult.status === "fulfilled") {
      await importFruits(db, fruitsResult.value);
      counts.fruits = fruitsResult.value.length;
      await upsertSyncState(db, "devil-fruits", fruitsResult.value.length);
    } else {
      errors.push("fruits");
      diagnostics.fruits = failureMessage(fruitsResult);
    }
    if (!hasShipsTable) {
      errors.push("bateaux");
      diagnostics.bateaux = "La migration de la table des bateaux doit être appliquée à la base locale.";
      counts.ships = knownShips.length;
      counts.shipImages = 0;
    } else if (shipsResult.status === "fulfilled") {
      const imported = await importShips(db, shipsResult.value);
      counts.ships = imported.count;
      counts.shipImages = imported.imageCount;
    } else {
      errors.push("bateaux");
      diagnostics.bateaux = failureMessage(shipsResult);
      const imported = await importShips(db, []);
      counts.ships = imported.count;
      counts.shipImages = imported.imageCount;
    }
    if (affiliationsResult.status === "fulfilled") {
      affiliations = affiliationsResult.value;
      counts.affiliations = await importAffiliations(db, affiliations, characters);
    } else {
      errors.push("équipages");
      diagnostics.équipages = failureMessage(affiliationsResult);
      counts.affiliations = await importAffiliations(db, [], characters);
    }
    if (episodesResult.status === "fulfilled") counts.episodes = await importGuideList(db, "episodes", episodesResult.value);
    else { errors.push("épisodes"); diagnostics.épisodes = failureMessage(episodesResult); }
    if (chaptersResult.status === "fulfilled") counts.chapters = await importGuideList(db, "chapters", chaptersResult.value);
    else { errors.push("chapitres"); diagnostics.chapitres = failureMessage(chaptersResult); }

    // Keep curated entries available even when a remote catalog is down, and
    // retry missing artwork sooner after a failed/empty lookup.
    await seedCuratedFruitTimeline(db);
    const [characterCoverage, crewCoverage, fruitCoverage, shipCoverage] = await Promise.all([
      db.prepare("SELECT COUNT(*) AS total, SUM(image_url IS NOT NULL) AS images FROM characters").first<{ total: number; images: number }>(),
      db.prepare("SELECT COUNT(*) AS total, SUM(image_url IS NOT NULL) AS images FROM affiliations").first<{ total: number; images: number }>(),
      db.prepare("SELECT COUNT(*) AS total, SUM(image_url IS NOT NULL) AS images FROM devil_fruits").first<{ total: number; images: number }>(),
      hasShipsTable
        ? db.prepare("SELECT COUNT(*) AS total, SUM(image_url IS NOT NULL) AS images FROM ships").first<{ total: number; images: number }>()
        : Promise.resolve(null),
    ]);
    counts.characters = characterCoverage?.total ?? counts.characters ?? 0;
    counts.characterImages = characterCoverage?.images ?? 0;
    counts.affiliations = crewCoverage?.total ?? counts.affiliations ?? 0;
    counts.crewImages = crewCoverage?.images ?? 0;
    counts.fruits = fruitCoverage?.total ?? counts.fruits ?? 0;
    counts.fruitImages = fruitCoverage?.images ?? 0;
    counts.ships = shipCoverage?.total ?? counts.ships ?? knownShips.length;
    counts.shipImages = shipCoverage?.images ?? counts.shipImages ?? 0;

    if (Object.keys(counts).length === 0) return jsonResponse({ error: "Aucune source n’a pu être actualisée." }, 502);
    return jsonResponse({ ok: true, counts, errors, diagnostics, syncedAt: NOW() });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Échec de la synchronisation." }, 500);
  }
}
