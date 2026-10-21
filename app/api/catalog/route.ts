import { getDb, jsonResponse } from "../_lib";
import arcSource from "../../../content/arcs.json";
import crewSource from "../../../content/crews.json";
import characterLoreSource from "../../../content/character-lore.json";
import fightSource from "../../../content/fights.json";
import emperorSource from "../../../content/emperors.json";
import crewEnrichmentSource from "../../../content/crew-enrichment.json";
import shipSource from "../../../content/ships.json";

const MAX_CHARACTERS_PER_PAGE = 1000;
const LAST_INDEXED_CHAPTER = Math.max(...(arcSource as { chapterEnd: number }[]).map((arc) => arc.chapterEnd));
type CharacterLore = {
  name: string;
  standalone?: boolean;
  aliases?: string[];
  knownAt?: number;
  firstChapter?: number;
  firstRevealChapter?: number;
  role?: string;
  group?: string;
  roleChapter?: number;
  groupChapter?: number;
  preRevealRole?: string;
  preRevealGroup?: string;
  description: string;
  descriptionChapter?: number;
  preRevealDescription?: string;
  middleRevealChapter?: number;
  middleRevealDescription?: string;
  achievements: { chapter: number; text: string }[];
  bounties: { chapter: number; amount: number; snapshot?: boolean }[];
};
type CuratedCrew = {
  id: string;
  name: string;
  preRevealName?: string;
  nameRevealChapter?: number;
  description: string;
  descriptionChapter?: number;
  middleRevealChapter?: number;
  middleRevealDescription?: string;
  preRevealDescription?: string;
  knownAt: number;
  tag?: string;
  members?: [string, string, number][];
  achievements?: { chapter: number; text: string }[];
};
type CuratedFight = {
  chapter: number;
  fighterA: string;
  fighterB: string;
  winner: string | null;
  finish: "decisive" | "interrupted" | "draw" | "unresolved";
  summary: string;
};
type CuratedShip = {
  id: string; name: string; aliases?: string[]; type?: string; firstChapter: number; crewId?: string; affiliationLabel?: string;
  art: string; color: string; preRevealDescription?: string; description?: string; descriptionChapter?: number;
  achievements?: { chapter: number; text: string }[];
};
type EmperorPeriod = { name: string; from: number; to?: number; title?: string };
const characterLore = characterLoreSource as CharacterLore[];
const characterLoreByName = new Map<string, CharacterLore>();
const curatedCrews = crewSource as CuratedCrew[];
const curatedFights = fightSource as CuratedFight[];
const emperorPeriods = emperorSource as EmperorPeriod[];
const crewEnrichment = crewEnrichmentSource as Record<string, { descriptionChapter: number; description: string; achievements: { chapter: number; text: string }[] }>;
const curatedShips = shipSource as CuratedShip[];
const crewAliases: Record<string, string[]> = {
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
// L’API décrit souvent les affiliations actuelles sans donner leur chapitre de révélation.
// Ces seuils empêchent les groupes explicitement identifiés plus tard de remonter aux débuts de leurs membres.
const affiliationRevealOrders: Record<string, number> = {
  "buggyandalvidaalliance": 5,
  "buggysdelivery": 22,
  "clanofd": 12,
  "revolutionaryarmy": 16,
  "pacifista": 18,
  "worldnobles": 18,
  "newkamaland": 20,
  "dadanfamily": 22,
  "ninjapirateminksamuraialliance": 25,
  "g5": 25,
  "cp0": 26,
  "mokomodukedom": 27,
  "kouzukifamily": 27,
  "nineredscabbards": 27,
  "charlottefamily": 28,
  "worldeconomynewspaper": 28,
  "shimotsukifamily": 32,
};

function curatedCrew(name: unknown) {
  const key = normalized(name);
  return curatedCrews.find((item) => normalized(item.name) === key || (crewAliases[item.id] ?? []).some((alias) => normalized(alias) === key));
}

function normalized(value: unknown) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function curatedShip(name: unknown) {
  const key = normalized(name);
  return curatedShips.find((ship) => [ship.name, ...(ship.aliases ?? [])].some((alias) => normalized(alias) === key));
}

function visibleLoreDescription(profile: CharacterLore | undefined, chapterEnd: number) {
  if (!profile) return null;
  const fullDescriptionKnownAt = Math.max(
    Number(profile.descriptionChapter ?? profile.firstChapter ?? 0),
    Number(profile.roleChapter ?? profile.firstChapter ?? 0),
    Number(profile.groupChapter ?? profile.firstChapter ?? 0),
  );
  if (fullDescriptionKnownAt <= chapterEnd) return profile.description;
  if (profile.middleRevealDescription && Number(profile.middleRevealChapter) <= chapterEnd) return profile.middleRevealDescription;
  return profile.preRevealDescription ?? null;
}

function sourceBountySnapshot(value: unknown) {
  try {
    const source = JSON.parse(String(value ?? "{}")) as { bounties?: { amount?: number; is_active?: boolean }[] };
    const entries = Array.isArray(source.bounties) ? source.bounties : [];
    const entry = entries.find((item) => item.is_active && Number(item.amount) > 0) ?? entries.find((item) => Number(item.amount) > 0);
    return entry ? Number(entry.amount) : null;
  } catch {
    return null;
  }
}

const fightNameAliases: Record<string, string> = {
  zoro: "Roronoa Zoro", chopper: "Tony Tony Chopper", whitebeard: "Edward Newgate",
  blackbeard: "Marshall D. Teach", trafalgarlaw: "Trafalgar D. Water Law",
  trafalgardwaterlaw: "Trafalgar D. Water Law", mr2bonclay: "Bentham",
  missdoublefinger: "Zala", enel: "Enel", mr1: "Daz Bones", mr4: "Babe",
};

function characterName(value: string) {
  return characterLoreByName.get(normalized(value))?.name ?? fightNameAliases[normalized(value)] ?? value;
}

function emperorTitle(name: string, chapterEnd: number) {
  const key = normalized(characterName(name));
  const period = (emperorPeriodsByName.get(key) ?? []).find((item) => chapterEnd >= item.from && (item.to == null || chapterEnd <= item.to));
  return period ? period.title ?? "Empereur (Yonkō)" : null;
}

function fightsFor(name: string, chapterEnd: number) {
  const characterKey = normalized(characterName(name));
  return (curatedFightsByCharacter.get(characterKey) ?? []).filter((fight) => fight.chapter <= chapterEnd)
    .map((fight) => {
      const isA = normalized(characterName(fight.fighterA)) === characterKey;
      const opponent = isA ? fight.fighterB : fight.fighterA;
      const result = fight.finish === "draw" ? "Égalité"
        : fight.finish === "interrupted" ? "Combat interrompu"
          : fight.finish === "unresolved" ? "Issue non tranchée"
            : normalized(characterName(fight.winner ?? "")) === characterKey ? "Victoire" : "Défaite";
      return { chapter: fight.chapter, opponent, opponentKey: characterName(opponent), result, summary: fight.summary };
    });
}

for (const profile of characterLore) for (const name of [profile.name, ...(profile.aliases ?? [])]) characterLoreByName.set(normalized(name), profile);

const emperorPeriodsByName = new Map<string, EmperorPeriod[]>();
for (const period of emperorPeriods) {
  const key = normalized(characterName(period.name));
  const periods = emperorPeriodsByName.get(key) ?? [];
  periods.push(period);
  emperorPeriodsByName.set(key, periods);
}

const curatedFightsByCharacter = new Map<string, CuratedFight[]>();
for (const fight of curatedFights) {
  const fighterKeys = new Set([normalized(characterName(fight.fighterA)), normalized(characterName(fight.fighterB))]);
  for (const key of fighterKeys) {
    const fights = curatedFightsByCharacter.get(key) ?? [];
    fights.push(fight);
    curatedFightsByCharacter.set(key, fights);
  }
}

async function arcPosition(db: D1Database, id: string | null) {
  if (!id || id === "-1") return null;
  return db.prepare("SELECT id, sort_order AS sortOrder, chapter_end AS chapterEnd, episode_end AS episodeEnd FROM arcs WHERE id = ?")
    .bind(id).first<{ id: string; sortOrder: number; chapterEnd: number; episodeEnd: number }>();
}

async function readCharacters(db: D1Database, arcOrder: number, chapterEnd: number, offset: number, limit: number) {
  // Read all indexed characters, then apply curated first-appearance and name
  // reveal dates below. The upstream first arc can be later than a verified
  // debut (for example, when an affiliation was added only after a timeskip).
  const sourcePayloadColumn = chapterEnd >= LAST_INDEXED_CHAPTER ? ", c.source_payload AS sourcePayload" : "";
  const result = await db.prepare(`SELECT c.id, c.name, c.image_url AS image, c.source_url AS imageSource, c.first_chapter AS firstChapter${sourcePayloadColumn}, a.sort_order AS knownAt, a.name AS firstArc FROM characters c LEFT JOIN arcs a ON a.id=c.first_arc_id ORDER BY a.sort_order, c.name LIMIT 10000`)
    .all<Record<string, unknown>>();
  const membershipResult = await db.prepare("SELECT m.character_id AS characterId, f.name AS groupName, m.role, ma.sort_order AS memberKnownAt, fa.sort_order AS groupKnownAt FROM affiliation_members m JOIN affiliations f ON f.id=m.affiliation_id LEFT JOIN arcs ma ON ma.id=m.known_arc_id LEFT JOIN arcs fa ON fa.id=f.first_arc_id WHERE ma.sort_order <= ? ORDER BY ma.sort_order, f.name")
    .bind(arcOrder).all<Record<string, unknown>>();
  const memberships = new Map<string, Record<string, unknown>[]>();
  for (const membership of membershipResult.results ?? []) {
    const revealOrder = affiliationRevealOrders[normalized(membership.groupName)] ?? Number(membership.groupKnownAt ?? 0);
    if (revealOrder > arcOrder) continue;
    const key = String(membership.characterId);
    const list = memberships.get(key) ?? [];
    list.push(membership);
    memberships.set(key, list);
  }
  const rows = (result.results ?? []).map((row) => {
    const profile = characterLoreByName.get(normalized(row.name));
    const visibleMemberships = memberships.get(String(row.id)) ?? [];
    const sourceMembership = visibleMemberships.find((item) => item.role && item.role !== "Membre") ?? visibleMemberships[0];
    const revealedChapter = Number(profile?.firstRevealChapter ?? profile?.firstChapter ?? row.firstChapter);
    const appearanceChapter = Number(profile?.firstChapter ?? row.firstChapter);
    const nameRevealOrder = Number(profile?.knownAt ?? row.knownAt);
    if (!Number.isFinite(revealedChapter) || revealedChapter <= 0 || !Number.isFinite(nameRevealOrder) || revealedChapter > chapterEnd || nameRevealOrder > arcOrder) return null;
    const visibleFirstChapter = appearanceChapter <= chapterEnd ? appearanceChapter : revealedChapter;
    const firstArc = String((arcSource as { name: string; chapterStart: number; chapterEnd: number }[]).find((arc) => visibleFirstChapter >= arc.chapterStart && visibleFirstChapter <= arc.chapterEnd)?.name ?? row.firstArc ?? "Manga");
    const roleKnown = !profile?.roleChapter || profile.roleChapter <= chapterEnd;
    const groupKnown = !profile?.groupChapter || profile.groupChapter <= chapterEnd;
    const role = profile ? (roleKnown ? profile.role : profile.preRevealRole) ?? "Personnage" : String(sourceMembership?.role ?? "Personnage");
    const group = profile
      ? (groupKnown ? profile.group : profile.preRevealGroup) ?? "Affiliation non précisée"
      : String(sourceMembership?.groupName ?? "Affiliation non précisée");
    const fullDescriptionKnownAt = Math.max(
      Number(profile?.descriptionChapter ?? profile?.firstChapter ?? 0),
      Number(profile?.roleChapter ?? profile?.firstChapter ?? 0),
      Number(profile?.groupChapter ?? profile?.firstChapter ?? 0),
    );
    const description = profile && fullDescriptionKnownAt <= chapterEnd
      ? profile.description
      : profile?.middleRevealDescription && Number(profile.middleRevealChapter) <= chapterEnd
        ? profile.middleRevealDescription
        : profile?.preRevealDescription ?? (profile
          ? "Première apparition connue dans l’arc " + firstArc + ", au chapitre " + String(appearanceChapter) + ". Son rôle et ses liens se précisent au fil du récit."
          : String(row.name) + " apparaît dans l’arc " + firstArc + " au chapitre " + String(appearanceChapter) + ". À ce point du récit, la base le rattache à " + String(group) + (role !== "Personnage" ? " comme " + role.toLowerCase() : "") + ". Ce repère situe sa place au moment de son entrée dans l’histoire; les événements postérieurs restent masqués et aucun exploit n’est avancé sans source datée.");
    const safeAchievements = (profile?.achievements ?? []).filter((item) => item.chapter <= chapterEnd).map((item) => {
      const event = normalized(item.text);
      const roleIsFuture = profile?.role && item.chapter < Number(profile.roleChapter ?? profile.firstChapter ?? 0) && event.includes(normalized(profile.role));
      const groupIsFuture = profile?.group && item.chapter < Number(profile.groupChapter ?? profile.firstChapter ?? 0) && event.includes(normalized(profile.group));
      return roleIsFuture || groupIsFuture
        ? { ...item, text: "Première apparition connue dans l’arc " + firstArc + "." }
        : item;
    });
    const bounties = (profile?.bounties ?? []).filter((item) => item.chapter <= chapterEnd);
    const catalogBounty = chapterEnd >= LAST_INDEXED_CHAPTER ? sourceBountySnapshot(row.sourcePayload) : null;
    const curatedBounty = bounties.at(-1)?.amount;
    // Some source records contain a current bounty without the chapter where it
    // was revealed. Keep that value hidden until the last indexed story point.
    // The UI labels it as a catalog snapshot instead of inventing a reveal date.
    if (chapterEnd >= LAST_INDEXED_CHAPTER && catalogBounty && (!curatedBounty || catalogBounty > curatedBounty)) {
      bounties.push({ chapter: LAST_INDEXED_CHAPTER, amount: catalogBounty, snapshot: true });
    }
    const publicRow = Object.fromEntries(Object.entries(row).filter(([key]) => key !== "sourcePayload"));
    const name = String(profile?.name ?? row.name);
    const title = emperorTitle(name, chapterEnd);
    return Object.assign({}, publicRow, {
      name: profile?.name ?? row.name,
      firstChapter: visibleFirstChapter,
      firstAppearanceChapter: appearanceChapter <= chapterEnd ? appearanceChapter : null,
      firstRevealChapter: profile?.firstRevealChapter ?? profile?.firstChapter ?? row.firstChapter,
      knownAt: profile?.knownAt ?? row.knownAt,
      role,
      group,
      description,
      achievements: safeAchievements.length ? safeAchievements : [{ chapter: revealedChapter, text: profile ? "Première apparition documentée dans l’arc " + firstArc + "." : "Première apparition documentée dans l’arc " + firstArc + (group !== "Affiliation non précisée" ? "; rôle recensé : " + role + " au sein de " + group : "") + "." }],
      bounties,
      greatEmperor: title !== null,
      emperorTitle: title,
      fights: fightsFor(name, chapterEnd),
    });
  }).filter((row): row is Record<string, unknown> => row !== null);
  const presentNames = new Set(rows.map((row) => normalized(row.name)));
  for (const profile of characterLore) {
    const chapter = Number(profile.firstChapter) || 0;
    const revealChapter = Number(profile.firstRevealChapter ?? chapter);
    const order = Number(profile.knownAt ?? (arcSource as { sortOrder?: number; chapterStart: number; chapterEnd: number }[]).find((arc) => chapter >= arc.chapterStart && chapter <= arc.chapterEnd)?.sortOrder);
    if (!profile.standalone || !chapter || revealChapter > chapterEnd || !Number.isFinite(order) || order > arcOrder || presentNames.has(normalized(profile.name))) continue;
    const role = profile.role && Number(profile.roleChapter ?? chapter) <= chapterEnd ? profile.role : profile.preRevealRole ?? "Personnage";
    const group = profile.group && Number(profile.groupChapter ?? chapter) <= chapterEnd ? profile.group : profile.preRevealGroup ?? "Affiliation non précisée";
    const fullDescriptionKnownAt = Math.max(Number(profile.descriptionChapter ?? chapter), Number(profile.roleChapter ?? chapter), Number(profile.groupChapter ?? chapter));
    const description = fullDescriptionKnownAt <= chapterEnd
      ? profile.description
      : profile.middleRevealDescription && Number(profile.middleRevealChapter) <= chapterEnd
        ? profile.middleRevealDescription
        : profile.preRevealDescription ?? "Première apparition documentée dans le manga.";
    const visibleFirstChapter = chapter <= chapterEnd ? chapter : revealChapter;
    const firstArc = (arcSource as { name: string; chapterStart: number; chapterEnd: number }[]).find((arc) => visibleFirstChapter >= arc.chapterStart && visibleFirstChapter <= arc.chapterEnd)?.name ?? "Manga";
    const achievements = (profile.achievements ?? []).filter((item) => item.chapter <= chapterEnd);
    const title = emperorTitle(profile.name, chapterEnd);
    rows.push({
      id: "curated-" + normalized(profile.name), name: profile.name, image: null, imageSource: null,
      firstChapter: chapter <= chapterEnd ? chapter : revealChapter,
      firstAppearanceChapter: chapter <= chapterEnd ? chapter : null,
      firstRevealChapter: revealChapter, knownAt: order,
      role, group, description,
      achievements: achievements.length ? achievements : [{ chapter, text: "Première apparition documentée dans l’arc " + firstArc + "." }],
      bounties: (profile.bounties ?? []).filter((item) => item.chapter <= chapterEnd),
      greatEmperor: title !== null, emperorTitle: title, fights: fightsFor(profile.name, chapterEnd),
    });
    presentNames.add(normalized(profile.name));
  }
  const uniqueRows = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    const key = normalized(row.name);
    const existing = uniqueRows.get(key);
    if (!existing) {
      uniqueRows.set(key, row);
      continue;
    }
    if (!existing.image && row.image) existing.image = row.image;
    if (!existing.imageSource && row.imageSource) existing.imageSource = row.imageSource;
  }
  const allRows = Array.from(uniqueRows.values());
  return { rows: allRows.slice(offset, offset + limit), total: allRows.length };
}

