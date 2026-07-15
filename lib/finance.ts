import type { CartItem, Currency, ExchangeRates, Product, TaxBreakdown } from "./types";

// Formato es-VE, igual que fmt() en el sistema original
export function fmt(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function getCurrencyRate(rates: ExchangeRates, currency: Currency): number {
  switch (currency) {
    case "EUR":
      return rates.euro_bcv || 1;
    case "BCVUSD":
      return rates.dolar_bcv || 1;
    case "BINANCE":
      return rates.binance || 1;
    case "VES":
      return 1;
    default:
      return 1;
  }
}

export function getCurrencySymbol(currency: Currency): string {
  return { USD: "$", EUR: "€", BCVUSD: "Bs.", BINANCE: "Bs.", VES: "Bs." }[currency] ?? "";
}

/** Convierte un monto en USD a la moneda de cobro global, igual que usdToDisplay() */
export function usdToDisplay(usdAmount: number, rates: ExchangeRates) {
  const cur = rates.global_currency;
  if (cur === "VES" || cur === "BCVUSD" || cur === "BINANCE") {
    return { amount: usdAmount * getCurrencyRate(rates, cur), symbol: "Bs.", label: cur };
  }
  if (cur === "EUR") {
    const ves = usdAmount * (rates.dolar_bcv || 1);
    return { amount: ves / (rates.euro_bcv || 1), symbol: "€", label: "EUR" };
  }
  return { amount: usdAmount, symbol: "$", label: "USD" };
}

/** Descompone el carrito en base imponible / exento / IVA / total — igual que calcTaxBreakdown() */
export function calcTaxBreakdown(
  cartItems: CartItem[],
  products: Product[],
  applyIva: boolean
): TaxBreakdown {
  let baseImponible = 0;
  let exento = 0;

  for (const item of cartItems) {
    const prod = products.find((p) => p.id === item.productId);
    const isGravado = applyIva && prod?.tax_type === "IVA16";
    const lineTotal = item.unitPrice * item.qty;
    if (isGravado) baseImponible += lineTotal;
    else exento += lineTotal;
  }

  const iva = baseImponible * 0.16;
  const total = baseImponible + exento + iva;
  return { baseImponible, exento, iva, total };
}
