"use client";

import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { useToastStore } from "@/lib/store/useToastStore";

const ICONS = { success: CheckCircle2, error: XCircle, info: Info, warning: AlertTriangle };
const COLORS = { success: "var(--success)", error: "var(--danger)", info: "var(--accent)", warning: "var(--warning)" };

export function ToastContainer() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const Icon = ICONS[t.type];
        return (
          <div
            key={t.id}
            className="glass-panel pointer-events-auto flex items-center gap-2.5 px-4 py-3 text-[13.5px] font-medium max-w-[320px]"
            style={{ borderLeft: `4px solid ${COLORS[t.type]}` }}
          >
            <Icon size={16} color={COLORS[t.type]} />
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} aria-label="Cerrar">
              <X size={14} style={{ color: "var(--ink-muted)" }} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
