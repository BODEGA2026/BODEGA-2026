"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useAppStore } from "@/lib/store/useAppStore";
import { toast } from "@/lib/store/useToastStore";
import { isActiveClient } from "./clientUtils";

export function MassMessageModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const clients = useAppStore((s) => s.clients);
  const [segment, setSegment] = useState<"all" | "active" | "inactive">("all");
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) {
      toast("Escribe un mensaje", "warning");
      return;
    }
    let targets = clients;
    if (segment === "active") targets = targets.filter(isActiveClient);
    if (segment === "inactive") targets = targets.filter((c) => !isActiveClient(c));
    const withPhone = targets.filter((c) => c.phone);

    if (!withPhone.length) {
      toast("Sin clientes con teléfono en este segmento", "warning");
      return;
    }
    withPhone.forEach((c, i) => {
      setTimeout(() => {
        const msg = text.replace("{nombre}", c.name.split(" ")[0]);
        const phone = (c.phone || "").replace(/[^0-9]/g, "");
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
      }, i * 500);
    });
    toast(`${withPhone.length} mensajes enviados`, "success");
    setText("");
    onClose();
  };

  return (
    <Modal title="📱 Mensajería Masiva" open={open} onClose={onClose} onConfirm={handleSend} confirmLabel="Enviar">
      <p className="text-[13px] mb-4" style={{ color: "var(--ink-muted)" }}>
        Se abrirá WhatsApp por cada cliente con teléfono registrado.
      </p>
      <div className="flex flex-col gap-1.5 mb-4">
        <label className="text-[12px] font-semibold" style={{ color: "var(--ink-secondary)" }}>Segmento</label>
        <select className="input-field" value={segment} onChange={(e) => setSegment(e.target.value as typeof segment)}>
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-semibold" style={{ color: "var(--ink-secondary)" }}>Mensaje</label>
        <textarea
          className="input-field"
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Hola {nombre}, tenemos una oferta especial..."
        />
      </div>
      <p className="text-[11px] mt-2" style={{ color: "var(--ink-muted)" }}>
        Usa <code>{"{nombre}"}</code> para personalizar
      </p>
    </Modal>
  );
}
