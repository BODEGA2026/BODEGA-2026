# Rivera ERP — Unificación a Next.js + Supabase

Este proyecto unifica los dos archivos HTML originales:

- **Sistema Facturación** (Dashboard, POS, Inventario, Compras/Gastos, Cuentas,
  Financiero, Marketing, Estadísticas, Calculadora, Facturación, Configuración)
- **Módulo BI** (Carga Masiva, KPIs en tiempo real, Metas, Tendencias, Alertas)

...en una sola app Next.js 14 + TypeScript + Tailwind + Supabase, siguiendo el
mismo patrón que usamos en Délice Gourmet (Vercel + Supabase, sin localStorage).

## Qué ya está construido (Fase 1 — fundación)

| Pieza | Archivo | Reemplaza |
|---|---|---|
| Schema completo (12 tablas + RLS) | `supabase/schema.sql` | Todo `localStorage.setItem('flowERP_*' / 'flowBI_*')` |
| Tipos compartidos | `lib/types.ts` | Los objetos sueltos de `STATE` |
| Cliente Supabase (browser/server) | `lib/supabase/client.ts`, `server.ts` | — |
| Utilidades de moneda/IVA | `lib/finance.ts` | `usdToDisplay()`, `calcTaxBreakdown()`, `fmt()` |
| Store global | `lib/store/useAppStore.ts` | El objeto `STATE` + funciones `LS.save/load` |
| Tema glass/neumorphic/fluent | `app/globals.css` | El `<style>` inline del HTML original |
| Sidebar + header de tasas | `components/layout/Sidebar.tsx`, `RatesHeader.tsx` | `buildNav()`, `#rates-header` |
| Shell del panel admin | `components/layout/AppShell.tsx` + `app/admin/layout.tsx` | `toggleSidebar()`, carga inicial |
| **Dashboard completo** | `app/admin/dashboard/page.tsx` | `refreshDashboard()` + sus 3 gráficos |
| Sistema de toasts | `lib/store/useToastStore.ts`, `components/ui/ToastContainer.tsx` | `toast()` / `#toast-container` |
| Modal reutilizable | `components/ui/Modal.tsx` | `showModal()` / `closeModal()` |
| Export a Excel | `lib/excel.ts` | `exportToExcel()` |
| **Inventario completo** | `app/admin/inventario/page.tsx` + `ProductModal.tsx` | `renderizarInventario()`, `openProductForm()`, `guardarProducto()`, `deleteProduct()`, `exportInventoryExcel()` |
| **Compras y Gastos completo** | `app/admin/compras/page.tsx` + `PurchaseModal.tsx` + `ExpenseModal.tsx` | `openAddPurchase()`, `openAddExpense()`, `renderCierreCaja()`, `exportPurchasesExcel()` |
| **Cuentas completo** | `app/admin/cuentas/page.tsx` + `AccountModal.tsx` | `renderAccounts()`, `openAddAccount()`, `markAccountPaid()`, `exportAccountsExcel()` |
| **Financiero completo** | `app/admin/financiero/page.tsx` | `renderFinancial()`, `drawIncomeExpenseChart()`, `drawProfitabilityChart()`, `exportFinancialExcel()` |
| **Marketing completo** | `app/admin/marketing/page.tsx` + `ClientModal.tsx` + `MassMessageModal.tsx` | `renderClients()`, `filterClients()`, `openClientForm()`, `openMassMessage()`, `exportClientsExcel()` |
| **Ventas/POS completo** | `app/admin/ventas/page.tsx`, `ProductGrid.tsx`, `CartPanel.tsx`, `PendingSalesList.tsx`, `lib/store/useCartStore.ts` | `renderProductGrid()`, `addToCart()`, `renderCart()`, `updateCartTotal()`, `confirmSale()`, `saveAsPending()`, `generateWhatsAppTicket()`, `openInvoiceFromCart()` |
| **Estadísticas completo** | `app/admin/estadisticas/page.tsx` | `renderStats()`, `drawTopProductsChart()`, `drawChannelChart()`, `renderLowRotation()`, `exportStatsExcel()` |
| **Calculadora completo** | `app/admin/calculadora/page.tsx` | `runCalculator()`, `renderRatesSummary()` |
| **Facturación completo** | `app/admin/facturacion/page.tsx`, `InvoiceViewer.tsx`, `SaleList.tsx` | `renderInvoiceSaleList()`, `renderInvoice()`, `copyInvoiceText()`, `#invoice-print-area` |
| **Inteligencia de Negocios completo** | `app/admin/inteligencia/*`, `lib/bi/*`, `lib/store/useBIStore.ts` | Los 5 tabs del módulo BI original completo (carga masiva, KPIs, metas, tendencias, alertas) |
| **Configuración completo** | `app/admin/config/page.tsx` | `saveBusinessConfig()`, `exportBackup()`, `importBackup()`, `clearSalesData()`, `clearAllData()` |

