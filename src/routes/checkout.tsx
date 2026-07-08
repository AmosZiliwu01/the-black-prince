import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, MessageCircle, Upload, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";
import { StoreLayout } from "@/components/store/StoreLayout";
import { useCart } from "@/context/cart";
import { settingsQuery } from "@/lib/store";
import { formatCurrency } from "@/lib/format";
import { placeOrder } from "@/lib/orders.functions";
import { uploadPaymentProof } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — AZ Group" }] }),
  component: Checkout,
});

function Checkout() {
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const { data: settings } = useQuery(settingsQuery());
  const symbol = settings?.general.currency_symbol ?? "Rp";

  // Hanya metode yang aktif (toggle) DAN datanya lengkap (nama + detail terisi) yang muncul.
  const toggleMap: Record<string, boolean | undefined> = {
    QRIS: settings?.payment.qris_enabled,
    DANA: settings?.payment.dana_enabled,
    GoPay: settings?.payment.gopay_enabled,
    "Transfer Bank": settings?.payment.bank_enabled,
  };
  const methods = (settings?.payment.methods ?? []).filter((m) => {
    const isKnownToggle = m.name in toggleMap;
    const toggledOn = isKnownToggle ? toggleMap[m.name] : true;
    return toggledOn && m.name.trim() && m.details.trim();
  });

  const [form, setForm] = useState({
    customer_name: "",
    customer_whatsapp: "",
    roblox_username: "",
    customer_email: "",
    customer_note: "",
  });
  const [method, setMethod] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ order_number: string; total: number } | null>(null);

  // Set default method begitu daftar methods tersedia
  if (!method && methods.length > 0) {
    setMethod(methods[0].name);
  }

  const selectedMethod = methods.find((m) => m.name === method);
  const whatsapp = settings?.contact.whatsapp_number?.replace(/\D/g, "") ?? "";

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const buildWhatsAppLink = (orderNumber: string) => {
    const lines = [
      `Halo ${settings?.general.site_name ?? "AZ Group"}! Saya baru saja melakukan pemesanan.`,
      `Pesanan: ${orderNumber}`,
      `Nama: ${form.customer_name}`,
      `Roblox: ${form.roblox_username}`,
      `Pembayaran: ${method}`,
      `Total: ${formatCurrency(subtotal, symbol)}`,
      "",
      "Item:",
      ...items.map((i) => `- ${i.name} x${i.quantity}`),
    ];
    const text = encodeURIComponent(lines.join("\n"));
    return whatsapp ? `https://wa.me/${whatsapp}?text=${text}` : `https://wa.me/?text=${text}`;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (!form.customer_name || !form.customer_whatsapp || !form.roblox_username) {
      toast.error("Mohon lengkapi semua kolom wajib");
      return;
    }
    if (!method) {
      toast.error("Pilih metode pembayaran terlebih dahulu");
      return;
    }
    setSubmitting(true);
    try {
      let proofUrl = "";
      if (proofFile) {
        proofUrl = await uploadPaymentProof(proofFile);
      }
      const res = await placeOrder({
        data: {
          customer_name: form.customer_name,
          customer_whatsapp: form.customer_whatsapp,
          roblox_username: form.roblox_username,
          customer_email: form.customer_email || undefined,
          payment_method: method,
          payment_proof_url: proofUrl || undefined,
          customer_note: form.customer_note || undefined,
          items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        },
      });
      setResult(res);
      clear();
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan saat memproses pesanan. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
          <CheckCircle2 className="mx-auto h-16 w-16 text-success" />
          <h1 className="mt-4 font-display text-3xl font-bold">Pesanan Berhasil Dibuat!</h1>
          <p className="mt-2 text-muted-foreground">
            Nomor pesanan kamu adalah
          </p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="rounded-lg border border-border bg-card px-4 py-2 font-display text-xl font-bold text-primary">
              {result.order_number}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                navigator.clipboard.writeText(result.order_number);
                toast.success("Disalin");
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            {settings?.payment.instructions ||
              "Selesaikan pembayaran, lalu konfirmasi lewat WhatsApp dengan nomor pesanan dan bukti pembayaran."}
          </p>
          <Button asChild variant="gradient" size="lg" className="mt-6 w-full">
            <a href={buildWhatsAppLink(result.order_number)} target="_blank" rel="noreferrer">
              <MessageCircle className="h-5 w-5" /> Konfirmasi via WhatsApp
            </a>
          </Button>
          <div className="mt-3 flex gap-3">
            <Button asChild variant="outline" className="flex-1">
              <Link to="/track" search={{ order: result.order_number }}>Lacak Pesanan</Link>
            </Button>
            <Button asChild variant="ghost" className="flex-1">
              <Link to="/shop">Lanjut Belanja</Link>
            </Button>
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (items.length === 0) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="font-display text-2xl font-bold">Keranjang kamu kosong</h1>
          <Button asChild variant="gradient" className="mt-6">
            <Link to="/shop">Jelajahi Toko</Link>
          </Button>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold">Checkout</h1>

        <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            {/* Details */}
            <section className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h2 className="font-display text-lg font-bold">Data Kamu</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">Nama Lengkap *</Label>
                  <Input id="name" value={form.customer_name} onChange={(e) => set("customer_name", e.target.value)} className="mt-1.5" required />
                </div>
                <div>
                  <Label htmlFor="roblox">Username Roblox *</Label>
                  <Input id="roblox" value={form.roblox_username} onChange={(e) => set("roblox_username", e.target.value)} className="mt-1.5" required />
                </div>
                <div>
                  <Label htmlFor="wa">Nomor WhatsApp *</Label>
                  <Input id="wa" value={form.customer_whatsapp} onChange={(e) => set("customer_whatsapp", e.target.value)} placeholder="+62 812 3456 7890" className="mt-1.5" required />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.customer_email} onChange={(e) => set("customer_email", e.target.value)} className="mt-1.5" />
                </div>
              </div>
              <div className="mt-4">
                <Label htmlFor="note">Catatan Pesanan</Label>
                <Textarea id="note" value={form.customer_note} onChange={(e) => set("customer_note", e.target.value)} className="mt-1.5" rows={2} />
              </div>
            </section>

            {/* Payment */}
            <section className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h2 className="font-display text-lg font-bold">Metode Pembayaran</h2>
              {methods.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Belum ada metode pembayaran yang tersedia. Silakan hubungi kami lewat WhatsApp untuk menyelesaikan pesanan.
                </p>
              ) : (
                <div className="mt-4 space-y-2">
                  {methods.map((m) => (
                    <button
                      type="button"
                      key={m.name}
                      onClick={() => setMethod(m.name)}
                      className={cn(
                        "flex w-full flex-col rounded-lg border p-4 text-left transition-colors",
                        method === m.name ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                      )}
                    >
                      <span className="font-semibold">{m.name}</span>
                      {m.details && <span className="mt-1 text-sm text-muted-foreground">{m.details}</span>}
                    </button>
                  ))}
                </div>
              )}

              {selectedMethod && (
                <div className="mt-4 rounded-lg border border-border bg-secondary/40 p-4 text-sm">
                  {selectedMethod.image_url && (
                    <img
                      src={selectedMethod.image_url}
                      alt={`QR ${selectedMethod.name}`}
                      className="mx-auto mb-3 max-h-56 rounded-lg"
                    />
                  )}
                  <p className="font-medium">Instruksi pembayaran</p>
                  <p className="mt-1 text-muted-foreground">
                    {settings?.payment.instructions || "Selesaikan pembayaran, lalu konfirmasi via WhatsApp dengan bukti transfer."}
                  </p>
                </div>
              )}

              <div className="mt-4">
                <Label htmlFor="proof">Unggah Bukti Pembayaran</Label>
                <label
                  htmlFor="proof"
                  className="mt-1.5 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground hover:border-primary/50"
                >
                  <Upload className="h-4 w-4" />
                  {proofFile ? proofFile.name : "Pilih screenshot bukti pembayaran..."}
                </label>
                <input
                  id="proof"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </section>
          </div>

          {/* Summary */}
          <div className="h-fit rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-bold">Ringkasan Pesanan</h2>
            <div className="mt-4 space-y-2">
              {items.map((i) => (
                <div key={i.product_id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{i.name} × {i.quantity}</span>
                  <span>{formatCurrency(i.price * i.quantity, symbol)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between border-t border-border pt-4 text-base font-bold">
              <span>Total</span>
              <span>{formatCurrency(subtotal, symbol)}</span>
            </div>
            <Button type="submit" variant="gradient" size="lg" className="mt-6 w-full" disabled={submitting}>
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Memproses pesanan...</> : "Buat Pesanan"}
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Kamu akan mengonfirmasi pesanan lewat WhatsApp setelah checkout.
            </p>
          </div>
        </form>
      </div>
    </StoreLayout>
  );
}