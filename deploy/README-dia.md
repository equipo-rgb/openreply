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