> Nota: dejé fuera a propósito la **carga masiva por texto** del POS
> (`openBulkSale()` / "📥 Masiva") para no inflar más este módulo — es un
> textarea pequeño, la agrego en 2 minutos cuando quieras.

## Cómo arrancar

```bash
npm install
cp .env.example .env.local   # completa con las credenciales de tu proyecto Supabase
# En el SQL Editor de Supabase, ejecuta supabase/schema.sql
npm run dev
```

Auth: igual que Délice Gourmet — crea un único usuario admin manualmente desde
el panel de Supabase (Authentication → Users), deja los sign-ups públicos
deshabilitados, y protege `/admin` con middleware (puedo generarlo en la
siguiente fase, reutilizando el de Délice Gourmet).

## Roadmap — módulos pendientes (mismo patrón que Dashboard)

Cada módulo sigue la misma receta: página en `app/admin/<modulo>/page.tsx`,
lee del `useAppStore`, escribe con `supabase.from(...)`, estilos con las
clases de `globals.css` (`.card`, `.btn-primary`, `.stat-card`, etc.).

1. ~~**Ventas / POS**~~ ✅ — hecho: grid de productos con búsqueda, carrito
   (store de sesión aparte, `useCartStore`), toggle de IVA por venta,
   desglose fiscal en vivo, cargos adicionales (delivery/comisión/propina),
   caja multi-moneda, ventas pendientes (usa `sales.status='pending'`,
   sin tabla aparte), confirmar venta (descuenta stock + genera CXC si es
   crédito), ticket por WhatsApp, y botón de factura que deja el preview en
   `sessionStorage` para que lo lea el módulo de Facturación.
2. ~~**Inventario**~~ ✅ — hecho: tabla + filtros (búsqueda/categoría/stock),
   modal con selector de IVA/Exento, alerta de "actualizar precio" cuando
   sube el costo, export a Excel.
3. ~~**Compras y Gastos**~~ ✅ — hecho: modal de compra (con vínculo opcional
   a producto del inventario, sumando stock y actualizando costo), modal de
   gasto, cierre de caja del día, ambas tablas, export a Excel.
4. ~~**Cuentas**~~ ✅ — hecho: CXC/CXP con stats (por cobrar, por pagar,
   vencidas, balance neto), badges de vencido/pagado, marcar como pagada,
   export a Excel.
5. ~~**Financiero**~~ ✅ — hecho: filtro de rango de fechas, KPIs (ingresos,
   costos, utilidad, margen), 2 gráficos con recharts, historial de ventas
   con enlace directo a Facturación (`/admin/facturacion?saleId=...`,
   quedará activo cuando construya ese módulo), export a Excel.
6. ~~**Marketing**~~ ✅ — hecho: clientes, tabs activo/inactivo/todos,
   mensajería masiva por WhatsApp con plantilla `{nombre}`, export a Excel.
7. ~~**Estadísticas**~~ ✅ — hecho: KPIs, top productos (barras horizontales
   con recharts), baja rotación, ventas por canal, export a Excel.
