"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

export function Modal({
  title,
  open,
  onClose,
  onConfirm,
  confirmLabel = "Guardar",
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-5"
      style={{ background: "rgba(20,30,60,0.35)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="glass-panel-strong w-full max-w-[600px] max-h-[90vh] overflow-y-auto p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[18px] font-bold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5" aria-label="Cerrar">
            <X size={20} style={{ color: "var(--ink-muted)" }} />
          </button>
        </div>

        <div>{children}</div>

        {onConfirm && (
          <div className="flex gap-2.5 mt-6 justify-end">
            <button className="btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
