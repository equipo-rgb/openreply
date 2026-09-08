"use client";

/**
 * Sidebar Navigation
 *
 * Text-only nav with active state and workspace section.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Panel", href: "/dashboard" },
  { label: "Resumen", href: "/overview" },
  { label: "Bandeja de entrada", href: "/inbox" },
  { label: "Campañas", href: "/campaigns" },
  { label: "Registro de DMs", href: "/logs" },
  { label: "Ajustes", href: "/settings" },
  { label: "Diagnóstico", href: "/diagnostics" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceName: string;
}

export default function Sidebar({
  isOpen,
  onClose,
  workspaceName,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}
        className={`
          ui-glass fixed inset-y-3 left-3 z-50 w-[244px] max-w-[85vw] shrink-0 rounded-2xl flex flex-col
          transition-transform duration-200 ease-out
          lg:h-full lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? "translate-x-0 visible" : "-translate-x-[calc(100%+1rem)] invisible lg:visible"}
        `}
      >
        {/* Same reason as the top bar: the drawer is full height, so the
            wordmark would otherwise land under the status bar. */}
        <div
          className="px-5 py-5 border-b border-border"
          style={{ paddingTop: "calc(1.25rem + env(safe-area-inset-top))" }}
        >
          <Link href="/dashboard" className="flex items-center gap-3 text-sm font-semibold tracking-tight">
            <span className="ui-brand" aria-hidden="true">OR</span>
            <span>OpenReply<span className="mt-0.5 block text-xs font-normal tracking-normal text-muted">D-IA · Instagram</span></span>
          </Link>
        </div>

        <button type="button" onClick={onClose} className="ui-button mx-3 mt-3 lg:hidden" aria-label="Cerrar menú lateral">Cerrar menú</button>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={isActive ? "page" : undefined}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-lg text-[13px]
                  ${
                    isActive
                      ? "bg-accent/10 text-accent font-medium ring-1 ring-inset ring-accent/15"
                      : "text-muted hover:text-foreground hover:bg-surface-hover"
                  }
                `}
              >
                <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${isActive ? "bg-accent" : "bg-muted/40"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-border">
          <p className="text-xs font-medium text-foreground truncate">{workspaceName}</p>
          <p className="mt-1 text-xs text-muted">Servidor propio</p>
        </div>
      </aside>
    </>
  );
}