8. ~~**Calculadora Cambiaria**~~ ✅ — hecho: 100% cliente, sin escritura a
   Supabase (solo lee `rates` del store), misma fórmula de diferencial
   cambiario que el original.
9. ~~**Facturación**~~ ✅ — hecho: visor con tabla optimizada para copiar,
   dos columnas de totales (USD/Bs.), impresión vía `window.print()` con
   reglas `@media print` que aíslan solo el visor (`data-print-area`),
   copiar texto con `navigator.clipboard`, buscador/lista de ventas, y los
   dos puntos de entrada ya preparados: `?saleId=` (desde Financiero) y
   `?preview=1` leyendo `sessionStorage` (desde el botón Factura del POS).
10. ~~**Inteligencia de Negocios**~~ ✅ — hecho, las 5 pestañas:
    - **Carga Masiva**: drag & drop, plantilla `.xlsx`, auto-detección de
      columnas, mapeo editable, previsualización con errores/advertencias,
      importación con upsert por SKU o nombre (`bulkImportProducts` en el
      store).
    - **KPIs en Tiempo Real**: filtros de periodo/canal/categoría,
      variación % vs periodo anterior.
    - **Metas**: definir objetivo mensual por KPI, barra de cumplimiento.
    - **Tendencias**: clasificación automática por producto (crecimiento/
      descenso/estancado/inestable) con mini-gráfico de 3 meses.
    - **Alertas**: motor que genera alertas de stock bajo, metas en riesgo,
      tendencia negativa y productos sin movimiento — con store propio
      (`useBIStore`) respaldado por las tablas `goals` y `alerts`.
11. ~~**Configuración**~~ ✅ — hecho: formulario de datos del negocio,
    "Botón de Pánico" (exportar/importar backup completo como JSON contra
    Supabase en vez de localStorage), y zona de peligro (borrar historial
    de ventas / borrar todo, con doble confirmación como el original).

## ✅ Estado: los 12 módulos están completos

Dashboard, Ventas/POS, Inventario, Compras/Gastos, Cuentas, Financiero,
Marketing, Estadísticas, Calculadora, Facturación, Inteligencia de
Negocios y Configuración — toda la lógica del sistema original (más el
módulo BI) está portada a Next.js + TypeScript + Supabase.

## Pendiente antes de producción

- ~~**Middleware de auth**~~ ✅ — hecho: `middleware.ts` + `lib/supabase/middleware.ts`
  protegen todo `/admin/*`, redirigen a `/login` sin sesión y de vuelta a
  `/admin/dashboard` si ya hay sesión. Mismo patrón que Délice Gourmet.
- ~~**Página de login**~~ ✅ — hecho: `app/login/page.tsx`, contra
  `supabase.auth.signInWithPassword()`. Botón "Cerrar sesión" agregado al
  Sidebar.
- **Archivos de proyecto que faltaban** — los agregué en esta pasada:
  `app/layout.tsx` (root layout + fuentes DM Sans/DM Mono), `app/page.tsx`
  (redirect a `/admin/dashboard`), `tsconfig.json` (alias `@/`),
  `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`,
  `next-env.d.ts`, `.gitignore`. Sin estos, el proyecto no compilaba —
  hasta ahora solo tenías las páginas y componentes, no el andamiaje.
- Crear el usuario admin único manualmente desde el dashboard de Supabase
  (Authentication → Users → Add user), con **sign-ups públicos
  deshabilitados** (Authentication → Providers → Email → desactivar
  "Allow new users to sign up").
- Ejecutar `supabase/schema.sql` en el SQL Editor de Supabase.
- `npm install`, copiar `.env.example` a `.env.local` con tus credenciales.
- `vercel deploy` (o conectar el repo de GitHub a Vercel), agregando las
  mismas variables de entorno en el dashboard de Vercel.
- Carga masiva por texto del POS (`openBulkSale()`), si la quieres — quedó
  fuera a propósito para no inflar ese módulo.