function sourceVariants(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (!value || typeof value !== "object") return [];
  return Object.values(value as Record<string, unknown>).filter((item): item is string => typeof item === "string");
}

function groupFlagImage(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const filename = decodeURIComponent(new URL(value).pathname).toLowerCase();
    return /jolly[_ -]?roger|pirates?[_ -]?flag|flag[_ -]?of/.test(filename) ? value : null;
  } catch {
    return null;
  }
}

async function readFruits(db: D1Database, arcOrder: number) {
  const [known, unclassified] = await Promise.all([
    db.prepare("SELECT f.id, f.name, f.model, f.type, f.sub_type AS subType, f.image_url AS image, f.first_chapter AS firstChapter, a.sort_order AS knownAt, f.canon_status AS canonStatus, f.description, f.source_url AS sourceUrl, f.source_payload AS sourcePayload FROM devil_fruits f JOIN arcs a ON a.id=f.first_arc_id WHERE a.sort_order <= ? ORDER BY a.sort_order, f.name LIMIT 1000")
      .bind(arcOrder).all<Record<string, unknown>>(),
    db.prepare("SELECT COUNT(*) AS total FROM devil_fruits WHERE first_arc_id IS NULL").first<{ total: number }>(),
  ]);
  const rows = (known.results ?? []).map((row) => {
    let source: Record<string, unknown> = {};
    try { source = JSON.parse(String(row.sourcePayload ?? "{}")); } catch { /* The indexed fields remain usable. */ }
    const aliases = Array.from(new Set([row.name, row.model, ...sourceVariants(source.name), ...sourceVariants(source.model)].filter((value): value is string => typeof value === "string" && Boolean(value.trim()))));
    const publicRow = Object.fromEntries(Object.entries(row).filter(([key]) => key !== "sourcePayload"));
    return Object.assign(publicRow, { aliases });
  });
  return { rows, total: rows.length, unclassifiedTotal: unclassified?.total ?? 0 };
}

