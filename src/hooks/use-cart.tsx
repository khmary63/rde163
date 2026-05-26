import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  productId: string;
  sku: string;
  name: string;
  brand: string;
  price: number;
  qty: number;
  warehouseId: string;
  warehouseName: string;
  maxQty: number;
  backorder?: boolean;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  total: number;
  add: (item: Omit<CartItem, "qty"> & { qty?: number }) => void;
  setQty: (productId: string, warehouseId: string, qty: number) => void;
  remove: (productId: string, warehouseId: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const STORAGE_KEY = "rde_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const add = useCallback<CartCtx["add"]>((item) => {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.productId === item.productId && x.warehouseId === item.warehouseId);
      const addQty = item.qty ?? 1;
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: Math.min(next[idx].maxQty, next[idx].qty + addQty) };
        return next;
      }
      return [...prev, { ...item, qty: Math.min(item.maxQty, addQty) }];
    });
  }, []);

  const setQty = useCallback<CartCtx["setQty"]>((productId, warehouseId, qty) => {
    setItems((prev) =>
      prev
        .map((x) =>
          x.productId === productId && x.warehouseId === warehouseId
            ? { ...x, qty: Math.max(1, Math.min(x.maxQty, qty)) }
            : x,
        )
        .filter((x) => x.qty > 0),
    );
  }, []);

  const remove = useCallback<CartCtx["remove"]>((productId, warehouseId) => {
    setItems((prev) => prev.filter((x) => !(x.productId === productId && x.warehouseId === warehouseId)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartCtx>(() => {
    const count = items.reduce((s, x) => s + x.qty, 0);
    const total = items.reduce((s, x) => s + x.qty * x.price, 0);
    return { items, count, total, add, setQty, remove, clear };
  }, [items, add, setQty, remove, clear]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
