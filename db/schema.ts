import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const arcs = sqliteTable("arcs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  saga: text("saga").notNull(),
  sortOrder: integer("sort_order").notNull(),
  chapterStart: integer("chapter_start").notNull(),
  chapterEnd: integer("chapter_end").notNull(),
  episodeStart: integer("episode_start").notNull(),
  episodeEnd: integer("episode_end").notNull(),
});

export const characters = sqliteTable("characters", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  description: text("description"),
  firstChapter: integer("first_chapter"),
  firstArcId: text("first_arc_id").references(() => arcs.id),
  sourceUrl: text("source_url"),
  sourcePayload: text("source_payload").notNull().default("{}"),
  updatedAt: text("updated_at").notNull(),
}, (table) => [index("characters_first_arc_idx").on(table.firstArcId), index("characters_name_idx").on(table.name)]);

export const devilFruits = sqliteTable("devil_fruits", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  model: text("model"),
  type: text("type"),
  subType: text("sub_type"),
  imageUrl: text("image_url"),
  firstChapter: integer("first_chapter"),
  firstArcId: text("first_arc_id").references(() => arcs.id),
  canonStatus: text("canon_status").notNull().default("À confirmer"),
  description: text("description"),
  sourceUrl: text("source_url"),
  sourcePayload: text("source_payload").notNull().default("{}"),
  updatedAt: text("updated_at").notNull(),
}, (table) => [index("devil_fruits_first_arc_idx").on(table.firstArcId), index("devil_fruits_name_idx").on(table.name)]);

export const affiliations = sqliteTable("affiliations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  kind: text("kind").notNull().default("Équipage ou organisation"),
  description: text("description"),
  imageUrl: text("image_url"),
  firstArcId: text("first_arc_id").references(() => arcs.id),
  sourceUrl: text("source_url"),
  sourcePayload: text("source_payload").notNull().default("{}"),
  updatedAt: text("updated_at").notNull(),
}, (table) => [index("affiliations_first_arc_idx").on(table.firstArcId), index("affiliations_name_idx").on(table.name)]);

export const affiliationMembers = sqliteTable("affiliation_members", {
  affiliationId: text("affiliation_id").notNull().references(() => affiliations.id),
  characterId: text("character_id").notNull().references(() => characters.id),
  role: text("role"),
  knownArcId: text("known_arc_id").references(() => arcs.id),
}, (table) => [uniqueIndex("affiliation_members_pair_idx").on(table.affiliationId, table.characterId), index("affiliation_members_arc_idx").on(table.knownArcId)]);

export const episodes = sqliteTable("episodes", {
  id: text("id").primaryKey(),
  number: integer("number").notNull(),
  title: text("title"),
  chapterText: text("chapter_text"),
  arcId: text("arc_id").references(() => arcs.id),
  sourcePayload: text("source_payload").notNull().default("{}"),
  updatedAt: text("updated_at").notNull(),
}, (table) => [uniqueIndex("episodes_number_idx").on(table.number), index("episodes_arc_idx").on(table.arcId)]);

export const chapters = sqliteTable("chapters", {
  id: text("id").primaryKey(),
  number: integer("number").notNull(),
  title: text("title"),
  volume: integer("volume"),
  arcId: text("arc_id").references(() => arcs.id),
  sourcePayload: text("source_payload").notNull().default("{}"),
  updatedAt: text("updated_at").notNull(),
}, (table) => [uniqueIndex("chapters_number_idx").on(table.number), index("chapters_arc_idx").on(table.arcId)]);

export const syncState = sqliteTable("sync_state", {
  source: text("source").primaryKey(),
  syncedAt: text("synced_at").notNull(),
  recordCount: integer("record_count").notNull().default(0),
  status: text("status").notNull().default("ok"),
});
