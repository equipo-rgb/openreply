import type { InstagramMedia } from "@/lib/meta/client";

type MediaPermalink = Pick<InstagramMedia, "id" | "permalink">;

/**
 * Normaliza una URL de Instagram a "instagram.com/reel/<shortcode>" para
 * comparar permalinks sin que importen www, query, barra final o /p/ vs /reel/.
 *
 * Si la URL no lleva shortcode reconocible se devuelve la ruta completa en
 * lugar de inventar uno: dos URLs rotas distintas no deben parecer la misma.
 */
export function normalizePostUrl(input: string): string {
  const url = new URL(input);
  const host = url.hostname.replace(/^www\./, "");
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.findIndex((p) => p === "p" || p === "reel" || p === "reels");
  const shortcode = idx >= 0 ? parts[idx + 1] : parts[parts.length - 1];
  if (!shortcode) return `${host}/${parts.join("/")}`;
  return `${host}/reel/${shortcode}`;
}

export function findMediaByPermalink(
  media: MediaPermalink[],
  postUrl: string
): MediaPermalink | null {
  const wanted = normalizePostUrl(postUrl);
  for (const item of media) {
    if (!item.permalink) continue;
    if (normalizePostUrl(item.permalink) === wanted) return item;
  }
  return null;
}
