"use client";

import { useEffect, useRef, useState } from "react";
import { Save, DownloadCloud, UploadCloud, Trash2, ShieldAlert, CloudCog, FileDown, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store/useAppStore";
import { useBIStore } from "@/lib/store/useBIStore";
import { toast } from "@/lib/store/useToastStore";

const TABLES = ["products", "clients", "sales", "purchases", "expenses", "accounts", "goals", "alerts"] as const;

interface BackupFile {
  name: string;
  createdAt: string | null;
  sizeKB: number;
  url: string;
}

export default function ConfigPage() {
  const { business, saveBusiness, loadAll } = useAppStore();
  const { goals, alerts, loadBI } = useBIStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    rif: "",
    address: "",
    phone: "",
    email: "",
    maps_link: "",
    footer_note: "",
  });

  const [autoBackups, setAutoBackups] = useState<BackupFile[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(true);

  const loadAutoBackups = async () => {
    setLoadingBackups(true);
    const supabase = createClient();
    const { data, error } = await supabase.storage.from("backups").list("", {
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error) {
      // El bucket puede no existir todavía si aún no se corrió setup-automated-backups.sql
      setAutoBackups([]);
      setLoadingBackups(false);
      return;
    }
    const files = (data ?? [])
      .filter((f) => f.name.endsWith(".json"))
      .map((f) => {
        const { data: pub } = supabase.storage.from("backups").getPublicUrl(f.name);
        return {
          name: f.name,
          createdAt: f.created_at,
          sizeKB: Math.round((f.metadata?.size ?? 0) / 1024),
          url: pub.publicUrl,
        };
      });
    setAutoBackups(files);
    setLoadingBackups(false);
  };

  useEffect(() => {
    loadAutoBackups();
  }, []);

  useEffect(() => {
    if (business) {
      setForm({
        name: business.name,
        rif: business.rif,
        address: business.address,
        phone: business.phone,
        email: business.email,
        maps_link: business.maps_link,
        footer_note: business.footer_note,
      });
    }
  }, [business]);

  const handleSaveBusiness = async () => {
    const ok = await saveBusiness(form);
    if (ok) toast("Configuración guardada", "success");
  };

  const handleExportBackup = async () => {
    const supabase = createClient();
    const [products, clients, sales, purchases, expenses, accounts] = await Promise.all([
      supabase.from("products").select("*"),
      supabase.from("clients").select("*"),
      supabase.from("sales").select("*"),
      supabase.from("purchases").select("*"),
      supabase.from("expenses").select("*"),
      supabase.from("accounts").select("*"),
    ]);

    const backup = {
      version: "1.0-supabase",
      exportDate: new Date().toISOString(),
      data: {
        business,
        products: products.data ?? [],
        clients: clients.data ?? [],
        sales: sales.data ?? [],
        purchases: purchases.data ?? [],
        expenses: expenses.data ?? [],
        accounts: accounts.data ?? [],
        goals,
        alerts,
      },
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AnthonyRiveraERP_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("✅ Respaldo exportado correctamente", "success");
  };

  const handleImportBackup = async (file: File) => {
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      if (!backup.data) throw new Error("Formato inválido");

      const confirmMsg = `¿Restaurar respaldo del ${new Date(backup.exportDate).toLocaleString("es-VE")}?\nEsto reemplazará TODOS los datos actuales.`;
      if (!confirm(confirmMsg)) return;

      const supabase = createClient();

      // Reemplaza cada tabla: borra todo lo existente e inserta lo del respaldo
      for (const table of TABLES) {
        const rows = backup.data[table];
        await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (Array.isArray(rows) && rows.length) {
          await supabase.from(table).insert(rows);
        }
      }
      if (backup.data.business) {
        await supabase.from("business_settings").update(backup.data.business).eq("id", backup.data.business.id);
      }

      await Promise.all([loadAll(), loadBI()]);
      toast("✅ Datos restaurados correctamente", "success");
    } catch {
      toast("❌ Error al importar: archivo inválido", "error");
    }
  };

  const handleClearSales = async () => {
    if (!confirm("¿Eliminar TODAS las ventas? Esta acción es irreversible.")) return;
    const supabase = createClient();
    await supabase.from("sales").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await loadAll();
    toast("Historial de ventas eliminado", "info");
  };

  const handleClearAll = async () => {
    if (!confirm("⚠️ ¿Eliminar ABSOLUTAMENTE TODOS los datos?\nEsta acción es irreversible. ¿Estás seguro?")) return;
    if (!confirm("Última confirmación: ¿borrar todo?")) return;
    const supabase = createClient();
    for (const table of TABLES) {
      await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    }
    location.reload();
  };

  return (
    <div className="space-y-5 pt-2">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight">Configuración</h1>
        <p className="text-[13px]" style={{ color: "var(--ink-muted)" }}>
          Ajustes del sistema y respaldo de datos
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-[14px] font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--ink-secondary)" }}>
            🏢 Datos del Negocio
          </h3>
          <div className="flex flex-col gap-3.5">
            <Field label="Nombre del negocio" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Mi Empresa SRL" />
            <Field label="RIF / Cédula Fiscal" value={form.rif} onChange={(v) => setForm({ ...form, rif: v })} placeholder="J-12345678-9" />
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold" style={{ color: "var(--ink-secondary)" }}>Dirección</label>
              <textarea className="input-field" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Av. Principal, Local 1" />
            </div>
            <Field label="Teléfono" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+58 412 000 0000" />
            <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="info@empresa.com" />
            <Field label="Link de ubicación (Maps)" value={form.maps_link} onChange={(v) => setForm({ ...form, maps_link: v })} placeholder="https://maps.google.com/..." />
            <Field label="Pie de factura (leyenda)" value={form.footer_note} onChange={(v) => setForm({ ...form, footer_note: v })} placeholder="¡Gracias por su compra!" />
            <button className="btn-primary self-start" onClick={handleSaveBusiness}>
              <Save size={15} /> Guardar Configuración
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div
            className="card"
            style={{ background: "linear-gradient(135deg, rgba(255,59,48,0.08) 0%, rgba(255,149,0,0.06) 100%)", borderColor: "rgba(255,59,48,0.18)", borderWidth: 2 }}
          >
            <div className="text-center">
              <div className="text-[40px] mb-2">🚨</div>
              <h3 className="text-[16px] font-bold mb-1">Botón de Pánico — Respaldo Completo</h3>
              <p className="text-[13px] max-w-[320px] mx-auto mb-4" style={{ color: "var(--ink-muted)" }}>
                Exporta todos tus datos en un JSON. Restaura al instante ante cualquier problema.
              </p>
              <div className="flex flex-col gap-2 items-center">
                <button className="btn-danger" onClick={handleExportBackup}>
                  <DownloadCloud size={15} /> Exportar Respaldo
                </button>
                <label className="btn-ghost cursor-pointer">
                  <UploadCloud size={15} /> Importar / Restaurar
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleImportBackup(e.target.files[0])}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[14px] font-semibold uppercase tracking-wide flex items-center gap-1.5" style={{ color: "var(--ink-secondary)" }}>
                <CloudCog size={15} style={{ color: "var(--accent)" }} /> Respaldos Automáticos
              </h3>
              <button className="btn-ghost btn-xs" onClick={loadAutoBackups} aria-label="Actualizar lista">
                <RefreshCw size={12} />
              </button>
            </div>
            <p className="text-[12.5px] mb-3.5" style={{ color: "var(--ink-muted)" }}>
              Cada noche (~11 pm hora Venezuela) el sistema guarda un respaldo completo aquí automáticamente, sin que tengas que hacer nada. Se conservan los últimos 30 días.
            </p>
            {loadingBackups ? (
              <p className="text-[12.5px]" style={{ color: "var(--ink-muted)" }}>Cargando...</p>
            ) : autoBackups.length === 0 ? (
              <p className="text-[12.5px]" style={{ color: "var(--ink-muted)" }}>
                Aún no hay respaldos automáticos. El primero se generará esta noche (requiere haber ejecutado <code>setup-automated-backups.sql</code> en Supabase).
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-black/5">
                {autoBackups.slice(0, 10).map((f) => (
                  <a
                    key={f.name}
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 py-2 text-[12.5px]"
                  >
                    <FileDown size={13} style={{ color: "var(--accent)" }} />
                    <span className="flex-1">{f.name}</span>
                    <span style={{ color: "var(--ink-muted)" }}>{f.sizeKB} KB</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="text-[14px] font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5" style={{ color: "var(--ink-secondary)" }}>
              <ShieldAlert size={15} color="var(--danger)" /> Zona de Peligro
            </h3>
            <p className="text-[13px] mb-3.5" style={{ color: "var(--ink-muted)" }}>
              Estas acciones son irreversibles. Haz un respaldo antes.
            </p>
            <div className="flex flex-col gap-2">
              <button
                className="btn-ghost btn-sm justify-center"
                style={{ borderColor: "rgba(255,59,48,0.3)", color: "var(--danger)" }}
                onClick={handleClearSales}
              >
                <Trash2 size={14} /> Borrar historial de ventas
              </button>
              <button
                className="btn-ghost btn-sm justify-center"
                style={{ borderColor: "rgba(255,59,48,0.3)", color: "var(--danger)" }}
                onClick={handleClearAll}
              >
                <ShieldAlert size={14} /> Borrar TODOS los datos
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-semibold" style={{ color: "var(--ink-secondary)" }}>{label}</label>
      <input className="input-field" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
