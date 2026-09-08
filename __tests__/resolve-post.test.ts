import { describe, expect, it } from "vitest";
import { findMediaByPermalink, normalizePostUrl } from "@/lib/external/resolve-post";

describe("normalizePostUrl", () => {
  it("quita query, barra final y www", () => {
    expect(normalizePostUrl("https://www.instagram.com/reel/ABC123/?igsh=xyz")).toBe(
      "instagram.com/reel/ABC123"
    );
  });
  it("trata /p/ y /reel/ como el mismo shortcode", () => {
    expect(normalizePostUrl("https://instagram.com/p/ABC123/")).toBe("instagram.com/reel/ABC123");
  });
});

describe("findMediaByPermalink", () => {
  const media = [
    { id: "1", permalink: "https://www.instagram.com/reel/AAA/" },
    { id: "2", permalink: "https://www.instagram.com/p/BBB/" },
  ];
  it("encuentra por shortcode aunque cambie el prefijo", () => {
    expect(findMediaByPermalink(media, "https://instagram.com/reel/BBB/?x=1")?.id).toBe("2");
  });
  it("devuelve null si no está", () => {
    expect(findMediaByPermalink(media, "https://instagram.com/reel/ZZZ/")).toBeNull();
  });
});

describe("URLs sin shortcode", () => {
  it("no hace coincidir dos URLs rotas distintas", () => {
    expect(normalizePostUrl("https://instagram.com/")).not.toBe(
      normalizePostUrl("https://instagram.com/reel/")
    );
  });
});