async function readShips(db: D1Database, chapterEnd: number) {
  let databaseRows: Record<string, unknown>[] = [];
  try {
    const result = await db.prepare("SELECT id, name, type, image_url AS image, first_chapter AS firstChapter, affiliation, source_url AS imageSource FROM ships WHERE first_chapter IS NOT NULL AND first_chapter <= ? ORDER BY first_chapter, name LIMIT 1000")
      .bind(chapterEnd).all<Record<string, unknown>>();
    databaseRows = result.results ?? [];
  } catch (error) {
    // Keep the rest of the catalog usable when a local database has not yet
    // received the ships migration. Curated ships below remain available.
    if (!(error instanceof Error) || !/no such table:\s*ships\b/i.test(error.message)) throw error;
  }
  const rows: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  const presentChapter = (chapter: number) => chapter > 0 && chapter <= chapterEnd;
  const toShip = (input: Record<string, unknown>, lore?: CuratedShip) => {
    const firstChapter = Number(lore?.firstChapter ?? input.firstChapter) || 0;
    if (!presentChapter(firstChapter)) return null;
    const arcIndex = (arcSource as { chapterStart: number; chapterEnd: number }[]).findIndex((arc) => firstChapter >= arc.chapterStart && firstChapter <= arc.chapterEnd);
    const events = (lore?.achievements ?? []).filter((item) => presentChapter(Number(item.chapter))).sort((left, right) => left.chapter - right.chapter);
    const description = lore
      ? (Number(lore.descriptionChapter ?? 0) <= chapterEnd ? lore.description : lore.preRevealDescription)
      : null;
    const affiliationNames = String(input.affiliation ?? "").split(/[·,;|]/).map((value) => value.trim()).filter(Boolean);
    const associatedCrew = lore?.crewId
      ? curatedCrews.find((crew) => crew.id === lore.crewId)
      : affiliationNames.map((name) => curatedCrew(name)).find((crew) => Boolean(crew));
    const crewRevealed = Boolean(associatedCrew && (arcIndex < 0 || associatedCrew.knownAt <= arcIndex));
    const name = lore?.name ?? String(input.name);
    return {
      id: lore?.id ?? String(input.id), name,
      type: lore?.type ?? input.type ?? "Type non précisé",
      image: input.image ?? null, imageSource: input.imageSource ?? null,
      firstChapter, knownAt: arcIndex >= 0 ? arcIndex : null,
      crewId: crewRevealed ? associatedCrew?.id ?? null : null,
      affiliationLabel: lore?.affiliationLabel ?? (crewRevealed ? associatedCrew?.name : null) ?? null,
      art: lore?.art ?? "sailing", color: lore?.color ?? "#7ca59b",
      description: description ?? (name + " est un navire répertorié dans la source du catalogue. Sa première apparition connue est située au chapitre " + firstChapter + "."),
      achievements: events.length ? events : [{ chapter: firstChapter, text: "Première apparition connue du navire dans le récit." }],
    };
  };
  for (const row of databaseRows) {
    const lore = curatedShip(row.name);
    const ship = toShip(row, lore);
    if (!ship) continue;
    const key = String(ship.id);
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(ship);
  }
  // Curated vessels appear immediately, even before the first remote catalog sync.
  for (const lore of curatedShips) {
    if (seen.has(lore.id)) continue;
    const ship = toShip({ id: lore.id, name: lore.name }, lore);
    if (!ship) continue;
    seen.add(lore.id);
    rows.push(ship);
  }
  return rows.sort((left, right) => Number(left.firstChapter) - Number(right.firstChapter) || String(left.name).localeCompare(String(right.name), "fr"));
}

