#!/bin/sh
# Ejecuta scripts/higiene.sql una vez al día a las 04:30 UTC contra DATABASE_URL.
# Falla en voz alta: cada ejecución escribe una línea con el resultado.
set -u

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[higiene] DATABASE_URL no definida" >&2
  exit 1
fi

echo "[higiene] arrancado"
ultimo_dia=""
while true; do
  ahora=$(date -u '+%Y-%m-%d %H:%M')
  dia=${ahora% *}
  hhmm=${ahora#* }
  if [ "$hhmm" = "04:30" ] && [ "$ultimo_dia" != "$dia" ]; then
    ultimo_dia="$dia"
    if salida=$(psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f /higiene/higiene.sql 2>&1); then
      echo "[higiene] $ahora ok: $(echo "$salida" | tr '\n' ' ')"
    else
      echo "[higiene] $ahora FALLO: $salida" >&2
    fi
  fi
  sleep 30
done
