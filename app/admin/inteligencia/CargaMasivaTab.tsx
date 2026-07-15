"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Download, Upload, ArrowLeft, CheckCircle2, RotateCcw } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { toast } from "@/lib/store/useToastStore";
import { ERP_FIELDS, autoDetectMapping, validateRows, type ValidatedRow } from "@/lib/bi/importMapping";

type Step = 1 | 2 | 3 | 4;
const STEP_LABELS = ["Cargar archivo", "Mapear columnas", "Validar y previsualizar", "Importar"];

export function CargaMasivaTab() {
  const bulkImportProducts = useAppStore((s) => s.bulkImportProducts);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>(1);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<number, string>>({});
  const [validRows, setValidRows] = useState<ValidatedRow[]>([]);
  const [resultLog, setResultLog] = useState<string[]>([]);

  const reset = () => {
    setStep(1);
    setFileName("");
    setHeaders([]);
    setRawRows([]);
    setMapping({});
    setValidRows([]);
    setResultLog([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadTemplate = () => {
    const headerRow = ["nombre", "precio_venta_usd", "costo_usd", "stock", "stock_minimo", "sku", "categoria", "impuesto", "proveedor", "variante", "region", "vendedor"];
    const example = [
      ["Camisa Polo Talla M", 15.5, 8.0, 20, 5, "CAM-M-001", "Ropa", "IVA16", "Proveedor A", "Talla M / Blanco", "Caracas", "Vendedor 1"],
      ["Vaso Desechable 7oz", 2.8, 1.2, 150, 30, "VAS-7oz", "Desechables", "EXENTO", "Proveedor B", "", "Maracaibo", ""],
    ];
    const ws = XLSX.utils.aoa_to_sheet([headerRow, ...example]);
    ws["!cols"] = headerRow.map((h) => ({ wch: Math.max(h.length + 4, 18) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, "Plantilla_Inventario_AnthonyRiveraERP.xlsx");
    toast("Plantilla descargada", "success");
  };

  const processFile = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["xlsx", "xls", "csv"].includes(ext)) {
      toast("Formato no soportado. Usa .xlsx, .xls o .csv", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: "" });
        if (rows.length < 2) {
          toast("El archivo está vacío o no tiene datos", "error");
          return;
        }
        const hdrs = rows[0].map((h) => String(h).trim());
        const data = rows.slice(1).filter((r) => r.some((c) => c !== ""));
        setHeaders(hdrs);
        setRawRows(data);
        setMapping(autoDetectMapping(hdrs));
        setFileName(file.name);
        setStep(2);
      } catch (err) {
        toast(`Error al leer el archivo: ${(err as Error).message}`, "error");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleValidate = () => {
    const mappedKeys = Object.values(mapping);
    const missing = ERP_FIELDS.filter((f) => f.required && !mappedKeys.includes(f.key));
    if (missing.length) {
      toast(`Campos obligatorios sin mapear: ${missing.map((f) => f.label).join(", ")}`, "error");
      return;
    }
    const rows = validateRows(rawRows, mapping);
    setValidRows(rows);
    const okCount = rows.filter((r) => r.errors.length === 0).length;
    if (okCount === 0) toast("No hay filas válidas para importar", "error");
    setStep(3);
  };

  const handleImport = async () => {
    const toImport = validRows.filter((r) => r.errors.length === 0);
    if (!toImport.length) {
      toast("Nada que importar", "warning");
      return;
    }
    const { added, updated } = await bulkImportProducts(
      toImport.map((r) => ({
        name: r.name!,
        sale_price: r.sale_price,
        cost: r.cost,
        stock: r.stock,
        min_stock: r.min_stock,
        sku: r.sku || null,
        category: r.category || null,
        tax_type: (r.tax_type as "IVA16" | "EXENTO") || "EXENTO",
        supplier: r.supplier || null,
        variant: r.variant || null,
        region: r.region || null,
        seller: r.seller || null,
      }))
    );
    setResultLog([
      `✅ Importación completada: ${added} agregados, ${updated} actualizados`,
      ...toImport.map((r) => `${r.name} — procesado (fila ${r.rowNum})`),
    ]);
    toast(`✅ ${added + updated} productos procesados en el ERP`, "success");
    setStep(4);
  };

  const okCount = validRows.filter((r) => r.errors.length === 0).length;
  const warnCount = validRows.filter((r) => r.errors.length === 0 && r.warnings.length > 0).length;
  const errCount = validRows.filter((r) => r.errors.length > 0).length;

  return (
    <div className="space-y-5">
      {/* Stepper */}
      <div className="flex items-center gap-0 mb-1">
        {STEP_LABELS.map((label, i) => {
          const n = (i + 1) as Step;
          const done = n < step;
          const active = n === step;
          return (
            <div key={label} className="flex items-center" style={{ flex: i < 3 ? "0 0 auto" : "0 0 auto" }}>
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
                  style={{ background: done ? "var(--success)" : active ? "var(--accent)" : "rgba(200,215,235,0.4)", color: done || active ? "#fff" : "var(--ink-muted)" }}
                >
                  {n}
                </div>
                <span className="text-[12.5px] font-semibold whitespace-nowrap hidden sm:inline" style={{ color: active ? "var(--accent)" : "var(--ink-muted)" }}>
                  {label}
                </span>
              </div>
              {i < 3 && <div className="h-0.5 w-8 sm:w-14 mx-2" style={{ background: done ? "var(--success)" : "rgba(200,215,235,0.4)" }} />}
            </div>
          );
        })}
      </div>

      {/* Paso 1 */}
      {step === 1 && (
        <div className="card">
          <h3 className="text-[14px] font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--ink-secondary)" }}>
            📄 Paso 1 — Cargar archivo Excel o CSV
          </h3>

          <div className="rounded-2xl p-4 flex items-center gap-3.5 mb-4" style={{ background: "linear-gradient(135deg, rgba(91,140,247,0.08), rgba(139,96,255,0.06))", border: "1.5px solid rgba(91,140,247,0.2)" }}>
            <div className="text-[32px]">📋</div>
            <div className="flex-1">
              <strong className="text-[14px] block">Descargar plantilla oficial</strong>
              <span className="text-[12px]" style={{ color: "var(--ink-muted)" }}>Columnas pre-mapeadas para importación sin errores</span>
            </div>
            <button className="btn-ghost btn-sm" onClick={downloadTemplate}>
              <Download size={14} /> .xlsx
            </button>
          </div>

          <div
            className="rounded-2xl px-6 py-9 text-center cursor-pointer transition-all"
            style={{
              border: `2.5px dashed ${dragOver ? "var(--accent)" : "rgba(91,140,247,0.35)"}`,
              background: dragOver ? "var(--accent-light)" : "rgba(91,140,247,0.03)",
            }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
            />
            <div className="text-[36px] mb-2">📂</div>
            <div className="text-[15px] font-semibold mb-1">Arrastra tu archivo aquí</div>
            <div className="text-[12px]" style={{ color: "var(--ink-muted)" }}>o haz clic para seleccionar · Soporta .xlsx, .xls, .csv</div>
          </div>

          {fileName && (
            <div className="mt-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold" style={{ background: "var(--success-light)", color: "#1a7a35" }}>
              ✅ Archivo cargado: {fileName} · {rawRows.length} filas detectadas · {headers.length} columnas
            </div>
          )}
        </div>
      )}

      {/* Paso 2 */}
      {step === 2 && (
        <div className="card">
          <h3 className="text-[14px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--ink-secondary)" }}>
            🗺️ Paso 2 — Mapear columnas detectadas
          </h3>
          <p className="text-[12.5px] mb-4" style={{ color: "var(--ink-muted)" }}>
            Asocia cada columna del archivo con el campo del ERP.
          </p>
          <div className="overflow-x-auto rounded-2xl" style={{ border: "1.5px solid var(--glass-border)" }}>
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: "rgba(240,245,255,0.5)" }}>
                  {["Columna en tu archivo", "Muestra de datos", "Campo del ERP"].map((h) => (
                    <th key={h} className="text-left px-3 py-2.5 text-[11px] font-bold uppercase" style={{ color: "var(--ink-muted)", borderBottom: "1px solid rgba(200,215,235,0.4)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {headers.map((h, i) => {
                  const sample = rawRows.slice(0, 3).map((r) => String(r[i] || "").slice(0, 18)).filter(Boolean).join(" · ") || "—";
                  return (
                    <tr key={i}>
                      <td className="px-3 py-2.5 text-[13px] font-semibold" style={{ borderBottom: "1px solid rgba(200,215,235,0.2)" }}>{h}</td>
                      <td className="px-3 py-2.5 text-[12px]" style={{ color: "var(--ink-muted)", fontFamily: "var(--font-mono)", borderBottom: "1px solid rgba(200,215,235,0.2)" }}>{sample}</td>
                      <td className="px-3 py-2.5" style={{ borderBottom: "1px solid rgba(200,215,235,0.2)" }}>
                        <select
                          className="input-field !py-1.5 min-w-[200px]"
                          value={mapping[i] ?? "IGNORE"}
                          onChange={(e) => setMapping({ ...mapping, [i]: e.target.value })}
                        >
                          {ERP_FIELDS.map((f) => (
                            <option key={f.key} value={f.key}>{f.label}{f.required ? " *" : ""}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2.5 mt-4">
            <button className="btn-ghost btn-sm" onClick={reset}><ArrowLeft size={14} /> Volver</button>
            <button className="btn-primary btn-sm" onClick={handleValidate}>Validar y previsualizar →</button>
          </div>
        </div>
      )}

      {/* Paso 3 */}
      {step === 3 && (
        <div className="card">
          <h3 className="text-[14px] font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--ink-secondary)" }}>
            👁️ Paso 3 — Previsualización y validación
          </h3>
          <div className="flex gap-2.5 flex-wrap mb-4">
            <Chip color="var(--success-light)" text={`✅ ${okCount} filas válidas`} textColor="#1a7a35" />
            {warnCount > 0 && <Chip color="var(--warning-light)" text={`⚠️ ${warnCount} con advertencias (se importarán)`} textColor="#9a5900" />}
            {errCount > 0 && <Chip color="var(--danger-light)" text={`❌ ${errCount} con errores (se omitirán)`} textColor="#c0281f" />}
          </div>

          <div className="overflow-x-auto rounded-2xl max-h-[320px] overflow-y-auto" style={{ border: "1.5px solid var(--glass-border)" }}>
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr style={{ background: "rgba(240,245,255,0.5)" }}>
                  {["#", "name", "sale_price", "cost", "stock", "sku", "category", "tax_type", "Estado"].map((h) => (
                    <th key={h} className="sticky top-0 text-left px-3 py-2 text-[11px] font-bold uppercase" style={{ color: "var(--ink-muted)", background: "rgba(240,245,255,0.95)", borderBottom: "1px solid rgba(200,215,235,0.4)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {validRows.slice(0, 20).map((r) => {
                  const status = r.errors.length ? "err" : r.warnings.length ? "warn" : "ok";
                  return (
                    <tr key={r.rowNum}>
                      {["rowNum", "name", "sale_price", "cost", "stock", "sku", "category", "tax_type"].map((c) => (
                        <td
                          key={c}
                          className="px-3 py-2"
                          style={{
                            fontFamily: "var(--font-mono)",
                            borderBottom: "1px solid rgba(200,215,235,0.15)",
                            color: r.errors.includes(c) ? "var(--danger)" : r.warnings.includes(c) ? "var(--warning)" : "var(--ink)",
                            fontWeight: r.errors.includes(c) || r.warnings.includes(c) ? 700 : 400,
                          }}
                        >
                          {(r as unknown as Record<string, unknown>)[c] !== undefined ? String((r as unknown as Record<string, unknown>)[c]) : "—"}
                        </td>
                      ))}
                      <td className="px-3 py-2" style={{ borderBottom: "1px solid rgba(200,215,235,0.15)" }}>
                        {status === "err" && <span style={{ color: "var(--danger)", fontWeight: 700 }}>❌ Error</span>}
                        {status === "warn" && <span style={{ color: "var(--warning)", fontWeight: 700 }}>⚠️ Advertencia</span>}
                        {status === "ok" && <span style={{ color: "var(--success)", fontWeight: 700 }}>✅ OK</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2.5 mt-4">
            <button className="btn-ghost btn-sm" onClick={() => setStep(2)}><ArrowLeft size={14} /> Volver</button>
            <button className="btn-primary" disabled={okCount === 0} style={{ opacity: okCount === 0 ? 0.5 : 1 }} onClick={handleImport}>
              <Upload size={15} /> Importar al ERP
            </button>
          </div>
        </div>
      )}

      {/* Paso 4 */}
      {step === 4 && (
        <div className="card">
          <h3 className="text-[14px] font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--ink-secondary)" }}>
            🎉 Paso 4 — Resultado de importación
          </h3>
          <div className="rounded-xl p-3.5 max-h-[180px] overflow-y-auto text-[12px] leading-relaxed" style={{ background: "rgba(20,25,50,0.04)", border: "1px solid rgba(200,215,235,0.4)", fontFamily: "var(--font-mono)" }}>
            {resultLog.map((line, i) => (
              <div key={i} style={{ color: i === 0 ? "var(--success)" : "var(--ink-secondary)" }}>{line}</div>
            ))}
          </div>
          <div className="flex gap-2.5 mt-4">
            <button className="btn-ghost btn-sm" onClick={reset}><RotateCcw size={14} /> Nueva importación</button>
            <button className="btn-success btn-sm" onClick={reset}><CheckCircle2 size={14} /> Listo</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({ color, text, textColor }: { color: string; text: string; textColor: string }) {
  return (
    <div className="rounded-xl px-3.5 py-2 text-[13px] font-semibold" style={{ background: color, color: textColor }}>
      {text}
    </div>
  );
}
