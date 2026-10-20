import { env } from "cloudflare:workers";
import arcsSource from "../../../content/arcs.json";
import curatedCrews from "../../../content/crews.json";
import curatedCharacters from "../../../content/characters.json";
import curatedFruits from "../../../content/fruits.json";
import fruitTimelineSource from "../../../content/fruits-timeline.json";
import { arcForChapter, chapterFromAppearance, DATA_SOURCE, getDb, jsonResponse, localized, numeric, rowsFromPayload, safeLabel, type ArcRecord } from "../_lib";

const ONEPIECE_API = "https://www.onepieceapi.com/api";
const EPISODE_API = "https://api.api-onepiece.com/v2";
const NOW = () => new Date().toISOString();
const SAFE_REMOTE_IMAGE = /^https:\/\//i;

type ApiRecord = Record<string, unknown>;
type CuratedCrew = { name: string; description: string; tag?: string; knownAt: number; members: [string, string, number][] };
type CuratedCharacter = [string, string, string, number];
type CuratedFruit = { name: string; firstSeen?: number; firstChapter?: number; knownAs?: string; canonStatus?: string; typeHistory?: { from: number; label: string }[]; user?: string; apiNames?: string[]; apiName?: string; apiModel?: string | null };

const arcs = arcsSource as ArcRecord[];
const crews = curatedCrews as CuratedCrew[];
const knownCharacters = curatedCharacters as CuratedCharacter[];
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
    if (!response.ok) throw new Error(`La source a répondu ${response.status}.`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchPaged(resource: string, maxPages = 80): Promise<ApiRecord[]> {
  const all: ApiRecord[] = [];
  for (let page = 1; page <= maxPages; page += 3) {
    const pages = [page, page + 1, page + 2].filter((value) => value <= maxPages);
    const results = await Promise.all(pages.map(async (number) => rowsFromPayload(await fetchJson(`${ONEPIECE_API}/${resource}?limit=100&page=${number}`)) as ApiRecord[]));
    let finished = false;
    results.forEach((items) => {
      all.push(...items);
      if (items.length < 100) finished = true;
    });
    if (finished) break;
  }
  return all;
}

function findArcId(chapter: number | null) {
  return arcForChapter(chapter, arcs)?.id ?? null;
}

function curatedFruit(name: string, model: string) {
  const keys = [name, model].map(normalize).filter(Boolean);
  return knownFruits.find((fruit) => {
    if (fruit.apiName) {
      const sourceName = normalize(name);
      const curatedName = normalize(fruit.apiName);
      const sourceModel = normalize(model);
      const nameMatches = sourceName === curatedName || (sourceModel && sourceName.indexOf(curatedName) === 0 && sourceName.indexOf(sourceModel) >= 0);
      const expectedModel = normalize(fruit.apiModel);
      const modelMatches = fruit.apiModel == null ? (!sourceModel || sourceModel === "unknown") : sourceModel === expectedModel;
      if (nameMatches && modelMatches) return true;
    }
    return [fruit.name, ...(fruit.apiNames ?? [])].map(normalize).some((key) => keys.includes(key));
  }) ?? null;
}

function curatedCharacter(name: string) {
  const key = normalize(name);
  return knownCharacters.find((item) => normalize(item[0]) === key) ?? null;
}

function curatedCrew(name: string) {
  const key = normalize(name);
  return crews.find((item) => normalize(item.name) === key) ?? null;
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
  const statements = items.flatMap((item) => {
    const name = localized(item.name);
    if (!name) return [];
    const extra = (item.extra_data && typeof item.extra_data === "object" ? item.extra_data : {}) as ApiRecord;
    const chapter = chapterFromAppearance(extra.first_appearance);
    const arcId = findArcId(chapter);
    const curated = curatedCharacter(name);
    const description = curated ? curated[1] : chapter ? `Première apparition manga : chapitre ${chapter}.` : "Personnage répertorié par une base communautaire; repère narratif à confirmer.";
    return [db.prepare("INSERT INTO characters (id, name, image_url, description, first_chapter, first_arc_id, source_url, source_payload, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, image_url=COALESCE(excluded.image_url, characters.image_url), description=COALESCE(excluded.description, characters.description), first_chapter=COALESCE(excluded.first_chapter, characters.first_chapter), first_arc_id=COALESCE(excluded.first_arc_id, characters.first_arc_id), source_url=excluded.source_url, source_payload=excluded.source_payload, updated_at=excluded.updated_at")
      .bind(sourceId(item, "character", name), name, safeImage(item.image_url), description, chapter, arcId, DATA_SOURCE, JSON.stringify(item), now)];
  });
  const importedNames = new Set(items.map((item) => normalize(localized(item.name))));
  for (const [name, role, group, knownAt] of knownCharacters) {
    if (importedNames.has(normalize(name))) continue;
    const key = normalize(name);
    const arc = arcs[knownAt];
    statements.push(db.prepare("INSERT INTO characters (id, name, image_url, description, first_chapter, first_arc_id, source_url, source_payload, updated_at) VALUES (?, ?, NULL, ?, ?, ?, ?, '{}', ?) ON CONFLICT(id) DO UPDATE SET description=excluded.description, first_chapter=excluded.first_chapter, first_arc_id=excluded.first_arc_id, updated_at=excluded.updated_at")
      .bind(`curated-character:${key}`, name, `${role} · ${group}`, arc?.chapterStart ?? null, arc?.id ?? null, "https://onepiece.fandom.com/wiki/Category:Characters", now));
  }
  await runBatch(db, statements);
}

async function importFruits(db: D1Database, items: ApiRecord[]) {
  const now = NOW();
  const statements = items.flatMap((item) => {
    const name = localized(item.name);
    if (!name) return [];
    const model = localized(item.model);
    const curated = curatedFruit(name, model);
    const extra = (item.extra_data && typeof item.extra_data === "object" ? item.extra_data : {}) as ApiRecord;
    const chapter = curated ? (curated.firstChapter ?? (curated.firstSeen == null ? null : arcs[curated.firstSeen]?.chapterStart) ?? null) : chapterFromAppearance(extra.first_appearance);
    const arcId = curated && curated.firstSeen != null ? (arcs[curated.firstSeen]?.id ?? findArcId(chapter)) : findArcId(chapter);
    const description = curated?.knownAs ?? (curated ? `Fruit connu depuis le chapitre ${chapter}.` : null);
    const canonStatus = curated?.canonStatus ?? (curated ? "Canon manga" : "À confirmer");
    return [db.prepare("INSERT INTO devil_fruits (id, name, model, type, sub_type, image_url, first_chapter, first_arc_id, canon_status, description, source_url, source_payload, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, model=excluded.model, type=excluded.type, sub_type=excluded.sub_type, image_url=COALESCE(excluded.image_url, devil_fruits.image_url), first_chapter=COALESCE(excluded.first_chapter, devil_fruits.first_chapter), first_arc_id=COALESCE(excluded.first_arc_id, devil_fruits.first_arc_id), canon_status=CASE WHEN excluded.canon_status='Canon manga' THEN excluded.canon_status ELSE devil_fruits.canon_status END, description=COALESCE(excluded.description, devil_fruits.description), source_url=excluded.source_url, source_payload=excluded.source_payload, updated_at=excluded.updated_at")
      .bind(sourceId(item, "fruit", name), curated?.name ?? name, model || null, safeLabel(item.type) || null, safeLabel(item.sub_type) || null, safeImage(item.image_url), chapter, arcId, canonStatus, description, DATA_SOURCE, JSON.stringify(item), now)];
  });
  const hasSourceRecord = (fruit: CuratedFruit) => items.some((item) => {
    const matched = curatedFruit(localized(item.name), localized(item.model));
    return matched?.name === fruit.name;
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
    statements.push(db.prepare("INSERT INTO devil_fruits (id, name, model, type, sub_type, image_url, first_chapter, first_arc_id, canon_status, description, source_url, source_payload, updated_at) VALUES (?, ?, NULL, ?, NULL, NULL, ?, ?, ?, ?, ?, '{}', ?) ON CONFLICT(id) DO UPDATE SET first_chapter=excluded.first_chapter, first_arc_id=excluded.first_arc_id, canon_status=excluded.canon_status, description=excluded.description, updated_at=excluded.updated_at")
      .bind(`curated-fruit:${normalize(fruit.name)}`, fruit.name, fruit.typeHistory?.[0]?.label ?? null, firstChapter, arc.id, canonStatus, fruit.knownAs ?? `Fruit répertorié à partir du chapitre ${firstChapter}.`, "https://onepiece.fandom.com/wiki/Category:Devil_Fruits", now));
  }
  await runBatch(db, statements);
}

function affiliationNames(value: unknown): string[] {
  if (typeof value === "string") return value.split(/[,;|]/).map((part) => part.trim()).filter(Boolean);
  if (Array.isArray(value)) return value.map(localized).filter(Boolean);
  if (value && typeof value === "object") return Object.values(value as ApiRecord).map(localized).filter(Boolean);
  return [];
}

async function importAffiliations(db: D1Database, items: ApiRecord[], characters: ApiRecord[]) {
  const now = NOW();
  const affiliationByName = new Map<string, { id: string; name: string; curated: CuratedCrew | null }>();
  const statements: D1PreparedStatement[] = [];
  for (const item of items) {
    const name = localized(item.name);
    if (!name) continue;
    const id = sourceId(item, "affiliation", name);
    const curated = curatedCrew(name);
    affiliationByName.set(normalize(name), { id, name, curated });
    statements.push(db.prepare("INSERT INTO affiliations (id, name, kind, description, image_url, first_arc_id, source_url, source_payload, updated_at) VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, kind=excluded.kind, description=COALESCE(excluded.description, affiliations.description), first_arc_id=COALESCE(excluded.first_arc_id, affiliations.first_arc_id), source_url=excluded.source_url, source_payload=excluded.source_payload, updated_at=excluded.updated_at")
      .bind(id, name, "Équipage ou organisation", curated?.description ?? "Équipage ou organisation répertorié dans la base communautaire. Les membres sont dévoilés au fil de leurs premières apparitions.", curated ? arcs[curated.knownAt]?.id ?? null : null, DATA_SOURCE, JSON.stringify(item), now));
  }

  // Les fiches éditoriales enrichissent l’index de la source lorsque celle-ci a un nom localisé différent.
  for (const crew of crews) {
    const key = normalize(crew.name);
    if (affiliationByName.has(key)) continue;
    const id = `curated:${key}`;
    affiliationByName.set(key, { id, name: crew.name, curated: crew });
    statements.push(db.prepare("INSERT INTO affiliations (id, name, kind, description, image_url, first_arc_id, source_url, source_payload, updated_at) VALUES (?, ?, ?, ?, NULL, ?, ?, '{}', ?) ON CONFLICT(id) DO UPDATE SET description=excluded.description, first_arc_id=excluded.first_arc_id, updated_at=excluded.updated_at")
      .bind(id, crew.name, crew.tag || "Équipage", crew.description, arcs[crew.knownAt]?.id ?? null, "https://onepiece.fandom.com/wiki/Category:Crews", now));
  }
  await runBatch(db, statements);

  // Do not erase the last good member map if one of the paginated sources
  // returned no characters or no affiliations during this refresh.
  if (!items.length || !characters.length) {
    await upsertSyncState(db, "affiliations", items.length);
    return items.length;
  }

  await db.prepare("DELETE FROM affiliation_members").run();
  const characterByName = new Map<string, { id: string; arcId: string | null }>();
  for (const character of characters) {
    const name = localized(character.name);
    if (!name) continue;
    const extra = (character.extra_data && typeof character.extra_data === "object" ? character.extra_data : {}) as ApiRecord;
    const chapter = chapterFromAppearance(extra.first_appearance);
    characterByName.set(normalize(name), { id: sourceId(character, "character", name), arcId: findArcId(chapter) });
  }
  for (const item of knownCharacters) {
    const key = normalize(item[0]);
    if (!characterByName.has(key)) characterByName.set(key, { id: `curated-character:${key}`, arcId: arcs[item[3]]?.id ?? null });
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
      if (!group) continue;
      memberStatements.push(db.prepare("INSERT OR REPLACE INTO affiliation_members (affiliation_id, character_id, role, known_arc_id) VALUES (?, ?, ?, ?)")
        .bind(group.id, person.id, "Membre", person.arcId));
    }
  }
  for (const crew of crews) {
    const group = affiliationByName.get(normalize(crew.name));
    if (!group) continue;
    for (const [name, role, knownAt] of crew.members) {
      const person = characterByName.get(normalize(name));
      if (!person) continue;
      memberStatements.push(db.prepare("INSERT OR REPLACE INTO affiliation_members (affiliation_id, character_id, role, known_arc_id) VALUES (?, ?, ?, ?)")
        .bind(group.id, person.id, safeLabel(role) || "Membre", arcs[knownAt]?.id ?? person.arcId));
    }
  }
  await runBatch(db, memberStatements);
  await db.prepare("UPDATE affiliations SET first_arc_id=(SELECT am.known_arc_id FROM affiliation_members am JOIN arcs a ON a.id=am.known_arc_id WHERE am.affiliation_id=affiliations.id AND am.known_arc_id IS NOT NULL ORDER BY a.sort_order LIMIT 1) WHERE id NOT LIKE 'curated:%'").run();
  await upsertSyncState(db, "affiliations", items.length);
  return items.length;
}

async function importGuideList(db: D1Database, resource: "episodes" | "chapters", items: ApiRecord[]) {
  const now = NOW();
  const table = resource;
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
  const existing = await db.prepare("SELECT id, name, model FROM devil_fruits").all<{ id: string; name: string; model: string | null }>();
  const known = new Set<string>();
  const statements: D1PreparedStatement[] = [];
  for (const row of existing.results ?? []) {
    const fruit = curatedFruit(row.name, row.model ?? "");
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
  for (const fruit of knownFruits) {
    if (known.has(fruit.name)) continue;
    const arc = fruit.firstSeen == null ? arcs.find((item) => fruit.firstChapter != null && fruit.firstChapter >= item.chapterStart && fruit.firstChapter <= item.chapterEnd) : arcs[fruit.firstSeen];
    if (!arc) continue;
    known.add(fruit.name);
    const chapter = fruit.firstChapter ?? arc.chapterStart;
    statements.push(db.prepare("INSERT OR IGNORE INTO devil_fruits (id, name, model, type, sub_type, image_url, first_chapter, first_arc_id, canon_status, description, source_url, source_payload, updated_at) VALUES (?, ?, NULL, ?, NULL, NULL, ?, ?, ?, ?, ?, '{}', ?)")
      .bind(`curated-fruit:${normalize(fruit.name)}`, fruit.name, fruit.typeHistory?.[0]?.label ?? null, chapter, arc.id, fruit.canonStatus ?? "Canon manga", fruit.knownAs ?? `Fruit répertorié à partir du chapitre ${chapter}.`, "https://onepiece.fandom.com/wiki/Category:Devil_Fruits", NOW()));
  }
  await runBatch(db, statements);
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
    if (Date.now() - lastTime < 120000) {
      await seedCuratedFruitTimeline(db);
      return jsonResponse({ skipped: true, syncedAt: last?.syncedAt, message: "Les données viennent d’être actualisées." });
    }

    await importArcs(db);
    const errors: string[] = [];
    const counts: Record<string, number> = {};

    const [charactersResult, fruitsResult, affiliationsResult, episodesResult, chaptersResult] = await Promise.allSettled([
      fetchPaged("characters"), fetchPaged("devil-fruits"), fetchPaged("affiliations"), fetchGuide("episodes"), fetchGuide("chapters"),
    ]);

    let characters: ApiRecord[] = [];
    let affiliations: ApiRecord[] = [];
    if (charactersResult.status === "fulfilled") {
      characters = charactersResult.value;
      await importCharacters(db, characters);
      counts.characters = characters.length;
      await upsertSyncState(db, "characters", characters.length);
    } else errors.push("personnages");
    if (fruitsResult.status === "fulfilled") {
      await importFruits(db, fruitsResult.value);
      counts.fruits = fruitsResult.value.length;
      await upsertSyncState(db, "devil-fruits", fruitsResult.value.length);
    } else errors.push("fruits");
    if (affiliationsResult.status === "fulfilled") {
      affiliations = affiliationsResult.value;
      counts.affiliations = await importAffiliations(db, affiliations, characters);
    } else errors.push("équipages");
    if (episodesResult.status === "fulfilled") counts.episodes = await importGuideList(db, "episodes", episodesResult.value);
    else errors.push("épisodes");
    if (chaptersResult.status === "fulfilled") counts.chapters = await importGuideList(db, "chapters", chaptersResult.value);
    else errors.push("chapitres");

    if (Object.keys(counts).length === 0) return jsonResponse({ error: "Aucune source n’a pu être actualisée." }, 502);
    return jsonResponse({ ok: true, counts, errors, syncedAt: NOW() });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Échec de la synchronisation." }, 500);
  }
}
