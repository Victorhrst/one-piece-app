import { getDb, jsonResponse } from "../_lib";

const MAX_CHARACTERS_PER_PAGE = 300;

async function arcPosition(db: D1Database, id: string | null) {
  if (!id || id === "-1") return null;
  return db.prepare("SELECT id, sort_order AS sortOrder, chapter_end AS chapterEnd, episode_end AS episodeEnd FROM arcs WHERE id = ?")
    .bind(id).first<{ id: string; sortOrder: number; chapterEnd: number; episodeEnd: number }>();
}

async function readCharacters(db: D1Database, arcOrder: number, offset: number, limit: number) {
  const count = await db.prepare("SELECT COUNT(*) AS total FROM characters c JOIN arcs a ON a.id=c.first_arc_id WHERE a.sort_order <= ?")
    .bind(arcOrder).first<{ total: number }>();
  const result = await db.prepare("SELECT c.id, c.name, c.image_url AS image, c.description, c.first_chapter AS firstChapter, a.sort_order AS knownAt, a.name AS firstArc FROM characters c JOIN arcs a ON a.id=c.first_arc_id WHERE a.sort_order <= ? ORDER BY a.sort_order, c.name LIMIT ? OFFSET ?")
    .bind(arcOrder, limit, offset).all<Record<string, unknown>>();
  return { rows: result.results ?? [], total: count?.total ?? 0 };
}

async function readFruits(db: D1Database, arcOrder: number) {
  const [known, unclassified] = await Promise.all([
    db.prepare("SELECT f.id, f.name, f.model, f.type, f.sub_type AS subType, f.image_url AS image, f.first_chapter AS firstChapter, a.sort_order AS knownAt, f.canon_status AS canonStatus, f.description FROM devil_fruits f JOIN arcs a ON a.id=f.first_arc_id WHERE a.sort_order <= ? ORDER BY a.sort_order, f.name LIMIT 1000")
      .bind(arcOrder).all<Record<string, unknown>>(),
    db.prepare("SELECT COUNT(*) AS total FROM devil_fruits WHERE first_arc_id IS NULL").first<{ total: number }>(),
  ]);
  return { rows: known.results ?? [], total: known.results?.length ?? 0, unclassifiedTotal: unclassified?.total ?? 0 };
}

async function readCrews(db: D1Database, arcOrder: number) {
  const result = await db.prepare("SELECT f.id, f.name, f.kind, f.description, f.image_url AS image, fa.sort_order AS knownAt, c.id AS memberId, c.name AS memberName, c.image_url AS memberImage, c.description AS memberDescription, m.role, ma.sort_order AS memberKnownAt FROM affiliations f JOIN arcs fa ON fa.id=f.first_arc_id LEFT JOIN affiliation_members m ON m.affiliation_id=f.id LEFT JOIN characters c ON c.id=m.character_id LEFT JOIN arcs ma ON ma.id=m.known_arc_id WHERE fa.sort_order <= ? AND (ma.sort_order <= ? OR m.character_id IS NULL) ORDER BY fa.sort_order, f.name, ma.sort_order, c.name LIMIT 12000")
    .bind(arcOrder, arcOrder).all<Record<string, unknown>>();
  const groups = new Map<string, Record<string, unknown>>();
  for (const row of result.results ?? []) {
    const id = String(row.id);
    let group = groups.get(id);
    if (!group) {
      group = { id, name: row.name, kind: row.kind, description: row.description, image: row.image, knownAt: row.knownAt, members: [] as Record<string, unknown>[] };
      groups.set(id, group);
    }
    if (row.memberId && row.memberName) {
      const members = group.members as Record<string, unknown>[];
      members.push({ id: row.memberId, name: row.memberName, image: row.memberImage, description: row.memberDescription, role: row.role || "Membre", knownAt: row.memberKnownAt });
      if (!group.image && row.memberImage) group.image = row.memberImage;
    }
  }
  return Array.from(groups.values());
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
    if (!arc) return jsonResponse({ ok: true, empty: true, characters: { rows: [], total: 0 }, fruits: { rows: [], total: 0, unclassifiedTotal: 0 }, crews: [], episodes: [], chapters: [], syncedAt: null });

    const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
    const limit = Math.max(1, Math.min(MAX_CHARACTERS_PER_PAGE, Number(url.searchParams.get("limit")) || MAX_CHARACTERS_PER_PAGE));
    if (requestedType === "characters") {
      return jsonResponse({ ok: true, characters: await readCharacters(db, arc.sortOrder, offset, limit) });
    }
    if (requestedType === "guide") {
      const [episodes, chapters, sync] = await Promise.all([
        readGuide(db, "episodes", arc.episodeEnd),
        readGuide(db, "chapters", arc.chapterEnd),
        db.prepare("SELECT MAX(synced_at) AS syncedAt FROM sync_state").first<{ syncedAt: string | null }>(),
      ]);
      return jsonResponse({ ok: true, arc: arc.id, episodes, chapters, syncedAt: sync?.syncedAt ?? null });
    }

    const [characters, fruits, crews, sync] = await Promise.all([
      readCharacters(db, arc.sortOrder, 0, MAX_CHARACTERS_PER_PAGE),
      readFruits(db, arc.sortOrder),
      readCrews(db, arc.sortOrder),
      db.prepare("SELECT MAX(synced_at) AS syncedAt FROM sync_state").first<{ syncedAt: string | null }>(),
    ]);
    return jsonResponse({ ok: true, arc: arc.id, characters, fruits, crews, syncedAt: sync?.syncedAt ?? null });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Lecture du catalogue impossible." }, 503);
  }
}
