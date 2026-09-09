import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { construirAviso, type FalloDM, type TokenPorCaducar } from "@/lib/vigilancia/aviso";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// La ventana se solapa a proposito con el intervalo del scheduler (15 min):
// mejor repetir un aviso que perder uno por un desfase de relojes.
const VENTANA_MINUTOS = 20;
const DIAS_AVISO_TOKEN = 7;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET;
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const desde = new Date(Date.now() - VENTANA_MINUTOS * 60 * 1000);

  const fallidos = await prisma.dmLog.findMany({
    where: { status: "FAILED", createdAt: { gt: desde } },
    select: {
      errorMessage: true,
      automation: {
        select: { name: true, instagramAccount: { select: { username: true } } },
      },
    },
    take: 100,
  });

  const fallos: FalloDM[] = fallidos.map((f) => ({
    campana: f.automation.name,
    cuenta: f.automation.instagramAccount.username,
    motivo: f.errorMessage ?? "",
  }));

  // El token solo se mira en la pasada diaria: avisar cada quince minutos de que
  // algo caduca dentro de una semana es la mejor forma de que se ignore.
  const diario = request.nextUrl.searchParams.get("diario") === "1";
  let tokensPorCaducar: TokenPorCaducar[] = [];
  if (diario) {
    const limite = new Date(Date.now() + DIAS_AVISO_TOKEN * 24 * 60 * 60 * 1000);
    const cuentas = await prisma.instagramAccount.findMany({
      where: { tokenExpiresAt: { lt: limite } },
      select: { username: true, tokenExpiresAt: true },
    });
    tokensPorCaducar = cuentas
      // `tokenExpiresAt` es opcional en el esquema. El filtro de Prisma ya
      // descarta los nulos, pero el tipo no lo sabe y el guardia es gratis.
      .filter((c): c is typeof c & { tokenExpiresAt: Date } => c.tokenExpiresAt !== null)
      .map((c) => ({
        cuenta: c.username,
        dias: Math.max(
          0,
          Math.ceil((c.tokenExpiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
        ),
      }));
  }

  const aviso = construirAviso({ fallos, tokensPorCaducar });
  if (!aviso) {
    return NextResponse.json({ success: true, avisado: false, fallos: 0 });
  }

  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) {
    // Sin webhook el aviso no se pierde: sale por el log del contenedor, que es
    // donde mira quien diagnostica.
    console.warn(`[vigilancia] SLACK_WEBHOOK_URL no configurado. Aviso sin enviar:\n${aviso}`);
    return NextResponse.json({
      success: true,
      avisado: false,
      motivo: "SLACK_WEBHOOK_URL no configurado",
      fallos: fallos.length,
    });
  }

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: aviso }),
    });
    if (!res.ok) {
      console.error(`[vigilancia] Slack respondio ${res.status}. Aviso:\n${aviso}`);
      return NextResponse.json(
        { success: false, error: `Slack respondio ${res.status}`, fallos: fallos.length },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error(`[vigilancia] no se pudo avisar a Slack: ${String(error)}\nAviso:\n${aviso}`);
    return NextResponse.json(
      { success: false, error: "No se pudo contactar con Slack", fallos: fallos.length },
      { status: 502 },
    );
  }

  return NextResponse.json({
    success: true,
    avisado: true,
    fallos: fallos.length,
    tokensPorCaducar: tokensPorCaducar.length,
  });
}
