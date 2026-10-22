import arcSource from "../../../content/arcs.json";
import { jsonResponse } from "../_lib";

type LocationArt = { arc: string; titles: string[] };
type WikiPage = {
  title?: string;
  missing?: boolean;
  thumbnail?: { source?: string };
  original?: { source?: string };
  images?: { title?: string }[];
  imageinfo?: { thumburl?: string; url?: string }[];
};

const locations: Record<string, LocationArt> = {
  "goat-island": { arc: "alabasta", titles: ["Goat Island"] },
  foosha: { arc: "romance-dawn", titles: ["Dawn Island", "Foosha Village"] },
  "shells-town": { arc: "romance-dawn", titles: ["Shells Town"] },
  "orange-town": { arc: "orange-town", titles: ["Orange Town"] },
  "rare-animal-island": { arc: "syrup-village", titles: ["Rare Animal Island"] },
  "syrup-village": { arc: "syrup-village", titles: ["Syrup Village"] },
  baratie: { arc: "baratie", titles: ["Baratie"] },
  "conomi-islands": { arc: "arlong-park", titles: ["Conomi Islands"] },
  loguetown: { arc: "loguetown", titles: ["Loguetown"] },
  "reverse-mountain": { arc: "reverse-mountain", titles: ["Reverse Mountain", "Twin Cape"] },
  "whisky-peak": { arc: "whisky-peak", titles: ["Whisky Peak", "Cactus Island"] },
  "little-garden": { arc: "little-garden", titles: ["Little Garden"] },
  "drum-island": { arc: "drum-island", titles: ["Drum Island"] },
  alabasta: { arc: "alabasta", titles: ["Arabasta Kingdom", "Alabasta"] },
  jaya: { arc: "jaya", titles: ["Jaya"] },
  skypiea: { arc: "skypiea", titles: ["Skypiea"] },
  "long-ring-long-land": { arc: "long-ring-long-land", titles: ["Long Ring Long Land"] },
  "water-7": { arc: "water-7", titles: ["Water 7", "Water Seven"] },
  "enies-lobby": { arc: "enies-lobby", titles: ["Enies Lobby"] },
  "thriller-bark": { arc: "thriller-bark", titles: ["Thriller Bark"] },
  sabaody: { arc: "sabaody", titles: ["Sabaody Archipelago", "Sabaody"] },
  "amazon-lily": { arc: "amazon-lily", titles: ["Amazon Lily"] },
  "impel-down": { arc: "impel-down", titles: ["Impel Down"] },
  marineford: { arc: "marineford", titles: ["Marineford"] },
  rusukaina: { arc: "post-war", titles: ["Rusukaina"] },
  kuraigana: { arc: "post-war", titles: ["Kuraigana Island", "Kuraigana"] },
  weatheria: { arc: "post-war", titles: ["Weatheria"] },
  "boin-archipelago": { arc: "post-war", titles: ["Boin Archipelago"] },
  "momoiro-island": { arc: "post-war", titles: ["Momoiro Island", "Kamabakka Kingdom"] },
  "torino-kingdom": { arc: "post-war", titles: ["Torino Kingdom"] },
  "tequila-wolf": { arc: "post-war", titles: ["Tequila Wolf"] },
  baltigo: { arc: "post-war", titles: ["Baltigo"] },
  "karakuri-island": { arc: "post-war", titles: ["Karakuri Island"] },
  "namakura-island": { arc: "post-war", titles: ["Namakura Island"] },
  "kenzan-island": { arc: "post-war", titles: ["Kenzan Island"] },
  "red-line": { arc: "sabaody", titles: ["Red Line"] },
  "marie-joie": { arc: "sabaody", titles: ["Mary Geoise", "Marie Joie"] },
  "fishman-island": { arc: "fishman-island", titles: ["Fish-Man Island", "Fishman Island"] },
  "punk-hazard": { arc: "punk-hazard", titles: ["Punk Hazard"] },
  dressrosa: { arc: "dressrosa", titles: ["Dressrosa"] },
  "green-bit": { arc: "dressrosa", titles: ["Green Bit"] },
  zou: { arc: "zou", titles: ["Zou"] },
  "cacao-island": { arc: "whole-cake-island", titles: ["Cacao Island"] },
  "whole-cake-island": { arc: "whole-cake-island", titles: ["Whole Cake Island"] },
  "nuts-island": { arc: "whole-cake-island", titles: ["Nuts Island"] },
  "totto-land": { arc: "whole-cake-island", titles: ["Totto Land"] },
  "mirror-world": { arc: "whole-cake-island", titles: ["Mirro-World"] },
  "germa-kingdom": { arc: "whole-cake-island", titles: ["Germa Kingdom"] },
  wano: { arc: "wano", titles: ["Wano Country"] },
  onigashima: { arc: "wano", titles: ["Onigashima"] },
  egghead: { arc: "egghead", titles: ["Egghead"] },
  elbaph: { arc: "elbaph", titles: ["Elbaf", "Elbaph"] },
};

