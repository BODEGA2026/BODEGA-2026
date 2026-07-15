// ============================================================
// Tipos compartidos — reflejan supabase/schema.sql
// ============================================================

export type TaxType = "IVA16" | "EXENTO";
export type Currency = "USD" | "EUR" | "BCVUSD" | "BINANCE" | "VES";
export type AccountType = "CXC" | "CXP";
export type AccountStatus = "pending" | "paid";
export type SaleStatus = "completed" | "pending";
export type AlertSeverity = "critical" | "warning" | "info";
export type AlertType = "stock_low" | "kpi_below" | "trend_drop" | "goal_risk";
export type GoalKpi = "sales" | "profit" | "clients" | "avgTicket" | "units";

export interface BusinessSettings {
  id: string;
  name: string;
  rif: string;
  address: string;
  phone: string;
  email: string;
  maps_link: string;
  footer_note: string;
  invoice_counter: number;
  updated_at: string;
}

export interface ExchangeRates {
  id: string;
  binance: number;
  euro_bcv: number;
  dolar_bcv: number;
  global_currency: Currency;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  supplier: string | null;
  variant: string | null;
  cost: number;
  previous_cost: number | null;
  sale_price: number;
  stock: number;
  min_stock: number;
  tax_type: TaxType;
  region: string | null;
  seller: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  total_bought: number;
  purchases_count: number;
  last_purchase: string | null;
  created_at: string;
}

export interface CartItem {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  unitCost: number;
  taxType: TaxType;
}

export interface Sale {
  id: string;
  invoice_num: number | null;
  client_name: string | null;
  client_id: string | null;
  phone: string | null;
  address: string | null;
  gps_link: string | null;
  payment_method: string | null;
  channel: string | null;
  items: CartItem[];
  subtotal_usd: number;
  base_imponible: number;
  exento: number;
  iva_usd: number;
  total_usd: number;
  cost_usd: number;
  profit_usd: number;
  delivery: number;
  commission: number;
  tip: number;
  apply_iva: boolean;
  rates_snapshot: ExchangeRates | null;
  status: SaleStatus;
  created_at: string;
}

export interface Purchase {
  id: string;
  purchase_date: string;
  supplier: string;
  product_id: string | null;
  product_name: string | null;
  qty: number;
  unit_cost: number;
  total: number;
  notes: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  expense_date: string;
  concept: string;
  category: string;
  amount: number;
  notes: string | null;
  created_at: string;
}

export interface Account {
  id: string;
  type: AccountType;
  entity: string;
  amount: number;
  due_date: string | null;
  status: AccountStatus;
  notes: string | null;
  sale_id: string | null;
  created_at: string;
}

export interface Goal {
  id: string;
  kpi: GoalKpi;
  period: string; // YYYY-MM
  target: number;
  created_at: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  meta: string | null;
  filters: Record<string, unknown> | null;
  auto_generated: boolean;
  read: boolean;
  triggered_at: string;
}

export interface TaxBreakdown {
  baseImponible: number;
  exento: number;
  iva: number;
  total: number;
}

/** Forma mínima necesaria para renderizar una factura — cubre tanto un Sale real como el preview del carrito (POS). */
export interface InvoiceLike {
  invoice_num: number | string | null;
  client_name: string | null;
  phone: string | null;
  address: string | null;
  gps_link: string | null;
  payment_method: string | null;
  channel: string | null;
  items: CartItem[];
  base_imponible: number;
  exento: number;
  iva_usd: number;
  total_usd: number;
  delivery: number;
  commission: number;
  tip: number;
  rates_snapshot: ExchangeRates | null;
  created_at: string;
}
