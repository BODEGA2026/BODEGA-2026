"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { RatesHeader } from "./RatesHeader";
import { useAppStore } from "@/lib/store/useAppStore";
import { ToastContainer } from "@/components/ui/ToastContainer";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const loading = useAppStore((s) => s.loading);
  const loadAll = useAppStore((s) => s.loadAll);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return (
    <div className="min-h-screen relative z-[1]">
      <ToastContainer />
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[99] bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="md:ml-[240px] flex flex-col min-h-screen">
        <div className="p-3 md:p-3">
          <RatesHeader onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <main className="flex-1 px-3 pb-6 md:px-6 max-w-[1280px] w-full mx-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64" style={{ color: "var(--ink-muted)" }}>
              Cargando datos…
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
