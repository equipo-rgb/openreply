# Handoff: traducir la interfaz de OpenReply al castellano

Encargo cerrado para un agente que trabaje dentro del repo (Codex CLI o
equivalente). No requiere conocer el resto del proyecto.

## Objetivo

Pasar a castellano de España todo el texto que ve un usuario en la interfaz.
Nada más. No es un rediseño ni una refactorización.

## Contexto del repo

- Fork de `diwenne/openreply`, rama de trabajo `dia`.
- Next.js 16, React, Tailwind 4. Sin librería de componentes y sin sistema de i18n:
  los textos están escritos directamente dentro del JSX, en inglés.
- Superficie: 28 ficheros `page.tsx` y 18 componentes, unas 7.850 líneas de TSX.
- Lo usan dos personas, ambas hispanohablantes. No hace falta soportar dos idiomas:
  se sustituye el inglés por el castellano, no se añade una capa de traducción.

## Alcance y orden

Traducir en este orden, un commit por pantalla:

1. `app/login` y la pantalla de error de acceso.
2. La lista de campañas.
3. El alta y la edición de campaña (el formulario más usado del panel).
4. El registro de DMs enviados.
5. La conexión de cuentas de Instagram.
6. El resto de pantallas.

Los cinco primeros bloques son el circuito diario. Si hay que parar por tiempo, se
para después del quinto, no a medias de uno.

## Reglas duras

Traducir SOLO cadenas que se pintan en pantalla. Nunca:

- Nombres de variables de entorno (`RESEND_API_KEY`, `ALLOWED_EMAILS`).
- Valores de enums de Prisma: `SENT`, `PENDING`, `FAILED`, `SKIPPED_DEDUP`, etc.
- Valores de datos que el código compara: el campo `goal` de `Automation` usa
  `"permanente"` y `"story-efimera"`, y hay lógica que depende de esas cadenas.
- Identificadores de proveedores de Auth.js: `"resend"`, `"nodemailer"`.
- Rutas, nombres de campos de API, claves de objetos, atributos `data-*`,
  clases de Tailwind.
- Mensajes de log y de error internos: se quedan en inglés, para no ensuciar el
  diff contra upstream.

Regla práctica: si la cadena aparece dentro de una comparación (`===`, `switch`,
`includes`), no se toca aunque parezca texto.

## Estilo

- Castellano de España, tuteo.
- Sin guion largo. Nunca. Ni en textos ni en comentarios.
- Sin emojis.
- Frases cortas. Preferir el verbo a la nominalización: "Crear campaña", no
  "Creación de campaña".
- Los botones, en infinitivo: "Guardar", "Enviar", "Conectar cuenta".

Glosario fijo:

| Inglés | Castellano |
|---|---|
| automation / campaign | campaña |
| keyword | palabra clave |
| trigger | disparador |
| DM | DM (se deja) |
| reel / story | reel / story (se dejan) |
| comment | comentario |
| follower | seguidor |
| workspace | espacio de trabajo |
| link / tracked link | enlace / enlace con seguimiento |
| dashboard | panel |
| settings | ajustes |
| sign in / log in | entrar |
| magic link | enlace de acceso |

## Verificación, obligatoria antes de cada commit

```bash
npm run typecheck   # tsc --noEmit, sin errores
npm test            # vitest, los 191 tests en verde
git diff --stat     # solo ficheros .tsx
```

Si `npm ci` se ha ejecutado antes, hace falta `npx prisma generate` o el typecheck
falla por los tipos generados de Prisma, que no están en el repo.

## Entrega

- Rama `dia-i18n` partiendo de `dia`.
- Un commit por pantalla, mensaje en castellano, con el prefijo `i18n(es):`.
- En el PR, la lista de pantallas traducidas y las cadenas que se han dejado en
  inglés a propósito, con el motivo.

## Lo que NO hay que hacer

- No rediseñar, no cambiar espaciados, colores ni estructura de componentes.
- No reordenar ni extraer componentes.
- No añadir `next-intl` ni ninguna librería de i18n.
- No tocar `lib/`, `worker/`, `prisma/` ni `scripts/`.
- No actualizar dependencias.

Este es un fork clavado a un commit auditado. Cuanto más estrecho sea el diff, más
barato será traer arreglos de upstream más adelante.
