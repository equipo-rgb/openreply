/**
 * Aviso de vigilancia de los DMs.
 *
 * Desde que ManyChat se apago (2026-09-09) no hay sistema de respaldo: si
 * OpenReply deja de enviar, nadie se entera hasta que alguien se queja. Esto
 * arma el texto que se manda a Slack.
 *
 * Regla de oro: silencio significa que todo va bien. Un aviso que llega cada
 * hora sin motivo se acaba ignorando, y entonces no avisa de nada.
 */

export interface FalloDM {
  campana: string;
  cuenta: string;
  motivo: string;
}

export interface TokenPorCaducar {
  cuenta: string;
  dias: number;
}

export function construirAviso(datos: {
  fallos: FalloDM[];
  tokensPorCaducar: TokenPorCaducar[];
}): string | null {
  const { fallos, tokensPorCaducar } = datos;
  if (fallos.length === 0 && tokensPorCaducar.length === 0) return null;

  const lineas: string[] = [];

  if (fallos.length > 0) {
    // Agrupado por motivo: trece lineas iguales no dicen mas que una que diga
    // "trece veces esto".
    const porMotivo = new Map<string, number>();
    const cuentas = new Set<string>();
    const campanas = new Set<string>();
    for (const f of fallos) {
      const motivo = f.motivo.trim() || "sin motivo registrado";
      porMotivo.set(motivo, (porMotivo.get(motivo) ?? 0) + 1);
      cuentas.add(f.cuenta);
      campanas.add(f.campana);
    }

    lineas.push(
      `⚠️ ${fallos.length} DMs fallidos en ${campanas.size === 1 ? `la campaña ${[...campanas][0]}` : `${campanas.size} campañas`} (${[...cuentas].map((c) => `@${c}`).join(", ")}):`,
    );
    for (const [motivo, veces] of [...porMotivo.entries()].sort((a, b) => b[1] - a[1])) {
      lineas.push(`   • ${veces} × ${motivo}`);
    }
  }

  if (tokensPorCaducar.length > 0) {
    if (lineas.length > 0) lineas.push("");
    for (const t of tokensPorCaducar) {
      lineas.push(
        `🔑 El token de Instagram de @${t.cuenta} caduca en ${t.dias} ${t.dias === 1 ? "día" : "días"}. Si caduca, los DMs paran sin error visible.`,
      );
    }
  }

  return lineas.join("\n");
}

/**
 * Firma de un aviso: que tipos de problema contiene, sin cuantos ni cuando.
 *
 * Sirve para no repetir el mismo aviso cada cuarto de hora mientras algo sigue
 * roto. Un aviso que se repite se ignora, y entonces deja de avisar. Si aparece
 * un problema DISTINTO, la firma cambia y ese si vuelve a sonar enseguida.
 */
export function firmaDelAviso(datos: {
  fallos: FalloDM[];
  tokensPorCaducar: TokenPorCaducar[];
}): string {
  const motivos = [...new Set(datos.fallos.map((f) => f.motivo.trim() || "sin motivo"))].sort();
  const tokens = [...new Set(datos.tokensPorCaducar.map((t) => t.cuenta))].sort();
  return JSON.stringify({ motivos, tokens });
}
