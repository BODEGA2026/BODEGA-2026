import * as XLSX from "xlsx";
import { toast } from "@/lib/store/useToastStore";

export function exportToExcel(data: Record<string, unknown>[], sheetName: string) {
  if (!data.length) {
    toast("Sin datos para exportar", "warning");
    return;
  }
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `AnthonyRiveraERP_${sheetName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  toast(`📊 ${sheetName} exportado`, "success");
}
