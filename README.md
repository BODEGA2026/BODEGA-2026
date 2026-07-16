# Rivera ERP — Next.js + Supabase

Reestructuración sobre la unificación original de los dos sistemas HTML
(Sistema Facturación + Módulo BI), ahora reorganizada según el flujo de
trabajo real del negocio.

## Estructura de módulos (8 en el sidebar)

| Módulo | Ruta | Contenido |
|---|---|---|
| **Dashboard** | `/admin/dashboard` | KPIs en tiempo real con filtro de periodo y variación % (mismo motor que Inteligencia de Negocios), resumen de alertas activas, gráficos de ventas semanales, distribución por canal, top productos. |
| **Ventas / POS** | `/admin/ventas` | Sin cambios — carrito, IVA, multi-moneda, ventas pendientes. |
| **Inventario y Compras** | `/admin/inventario` | 3 pestañas: **Productos** (antes Inventario), **Compras y Gastos** (antes su propio módulo), **Carga Masiva** (movida aquí desde Inteligencia de Negocios — ahora sí aparece el botón de plantilla descargable donde corresponde). |
| **Cuentas y Financiero** | `/admin/cuentas` | 2 pestañas: **Cuentas** (CXC/CXP) y **Financiero** (antes su propio módulo). |
| **Calculadora / Tasas** | `/admin/tasas` | Antes "Calculadora". Ahora incluye arriba un formulario para **editar las tasas centrales del sistema** (Binance, Euro BCV, Dólar BCV, moneda de cobro global) — se guardan en `exchange_rates` y se reflejan en todo el sistema (POS, Inventario, Financiero, Facturación). La calculadora de diferencial sigue debajo. |
| **Facturación** | `/admin/facturacion` | Sin cambios. |
| **Inteligencia de Negocios** | `/admin/inteligencia` | 6 pestañas: **KPIs**, **Estadísticas** (movida aquí), **Marketing** (movida aquí), **Metas**, **Tendencias**, **Alertas**. La Carga Masiva salió de aquí — ahora vive en Inventario. |
| **Configuración** | `/admin/config` | Sin cambios en funcionalidad — el campo "Nombre del negocio" ahora se refleja dinámicamente en el Sidebar y en el título de la pestaña del navegador (antes estaba fijo como texto). |

## Sobre el nombre del sistema

El campo `business.name` (editable en Configuración) es ahora la única
fuente del nombre mostrado en:
- El Sidebar (antes decía "Anthony Rivera Godoy" fijo en el código)
- El título de la pestaña del navegador (`app/layout.tsx`, vía
  `generateMetadata`, leyendo el nombre con el cliente de Supabase del
  servidor)

La pantalla de `/login` mantiene un título genérico ("Panel
Administrativo") a propósito: por RLS, un usuario sin sesión no puede leer
`business_settings`, así que no se le expone el nombre real del negocio
antes de autenticarse — es una decisión de seguridad, no un descuido.

## Sobre el Dashboard "estilo BI"

No tenía a la mano el código exacto del dashboard de Délice Gourmet que
mencionaste, así que interpreté el pedido reutilizando el mismo motor de
KPIs con variación % que ya construimos en Inteligencia de Negocios
(`lib/bi/kpi.ts`), más un resumen de las 3 alertas más recientes con link
directo al módulo completo. Si tenías algo más específico en mente para
ese dashboard, dime qué faltó y lo ajusto.

## Cómo arrancar

```bash
npm install
cp .env.example .env.local   # completa con las credenciales de tu proyecto Supabase
# En el SQL Editor de Supabase, ejecuta supabase/schema.sql
npm run dev
```

## Seguridad — Next.js parcheado

`package.json` ya usa `next@14.2.35`, la versión con el fix para las
vulnerabilidades RCE/DoS de diciembre 2025 (CVE-2025-66478,
CVE-2025-55184, CVE-2025-55183). No bajes de esa versión en la rama 14.x.

## Auth

`middleware.ts` protege todo `/admin/*`. Si en algún momento lo
desactivaste temporalmente para depurar, recuerda restaurar el matcher
completo antes de dejarlo en producción:

```ts
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```
