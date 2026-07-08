import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Plus, Trash2, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { fetchSettings, type SiteSettings } from "@/lib/store";
import { logActivity } from "@/lib/admin";
import { uploadImage, BUCKETS } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Pengaturan — AZ Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminSettings,
});

function AdminSettings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-settings-full"], queryFn: fetchSettings });
  const [draft, setDraft] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingSupportQr, setUploadingSupportQr] = useState(false);

  const s = draft ?? data ?? null;

  const update = (section: keyof SiteSettings, patch: Record<string, unknown>) => {
    if (!s) return;
    setDraft({ ...s, [section]: { ...s[section], ...patch } });
  };

  const saveSection = async (section: keyof SiteSettings) => {
    if (!s) return;
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: section, value: s[section] as never, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) { toast.error(error.message); setSaving(false); return; }
    await logActivity("update_settings", "settings", { section });
    await qc.invalidateQueries({ queryKey: ["settings"] });
    await qc.invalidateQueries({ queryKey: ["admin-settings-full"] });
    toast.success("Pengaturan tersimpan");
    setSaving(false);
  };

  const uploadSupportQr = async (file: File) => {
    setUploadingSupportQr(true);
    try {
      const url = await uploadImage(BUCKETS.siteAssets, file);
      update("support", { support_qris_image_url: url });
      toast.success("Gambar QRIS berhasil diunggah");
    } catch {
      toast.error("Gagal mengunggah gambar");
    } finally {
      setUploadingSupportQr(false);
    }
  };

  if (isLoading || !s) {
    return <AdminShell title="Pengaturan"><div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></AdminShell>;
  }

  return (
    <AdminShell title="Pengaturan">
      <Tabs defaultValue="general" className="max-w-2xl">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">Umum</TabsTrigger>
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="contact">Kontak</TabsTrigger>
          <TabsTrigger value="payment">Pembayaran</TabsTrigger>
          <TabsTrigger value="announcement">Pengumuman</TabsTrigger>
          <TabsTrigger value="support">Dukung Admin</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Field label="Nama Toko" value={s.general.site_name} onChange={(v) => update("general", { site_name: v })} />
          <Field label="Tagline" value={s.general.tagline} onChange={(v) => update("general", { tagline: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kode Mata Uang" value={s.general.currency} onChange={(v) => update("general", { currency: v })} />
            <Field label="Simbol Mata Uang" value={s.general.currency_symbol} onChange={(v) => update("general", { currency_symbol: v })} />
          </div>
          <Field label="Jam Operasional" value={s.general.support_hours} onChange={(v) => update("general", { support_hours: v })} />
          <SaveBtn onClick={() => saveSection("general")} saving={saving} />
        </TabsContent>

        <TabsContent value="hero" className="space-y-4">
          <Field label="Judul" value={s.hero.title} onChange={(v) => update("hero", { title: v })} />
          <Field label="Subjudul" value={s.hero.subtitle} onChange={(v) => update("hero", { subtitle: v })} textarea />
          <Field label="Teks Tombol" value={s.hero.cta} onChange={(v) => update("hero", { cta: v })} />
          <SaveBtn onClick={() => saveSection("hero")} saving={saving} />
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Kosongkan field yang tidak dipakai — otomatis tidak akan tampil di halaman publik.
          </p>
          <Field label="Nomor WhatsApp" value={s.contact.whatsapp_number} onChange={(v) => update("contact", { whatsapp_number: v })} placeholder="+62 812 3456 7890" />
          <Field label="Discord" value={s.contact.discord} onChange={(v) => update("contact", { discord: v })} placeholder="https://discord.gg/..." />
          <Field label="Instagram" value={s.contact.instagram} onChange={(v) => update("contact", { instagram: v })} placeholder="https://instagram.com/..." />
          <Field label="TikTok" value={s.contact.tiktok} onChange={(v) => update("contact", { tiktok: v })} placeholder="https://tiktok.com/@..." />
          <Field label="Facebook" value={s.contact.facebook} onChange={(v) => update("contact", { facebook: v })} placeholder="https://facebook.com/..." />
          <SaveBtn onClick={() => saveSection("contact")} saving={saving} />
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Field label="Instruksi Pembayaran" value={s.payment.instructions} onChange={(v) => update("payment", { instructions: v })} textarea />

          <div className="space-y-2 rounded-lg border border-border p-3">
            <p className="mb-1 text-sm font-medium">Metode Aktif</p>
            <div className="flex items-center justify-between">
              <Label>QRIS</Label>
              <Switch checked={s.payment.qris_enabled} onCheckedChange={(v) => update("payment", { qris_enabled: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>DANA</Label>
              <Switch checked={s.payment.dana_enabled} onCheckedChange={(v) => update("payment", { dana_enabled: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>GoPay</Label>
              <Switch checked={s.payment.gopay_enabled} onCheckedChange={(v) => update("payment", { gopay_enabled: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Transfer Bank</Label>
              <Switch checked={s.payment.bank_enabled} onCheckedChange={(v) => update("payment", { bank_enabled: v })} />
            </div>
          </div>

          <div>
            <Label>Detail Metode Pembayaran</Label>
            <p className="mb-2 text-xs text-muted-foreground">
              Isi detail (nomor rekening/nomor akun) dan gambar QR (kalau perlu) untuk tiap metode yang diaktifkan di atas. Nama harus sama persis: QRIS, DANA, GoPay, Transfer Bank.
            </p>
            <div className="space-y-3">
              {s.payment.methods.map((m, i) => (
                <PaymentMethodRow
                  key={i}
                  method={m}
                  onChange={(patch) => {
                    const methods = [...s.payment.methods];
                    methods[i] = { ...m, ...patch };
                    update("payment", { methods });
                  }}
                  onRemove={() => update("payment", { methods: s.payment.methods.filter((_, idx) => idx !== i) })}
                />
              ))}
              <Button variant="outline" size="sm" onClick={() => update("payment", { methods: [...s.payment.methods, { name: "", details: "", image_url: "" }] })}>
                <Plus className="h-4 w-4" /> Tambah Metode
              </Button>
            </div>
          </div>
          <SaveBtn onClick={() => saveSection("payment")} saving={saving} />
        </TabsContent>

        <TabsContent value="announcement" className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label>Tampilkan bar pengumuman</Label>
            <Switch checked={s.announcement.enabled} onCheckedChange={(v) => update("announcement", { enabled: v })} />
          </div>
          <Field label="Teks Pengumuman" value={s.announcement.text} onChange={(v) => update("announcement", { text: v })} textarea />
          <SaveBtn onClick={() => saveSection("announcement")} saving={saving} />
        </TabsContent>

        <TabsContent value="support" className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label>Tampilkan halaman "Dukung Admin"</Label>
            <Switch checked={s.support.support_enabled} onCheckedChange={(v) => update("support", { support_enabled: v })} />
          </div>
          <Field label="Judul Halaman" value={s.support.support_title} onChange={(v) => update("support", { support_title: v })} />
          <Field label="Pesan Ajakan" value={s.support.support_message} onChange={(v) => update("support", { support_message: v })} textarea />
          <div>
            <Label>Gambar QRIS Donasi</Label>
            <div className="mt-1.5 flex items-center gap-3">
              <div className="h-20 w-20 overflow-hidden rounded-lg border border-border bg-secondary/40">
                {s.support.support_qris_image_url && (
                  <img src={s.support.support_qris_image_url} alt="QRIS Donasi" className="h-full w-full object-cover" />
                )}
              </div>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:border-primary/50">
                {uploadingSupportQr ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Unggah
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadSupportQr(e.target.files[0])} />
              </label>
            </div>
          </div>
          <SaveBtn onClick={() => saveSection("support")} saving={saving} />
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}

function Field({ label, value, onChange, textarea, placeholder }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean; placeholder?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      {textarea ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5" rows={2} placeholder={placeholder} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5" placeholder={placeholder} />
      )}
    </div>
  );
}

function SaveBtn({ onClick, saving }: { onClick: () => void; saving: boolean }) {
  return (
    <Button variant="gradient" onClick={onClick} disabled={saving}>
      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan Perubahan
    </Button>
  );
}

function PaymentMethodRow({
  method, onChange, onRemove,
}: {
  method: { name: string; details: string; image_url?: string };
  onChange: (patch: Partial<{ name: string; details: string; image_url: string }>) => void;
  onRemove: () => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImage(BUCKETS.siteAssets, file);
      onChange({ image_url: url });
      toast.success("Gambar QR berhasil diunggah");
    } catch {
      toast.error("Gagal mengunggah gambar");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex gap-2">
        <div className="flex-1 space-y-2">
          <Input
            value={method.name}
            placeholder="Nama metode (mis. QRIS)"
            onChange={(e) => onChange({ name: e.target.value })}
          />
          <Input
            value={method.details}
            placeholder="Detail / info akun (mis. nomor rekening, nama pemilik)"
            onChange={(e) => onChange({ details: e.target.value })}
          />
        </div>
        <Button variant="outline" size="icon" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary/40">
          {method.image_url && <img src={method.image_url} alt="" className="h-full w-full object-cover" />}
        </div>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:border-primary/50">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Unggah Gambar QR (opsional)
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
        </label>
      </div>
    </div>
  );
}