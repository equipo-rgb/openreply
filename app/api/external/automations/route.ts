import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { decryptToken } from "@/lib/meta/oauth";
import { getUserMedia } from "@/lib/meta/client";
import { generateTrackedLinkSlug } from "@/lib/tracking/server";
import { buildTrackedUrl } from "@/lib/tracking/message";
import { generateReportShareSlug } from "@/lib/reports/share";
import { findMediaByPermalink } from "@/lib/external/resolve-post";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Un boton del DM. Meta admite hasta 3 y corta el titulo a 20 caracteres, asi
 * que se valida aqui en vez de dejar que Instagram lo recorte en silencio.
 */
const linkSchema = z.object({
  url: z.string().url(),
  label: z.string().min(1).max(20),
});

const bodySchema = z.object({
  instagramUsername: z.string().min(1),
  name: z.string().min(1).max(100),
  goal: z.string().max(120).optional(),
  postUrl: z.string().url().optional(),
  keywords: z.array(z.string().min(1).max(50)).min(1).max(10),
  dmMessage: z.string().min(1).max(1000),
  // Forma antigua, un solo enlace sin etiqueta. Se mantiene para no romper a
  // quien ya la use; `links` es la forma completa.
  trackedDestinationUrl: z.string().url().optional(),
  links: z.array(linkSchema).max(3).optional(),
  linkButtonLabel: z.string().max(20).optional(),
  // DM de apertura: el mensaje corto con un boton que se manda antes del DM
  // con el recurso, como en las campanas de ManyChat que esto sustituye.
  openingDmMessage: z.string().max(640).optional(),
  openingDmButtonLabel: z.string().max(20).optional(),
  followUpMessage: z.string().max(1000).optional(),
  followUpDelayMinutes: z.number().int().min(0).max(1440).optional(),
  dmTriggerEnabled: z.boolean().optional().default(false),
  publicReplyMessages: z.array(z.string().max(1000)).max(10).optional().default([]),
});

/**
 * Comparación en tiempo constante: este endpoint es público y una comparación
 * normal filtra el token carácter a carácter ante un atacante paciente.
 */
function authorized(request: NextRequest): boolean {
  const expected = process.env.OPENREPLY_API_TOKEN;
  if (!expected) return false;

  const received = request.headers.get("authorization") ?? "";
  const a = Buffer.from(received);
  const b = Buffer.from(`Bearer ${expected}`);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Un cuerpo que no es JSON tiene que salir como 400, no como un 500 sin
  // explicación en el lado de Jarvis.
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const account = await prisma.instagramAccount.findFirst({
    where: { username: { equals: data.instagramUsername, mode: "insensitive" } },
  });
  if (!account) {
    return NextResponse.json(
      { success: false, error: `Instagram account ${data.instagramUsername} not connected` },
      { status: 404 }
    );
  }

  let postId: string | null = null;
  let postUrl: string | null = null;
  const pendingNextReel = !data.postUrl;
  if (data.postUrl) {
    const media = await getUserMedia(decryptToken(account.accessToken), 50);
    const found = findMediaByPermalink(media, data.postUrl);
    if (!found) {
      return NextResponse.json(
        { success: false, error: "Post not found among the last 50 medias of the account" },
        { status: 422 }
      );
    }
    postId = found.id;
    postUrl = found.permalink ?? data.postUrl;
  }

  // `links` manda; `trackedDestinationUrl` es la forma antigua de un solo enlace.
  const linksPedidos =
    data.links ??
    (data.trackedDestinationUrl
      ? [{ url: data.trackedDestinationUrl, label: "Primary campaign link" }]
      : []);

  const trackedLinks = linksPedidos.map((link) => ({
    workspaceId: account.workspaceId,
    slug: generateTrackedLinkSlug(),
    label: link.label,
    destinationUrl: link.url,
  }));

  const publicReplyList = data.publicReplyMessages.map((m) => m.trim()).filter(Boolean);

  const automation = await prisma.automation.create({
    data: {
      name: data.name,
      goal: data.goal ?? null,
      postId,
      postUrl,
      pendingNextReel,
      matchAnyPost: false,
      keywords: data.keywords,
      matchAnyWord: false,
      dmTriggerEnabled: data.dmTriggerEnabled,
      dmMessage: data.dmMessage,
      linkButtonLabel: data.linkButtonLabel ?? null,
      openingDmEnabled: Boolean(data.openingDmMessage),
      openingDmMessage: data.openingDmMessage ?? null,
      openingDmButtonLabel: data.openingDmButtonLabel ?? null,
      followUpEnabled: Boolean(data.followUpMessage),
      followUpMessage: data.followUpMessage ?? null,
      followUpDelayMinutes: data.followUpDelayMinutes ?? 0,
      publicReplyEnabled: publicReplyList.length > 0,
      publicReplyMessages: publicReplyList,
      publicReplyMessage: publicReplyList[0] ?? null,
      isActive: true,
      wholeWordMatch: true,
      workspaceId: account.workspaceId,
      instagramAccountId: account.id,
      reportShareSlug: generateReportShareSlug(),
      ...(trackedLinks.length > 0 ? { trackedLinks: { create: trackedLinks } } : {}),
    },
    include: { trackedLinks: true },
  });

  const primary = automation.trackedLinks[0];
  return NextResponse.json(
    {
      success: true,
      data: {
        id: automation.id,
        name: automation.name,
        postId: automation.postId,
        pendingNextReel: automation.pendingNextReel,
        trackedUrl: primary ? buildTrackedUrl(primary.slug, process.env.NEXTAUTH_URL) : null,
        trackedUrls: automation.trackedLinks.map((link) => ({
          label: link.label,
          url: buildTrackedUrl(link.slug, process.env.NEXTAUTH_URL),
        })),
      },
    },
    { status: 201 }
  );
}
