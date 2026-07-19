"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useAppStore } from "@/lib/store/useAppStore";
import { toast } from "@/lib/store/useToastStore";
import type { AccountType } from "@/lib/types";

export function AccountModal({
  open,
  type,
  onClose,
}: {
  open: boolean;
  type: AccountType;
  onClose: () => void;
}) {
  const addAccount = useAppStore((s) => s.addAccount);
  const [entity, setEntity] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const reset = () => {
    setEntity("");
    setAmount("");
    setDueDate("");
    setNotes("");
  };

  const handleSave = async () => {
    const amt = parseFloat(amount);
    if (!entity.trim() || isNaN(amt)) {
      toast("Completa los campos", "warning");
      return;
    }
    const ok = await addAccount({ type, entity: entity.trim(), amount: amt, due_date: dueDate || null, notes });
    if (ok) {
      toast(`${type} registrada`, "success");
      reset();
      onClose();
    }
  };

  return (
    <Modal
      title={`+ ${type === "CXC" ? "Cuenta por Cobrar" : "Cuenta por Pagar"}`}
      open={open}
      onClose={() => { reset(); onClose(); }}
      onConfirm={handleSave}
    >
      <div className="flex flex-col gap-1.5 mb-4">
        <label className="text-[12px] font-semibold" style={{ color: "var(--ink-secondary)" }}>
          {type === "CXC" ? "Cliente" : "Proveedor"}
        </label>
        <input className="input-field" value={entity} onChange={(e) => setEntity(e.target.value)} placeholder="Nombre" />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold" style={{ color: "var(--ink-secondary)" }}>Monto (USD)</label>
          <input type="number" step="0.01" className="input-field" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold" style={{ color: "var(--ink-secondary)" }}>Fecha Vencimiento</label>
          <input type="date" className="input-field" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-semibold" style={{ color: "var(--ink-secondary)" }}>Notas</label>
        <textarea className="input-field" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
    </Modal>
  );
}
