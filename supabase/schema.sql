-- ============================================================
-- ANTHONY RIVERA GODOY — SISTEMA DE FACTURACIÓN
-- Schema unificado (ERP + Módulo BI) para Supabase
-- Reemplaza localStorage. Ejecutar en el SQL Editor de Supabase.
-- ============================================================

-- Extensión para UUIDs
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- NEGOCIO / CONFIGURACIÓN (fila única, igual que STATE.business)
-- ------------------------------------------------------------
create table if not exists business_settings (
  id uuid primary key default gen_random_uuid(),
  name text default '',
  rif text default '',
  address text default '',
  phone text default '',
  email text default '',
  maps_link text default '',
  footer_note text default '',
  invoice_counter integer default 1,
  updated_at timestamptz default now()
);

-- Tasas de cambio (fila única, igual que STATE.rates)
create table if not exists exchange_rates (
  id uuid primary key default gen_random_uuid(),
  binance numeric default 0,
  euro_bcv numeric default 0,
  dolar_bcv numeric default 0,
  global_currency text default 'USD', -- USD | EUR | BCVUSD | BINANCE | VES
  updated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- INVENTARIO
-- ------------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text,
  category text,
  supplier text,
  variant text,
  cost numeric not null default 0,
  previous_cost numeric,
  sale_price numeric not null default 0,
  stock integer not null default 0,
  min_stock integer not null default 5,
  tax_type text not null default 'EXENTO', -- 'IVA16' | 'EXENTO'  ("desc" NUNCA usar como nombre de columna)
  region text,
  seller text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_products_sku on products(sku);
create index if not exists idx_products_category on products(category);

-- ------------------------------------------------------------
-- CLIENTES
-- ------------------------------------------------------------
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  address text,
  notes text,
  total_bought numeric default 0,
  purchases_count integer default 0,
  last_purchase timestamptz,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- VENTAS
-- ------------------------------------------------------------
create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  invoice_num integer,
  client_name text,
  client_id uuid references clients(id) on delete set null,
  phone text,
  address text,
  gps_link text,
  payment_method text,
  channel text,
  items jsonb not null default '[]', -- [{productId,name,qty,unitPrice,unitCost,taxType}]
  subtotal_usd numeric default 0,
  base_imponible numeric default 0,
  exento numeric default 0,
  iva_usd numeric default 0,
  total_usd numeric not null default 0,
  cost_usd numeric default 0,
  profit_usd numeric default 0,
  delivery numeric default 0,
  commission numeric default 0,
  tip numeric default 0,
  apply_iva boolean default true,
  rates_snapshot jsonb, -- tasas al momento de la venta
  status text default 'completed', -- 'completed' | 'pending'
  created_at timestamptz default now()
);
create index if not exists idx_sales_created_at on sales(created_at desc);
create index if not exists idx_sales_status on sales(status);

-- ------------------------------------------------------------
-- COMPRAS Y GASTOS
-- ------------------------------------------------------------
create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  purchase_date date default current_date,
  supplier text not null,
  product_id uuid references products(id) on delete set null,
  product_name text,
  qty integer not null default 1,
  unit_cost numeric not null default 0,
  total numeric not null default 0,
  notes text,
  created_at timestamptz default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date default current_date,
  concept text not null,
  category text default 'Otros',
  amount numeric not null default 0,
  notes text,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- CUENTAS POR COBRAR / PAGAR
-- ------------------------------------------------------------
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  type text not null, -- 'CXC' | 'CXP'
  entity text not null,
  amount numeric not null default 0,
  due_date date,
  status text default 'pending', -- 'pending' | 'paid'
  notes text,
  sale_id uuid references sales(id) on delete set null,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- MÓDULO BI: METAS Y ALERTAS
-- ------------------------------------------------------------
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  kpi text not null, -- 'sales' | 'profit' | 'clients' | 'avgTicket' | 'units'
  period text not null, -- 'YYYY-MM'
  target numeric not null,
  created_at timestamptz default now(),
  unique(kpi, period)
);

create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  type text not null, -- 'stock_low' | 'kpi_below' | 'trend_drop' | 'goal_risk'
  severity text not null, -- 'critical' | 'warning' | 'info'
  message text not null,
  meta text,
  filters jsonb,
  auto_generated boolean default true,
  read boolean default false,
  triggered_at timestamptz default now()
);

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY — panel admin de un solo usuario
-- Igual que Délice Gourmet: auth admin-only, sign-up deshabilitado
-- ------------------------------------------------------------
alter table business_settings enable row level security;
alter table exchange_rates enable row level security;
alter table products enable row level security;
alter table clients enable row level security;
alter table sales enable row level security;
alter table purchases enable row level security;
alter table expenses enable row level security;
alter table accounts enable row level security;
alter table goals enable row level security;
alter table alerts enable row level security;

-- Solo usuarios autenticados (el admin único) pueden leer/escribir
create policy "authenticated full access" on business_settings for all using (auth.role() = 'authenticated');
create policy "authenticated full access" on exchange_rates for all using (auth.role() = 'authenticated');
create policy "authenticated full access" on products for all using (auth.role() = 'authenticated');
create policy "authenticated full access" on clients for all using (auth.role() = 'authenticated');
create policy "authenticated full access" on sales for all using (auth.role() = 'authenticated');
create policy "authenticated full access" on purchases for all using (auth.role() = 'authenticated');
create policy "authenticated full access" on expenses for all using (auth.role() = 'authenticated');
create policy "authenticated full access" on accounts for all using (auth.role() = 'authenticated');
create policy "authenticated full access" on goals for all using (auth.role() = 'authenticated');
create policy "authenticated full access" on alerts for all using (auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- FILAS INICIALES OBLIGATORIAS (evita 406 en settings/rates)
-- ------------------------------------------------------------
insert into business_settings (name, rif, footer_note)
  select 'Anthony Rivera Godoy', '', '¡Gracias por su preferencia!'
  where not exists (select 1 from business_settings);

insert into exchange_rates (binance, euro_bcv, dolar_bcv, global_currency)
  select 0, 0, 0, 'USD'
  where not exists (select 1 from exchange_rates);
