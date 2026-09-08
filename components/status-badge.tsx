/**
 * Status label for DM status. Plain text; color carries the state.
 */

const statusConfig: Record<string, { text: string; label: string }> = {
  SENT: { text: "text-success", label: "Enviado" },
  FAILED: { text: "text-error", label: "Fallido" },
  PENDING: { text: "text-warning", label: "Pendiente" },
  SKIPPED_DEDUP: { text: "text-muted", label: "Duplicado omitido" },
  SKIPPED_RATE_LIMIT: { text: "text-warning", label: "Omitido por frecuencia" },
  SKIPPED_PLAN_LIMIT: { text: "text-warning", label: "Omitido por límite del plan" },
  SKIPPED_NO_MATCH: { text: "text-muted", label: "Sin coincidencia" },
};

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.PENDING;

  return (
    <span className={`shrink-0 whitespace-nowrap text-sm ${config.text}`}>
      {config.label}
    </span>
  );
}
