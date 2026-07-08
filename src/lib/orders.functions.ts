import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const itemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1).max(999),
});

const placeOrderSchema = z.object({
  customer_name: z.string().trim().min(2).max(100),
  customer_whatsapp: z.string().trim().min(5).max(30),
  roblox_username: z.string().trim().min(2).max(50),
  customer_email: z.string().trim().email().max(120).optional().or(z.literal("")),
  payment_method: z.string().trim().min(1).max(60),
  payment_proof_url: z.string().trim().max(500).optional().or(z.literal("")),
  customer_note: z.string().trim().max(1000).optional().or(z.literal("")),
  items: z.array(itemSchema).min(1).max(50),
});

function genOrderNumber() {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  const stamp = Date.now().toString(36).slice(-4).toUpperCase();
  return `AZ-${stamp}${rand}`;
}

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => placeOrderSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const ids = data.items.map((i) => i.product_id);
    const { data: products, error: prodErr } = await supabaseAdmin
      .from("products")
      .select("id, name, price, is_active, stock")
      .in("id", ids);

    if (prodErr) throw new Error("Could not verify products");
    const active = (products ?? []).filter((p) => p.is_active);
    if (active.length === 0) throw new Error("No valid products in cart");

    // Validasi stok di server — sumber kebenaran terakhir, tidak bisa dilewati dari client.
    for (const item of data.items) {
      const p = active.find((x) => x.id === item.product_id);
      if (p && item.quantity > p.stock) {
        throw new Error(`Stok "${p.name}" tidak mencukupi. Tersisa ${p.stock}.`);
      }
    }

    let subtotal = 0;
    const lineItems = data.items
      .map((item) => {
        const p = active.find((x) => x.id === item.product_id);
        if (!p) return null;
        const unit = Number(p.price);
        const line = unit * item.quantity;
        subtotal += line;
        return {
          product_id: p.id,
          product_name: p.name,
          unit_price: unit,
          quantity: item.quantity,
          line_total: line,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    if (lineItems.length === 0) throw new Error("No valid products in cart");

    const orderNumber = genOrderNumber();
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_name: data.customer_name,
        customer_whatsapp: data.customer_whatsapp,
        roblox_username: data.roblox_username,
        customer_email: data.customer_email || null,
        payment_method: data.payment_method,
        payment_proof_url: data.payment_proof_url || null,
        proof_submitted_on_web: !!data.payment_proof_url,
        customer_note: data.customer_note || null,
        status: data.payment_proof_url ? "awaiting_verification" : "pending",
        subtotal,
        total: subtotal,
      })
      .select("id, order_number")
      .single();

    if (orderErr || !order) throw new Error("Could not create order");

    const { error: itemsErr } = await supabaseAdmin
      .from("order_items")
      .insert(lineItems.map((li) => ({ ...li, order_id: order.id })));

    if (itemsErr) throw new Error("Could not save order items");

    // Kurangi stok sesuai jumlah yang dipesan.
    for (const item of lineItems) {
      const p = active.find((x) => x.id === item.product_id);
      if (!p) continue;
      const newStock = Math.max(0, p.stock - item.quantity);
      await supabaseAdmin.from("products").update({ stock: newStock }).eq("id", item.product_id);
    }

    return { order_number: order.order_number, total: subtotal };
  });

const trackSchema = z.object({ order_number: z.string().trim().min(3).max(40) });

export const trackOrder = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => trackSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(
        "id, order_number, customer_name, roblox_username, status, total, payment_method, created_at, updated_at",
      )
      .ilike("order_number", data.order_number)
      .maybeSingle();

    if (error) throw new Error("Could not look up order");
    if (!order) return { found: false as const };

    const { data: items } = await supabaseAdmin
      .from("order_items")
      .select("product_name, quantity, unit_price, line_total")
      .eq("order_id", order.id);

    const { id: _id, ...publicOrder } = order;
    return { found: true as const, order: publicOrder, items: items ?? [] };
  });