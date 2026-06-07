// Shared price-tier helpers used by the catalog and cart.
//
// price_tiers — JSONB on products, populated from the Excel price list
// (РРЦ со скидкой 5/10/15/18/20/21%) or computed for «под заказ» rows.

export const DISCOUNT_TIERS = [5, 10, 15, 18, 20, 21] as const;
export type DiscountTier = (typeof DISCOUNT_TIERS)[number];
export type PriceTiers = Partial<Record<`${DiscountTier}`, number>>;

/** Pick the price a user with `discount` should see. */
export function pickPriceForDiscount(
  retail: number,
  tiers: PriceTiers | null | undefined,
  discount: number,
): number {
  const safeRetail = Number(retail) || 0;
  if (!discount || discount <= 0) return safeRetail;
  const t = tiers ?? {};
  const exact = t[String(discount) as `${DiscountTier}`];
  if (exact != null && Number.isFinite(Number(exact))) return Number(exact);
  // Otherwise — best available tier ≤ user's discount.
  const lower = [...DISCOUNT_TIERS].reverse().find((tier) => tier <= discount);
  if (lower != null) {
    const v = t[String(lower) as `${DiscountTier}`];
    if (v != null && Number.isFinite(Number(v))) return Number(v);
  }
  return safeRetail;
}

/** Build the full 6-tier price map from a retail price (for «под заказ»). */
export function buildTiersFromRetail(retail: number): PriceTiers {
  if (!retail || retail <= 0) return {};
  const out: PriceTiers = {};
  for (const t of DISCOUNT_TIERS) {
    out[String(t) as `${DiscountTier}`] = Math.round(retail * (1 - t / 100) * 100) / 100;
  }
  return out;
}
