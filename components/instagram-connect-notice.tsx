"use client";

import { useSearchParams } from "next/navigation";

type Tone = "error" | "warning" | "success";

const TONE_CLASSES: Record<Tone, string> = {
  error: "border-error/20 bg-error/10 text-error",
  warning: "border-warning/20 bg-warning/10 text-warning",
  success: "border-success/20 bg-success/10 text-success",
};

const MESSAGES: Record<string, { tone: Tone; title: string; detail: string }> = {
  denied: {
    tone: "warning",
    title: "Conexión con Instagram cancelada",
    detail:
      "Has rechazado los permisos en Instagram. Vuelve a empezar y acepta todos los permisos solicitados.",
  },
  invalid: {
    tone: "error",
    title: "Conexión con Instagram caducada",
    detail:
      "Falta el enlace de acceso o han pasado más de 10 minutos. Pulsa Conectar Instagram para volver a intentarlo.",
  },
  forbidden: {
    tone: "error",
    title: "Acceso no permitido",
    detail:
      "Solo los propietarios y administradores del espacio de trabajo pueden conectar una cuenta de Instagram.",
  },
  already_connected: {
    tone: "warning",
    title: "Cuenta ya conectada",
    detail:
      "Esa cuenta de Instagram está conectada a otro espacio de trabajo. Desconéctala allí primero o conecta otra cuenta.",
  },
};

export function InstagramConnectNotice() {
  const searchParams = useSearchParams();
  const status = searchParams.get("instagram");

  if (!status) return null;

  if (status === "misconfigured") {
    const missing = (searchParams.get("missing") ?? "")
      .split(",")
      .filter(Boolean);

    return (
      <Notice tone="error" title="Aplicación de Instagram sin configurar">
        <p>
          Configura{" "}
          {missing.length > 0
            ? "estas variables de entorno"
            : "las variables de entorno necesarias"}{" "}
          y reinicia el servidor:
        </p>
        {missing.length > 0 && (
          <ul className="mt-2 space-y-1">
            {missing.map((name) => (
              <li key={name} className="font-mono text-xs">
                {name}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2">
          Consulta <span className="font-mono text-xs">docs/setup.md</span> para saber cómo
          obtener cada valor. Recuerda que{" "}
          <span className="font-mono text-xs">ENCRYPTION_KEY</span> debe ser una
          cadena hexadecimal de 64 caracteres.
        </p>
      </Notice>
    );
  }

  if (status === "failed") {
    const reason = searchParams.get("reason");

    return (
      <Notice tone="error" title="No se ha podido conectar con Instagram">
        <p>
          Instagram ha aceptado el acceso, pero no se ha podido completar
          la conexión. Suele deberse a una URI de redirección incorrecta o a que
          faltan permisos en la aplicación.
        </p>
        {reason && (
          <p className="mt-2 font-mono text-xs break-words opacity-80">
            {reason}
          </p>
        )}
      </Notice>
    );
  }

  const known = MESSAGES[status];
  if (!known) return null;

  return (
    <Notice tone={known.tone} title={known.title}>
      <p>{known.detail}</p>
    </Notice>
  );
}

function Notice({
  tone,
  title,
  children,
}: {
  tone: Tone;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded border p-4 text-sm ${TONE_CLASSES[tone]}`}>
      <p className="font-semibold">{title}</p>
      <div className="mt-1 opacity-90">{children}</div>
    </div>
  );
}
