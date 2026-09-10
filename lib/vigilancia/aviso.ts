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


/**
 * Fallos que NO son problema nuestro: los provoca la otra persona o el propio
 * hilo, y no hay nada que arreglar en el sistema.
 *
 * Se callan a proposito. Un canal de avisos lleno de "esta cuenta no admite
 * mensajes" es un canal que nadie lee, y entonces el aviso que si importaba
 * pasa desapercibido.
 *
 * Los patrones salen de los que el propio worker ya reconoce como rechazos que
 * no tiene sentido reintentar (`NON_TEMPLATE_REJECTIONS` en dm-worker).
 */
const RUIDO_DEL_DESTINATARIO = [
  /outside of allowed window/i,
  /invalid for a private reply/i,
  /requested user cannot be found/i,
  /isn.t available/i,
  /no acepta mensajes/i,
  /Meta API Error 551\b/i,
];

export function esRuidoDelDestinatario(motivo: string): boolean {
  return RUIDO_DEL_DESTINATARIO.some((patron) => patron.test(motivo));
}

export function construirAviso(datos: {
  fallos: FalloDM[];
  tokensPorCaducar: TokenPorCaducar[];
}): string | null {
  const { tokensPorCaducar } = datos;
  // Lo que no podemos arreglar no se cuenta como aviso. Si TODO lo que ha
  // fallado es ruido del destinatario, no hay nada que decir.
  const fallos = datos.fallos.filter((f) => !esRuidoDelDestinatario(f.motivo));
  const ignorados = datos.fallos.length - fallos.length;

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
    if (ignorados > 0) {
      lineas.push(
        `   (${ignorados} más por ajustes del destinatario o ventana cerrada, sin nada que arreglar)`,
      );
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
  const motivos = [
    ...new Set(
      datos.fallos
        .filter((f) => !esRuidoDelDestinatario(f.motivo))
        .map((f) => f.motivo.trim() || "sin motivo"),
    ),
  ].sort();
  const tokens = [...new Set(datos.tokensPorCaducar.map((t) => t.cuenta))].sort();
  return JSON.stringify({ motivos, tokens });
}

/**
 * Silencio anormal en la entrada.
 *
 * El fallo mas grave de este sistema no hace ruido: si Meta deja de entregar
 * comentarios, no falla ningun DM, no hay errores y todo se ve verde. Paso el
 * 2026-09-09, con 17 horas sin un solo evento y nadie enterado hasta que Martin
 * respondio comentarios a mano.
 *
 * Tres condiciones, y las tres importan:
 *
 * - **Hubo trafico antes.** Un sistema recien montado, o una cuenta sin
 *   comentarios, no esta roto: no tiene nada que recibir.
 * - **Es horario en el que se comenta.** De madrugada el silencio es normal, y
 *   avisar a las cuatro de la manana solo entrena a ignorar los avisos.
 * - **El hueco es largo.** Los comentarios van a rachas; dos horas sin nada un
 *   martes por la manana no significa nada.
 */
const HORAS_DE_SILENCIO_SOSPECHOSO = 4;
// Horario en UTC. España va dos horas por delante en verano, asi que esto es de
// las nueve de la manana a las once de la noche, hora local.
const HORA_UTC_INICIO_ACTIVIDAD = 7;
const HORA_UTC_FIN_ACTIVIDAD = 21;

export function hayQueAvisarPorSilencio(datos: {
  horasSinEventos: number;
  eventosSemanaPrevia: number;
  horaUtc: number;
}): boolean {
  if (datos.eventosSemanaPrevia === 0) return false;
  if (datos.horaUtc < HORA_UTC_INICIO_ACTIVIDAD || datos.horaUtc >= HORA_UTC_FIN_ACTIVIDAD) {
    return false;
  }
  return datos.horasSinEventos >= HORAS_DE_SILENCIO_SOSPECHOSO;
}

export function lineaDeSilencio(horasSinEventos: number): string {
  return `🔇 Instagram lleva ${Math.floor(horasSinEventos)} horas sin entregar ni un comentario, y antes sí llegaban. Puede ser que Meta haya desactivado la suscripción del webhook: revísala en el panel de la app.`;
}
