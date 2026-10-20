import { env } from "cloudflare:workers";

export const apiDb = env.DB;
export const PAGE_SIZE = 100;
export const DATA_SOURCE = "https://www.onepieceapi.com/documentation";

export type ArcRecord = {
  id: string;
  name: string;
  saga: string;
  chapterStart: number;
  chapterEnd: number;
  episodeStart: number;
  episodeEnd: number;
};

export function localized(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  for (const key of ["fr", "en", "romaji", "jp"]) {
    if (typeof record[key] === "string" && record[key]) return String(record[key]).trim();
  }
  return "";
}

export function chapterFromAppearance(value: unknown): number | null {
  const match = String(value ?? "").match(/chapter\s*[-:#]?\s*(\d+)/i);
  return match ? Number(match[1]) : null;
}

export function rowsFromPayload(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["results", "data", "items"]) {
      if (Array.isArray(record[key])) return record[key] as unknown[];
    }
  }
  return [];
}

export function jsonResponse(body: unknown, status = 200, headers: HeadersInit = {}) {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Cache-Control", "private, max-age=30");
  responseHeaders.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { status, headers: responseHeaders });
}

export function getDb() {
  if (!apiDb) throw new Error("La base D1 n’est pas configurée pour ce site.");
  return apiDb;
}

export function numeric(value: unknown): number | null {
  const match = String(value ?? "").match(/\d+/);
  return match ? Number(match[0]) : null;
}

export function arcForChapter(chapter: number | null, arcs: ArcRecord[]): ArcRecord | null {
  if (!chapter) return null;
  return arcs.find((arc) => chapter >= arc.chapterStart && chapter <= arc.chapterEnd) ?? null;
}

export function safeLabel(value: unknown): string {
  return typeof value === "string" ? value.replace(/[\u0000-\u001f]/g, "").slice(0, 240) : "";
}