async function readCrews(db: D1Database, arcOrder: number, chapterEnd: number) {
  const result = await db.prepare("SELECT f.id, f.name, f.kind, f.description, f.image_url AS image, f.source_url AS imageSource, fa.sort_order AS knownAt, c.id AS memberId, c.name AS memberName, c.first_chapter AS memberFirstChapter, c.image_url AS memberImage, c.source_url AS memberImageSource, c.description AS memberDescription, m.role, ma.sort_order AS memberKnownAt FROM affiliations f LEFT JOIN arcs fa ON fa.id=f.first_arc_id LEFT JOIN affiliation_members m ON m.affiliation_id=f.id LEFT JOIN characters c ON c.id=m.character_id LEFT JOIN arcs ma ON ma.id=m.known_arc_id ORDER BY fa.sort_order, f.name, ma.sort_order, c.name LIMIT 12000")
    .all<Record<string, unknown>>();
  const groups = new Map<string, Record<string, unknown>>();
  const memberDetails = new Map<string, Record<string, unknown>>();
  for (const row of result.results ?? []) {
    if (row.memberId && row.memberName) {
      const memberKey = normalized(row.memberName);
      if (!memberDetails.has(memberKey) || (!memberDetails.get(memberKey)?.memberImage && row.memberImage)) memberDetails.set(memberKey, row);
    }
    const id = String(row.id);
    if (normalized(row.name) === "marines" || normalized(row.name) === "marine") continue;
    const curated = curatedCrew(row.name);
    if (!curated && row.knownAt == null) continue;
    const revealOrder = curated?.knownAt ?? affiliationRevealOrders[normalized(row.name)] ?? Number(row.knownAt);
    if (revealOrder > arcOrder) continue;
    let group = groups.get(id);
    if (!group) {
      group = {
        id: curated?.id ?? id,
        name: curated && Number(curated.nameRevealChapter ?? 0) > chapterEnd ? curated.preRevealName ?? curated.name : curated?.name ?? row.name,
        canonicalId: curated?.id ?? id, canonicalName: curated?.name ?? row.name, kind: row.kind,
        tag: curated?.tag ?? row.kind,
        description: curated
          ? Number(curated.descriptionChapter ?? 0) <= chapterEnd
            ? curated.description
            : curated.middleRevealDescription && Number(curated.middleRevealChapter) <= chapterEnd
              ? curated.middleRevealDescription
            : curated.preRevealDescription ?? "Cette fiche reste volontairement concise jusqu’aux révélations de l’histoire."
          : row.description,
        achievements: (curated?.achievements ?? []).filter((item) => item.chapter <= chapterEnd).map((item) => ({ ...item })),
        image: groupFlagImage(row.image), imageSource: groupFlagImage(row.image) ? row.imageSource : null, knownAt: revealOrder, members: [] as Record<string, unknown>[],
      };
      groups.set(id, group);
    }
    if (row.memberId && row.memberName && row.memberKnownAt != null && Number(row.memberKnownAt) <= arcOrder) {
      const members = group.members as Record<string, unknown>[];
      const profile = characterLoreByName.get(normalized(row.memberName));
      members.push({
        id: row.memberId, name: profile?.name ?? row.memberName, image: row.memberImage, imageSource: row.memberImageSource,
        description: visibleLoreDescription(profile, chapterEnd),
        role: profile ? ((profile.roleChapter ?? profile.firstChapter ?? 0) <= chapterEnd ? profile.role : profile.preRevealRole) ?? "Membre" : row.role || "Membre",
        knownAt: Math.max(Number(row.memberKnownAt) || 0, Number(profile?.knownAt) || 0),
        firstChapter: Number(profile?.firstChapter ?? row.memberFirstChapter) || null,
      });
    }
  }
  // Keep a curated crew page available when the upstream affiliation has no
  // first-arc index yet (or is temporarily missing from the source catalog).
  for (const curated of curatedCrews) {
    if (curated.knownAt > arcOrder) continue;
    const key = normalized(curated.id);
    if (Array.from(groups.values()).some((group) => normalized(group.canonicalId ?? group.id) === key)) continue;
    groups.set("curated:" + curated.id, {
      id: curated.id,
      name: Number(curated.nameRevealChapter ?? 0) > chapterEnd ? curated.preRevealName ?? curated.name : curated.name,
      canonicalId: curated.id, canonicalName: curated.name,
      kind: curated.tag ?? "Équipage pirate", tag: curated.tag ?? "Équipage pirate",
      description: Number(crewEnrichment[curated.id]?.descriptionChapter ?? Number.MAX_SAFE_INTEGER) <= chapterEnd
        ? crewEnrichment[curated.id].description
        : Number(curated.descriptionChapter ?? 0) <= chapterEnd
          ? curated.description
          : curated.middleRevealDescription && Number(curated.middleRevealChapter) <= chapterEnd
            ? curated.middleRevealDescription
          : curated.preRevealDescription ?? "Cette fiche reste volontairement concise jusqu’aux révélations de l’histoire.",
      achievements: [...(curated.achievements ?? []), ...(crewEnrichment[curated.id]?.achievements ?? [])].filter((item) => item.chapter <= chapterEnd).map((item) => ({ ...item })),
      image: null, imageSource: null, knownAt: curated.knownAt, members: [] as Record<string, unknown>[],
    });
  }
  // Curated rosters preserve the earliest arc where a crew member was already
  // known, even if the upstream catalog only linked that person to the group later.
  for (const group of groups.values()) {
    const curated = curatedCrew(group.canonicalName ?? group.name);
    if (!curated?.members?.length) continue;
    const members = group.members as Record<string, unknown>[];
    for (const [name, listedRole, knownAt] of curated.members) {
      if (knownAt > arcOrder) continue;
      const profile = characterLoreByName.get(normalized(name));
      const existing = members.find((member) => normalized(member.name) === normalized(profile?.name ?? name));
      const details = memberDetails.get(normalized(name)) ?? memberDetails.get(normalized(profile?.name ?? name));
      const roleKnown = !profile?.roleChapter || profile.roleChapter <= chapterEnd;
      const visibleRole = profile ? roleKnown ? profile.role ?? listedRole : profile.preRevealRole ?? "Membre" : listedRole || "Membre";
      const visibleDescription = visibleLoreDescription(profile, chapterEnd);
      if (existing) {
        existing.knownAt = knownAt;
        existing.role = visibleRole;
        if (!existing.image && details?.memberImage) existing.image = details.memberImage;
        if (!existing.imageSource && details?.memberImageSource) existing.imageSource = details.memberImageSource;
        if (!existing.description && visibleDescription) existing.description = visibleDescription;
        continue;
      }
      members.push({
        id: details?.memberId ?? null,
        name: profile?.name ?? details?.memberName ?? name,
        role: visibleRole,
        knownAt,
        firstChapter: Number(profile?.firstChapter ?? details?.memberFirstChapter) || null,
        image: details?.memberImage ?? null,
        imageSource: details?.memberImageSource ?? null,
        description: visibleDescription,
      });
    }
  }
  const collapsed = new Map<string, Record<string, unknown>>();
  for (const group of groups.values()) {
    const canonicalId = String(group.canonicalId ?? group.id);
    const curated = curatedCrew(group.canonicalName ?? group.name);
    const members = group.members as Record<string, unknown>[];
    const key = normalized(canonicalId);
    const existing = collapsed.get(key);
    if (!existing) {
      collapsed.set(key, group);
      continue;
    }
    if (!existing.image && group.image) {
      existing.image = group.image;
      existing.imageSource = group.imageSource ?? null;
    }
    const existingMembers = existing.members as Record<string, unknown>[];
    for (const member of members) {
      const memberKey = normalized(member.name);
      const match = existingMembers.find((candidate) => normalized(candidate.name) === memberKey);
      if (!match) existingMembers.push(member);
      else {
        match.knownAt = Math.max(Number(match.knownAt) || 0, Number(member.knownAt) || 0);
        if (!match.firstChapter && member.firstChapter) match.firstChapter = member.firstChapter;
        if ((!match.role || match.role === "Membre") && member.role) match.role = member.role;
        if (!match.image && member.image) match.image = member.image;
        if (!match.description && member.description) match.description = member.description;
      }
    }
    if (curated) existing.knownAt = curated.knownAt;
    else existing.knownAt = Math.max(Number(existing.knownAt) || 0, Number(group.knownAt) || 0);
  }
  return Array.from(collapsed.values()).filter((group) => normalized(group.id) !== "marines" && normalized(group.name) !== "marines" && normalized(group.name) !== "marine").map((group) => {
    if (!curatedCrew(group.canonicalName ?? group.name)) {
      const count = (group.members as Record<string, unknown>[]).length;
      const members = group.members as Record<string, unknown>[];
      const examples = members.slice(0, 3).map((member) => String(member.name) + (member.role && member.role !== "Membre" ? " (« " + String(member.role) + " »)" : ""));
      const sampleText = examples.length ? " Parmi eux : " + examples.join(", ") + "." : " Aucun membre n’est encore documenté à ce point du récit.";
      group.tag = count === 1 ? "Lien répertorié" : "Groupe répertorié";
      group.description = String(group.name) + " est répertorié parmi les groupes et affiliations liés aux personnages de l’œuvre. Jusqu’au chapitre " + chapterEnd + ", cette fiche identifie " + count + " membre" + (count > 1 ? "s" : "") + " dont la présence est connue." + sampleText + " Les membres révélés plus tard restent masqués.";
    }
    const crew = curatedCrew(group.canonicalName ?? group.name);
    const enrichment = crew ? crewEnrichment[crew.id] : undefined;
    if (crew) {
      group.emperorTitle = emperorCrewTitle(crew.id, chapterEnd);
      group.greatEmperor = Boolean(group.emperorTitle);
      if (enrichment && chapterEnd >= enrichment.descriptionChapter) group.description = enrichment.description;
      const entries = group.achievements as { chapter: number; text: string }[];
      for (const achievement of enrichment?.achievements ?? []) {
        if (achievement.chapter > chapterEnd) continue;
        if (entries.some((item) => item.chapter === achievement.chapter && item.text === achievement.text)) continue;
        const sameChapter = entries.find((item) => item.chapter === achievement.chapter);
        if (sameChapter) {
          const includedAt = sameChapter.text.indexOf(achievement.text);
          if (includedAt >= 0) {
            const beforeEnrichment = sameChapter.text.slice(0, includedAt).trim();
            sameChapter.text = beforeEnrichment ? beforeEnrichment + " " + achievement.text : achievement.text;
          } else {
            sameChapter.text += " " + achievement.text;
          }
        }
        else entries.push(achievement);
      }
      entries.sort((a, b) => a.chapter - b.chapter);
    }
    const achievements = group.achievements as { chapter: number; text: string }[];
    if (!achievements.length) {
      const members = group.members as Record<string, unknown>[];
      const firstMember = members
        .filter((member) => Number(member.knownAt ?? 0) <= arcOrder && Number(member.firstChapter) > 0 && Number(member.firstChapter) <= chapterEnd)
        .sort((left, right) => Number(left.firstChapter) - Number(right.firstChapter))[0];
      if (firstMember) {
        const chapter = Number(firstMember.firstChapter);
        achievements.push({ chapter, text: "Premier repère de présence pour cette affiliation dans le catalogue : " + String(firstMember.name) + " apparaît au chapitre " + String(chapter) + ". Cette date situe le personnage, sans lui attribuer un exploit collectif." });
      }
    }
    return group;
  });
}

