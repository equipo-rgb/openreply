import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import {
  construirAviso,
  firmaDelAviso,
  type FalloDM,
  type TokenPorCaducar,
} from "@/lib/vigilancia/aviso";
import { getRedisConnection } from "@/lib/queue/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// La ventana se solapa a proposito con el intervalo del scheduler (15 min):
// mejor repetir un aviso que perder uno por un desfase de relojes.
const VENTANA_MINUTOS = 20;
const DIAS_AVISO_TOKEN = 7;
// Mientras algo siga roto, el mismo aviso no se repite antes de una hora. Un
// aviso que llega cada cuarto de hora se ignora, y entonces deja de avisar.
const SILENCIO_MISMO_AVISO_SEGUNDOS = 60 * 60;
const CLAVE_ULTIMO_AVISO = "vigilancia:ultima-firma";

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

  // Si es exactamente el mismo problema que ya avisamos hace menos de una hora,
  // se calla. Un problema NUEVO cambia la firma y suena enseguida.
  const firma = firmaDelAviso({ fallos, tokensPorCaducar });
  try {
    const redis = getRedisConnection();
    const anterior = await redis.get(CLAVE_ULTIMO_AVISO);
    if (anterior === firma) {
      return NextResponse.json({
        success: true,
        avisado: false,
        motivo: "mismo aviso que el anterior, en silencio",
        fallos: fallos.length,
      });
    }
    await redis.set(CLAVE_ULTIMO_AVISO, firma, "EX", SILENCIO_MISMO_AVISO_SEGUNDOS);
  } catch (error) {
    // Sin Redis se avisa igual: repetir un aviso es mucho menos grave que
    // callarse uno.
    console.warn(`[vigilancia] no se pudo leer el silencio en Redis: ${String(error)}`);
  }

  const envio = await avisarASlack(aviso);
  if (!envio.enviado) {
    // El aviso no se pierde: sale por el log del contenedor, que es donde mira
    // quien diagnostica.
    console.warn(`[vigilancia] ${envio.motivo}. Aviso sin enviar:\n${aviso}`);
    return NextResponse.json(
      { success: envio.configurado ? false : true, avisado: false, motivo: envio.motivo, fallos: fallos.length },
      { status: envio.configurado ? 502 : 200 },
    );
  }

  return NextResponse.json({
    success: true,
    avisado: true,
    fallos: fallos.length,
    tokensPorCaducar: tokensPorCaducar.length,
  });
}

/**
 * Manda el aviso por el camino que este configurado.
 *
 * Dos caminos a proposito: `SLACK_WEBHOOK_URL` si hay webhook, o el bot que el
 * equipo ya tiene (`SLACK_BOT_TOKEN` + `SLACK_CHANNEL_ID`), para no montar una
 * pieza nueva solo para esto. Si no hay ninguno, no es un error: el aviso sale
 * por el log.
 */
async function avisarASlack(
  texto: string,
): Promise<{ enviado: true } | { enviado: false; configurado: boolean; motivo: string }> {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  const token = process.env.SLACK_BOT_TOKEN;
  const canal = process.env.SLACK_CHANNEL_ID;

  if (!webhook && !(token && canal)) {
    return {
      enviado: false,
      configurado: false,
      motivo: "Sin SLACK_WEBHOOK_URL ni SLACK_BOT_TOKEN con SLACK_CHANNEL_ID",
    };
  }

  try {
    if (webhook) {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: texto }),
      });
      if (!res.ok) {
        return { enviado: false, configurado: true, motivo: `El webhook de Slack respondio ${res.status}` };
      }
      return { enviado: true };
    }

    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ channel: canal, text: texto }),
    });
    // La API de Slack contesta 200 aunque falle: el error va dentro del cuerpo.
    // `not_in_channel` es el habitual: hay que invitar al bot al canal.
    const cuerpo = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!cuerpo.ok) {
      return { enviado: false, configurado: true, motivo: `Slack rechazo el mensaje: ${cuerpo.error ?? `HTTP ${res.status}`}` };
    }
    return { enviado: true };
  } catch (error) {
    return {
      enviado: false,
      configurado: true,
      motivo: `No se pudo contactar con Slack: ${error instanceof Error ? error.message : "error de red"}`,
    };
  }
}
