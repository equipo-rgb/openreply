# OpenReply en D-IA

Fork de diwenne/openreply fijado al commit 15ba231 (auditado 2026-09-08).
Rama de trabajo: `dia`. Cambios respecto al original:

- Sin Vercel Analytics.
- `deploy/easypanel.compose.yml`: stack completo para easypanel (web, worker, cron, higiene, postgres, redis).
- `scripts/higiene.sh` + `scripts/higiene.sql`: apaga campañas de reels muertos (60 días sin vida, 30 sin DMs) y el trigger por DM de stories efímeras (48 h).
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
   | `postgres` | plantilla Postgres 16 de easypanel | - | base `openreply` |
   | `redis` | plantilla Redis 7 de easypanel | - | |
   | `web` | `ghcr.io/equipo-rgb/openreply:dia` | `sh -c "npx prisma migrate deploy && npm run start"` | dominio `dm.d-ia.es`, puerto 3000 |
   | `worker` | misma imagen | `npm run worker` | |
   | `cron` | misma imagen | `sh scripts/cron.sh` | `CRON_BASE_URL=http://web:3000` |
   | `higiene` | `postgres:16-alpine` | `sh /higiene/higiene.sh` | monta `scripts/higiene.sh` y `.sql` |

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
- El SQL de higiene se puede probar a mano sin esperar a las 04:30 UTC:
  `docker exec <contenedor-higiene> sh -c 'psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f /higiene/higiene.sql'`.