function emperorCrewTitle(id: string, chapterEnd: number) {
  const captains: Record<string, string[]> = {
    "straw-hats": ["Monkey D. Luffy"], "red-hair": ["Shanks"], "buggy": ["Buggy"],
    "blackbeard": ["Marshall D. Teach", "Blackbeard"], "whitebeard": ["Edward Newgate", "Whitebeard"],
    "big-mom": ["Charlotte Linlin", "Big Mom"], "beasts": ["Kaido"], "cross-guild": ["Buggy"],
  };
  if (id === "cross-guild" && chapterEnd < 1058) return null;
  return (captains[id] ?? []).map((name) => emperorTitle(name, chapterEnd)).find(Boolean) ?? null;
}

async function readGuide(db: D1Database, table: "episodes" | "chapters", maxNumber: number) {
  if (table === "episodes") {
    const records = await db.prepare("SELECT e.number, e.title, e.chapter_text AS chapter, a.name AS arcName, e.source_payload AS payload FROM episodes e LEFT JOIN arcs a ON a.id=e.arc_id WHERE e.number <= ? ORDER BY e.number LIMIT 3000")
      .bind(maxNumber).all<{ number: number; title: string | null; chapter: string | null; arcName: string | null; payload: string }>();
    return (records.results ?? []).map((row) => {
      let source: Record<string, unknown> = {};
      try { source = JSON.parse(row.payload); } catch { /* Keep the compact indexed fields. */ }
      return {
        number: row.number,
        title: row.title,
        chapter: row.chapter,
        arc: { title: row.arcName ?? "Arc à confirmer" },
        release_date: source.release_date ?? source.releaseDate ?? null,
        description: source.description ?? source.synopsis ?? source.summary ?? null,
      };
    });
  }
  const records = await db.prepare("SELECT number, title, volume FROM chapters WHERE number <= ? ORDER BY number LIMIT 3000")
    .bind(maxNumber).all<{ number: number; title: string | null; volume: number | null }>();
  return (records.results ?? []).map((row) => ({
    number: row.number,
    chapter_number: row.number,
    title: row.title,
    tome: row.volume ? { tome_number: row.volume } : null,
  }));
}

