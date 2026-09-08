# OpenReply en D-IA

Fork de diwenne/openreply fijado al commit 15ba231 (auditado 2026-09-08).
Rama de trabajo: `dia`. Cambios respecto al original:

- Sin Vercel Analytics.
- `deploy/easypanel.compose.yml`: stack completo para easypanel (web, worker, cron, higiene, postgres, redis).
- `scripts/higiene.mjs` + `scripts/higiene.sql`: apaga campañas de reels muertos (60 días sin vida, 30 sin DMs) y el trigger por DM de stories efímeras (48 h).
- `app/api/external/automations`: endpoint con Bearer para que Jarvis cree campañas (ver Task 8).

Convenciones de campañas:
- `goal = "permanente"`: palabras fijas de DM (mentoría, comunidad). Nunca se apagan.
- `goal = "story-efimera"`: stories puntuales. El trigger por DM se apaga solo a las 48 h.
- Resto: campañas de reel. Una por pieza, atadas a su post.

Para actualizar desde upstream: auditar el nuevo commit con /audita-herramienta antes de hacer merge.

## Como se despliega en el VPS

El VPS (Hetzner, `dia-chatwoot-01`) corre easypanel sobre Docker Swarm. En Swarm
no se ejecuta `build:` y se ignora `depends_on`, asi que el stack NO se despliega
con el compose de `deploy/`. Ese fichero es solo para probar en local.

En produccion:

1. GitHub Actions (`.github/workflows/docker-publish.yml`) construye la imagen en
   cada push a la rama `dia` y la sube a `ghcr.io/equipo-rgb/openreply:dia`.
2. En easypanel, proyecto `openreply`, seis servicios:

   | Servicio | Origen | Comando | Notas |
   |---|---|---|---|
   | `postgres` | plantilla Postgres de easypanel | - | base `openreply`, usuario `postgres`; la contrasena la genera el panel |
   | `redis` | plantilla Redis 7 de easypanel | - | |
   | `web` | `ghcr.io/equipo-rgb/openreply:dia` | `sh -c "npx prisma migrate deploy && npm run start"` | dominio `dm.d-ia.es` apuntando al **puerto 80** |
   | `worker` | misma imagen | `npm run worker` | |
   | `cron` | misma imagen | `sh scripts/cron.sh` | `CRON_BASE_URL=http://openreply_web:80` |
   | `higiene` | misma imagen | `node scripts/higiene.mjs` | solo necesita `DATABASE_URL` |

3. Traefik y el certificado de Let's Encrypt los gestiona easypanel al asignar el
   dominio. Traefik enruta por fichero generado (`/etc/easypanel/traefik/config/main.yaml`),
   no por labels de Docker: no vale montar el stack a mano con `docker compose`.
4. `ENCRYPTION_KEY`, `DATABASE_URL` y `REDIS_URL` tienen que ser identicos en
   `web`, `worker` y `cron`.

Para desplegar una version nueva: push a `dia`, esperar a la action y pulsar
Deploy en `web`, `worker` y `cron`.

## Notas de despliegue verificadas en local (2026-09-08)

- `worker` y `cron` dependen de `web` con `condition: service_started`, no
  `service_healthy`: `/api/health` devuelve 503 mientras el worker no late, así
  que esperar a "healthy" dejaría al worker sin arrancar nunca.
- `deploy/openreply.env` guarda los secretos en local y está ignorado por
  `deploy/*.env` en `.gitignore`. El patrón `.env*` del repo original no lo cubre.
- El compose no publica puertos al host: `web` se sirve por Traefik en easypanel.
  Para comprobar la salud en local: `docker exec <contenedor-web> node -e
  "fetch('http://localhost:3000/api/health').then(r=>r.text()).then(console.log)"`.
- El SQL de higiene se puede probar a mano sin esperar a las 04:30 UTC, con la
  imagen de la app: `docker run --rm --network easypanel-openreply -e DATABASE_URL=... \
  --entrypoint node ghcr.io/equipo-rgb/openreply:dia -e "...query(fs.readFileSync('scripts/higiene.sql','utf8'))..."`.

## Trampas de easypanel que costaron tiempo (2026-09-08)

- easypanel inyecta `PORT=80` en los servicios App, asi que Next escucha en el 80
  aunque en local use el 3000. El dominio tiene que apuntar al **puerto 80**, o
  Traefik devuelve 502.
- El Postgres y el Redis de easypanel generan credenciales propias. Hay que copiar
  sus **cadenas de conexion internas** desde el panel: el Redis lleva contrasena
  (`redis://default:...@openreply_redis:6379`) y sin ella `/api/health` no
  responde, se queda colgado reintentando.
- Los hosts internos son `<proyecto>_<servicio>`: `openreply_postgres`,
  `openreply_redis`, `openreply_web`.
- Editar el Environment no basta: hay que Guardar y despues pulsar Deploy, o el
  contenedor sigue con las variables viejas.
