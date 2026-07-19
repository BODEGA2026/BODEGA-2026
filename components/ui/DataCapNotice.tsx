import { AlertTriangle } from "lucide-react";

/**
 * Aviso visible cuando un reporte de "todo el historial" en realidad
 * está limitado a los N registros más recientes cargados, no al total
 * real en la base de datos. Evita que Financiero/Estadísticas/Dashboard
 * muestren números incompletos sin que nadie se entere.
 */
export function DataCapNotice({ loaded, total, label }: { loaded: number; total: number; label: string }) {
  if (loaded >= total) return null;

  return (
    <div
      className="rounded-xl px-3.5 py-2.5 text-[12px] flex items-center gap-2"
      style={{ background: "var(--warning-light)", border: "1px solid rgba(255,159,10,0.3)", color: "#9a5900" }}
    >
      <AlertTriangle size={14} className="shrink-0" />
      Este reporte muestra los {loaded.toLocaleString("es-VE")} {label} más recientes de{" "}
      {total.toLocaleString("es-VE")} en total — los registros más antiguos no están incluidos aquí.
    </div>
  );
}
