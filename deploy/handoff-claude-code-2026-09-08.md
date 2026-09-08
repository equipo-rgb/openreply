# Handoff a Claude Code: OpenReply, 8 de septiembre de 2026

## Leer primero

Este parte registra lo ejecutado y verificado. No marcar la puesta en marcha completa: falta la prueba real de extremo a extremo y conectar a Pau. ManyChat sigue activo. No repetir la creación de la app, sus claves, suscripciones ni la conexión de Martín.

Repo: `https://github.com/equipo-rgb/openreply`, checkout `/Users/martin/dev/openreply`, rama `dia`. Base auditada upstream `15ba231cdd71a2c455467d67c4e0eb7f29e51d70`. No actualizar upstream sin auditoría. Contrato visual: `deploy/handoff-traduccion-es.md`.

Plan de fases original: repo `equipo-rgb/dia-contenido`, `docs/superpowers/plans/2026-09-08-openreply-vps.md`. Sus checkboxes no reflejaban esta sesión; usar este parte como estado de ejecución, preservando las reglas del plan.

## Código, castellano y diseño: terminado dentro del alcance

Se integraron por fast-forward y subieron a `dia` los 15 commits de `dia-i18n` y `dia-ui`, hasta `09e59a060bfdf9ec212f8d60d8295fedf63ac58c`.

Pantallas: acceso y confirmación de correo, lista de campañas, alta/edición y vista previa, registro de DMs, conexión de Instagram. Navegación y tokens Nimbus de Jarvis aplicados. Después se corrigieron foco/teclado del menú, controles táctiles, editor a 320 px y conservación de estado/datos cuando falla la API.

No se tradujeron los valores comparados por código, enums de Prisma, proveedores, rutas, claves ni variables de entorno. `goal` conserva `permanente` y `story-efimera`. No se modificaron lib/, worker/, prisma/, scripts/, API ni dependencias en este encargo.

Límite importante: el error nativo de Auth.js sigue pendiente de personalización porque requería tocar lib/auth.ts. El dashboard, equipo y demás pantallas fuera de alcance conservan textos en inglés. No declarar toda la aplicación traducida.

Prisma generate, typecheck y 191/191 tests pasaron antes de cada commit. Lint de TSX modificados y build de producción webpack correctos. Chromium local con respuestas simuladas: edición/payload, validación, búsqueda, filtros, paginación, errores HTTP recuperables, móvil, foco y movimiento reducido. No equivalen a una prueba real de DMs. Sin prueba en iPhone físico.

## Producción: desplegada

- URL: https://dm.d-ia.es
- VPS: alias SSH `chatwoot`, host `dia-chatwoot-01`.
- Easypanel: https://panel2.desarrollosconia.com, proyecto `openreply`.
- Imagen publicada por https://github.com/equipo-rgb/openreply/actions/runs/34257454088 (success).
- Revisión de la imagen: `09e59a060bfdf9ec212f8d60d8295fedf63ac58c`.
- Digest: `sha256:f17ce923cd00d5abf66b2a9f09e26081fa568f18f9967e3afbc696b25d2a66c2`.
- Web, worker, cron e higiene actualizados inicialmente mediante Docker Swarm por SSH. Web se implementó después desde Easypanel para aplicar las claves de Meta. Postgres y Redis no se modificaron.
- Health verificado: database/redis/queue ok, worker healthy. Servicios estables 1/1 al cerrar el despliegue.
- Imagen anterior, si se necesita referencia: `sha256:cb32e0e9be0df4de423ae31d0e0d24eb91cb359bd2d7fa793bfc79f19127e7e0`. Revertir imagen no revierte variables.
- El puerto real del servicio es 80, no el 3000 de algunos ejemplos antiguos del plan.

## Task 4: Meta, casi completa

Creada y PUBLICADA la app `D-IA DM` en el porfolio `desarrollosconia`, que Meta muestra como empresa verificada.

