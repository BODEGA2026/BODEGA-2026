import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type {
  Account,
  BusinessSettings,
  Client,
  Expense,
  ExchangeRates,
  Product,
  Purchase,
  Sale,
} from "@/lib/types";

interface AppState {
  loading: boolean;
  business: BusinessSettings | null;
  rates: ExchangeRates | null;
  products: Product[];
  clients: Client[];
  sales: Sale[];
  purchases: Purchase[];
  expenses: Expense[];
  accounts: Account[];

  loadAll: () => Promise<void>;

  saveRates: (patch: Partial<ExchangeRates>) => Promise<void>;
  saveBusiness: (patch: Partial<BusinessSettings>) => Promise<void>;

  upsertProduct: (product: Partial<Product> & { id?: string }) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  confirmSale: (sale: Omit<Sale, "id" | "created_at" | "invoice_num" | "status">) => Promise<Sale | null>;

  /** Guarda una venta como pendiente (no descuenta stock, no asigna # de factura). */
  savePendingSale: (sale: Omit<Sale, "id" | "created_at" | "invoice_num" | "status">) => Promise<void>;
  deletePendingSale: (id: string) => Promise<void>;

  /** Registra una compra. Si va ligada a un producto, suma stock y actualiza costo (igual que openAddPurchase()). */
  addPurchase: (input: {
    purchase_date: string;
    supplier: string;
    product_id: string | null;
    product_name: string;
    qty: number;
    unit_cost: number;
    notes?: string;
  }) => Promise<void>;
  deletePurchase: (id: string) => Promise<void>;

  addExpense: (input: { expense_date: string; concept: string; category: string; amount: number; notes?: string }) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  addAccount: (input: {
    type: "CXC" | "CXP";
    entity: string;
    amount: number;
    due_date: string | null;
    notes?: string;
  }) => Promise<void>;
  markAccountPaid: (id: string) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;

  upsertClient: (client: Partial<Client> & { id?: string }) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  /** Importación masiva: busca por SKU o nombre, actualiza si existe o inserta si no — igual que executeImport(). */
  bulkImportProducts: (
    rows: (Partial<Product> & { name: string })[]
  ) => Promise<{ added: number; updated: number }>;
}

