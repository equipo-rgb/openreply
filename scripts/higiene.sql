-- Higiene de campañas de OpenReply (D-IA). Corre a diario desde scripts/higiene.sh.
-- Ambas operaciones son reversibles: solo cambian flags.

-- 1) Reels muertos: campaña atada a un post concreto, no permanente, con más de
--    60 días de vida y sin ningún DM enviado en los últimos 30 días.
UPDATE "Automation" a
SET "isActive" = false, "updatedAt" = now()
WHERE a."isActive" = true
  AND a."postId" IS NOT NULL
  AND COALESCE(a.goal, '') <> 'permanente'
  AND a."createdAt" < now() - interval '60 days'
  AND NOT EXISTS (
    SELECT 1 FROM "DmLog" d
    WHERE d."automationId" = a.id
      AND d.status = 'SENT'
      AND d."createdAt" > now() - interval '30 days'
  );

-- 2) Stories efímeras: apagar el trigger por DM pasadas 48 horas.
UPDATE "Automation"
SET "dmTriggerEnabled" = false, "updatedAt" = now()
WHERE "dmTriggerEnabled" = true
  AND goal = 'story-efimera'
  AND "createdAt" < now() - interval '48 hours';