- App general Meta: `1100491899091851`.
- App de Instagram: `D-IA DM-IG`, ID `1438049514940268`. No intercambiar ambos IDs.
- Contacto conservado: el Gmail ya rellenado por Meta; no se cambió por el correo empresarial.
- Instagram Login, caso de uso administrar mensajes y contenido de Instagram. No se añadió Marketing API ni se realizó App Review.
- Callback OAuth guardado: `https://dm.d-ia.es/api/instagram/callback`.
- `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `FACEBOOK_APP_SECRET` aplicados y verificados en el servicio WEB de Easypanel. Secretos no incluidos en este documento. No asumir que se actualizaron también en worker/cron.
- URLs legales guardadas: `/privacy`, `/terms`, `/data-deletion` sobre https://dm.d-ia.es.
- Webhook verificado: `https://dm.d-ia.es/api/webhook`, usando el `WEBHOOK_VERIFY_TOKEN` existente.
- `comments` y `messages` confirmados como Suscrito; consola Meta los muestra en v26.0. El entorno del fork mantiene META_GRAPH_API_VERSION=v25.0. No se cambió la versión del código.
- Meta también mostraba activas otras suscripciones predeterminadas (live_comments, message_edit, message_reactions, messaging_postbacks, messaging_referral, messaging_seen). No se alteraron a ciegas.
- Se enviaron desde la consola de Meta un evento comments y otro messages. Recuento de WebhookEvent: 0 → 1 → 2, verificado en Postgres. Son datos sintéticos, no DMs reales.
- `@soymartintoledo` (una sola o final) invitado como Evaluador de Instagram y aceptado, comprobado en Instagram y Meta.
- `@paurodriguez.ia` invitado; última comprobación: Pendiente. Debe aceptar desde su Instagram.

Martín tiene una restricción publicitaria, pero no impidió crear/publicar esta app ni conectar Instagram. No se transfirió su cuenta a Pau.

## Task 5: Martín conectado; resto pendiente

Consentimiento de Instagram concedido expresamente por Martín: perfil/contenido, comentarios, mensajes e insights. Callback terminó en `/dashboard?connected=true`, mostrando `@soymartintoledo` y 1 cuenta conectada.

Verificación directa en Postgres después de conectar:

- InstagramAccount.username: `soymartintoledo`.
- tokenExpiresAt: `2026-11-07 18:35:16.540` (timestamp devuelto por DB).
- webhookSubscribed: true.
- WebhookEvent: 2.
- DmLog: sin filas; ningún SENT real comprobado.
- Dashboard: 0 campañas activas y 0 DMs enviados.

Siguiente acción: pedir el enlace de un reel de Martín y disponer de una tercera cuenta para comentar. Crear la campaña de prueba por post concreto, keyword PRUEBA, siguiendo el plan. Verificar comentario real → DM recibido → SENT → clic rastreado. Repetir con Pau tras su aceptación y conexión. No inventar un SENT ni dar Task 5 por cerrada por los dos eventos sintéticos.

## Tasks 6 a 10: pendientes, no ejecutadas en esta sesión

6. Permanentes mentoría/comunidad y migración de campañas semanales. Mantener ManyChat una semana completa desde la primera campaña real; apagar solo con SENT en las tres piezas de una semana de CADA cuenta. Esta semana aún NO ha empezado. Evitar duplicar respuestas durante la validación.
7. Endpoint externo Bearer en el fork.
8. Tools de Jarvis: crear campaña con approval y consultar estado.
9. Sincronización de comentarios por keyword a Airtable.
10. Actualización de los documentos del sistema de contenido.

No asumir que estas tareas están implementadas sin revisar sus repos. El castellano/diseño se adelantó a Task 5 por petición expresa de Martín. La referencia a apertura de comunidad el 4 de septiembre está desfasada respecto al 8 de septiembre: confirmar calendario, no inventar una fecha de apagado.

## Incidencia de secretos: pendiente de resolver

Una salida de diagnóstico del asistente no ocultó correctamente variables ya existentes de Easypanel y mostró valores en el historial de herramientas. Se avisó a Martín. No copiar valores del historial ni de otros documentos al repo.

Afectados: NEXTAUTH_SECRET, CRON_SECRET, ENCRYPTION_KEY, WEBHOOK_VERIFY_TOKEN, credenciales de DATABASE_URL y REDIS_URL, RESEND_API_KEY. Las dos claves nuevas de Meta se manejaron en memoria y no se imprimieron.

No se rotó ninguna credencial. Coordinar la rotación antes de considerarla resuelta: ENCRYPTION_KEY protege los tokens de Instagram y no se puede cambiar sin estrategia de recifrado/reconexión; Postgres/Redis y secretos compartidos requieren cambios consistentes en consumidores; el token de webhook requiere actualizar también Meta. No hacer cambios parciales que rompan la instalación. Esta incidencia es adicional a la exposición previa de Postgres que el plan original ya mencionaba.

## Notas para retomar

Easypanel utiliza un editor de texto: `setValue` aparentó cambiarlo pero no persistió. Funcionó entrada real al editor (seleccionar todo, pegar), Guardar y luego Implementar. Siempre verificar el entorno efectivo sin mostrar valores.

Las aceptaciones contractuales, permisos y publicación fueron autorizados por Martín, algunas completadas personalmente. No repetirlos ni recrear la app. Para nuevas ampliaciones de acceso, revisar su alcance.

Este handoff es documental. Los commits posteriores a 09e59a0 no implican una nueva versión funcional desplegada si llevan [skip ci].
