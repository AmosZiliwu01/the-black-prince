import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface CartItem {
  product_id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (product_id: string) => void;
  setQuantity: (product_id: string, qty: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "az_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    return {
      items,
      count,
      subtotal,
      addItem: (item, qty = 1) =>
        setItems((prev) => {
          const existing = prev.find((p) => p.product_id === item.product_id);
          if (existing) {
            return prev.map((p) =>
              p.product_id === item.product_id ? { ...p, quantity: p.quantity + qty } : p,
            );
          }
          return [...prev, { ...item, quantity: qty }];
        }),
      removeItem: (id) => setItems((prev) => prev.filter((p) => p.product_id !== id)),
      setQuantity: (id, qty) =>
        setItems((prev) =>
          qty <= 0
            ? prev.filter((p) => p.product_id !== id)
            : prev.map((p) => (p.product_id === id ? { ...p, quantity: qty } : p)),
        ),
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
