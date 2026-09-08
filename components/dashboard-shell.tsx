"use client";

import { useEffect, useRef, useState } from "react";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/top-bar";

interface DashboardShellProps {
  children: React.ReactNode;
  workspaceName: string;
  instagramUsername: string | null;
  instagramAccountCount: number;
}

export default function DashboardShell({
  children,
  workspaceName,
  instagramUsername,
  instagramAccountCount,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sidebarOpen) return;
    const desktop = window.matchMedia("(min-width: 1024px)");
    if (desktop.matches) return;
    const sidebar = sidebarRef.current;
    const content = contentRef.current;
    if (!sidebar || !content) return;
    content.inert = true;
    const focusFrame = requestAnimationFrame(() => {
      sidebar.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    });
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setSidebarOpen(false);
      }
      if (event.key !== "Tab" || !sidebar) return;
      const items = Array.from(sidebar.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"))
        .filter((item) => item.getClientRects().length > 0 && getComputedStyle(item).visibility !== "hidden");
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || !sidebar.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !sidebar.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    }
    const onResize = () => { if (desktop.matches) setSidebarOpen(false); };
    document.addEventListener("keydown", handleKey);
    desktop.addEventListener("change", onResize);
    const trigger = menuButtonRef.current;
    return () => {
      cancelAnimationFrame(focusFrame);
      content.inert = false;
      document.removeEventListener("keydown", handleKey);
      desktop.removeEventListener("change", onResize);
      if (!desktop.matches) trigger?.focus({ preventScroll: true });
    };
  }, [sidebarOpen]);

  return (
    // h-dvh, not h-screen: on mobile browsers the URL bar eats into 100vh, which
    // would push the composer and pagination controls below the fold.
    <div className="dia-ui ui-wallpaper flex h-dvh gap-4 overflow-hidden p-3 lg:p-4">
      <a href="#main-content" className="ui-skip-link">Saltar al contenido</a>
      <Sidebar
        panelRef={sidebarRef}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        workspaceName={workspaceName}
      />

      <div ref={contentRef} className="ui-glass flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl">
        <TopBar
          menuButtonRef={menuButtonRef}
          menuOpen={sidebarOpen}
          onMenuClick={() => setSidebarOpen(true)}
          instagramUsername={instagramUsername}
          instagramAccountCount={instagramAccountCount}
        />

        {/* overflow-x-hidden: enabling vertical scrolling makes the browser
            allow horizontal scrolling too, which lets a wide child drag the
            whole page sideways on a phone. */}
        <main id="main-content" tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