const SAFE_IMAGE_HOSTS = new Set(["static.wikia.nocookie.net", "vignette.wikia.nocookie.net"]);
const WIKI_API = "https://onepiece.fandom.com/api.php";

function pagesFrom(payload: unknown): WikiPage[] {
  if (!payload || typeof payload !== "object") return [];
  const query = (payload as { query?: { pages?: WikiPage[] | Record<string, WikiPage> } }).query;
  const pages = query?.pages;
  return Array.isArray(pages) ? pages : pages ? Object.values(pages) : [];
}

function safeImage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && SAFE_IMAGE_HOSTS.has(url.hostname) ? url.href : null;
  } catch {
    return null;
  }
}

async function queryWiki(params: URLSearchParams, signal: AbortSignal) {
  const response = await fetch(`${WIKI_API}?${params}`, {
    headers: { Accept: "application/json", "User-Agent": "GrandLineWiki/1.0 (island artwork; source links included)" },
    signal,
  });
  if (!response.ok) return null;
  return response.json() as Promise<unknown>;
}

function articleSource(title: string) {
  return `https://onepiece.fandom.com/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("location") ?? "";
  const progressParam = url.searchParams.get("progress");
  const progress = progressParam === null ? Number.NaN : Number(progressParam);
  const location = locations[id];
  const requiredIndex = location ? arcSource.findIndex((arc) => arc.id === location.arc) : -1;
  if (!location || requiredIndex < 0 || !Number.isInteger(progress) || progress < requiredIndex) {
    return jsonResponse({ image: null, sourceUrl: null }, 404);
  }

  const controller = new AbortController();
  const abortFromRequest = () => controller.abort();
  request.signal.addEventListener("abort", abortFromRequest, { once: true });
  const timer = setTimeout(abortFromRequest, 4500);
  try {
    for (const title of location.titles) {
      const pageParams = new URLSearchParams({
        action: "query", format: "json", prop: "pageimages", piprop: "thumbnail|original",
        pithumbsize: "1000", redirects: "1", titles: title,
      });
      const pagePayload = await queryWiki(pageParams, controller.signal);
      const page = pagesFrom(pagePayload).find((item) => !item.missing);
      const sourceTitle = page?.title ?? title;
      const pageImage = safeImage(page?.thumbnail?.source ?? page?.original?.source);
      if (pageImage) return jsonResponse({ image: pageImage, sourceUrl: articleSource(sourceTitle) });

      // Some island articles only show their scenery inside the article body.
      const imageParams = new URLSearchParams({
        action: "query", format: "json", prop: "images", imlimit: "50", redirects: "1", titles: title,
      });
      const imagePayload = await queryWiki(imageParams, controller.signal);
      const article = pagesFrom(imagePayload).find((item) => !item.missing);
      const terms = title.toLowerCase().match(/[a-z0-9]+/g)?.filter((term) => !["the", "of", "and", "island", "kingdom", "archipelago", "country"].includes(term)) ?? [];
      const candidates = (article?.images ?? []).map((image) => image.title).filter((file): file is string => {
        const filename = (file ?? "").replace(/^File:/i, "").replace(/\.[^.]+$/, "").toLowerCase();
        return terms.length > 0 && terms.every((term) => filename.includes(term));
      }).slice(0, 8);
      if (!candidates.length) continue;

      const infoParams = new URLSearchParams({
        action: "query", format: "json", prop: "imageinfo", iiprop: "url", iiurlwidth: "1000", titles: candidates.join("|"),
      });
      const infoPayload = await queryWiki(infoParams, controller.signal);
      const info = pagesFrom(infoPayload).find((item) => item.imageinfo?.length)?.imageinfo?.[0];
      const image = safeImage(info?.thumburl ?? info?.url);
      if (image) return jsonResponse({ image, sourceUrl: articleSource(sourceTitle) });
    }
    return jsonResponse({ image: null, sourceUrl: null });
  } catch {
    return jsonResponse({ image: null, sourceUrl: null });
  } finally {
    clearTimeout(timer);
    request.signal.removeEventListener("abort", abortFromRequest);
  }
}