export const useAppStore = create<AppState>((set, get) => ({
  loading: true,
  business: null,
  rates: null,
  products: [],
  clients: [],
  sales: [],
  purchases: [],
  expenses: [],
  accounts: [],

  loadAll: async () => {
    const supabase = createClient();
    set({ loading: true });

    const [business, rates, products, clients, sales, purchases, expenses, accounts] =
      await Promise.all([
        supabase.from("business_settings").select("*").limit(1).maybeSingle(),
        supabase.from("exchange_rates").select("*").limit(1).maybeSingle(),
        supabase.from("products").select("*").order("name"),
        supabase.from("clients").select("*").order("name"),
        supabase.from("sales").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("purchases").select("*").order("created_at", { ascending: false }).limit(300),
        supabase.from("expenses").select("*").order("created_at", { ascending: false }).limit(300),
        supabase.from("accounts").select("*").order("created_at", { ascending: false }),
      ]);

    set({
      business: business.data as BusinessSettings,
      rates: rates.data as ExchangeRates,
      products: (products.data ?? []) as Product[],
      clients: (clients.data ?? []) as Client[],
      sales: (sales.data ?? []) as Sale[],
      purchases: (purchases.data ?? []) as Purchase[],
      expenses: (expenses.data ?? []) as Expense[],
      accounts: (accounts.data ?? []) as Account[],
      loading: false,
    });
  },

  saveRates: async (patch) => {
    const supabase = createClient();
    const current = get().rates;
    if (!current) return;
    const { data } = await supabase
      .from("exchange_rates")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", current.id)
      .select()
      .single();
    if (data) set({ rates: data as ExchangeRates });
  },

  saveBusiness: async (patch) => {
    const supabase = createClient();
    const current = get().business;
    if (!current) return;
    const { data } = await supabase
      .from("business_settings")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", current.id)
      .select()
      .single();
    if (data) set({ business: data as BusinessSettings });
  },

  upsertProduct: async (product) => {
    const supabase = createClient();
    if (product.id) {
      const { data } = await supabase
        .from("products")
        .update({ ...product, updated_at: new Date().toISOString() })
        .eq("id", product.id)
        .select()
        .single();
      if (data) {
        set({ products: get().products.map((p) => (p.id === data.id ? (data as Product) : p)) });
      }
    } else {
      const { data } = await supabase.from("products").insert(product).select().single();
      if (data) set({ products: [...get().products, data as Product] });
    }
  },

  deleteProduct: async (id) => {
    const supabase = createClient();
    await supabase.from("products").delete().eq("id", id);
    set({ products: get().products.filter((p) => p.id !== id) });
  },

  /**
   * Confirma una venta: inserta el registro, descuenta stock y,
   * si el pago es a crédito, crea la cuenta por cobrar.
   * Equivalente a confirmSale() en el sistema original.
   */
  confirmSale: async (saleInput) => {
    const supabase = createClient();
    const business = get().business;
    if (!business) return null;

    const nextInvoiceNum = (business.invoice_counter || 1) + 1;

    const { data: sale, error } = await supabase
      .from("sales")
      .insert({ ...saleInput, status: "completed", invoice_num: business.invoice_counter })
      .select()
      .single();
    if (error || !sale) return null;

    // Actualizar contador de facturas
    await get().saveBusiness({ invoice_counter: nextInvoiceNum });

    // Descontar inventario
    for (const item of saleInput.items) {
      const prod = get().products.find((p) => p.id === item.productId);
      if (prod) {
        const newStock = Math.max(0, prod.stock - item.qty);
        await supabase.from("products").update({ stock: newStock }).eq("id", prod.id);
      }
    }

    // CXC si el pago es a crédito
    if (saleInput.payment_method?.toLowerCase().includes("crédito")) {
      await supabase.from("accounts").insert({
        type: "CXC",
        entity: saleInput.client_name || "Sin nombre",
        amount: saleInput.total_usd,
        status: "pending",
        sale_id: sale.id,
        notes: `Venta ${saleInput.channel ?? ""}`,
      });
    }

    await get().loadAll();
    return sale as Sale;
  },

  savePendingSale: async (saleInput) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("sales")
      .insert({ ...saleInput, status: "pending" })
      .select()
      .single();
    if (data) set({ sales: [data as Sale, ...get().sales] });
  },

  deletePendingSale: async (id) => {
    const supabase = createClient();
    await supabase.from("sales").delete().eq("id", id);
    set({ sales: get().sales.filter((s) => s.id !== id) });
  },

  /**
   * Registra una compra. Si está ligada a un producto del inventario,
   * suma el stock y actualiza el costo (guardando previous_cost si cambió),
   * igual que openAddPurchase() en el sistema original.
   */
  addPurchase: async ({ purchase_date, supplier, product_id, product_name, qty, unit_cost, notes }) => {
    const supabase = createClient();
    const total = qty * unit_cost;

    const { data: purchase } = await supabase
      .from("purchases")
      .insert({ purchase_date, supplier, product_id, product_name, qty, unit_cost, total, notes })
      .select()
      .single();
    if (!purchase) return;

    if (product_id) {
      const prod = get().products.find((p) => p.id === product_id);
      if (prod) {
        const patch: Partial<Product> = { stock: prod.stock + qty };
        if (unit_cost !== prod.cost) {
          patch.previous_cost = prod.cost;
          patch.cost = unit_cost;
        }
        await supabase.from("products").update(patch).eq("id", prod.id);
      }
    }

    await get().loadAll();
  },

  deletePurchase: async (id) => {
    const supabase = createClient();
    await supabase.from("purchases").delete().eq("id", id);
    set({ purchases: get().purchases.filter((p) => p.id !== id) });
  },

  addExpense: async (input) => {
    const supabase = createClient();
    const { data } = await supabase.from("expenses").insert(input).select().single();
    if (data) set({ expenses: [data as Expense, ...get().expenses] });
  },

  deleteExpense: async (id) => {
    const supabase = createClient();
    await supabase.from("expenses").delete().eq("id", id);
    set({ expenses: get().expenses.filter((e) => e.id !== id) });
  },

  addAccount: async (input) => {
    const supabase = createClient();
    const { data } = await supabase.from("accounts").insert({ ...input, status: "pending" }).select().single();
    if (data) set({ accounts: [data as Account, ...get().accounts] });
  },

  markAccountPaid: async (id) => {
    const supabase = createClient();
    const { data } = await supabase.from("accounts").update({ status: "paid" }).eq("id", id).select().single();
    if (data) set({ accounts: get().accounts.map((a) => (a.id === id ? (data as Account) : a)) });
  },

  deleteAccount: async (id) => {
    const supabase = createClient();
    await supabase.from("accounts").delete().eq("id", id);
    set({ accounts: get().accounts.filter((a) => a.id !== id) });
  },

  upsertClient: async (client) => {
    const supabase = createClient();
    if (client.id) {
      const { data } = await supabase.from("clients").update(client).eq("id", client.id).select().single();
      if (data) set({ clients: get().clients.map((c) => (c.id === data.id ? (data as Client) : c)) });
    } else {
      const { data } = await supabase.from("clients").insert(client).select().single();
      if (data) set({ clients: [...get().clients, data as Client] });
    }
  },

  deleteClient: async (id) => {
    const supabase = createClient();
    await supabase.from("clients").delete().eq("id", id);
    set({ clients: get().clients.filter((c) => c.id !== id) });
  },

  bulkImportProducts: async (rows) => {
    const supabase = createClient();
    let added = 0;
    let updated = 0;

    for (const row of rows) {
      const existing = get().products.find(
        (p) => (row.sku && p.sku === row.sku) || p.name.toLowerCase() === row.name.toLowerCase()
      );
      if (existing) {
        const patch: Partial<Product> = { ...row };
        if (row.cost != null && row.cost !== existing.cost) patch.previous_cost = existing.cost;
        await supabase.from("products").update(patch).eq("id", existing.id);
        updated++;
      } else {
        await supabase.from("products").insert(row);
        added++;
      }
    }

    await get().loadAll();
    return { added, updated };
  },
}));
