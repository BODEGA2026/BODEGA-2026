"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useAppStore } from "@/lib/store/useAppStore";
import { toast } from "@/lib/store/useToastStore";
import type { Client } from "@/lib/types";

export function ClientModal({ open, onClose, client }: { open: boolean; onClose: () => void; client: Client | null }) {
  const upsertClient = useAppStore((s) => s.upsertClient);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setName(client?.name ?? "");
    setPhone(client?.phone ?? "");
    setEmail(client?.email ?? "");
    setAddress(client?.address ?? "");
    setNotes(client?.notes ?? "");
  }, [client, open]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast("Nombre requerido", "warning");
      return;
    }
    await upsertClient({
      id: client?.id,
      name: name.trim(),
      phone: phone || null,
      email: email || null,
      address: address || null,
      notes: notes || null,
      ...(client ? {} : { total_bought: 0, purchases_count: 0 }),
    });
    toast("Cliente guardado", "success");
    onClose();
  };

  return (
    <Modal title={client ? "✏️ Editar Cliente" : "+ Nuevo Cliente"} open={open} onClose={onClose} onConfirm={handleSave}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nombre *" value={name} onChange={setName} />
        <Field label="Teléfono" value={phone} onChange={setPhone} placeholder="+58 412..." />
        <Field label="Email" value={email} onChange={setEmail} type="email" />
        <Field label="Dirección" value={address} onChange={setAddress} />
        <div className="col-span-2">
          <Field label="Notas" value={notes} onChange={setNotes} />
        </div>
      </div>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-semibold" style={{ color: "var(--ink-secondary)" }}>
        {label}
      </label>
      <input type={type} className="input-field" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
