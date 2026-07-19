"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useAppStore } from "@/lib/store/useAppStore";
import { toast } from "@/lib/store/useToastStore";

const today = () => new Date().toISOString().slice(0, 10);
const CATEGORIES = ["Alquiler", "Nómina", "Servicios", "Transporte", "Marketing", "Suministros", "Otros"];

export function ExpenseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addExpense = useAppStore((s) => s.addExpense);
  const [concept, setConcept] = useState("");
  const [category, setCategory] = useState("Alquiler");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState("");

  const reset = () => {
    setConcept("");
    setCategory("Alquiler");
    setAmount("");
    setDate(today());
    setNotes("");
  };

  const handleSave = async () => {
    const amt = parseFloat(amount);
    if (!concept.trim() || isNaN(amt)) {
      toast("Completa los campos obligatorios", "warning");
      return;
    }
    const ok = await addExpense({ concept: concept.trim(), category, amount: amt, expense_date: date, notes });
    if (ok) {
      toast("Gasto registrado", "success");
      reset();
      onClose();
    }
  };

  return (
    <Modal title="💸 Registrar Gasto" open={open} onClose={() => { reset(); onClose(); }} onConfirm={handleSave}>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold" style={{ color: "var(--ink-secondary)" }}>Concepto *</label>
          <input className="input-field" value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="Alquiler, Nómina, Servicios..." />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold" style={{ color: "var(--ink-secondary)" }}>Categoría</label>
          <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold" style={{ color: "var(--ink-secondary)" }}>Monto (USD) *</label>
          <input type="number" step="0.01" className="input-field" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold" style={{ color: "var(--ink-secondary)" }}>Fecha</label>
          <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-1.5">
        <label className="text-[12px] font-semibold" style={{ color: "var(--ink-secondary)" }}>Notas</label>
        <input className="input-field" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Descripción adicional" />
      </div>
    </Modal>
  );
}
