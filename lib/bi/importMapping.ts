export interface ImportField {
  key: string;
  label: string;
  required: boolean;
}

export const ERP_FIELDS: ImportField[] = [
  { key: "name", label: "Nombre del producto", required: true },
  { key: "sale_price", label: "Precio de venta (USD)", required: true },
  { key: "cost", label: "Costo de compra (USD)", required: true },
  { key: "stock", label: "Stock actual", required: false },
  { key: "min_stock", label: "Stock mínimo", required: false },
  { key: "sku", label: "SKU / Código", required: false },
  { key: "category", label: "Categoría", required: false },
  { key: "tax_type", label: "Tipo de impuesto (IVA16/EXENTO)", required: false },
  { key: "supplier", label: "Proveedor", required: false },
  { key: "variant", label: "Variante / Talla", required: false },
  { key: "region", label: "Región", required: false },
  { key: "seller", label: "Vendedor", required: false },
  { key: "IGNORE", label: "— Ignorar columna —", required: false },
];

const RULES: { key: string; patterns: string[] }[] = [
  { key: "name", patterns: ["nombre", "producto", "descripcion", "item", "name", "articulo"] },
  { key: "sale_price", patterns: ["preciov enta", "precioventa", "saleprice", "pvp", "price", "precio", "ventausd", "preciousd"] },
  { key: "cost", patterns: ["costo", "cost", "costousd", "costocompra", "purchase"] },
  { key: "stock", patterns: ["stock", "cantidad", "existencia", "qty", "existencias"] },
  { key: "min_stock", patterns: ["stockminimo", "minstock", "minimo", "minimum", "stockmin"] },
  { key: "sku", patterns: ["sku", "codigo", "code", "ref", "referencia", "barcode"] },
  { key: "category", patterns: ["categoria", "category", "tipo", "type", "grupo", "group"] },
  { key: "tax_type", patterns: ["impuesto", "tax", "iva", "taxtype", "tipoimpuesto"] },
  { key: "supplier", patterns: ["proveedor", "supplier", "vendor", "fabricante"] },
  { key: "variant", patterns: ["variante", "variant", "talla", "color", "size"] },
  { key: "region", patterns: ["region", "zona", "area", "ciudad", "city"] },
  { key: "seller", patterns: ["vendedor", "seller", "agente", "rep", "responsable"] },
];

export function autoDetectMapping(headers: string[]): Record<number, string> {
  const map: Record<number, string> = {};
  headers.forEach((h, i) => {
    const hn = h.toLowerCase().replace(/[\s_-]/g, "");
    const match = RULES.find((r) => r.patterns.some((p) => hn.includes(p.replace(/[\s_-]/g, ""))));
    if (match && !Object.values(map).includes(match.key)) {
      map[i] = match.key;
    } else {
      map[i] = "IGNORE";
    }
  });
  return map;
}

export interface ValidatedRow {
  rowNum: number;
  errors: string[];
  warnings: string[];
  name?: string;
  sale_price?: number;
  cost?: number;
  stock?: number;
  min_stock?: number;
  sku?: string;
  category?: string;
  tax_type?: string;
  supplier?: string;
  variant?: string;
  region?: string;
  seller?: string;
}

export function validateRows(rawRows: string[][], mapping: Record<number, string>): ValidatedRow[] {
  return rawRows.map((row, ri) => {
    const obj: ValidatedRow = { rowNum: ri + 2, errors: [], warnings: [] };

    Object.entries(mapping).forEach(([ciStr, key]) => {
      if (key === "IGNORE") return;
      const ci = Number(ciStr);
      let val: string | number = String(row[ci] ?? "").trim();

      if (key === "sale_price" || key === "cost") {
        const num = parseFloat(String(val).replace(/[^0-9.-]/g, ""));
        if (isNaN(num) || num < 0) {
          const isRequired = ERP_FIELDS.find((f) => f.key === key)?.required;
          if (isRequired) obj.errors.push(key);
          else obj.warnings.push(key);
          val = 0;
        } else {
          val = num;
        }
      } else if (key === "stock" || key === "min_stock") {
        const num = parseInt(String(val)) || 0;
        val = num < 0 ? 0 : num;
        if (num < 0) obj.warnings.push(key);
      } else if (key === "tax_type") {
        const upper = String(val).toUpperCase();
        val = ["IVA16", "EXENTO"].includes(upper) ? upper : "EXENTO";
        if (!["IVA16", "EXENTO"].includes(upper)) obj.warnings.push(key);
      } else if (key === "name" && val === "") {
        obj.errors.push(key);
      }

      (obj as unknown as Record<string, string | number>)[key] = val;
    });

    if (!obj.tax_type) obj.tax_type = "EXENTO";
    if (!obj.stock) obj.stock = 0;
    if (!obj.min_stock) obj.min_stock = 5;

    return obj;
  });
}
