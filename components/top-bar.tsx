"use client";

/**
 * Top Bar
 *
 * Page title, mobile hamburger, and connection status.
 */

import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/dashboard": "Panel",
  "/campaigns": "Campañas",
  "/campaigns/new": "Crear campaña",
  "/automations": "Campañas",
  "/automations/new": "Crear campaña",
  "/logs": "Registro de DMs",
  "/settings": "Ajustes",
  "/diagnostics": "Diagnóstico",
};

interface TopBarProps {
  onMenuClick: () => void;
  menuOpen: boolean;
  menuButtonRef: React.RefObject<HTMLButtonElement | null>;
  instagramUsername: string | null;
  instagramAccountCount: number;
}

export default function TopBar({
  onMenuClick,
  menuOpen,
  menuButtonRef,
  instagramUsername,
  instagramAccountCount,
}: TopBarProps) {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? (pathname.startsWith("/campaigns/") ? (pathname.endsWith("/edit") ? "Editar campaña" : "Campaña") : "Panel");

  return (
    <header
      className="relative z-30 flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 sm:px-6 lg:px-8"
      // Installed to the home screen the app starts at the very top of the
      // display, so without this the title sits under the clock and battery.
      // The inset is 0 in a browser tab and on desktop.
      style={{
        height: "calc(4rem + env(safe-area-inset-top))",
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <button
          ref={menuButtonRef}
          aria-expanded={menuOpen}
          aria-controls="sidebar-navigation"
          onClick={onMenuClick}
          className="ui-button lg:hidden shrink-0 px-3"
          aria-label="Abrir o cerrar menú lateral"
        >
          Menú
        </button>
        <h1 className="truncate text-base font-medium tracking-tight">{title}</h1>
      </div>

      {instagramAccountCount > 0 ? (
        <p className="max-w-[40%] shrink-0 truncate rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">
          {instagramAccountCount > 1
            ? `${instagramAccountCount} cuentas`
            : `@${instagramUsername}`}
        </p>
      ) : (
        <a
          href="/api/instagram/connect"
          className="ui-button ui-button-primary shrink-0"
        >
          {/* Full label needs more room than a 360px header has to spare. */}
          <span className="sm:hidden">Conectar</span>
          <span className="hidden sm:inline">Conectar Instagram</span>
        </a>
      )}
    </header>
  );
}
