import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/store/useToastStore";
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

/** Muestra el error real de Supabase en vez de fallar en silencio. */
function reportError(action: string, error: { message: string } | null): void {
  if (!error) return;
  console.error(`[${action}]`, error);
  toast(`Error al guardar (${action}): ${error.message}`, "error");
}

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

  /** Totales reales en la base de datos — pueden ser mayores a los arrays de arriba si se alcanzó el límite de carga. */
  salesTotalCount: number;
  purchasesTotalCount: number;
  expensesTotalCount: number;

  loadAll: () => Promise<void>;

  saveRates: (patch: Partial<ExchangeRates>) => Promise<boolean>;
  saveBusiness: (patch: Partial<BusinessSettings>) => Promise<boolean>;

  upsertProduct: (product: Partial<Product> & { id?: string }) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;

  confirmSale: (sale: Omit<Sale, "id" | "created_at" | "invoice_num" | "status">) => Promise<Sale | null>;

  /** Guarda una venta como pendiente (no descuenta stock, no asigna # de factura). */
  savePendingSale: (sale: Omit<Sale, "id" | "created_at" | "invoice_num" | "status">) => Promise<boolean>;
  deletePendingSale: (id: string) => Promise<boolean>;

  /** Registra una compra. Si va ligada a un producto, suma stock y actualiza costo (igual que openAddPurchase()). */
  addPurchase: (input: {
    purchase_date: string;
    supplier: string;
    product_id: string | null;
    product_name: string;
    qty: number;
    unit_cost: number;
    notes?: string;
  }) => Promise<boolean>;
  deletePurchase: (id: string) => Promise<boolean>;

  addExpense: (input: { expense_date: string; concept: string; category: string; amount: number; notes?: string }) => Promise<boolean>;
  deleteExpense: (id: string) => Promise<boolean>;

  addAccount: (input: {
    type: "CXC" | "CXP";
    entity: string;
    amount: number;
    due_date: string | null;
    notes?: string;
  }) => Promise<boolean>;
  markAccountPaid: (id: string) => Promise<boolean>;
  deleteAccount: (id: string) => Promise<boolean>;

  upsertClient: (client: Partial<Client> & { id?: string }) => Promise<boolean>;
  deleteClient: (id: string) => Promise<boolean>;

  /** Importación masiva: busca por SKU o nombre, actualiza si existe o inserta si no — igual que executeImport(). */
  bulkImportProducts: (
    rows: (Partial<Product> & { name: string })[]
  ) => Promise<{ added: number; updated: number; failed: number }>;
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
  salesTotalCount: 0,
  purchasesTotalCount: 0,
  expensesTotalCount: 0,

  loadAll: async () => {
    const supabase = createClient();
    set({ loading: true });

    // Límites de carga: generosos, pero acotados para no traer un payload
    // gigantesco de una sola vez. Si el negocio los supera, salesTotalCount
    // (etc.) queda por encima del tamaño del array cargado, y la UI puede
    // avisarlo en vez de mostrar reportes incompletos en silencio.
    const SALES_LIMIT = 3000;
    const PURCHASES_LIMIT = 2000;
    const EXPENSES_LIMIT = 2000;

    const [business, rates, products, clients, sales, purchases, expenses, accounts] =
      await Promise.all([
        supabase.from("business_settings").select("*").limit(1).maybeSingle(),
        supabase.from("exchange_rates").select("*").limit(1).maybeSingle(),
        supabase.from("products").select("*").order("name"),
        supabase.from("clients").select("*").order("name"),
        supabase.from("sales").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(SALES_LIMIT),
        supabase.from("purchases").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(PURCHASES_LIMIT),
        supabase.from("expenses").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(EXPENSES_LIMIT),
        supabase.from("accounts").select("*").order("created_at", { ascending: false }),
      ]);

    // Si CUALQUIERA de estas consultas falla (ej. por permisos RLS),
    // avisa explícitamente en vez de mostrar módulos vacíos sin explicación.
    const errors = [
      ["negocio", business.error],
      ["tasas", rates.error],
      ["productos", products.error],
      ["clientes", clients.error],
      ["ventas", sales.error],
      ["compras", purchases.error],
      ["gastos", expenses.error],
      ["cuentas", accounts.error],
    ] as const;
    errors.forEach(([label, error]) => {
      if (error) {
        console.error(`[loadAll:${label}]`, error);
        toast(`No se pudieron cargar ${label}: ${error.message}`, "error");
      }
    });

    set({
      business: business.data as BusinessSettings,
      rates: rates.data as ExchangeRates,
      products: (products.data ?? []) as Product[],
      clients: (clients.data ?? []) as Client[],
      sales: (sales.data ?? []) as Sale[],
      purchases: (purchases.data ?? []) as Purchase[],
      expenses: (expenses.data ?? []) as Expense[],
      accounts: (accounts.data ?? []) as Account[],
      salesTotalCount: sales.count ?? (sales.data ?? []).length,
      purchasesTotalCount: purchases.count ?? (purchases.data ?? []).length,
      expensesTotalCount: expenses.count ?? (expenses.data ?? []).length,
      loading: false,
    });
  },

  saveRates: async (patch) => {
    const supabase = createClient();
    const current = get().rates;
    if (!current) return false;
    const { data, error } = await supabase
      .from("exchange_rates")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", current.id)
      .select()
      .single();
    if (error || !data) {
      reportError("tasas", error);
      return false;
    }
    set({ rates: data as ExchangeRates });
    return true;
  },

  saveBusiness: async (patch) => {
    const supabase = createClient();
    const current = get().business;
    if (!current) return false;
    const { data, error } = await supabase
      .from("business_settings")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", current.id)
      .select()
      .single();
    if (error || !data) {
      reportError("configuración del negocio", error);
      return false;
    }
    set({ business: data as BusinessSettings });
    return true;
  },

  upsertProduct: async (product) => {
    const supabase = createClient();
    if (product.id) {
      const { data, error } = await supabase
        .from("products")
        .update({ ...product, updated_at: new Date().toISOString() })
        .eq("id", product.id)
        .select()
        .single();
      if (error || !data) {
        reportError("producto", error);
        return false;
      }
      set({ products: get().products.map((p) => (p.id === data.id ? (data as Product) : p)) });
      return true;
    } else {
      const { data, error } = await supabase.from("products").insert(product).select().single();
      if (error || !data) {
        reportError("producto", error);
        return false;
      }
      set({ products: [...get().products, data as Product] });
      return true;
    }
  },

  deleteProduct: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      reportError("eliminar producto", error);
      return false;
    }
    set({ products: get().products.filter((p) => p.id !== id) });
    return true;
  },

  /**
   * Confirma una venta: inserta el registro, descuenta stock y,
   * si el pago es a crédito, crea la cuenta por cobrar.
   * Equivalente a confirmSale() en el sistema original.
   */
  confirmSale: async (saleInput) => {
    const supabase = createClient();
    const business = get().business;
    if (!business) {
      toast("No se pudo confirmar: falta cargar la configuración del negocio", "error");
      return null;
    }

    const nextInvoiceNum = (business.invoice_counter || 1) + 1;

    const { data: sale, error } = await supabase
      .from("sales")
      .insert({ ...saleInput, status: "completed", invoice_num: business.invoice_counter })
      .select()
      .single();
    if (error || !sale) {
      reportError("venta", error);
      return null;
    }

    // Actualizar contador de facturas
    await get().saveBusiness({ invoice_counter: nextInvoiceNum });

    // Descontar inventario
    for (const item of saleInput.items) {
      const prod = get().products.find((p) => p.id === item.productId);
      if (prod) {
        const newStock = Math.max(0, prod.stock - item.qty);
        const { error: stockError } = await supabase.from("products").update({ stock: newStock }).eq("id", prod.id);
        if (stockError) reportError(`descontar stock de ${prod.name}`, stockError);
      }
    }

    // CXC si el pago es a crédito
    if (saleInput.payment_method?.toLowerCase().includes("crédito")) {
      const { error: cxcError } = await supabase.from("accounts").insert({
        type: "CXC",
        entity: saleInput.client_name || "Sin nombre",
        amount: saleInput.total_usd,
        status: "pending",
        sale_id: sale.id,
        notes: `Venta ${saleInput.channel ?? ""}`,
      });
      if (cxcError) reportError("cuenta por cobrar", cxcError);
    }

    await get().loadAll();
    return sale as Sale;
  },

  savePendingSale: async (saleInput) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("sales")
      .insert({ ...saleInput, status: "pending" })
      .select()
      .single();
    if (error || !data) {
      reportError("venta pendiente", error);
      return false;
    }
    set({ sales: [data as Sale, ...get().sales], salesTotalCount: get().salesTotalCount + 1 });
    return true;
  },

  deletePendingSale: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.from("sales").delete().eq("id", id);
    if (error) {
      reportError("eliminar venta pendiente", error);
      return false;
    }
    set({ sales: get().sales.filter((s) => s.id !== id), salesTotalCount: Math.max(0, get().salesTotalCount - 1) });
    return true;
  },

  /**
   * Registra una compra. Si está ligada a un producto del inventario,
   * suma el stock y actualiza el costo (guardando previous_cost si cambió),
   * igual que openAddPurchase() en el sistema original.
   */
  addPurchase: async ({ purchase_date, supplier, product_id, product_name, qty, unit_cost, notes }) => {
    const supabase = createClient();
    const total = qty * unit_cost;

    const { data: purchase, error } = await supabase
      .from("purchases")
      .insert({ purchase_date, supplier, product_id, product_name, qty, unit_cost, total, notes })
      .select()
      .single();
    if (error || !purchase) {
      reportError("compra", error);
      return false;
    }

    if (product_id) {
      const prod = get().products.find((p) => p.id === product_id);
      if (prod) {
        const patch: Partial<Product> = { stock: prod.stock + qty };
        if (unit_cost !== prod.cost) {
          patch.previous_cost = prod.cost;
          patch.cost = unit_cost;
        }
        const { error: stockError } = await supabase.from("products").update(patch).eq("id", prod.id);
        if (stockError) reportError(`actualizar stock de ${prod.name}`, stockError);
      }
    }

    await get().loadAll();
    return true;
  },

  deletePurchase: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.from("purchases").delete().eq("id", id);
    if (error) {
      reportError("eliminar compra", error);
      return false;
    }
    set({ purchases: get().purchases.filter((p) => p.id !== id), purchasesTotalCount: Math.max(0, get().purchasesTotalCount - 1) });
    return true;
  },

  addExpense: async (input) => {
    const supabase = createClient();
    const { data, error } = await supabase.from("expenses").insert(input).select().single();
    if (error || !data) {
      reportError("gasto", error);
      return false;
    }
    set({ expenses: [data as Expense, ...get().expenses], expensesTotalCount: get().expensesTotalCount + 1 });
    return true;
  },

  deleteExpense: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      reportError("eliminar gasto", error);
      return false;
    }
    set({ expenses: get().expenses.filter((e) => e.id !== id), expensesTotalCount: Math.max(0, get().expensesTotalCount - 1) });
    return true;
  },

  addAccount: async (input) => {
    const supabase = createClient();
    const { data, error } = await supabase.from("accounts").insert({ ...input, status: "pending" }).select().single();
    if (error || !data) {
      reportError("cuenta", error);
      return false;
    }
    set({ accounts: [data as Account, ...get().accounts] });
    return true;
  },

  markAccountPaid: async (id) => {
    const supabase = createClient();
    const { data, error } = await supabase.from("accounts").update({ status: "paid" }).eq("id", id).select().single();
    if (error || !data) {
      reportError("marcar cuenta como pagada", error);
      return false;
    }
    set({ accounts: get().accounts.map((a) => (a.id === id ? (data as Account) : a)) });
    return true;
  },

  deleteAccount: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (error) {
      reportError("eliminar cuenta", error);
      return false;
    }
    set({ accounts: get().accounts.filter((a) => a.id !== id) });
    return true;
  },

  upsertClient: async (client) => {
    const supabase = createClient();
    if (client.id) {
      const { data, error } = await supabase.from("clients").update(client).eq("id", client.id).select().single();
      if (error || !data) {
        reportError("cliente", error);
        return false;
      }
      set({ clients: get().clients.map((c) => (c.id === data.id ? (data as Client) : c)) });
      return true;
    } else {
      const { data, error } = await supabase.from("clients").insert(client).select().single();
      if (error || !data) {
        reportError("cliente", error);
        return false;
      }
      set({ clients: [...get().clients, data as Client] });
      return true;
    }
  },

  deleteClient: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) {
      reportError("eliminar cliente", error);
      return false;
    }
    set({ clients: get().clients.filter((c) => c.id !== id) });
    return true;
  },

  bulkImportProducts: async (rows) => {
    const supabase = createClient();
    let added = 0;
    let updated = 0;
    let failed = 0;

    for (const row of rows) {
      const existing = get().products.find(
        (p) => (row.sku && p.sku === row.sku) || p.name.toLowerCase() === row.name.toLowerCase()
      );
      if (existing) {
        const patch: Partial<Product> = { ...row };
        if (row.cost != null && row.cost !== existing.cost) patch.previous_cost = existing.cost;
        const { error } = await supabase.from("products").update(patch).eq("id", existing.id);
        if (error) {
          console.error(`[bulkImport:update:${row.name}]`, error);
          failed++;
        } else {
          updated++;
        }
      } else {
        const { error } = await supabase.from("products").insert(row);
        if (error) {
          console.error(`[bulkImport:insert:${row.name}]`, error);
          failed++;
        } else {
          added++;
        }
      }
    }

    if (failed > 0) {
      toast(`${failed} producto(s) no se pudieron importar — revisa la consola (F12) para el detalle`, "error");
    }

    await get().loadAll();
    return { added, updated, failed };
  },
}));
