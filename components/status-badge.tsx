/**
 * Status label for DM status. Plain text; color carries the state.
 */

const statusConfig: Record<string, { text: string; label: string }> = {
  SENT: { text: "text-success bg-success/10 border-success/20", label: "Enviado" },
  FAILED: { text: "text-error bg-error/10 border-error/20", label: "Fallido" },
  PENDING: { text: "text-warning bg-warning/10 border-warning/20", label: "Pendiente" },
  SKIPPED_DEDUP: { text: "text-muted bg-surface-hover border-border", label: "Duplicado omitido" },
  SKIPPED_RATE_LIMIT: { text: "text-warning bg-warning/10 border-warning/20", label: "Omitido por frecuencia" },
  SKIPPED_PLAN_LIMIT: { text: "text-warning bg-warning/10 border-warning/20", label: "Omitido por límite del plan" },
  SKIPPED_NO_MATCH: { text: "text-muted bg-surface-hover border-border", label: "Sin coincidencia" },
};

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.PENDING;

  return (
    <span className={`inline-flex shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${config.text}`}>
      {config.label}
    </span>
  );
}
