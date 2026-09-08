// Higiene de campañas de OpenReply (D-IA).
//
// Ejecuta scripts/higiene.sql una vez al día a las 04:30 UTC contra DATABASE_URL.
// Corre en la misma imagen que la app (el VPS usa easypanel sobre Docker Swarm y
// ahí no hay forma cómoda de montar ficheros sueltos), por eso usa pg en vez de
// psql: la imagen de Node no trae cliente de Postgres.
//
// Falla en voz alta: cada ejecución escribe una línea con el resultado.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const HORA_UTC = "04:30";
const sqlPath = join(dirname(fileURLToPath(import.meta.url)), "higiene.sql");

if (!process.env.DATABASE_URL) {
  console.error("[higiene] DATABASE_URL no definida");
  process.exit(1);
}

const sql = readFileSync(sqlPath, "utf8");

async function pasada() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    // Las dos sentencias del fichero van juntas: pg las ejecuta en una sola
    // transacción implícita, así que o se aplican las dos o ninguna.
    const resultados = await client.query(sql);
    const filas = (Array.isArray(resultados) ? resultados : [resultados])
      .map((r) => r.rowCount ?? 0)
      .join(" y ");
    return `${filas} campañas tocadas`;
  } finally {
    await client.end();
  }
}

console.log("[higiene] arrancado");

let ultimoDia = "";
setInterval(async () => {
  const ahora = new Date().toISOString();
  const dia = ahora.slice(0, 10);
  const hhmm = ahora.slice(11, 16);
  if (hhmm !== HORA_UTC || ultimoDia === dia) return;
  ultimoDia = dia;
  try {
    console.log(`[higiene] ${dia} ${hhmm} ok: ${await pasada()}`);
  } catch (error) {
    console.error(`[higiene] ${dia} ${hhmm} FALLO: ${error.message}`);
  }
}, 30_000);