export async function GET(request: Request) {
  try {
    const db = getDb();
    const url = new URL(request.url);
    const requestedType = url.searchParams.get("type") ?? "all";
    const arc = await arcPosition(db, url.searchParams.get("arc"));
    if (!arc) return jsonResponse({ ok: true, empty: true, characters: { rows: [], total: 0 }, fruits: { rows: [], total: 0, unclassifiedTotal: 0 }, crews: [], ships: [], episodes: [], chapters: [], syncedAt: null });

    const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
    const limit = Math.max(1, Math.min(MAX_CHARACTERS_PER_PAGE, Number(url.searchParams.get("limit")) || MAX_CHARACTERS_PER_PAGE));
    if (requestedType === "characters") {
      return jsonResponse({ ok: true, characters: await readCharacters(db, arc.sortOrder, arc.chapterEnd, offset, limit) });
    }
    if (requestedType === "guide") {
      const [episodes, chapters, sync] = await Promise.all([
        readGuide(db, "episodes", arc.episodeEnd),
        readGuide(db, "chapters", arc.chapterEnd),
        db.prepare("SELECT MAX(synced_at) AS syncedAt FROM sync_state").first<{ syncedAt: string | null }>(),
      ]);
      return jsonResponse({ ok: true, arc: arc.id, episodes, chapters, syncedAt: sync?.syncedAt ?? null });
    }

    const [characters, fruits, crews, ships, sync] = await Promise.all([
      readCharacters(db, arc.sortOrder, arc.chapterEnd, 0, MAX_CHARACTERS_PER_PAGE),
      readFruits(db, arc.sortOrder),
      readCrews(db, arc.sortOrder, arc.chapterEnd),
      readShips(db, arc.chapterEnd),
      db.prepare("SELECT MAX(synced_at) AS syncedAt FROM sync_state").first<{ syncedAt: string | null }>(),
    ]);
    return jsonResponse({ ok: true, arc: arc.id, characters, fruits, crews, ships, syncedAt: sync?.syncedAt ?? null });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Lecture du catalogue impossible." }, 503);
  }
}
