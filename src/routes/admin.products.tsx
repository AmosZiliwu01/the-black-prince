import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Upload, Zap } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { slugify, logActivity } from "@/lib/admin";
import { uploadImage, BUCKETS } from "@/lib/storage";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/products")({
  head: () => ({ meta: [{ title: "Produk — AZ Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminProducts,
});

const DEFAULT_TYPE_LABELS: Record<string, string> = {
  fruit: "Buah",
  account: "Akun",
  joki: "Joki",
};

const NEW_TYPE_VALUE = "__new__";

interface Product {
  id: string;
  category_id: string | null;
  product_type: string;
  game_name: string;
  category: string | null;
  rarity: string | null;
  duration: string | null;
  features: string[];
  badges: string[];
  sold_count: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  delivery_info: string | null;
}

async function fetchProducts() {
  const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data as Product[];
}
async function fetchCats() {
  const { data } = await supabase.from("categories").select("id, name").order("sort_order");
  return data ?? [];
}

function AdminProducts() {
  const qc = useQueryClient();
  const { data: products, isLoading } = useQuery({ queryKey: ["admin-products"], queryFn: fetchProducts });
  const { data: cats } = useQuery({ queryKey: ["admin-cats-mini"], queryFn: fetchCats });
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-products"] });

  // Jenis produk yang sudah pernah dipakai di data, untuk filter & dropdown form.
  const existingTypes = Array.from(new Set((products ?? []).map((p) => p.product_type))).sort();

  const filtered = products?.filter((p) => typeFilter === "all" || p.product_type === typeFilter) ?? [];

  const remove = async (p: Product) => {
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    await logActivity("delete_product", "product", { name: p.name });
    toast.success("Produk dihapus");
    refresh();
  };

  return (
    <AdminShell title="Produk">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Jenis:</Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Jenis</SelectItem>
              {existingTypes.map((t) => (
                <SelectItem key={t} value={t}>{DEFAULT_TYPE_LABELS[t] ?? t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="gradient" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4" /> Produk Baru
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <div className="divide-y divide-border">
            {filtered.map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-4">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary/40">
                  {p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center"><Zap className="h-5 w-5 text-primary/40" /></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold">{p.name}</p>
                    <Badge variant="secondary">{DEFAULT_TYPE_LABELS[p.product_type] ?? p.product_type}</Badge>
                    <Badge variant="outline">{p.game_name}</Badge>
                    {p.is_featured && <Badge variant="accent">Unggulan</Badge>}
                    {!p.is_active && <Badge variant="secondary">Disembunyikan</Badge>}
                    {p.stock <= 0 && <Badge variant="destructive">Habis</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(Number(p.price), "Rp")} · Stok: {p.stock} · Terjual: {p.sold_count}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus "{p.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>Tindakan ini tidak bisa dibatalkan.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove(p)}>Hapus</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="p-12 text-center text-muted-foreground">Belum ada produk.</p>}
          </div>
        </div>
      )}

      <ProductDialog
        open={open}
        setOpen={setOpen}
        editing={editing}
        cats={cats ?? []}
        existingTypes={existingTypes}
        onSaved={refresh}
      />
    </AdminShell>
  );
}

interface ProductFormState {
  product_type: string;
  customType: string;
  game_name: string;
  name: string;
  description: string;
  price: string;
  original_price: string;
  stock: string;
  sold_count: string;
  category_id: string;
  category: string;
  rarity: string;
  duration: string;
  delivery_info: string;
  features: string;
  badges: string;
  is_active: boolean;
  is_featured: boolean;
}

const EMPTY_FORM: ProductFormState = {
  product_type: "fruit",
  customType: "",
  game_name: "Blox Fruits",
  name: "",
  description: "",
  price: "0",
  original_price: "",
  stock: "0",
  sold_count: "0",
  category_id: "",
  category: "",
  rarity: "",
  duration: "",
  delivery_info: "",
  features: "",
  badges: "",
  is_active: true,
  is_featured: false,
};

function ProductDialog({
  open, setOpen, editing, cats, existingTypes, onSaved,
}: {
  open: boolean; setOpen: (v: boolean) => void; editing: Product | null;
  cats: { id: string; name: string }[]; existingTypes: string[]; onSaved: () => void;
}) {
  const [f, setF] = useState<ProductFormState>(EMPTY_FORM);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("dasar");

  // Gabungkan jenis default (fruit/account/joki) dengan jenis lain yang sudah pernah dipakai,
  // supaya dropdown selalu lengkap tapi tetap bisa ditambah jenis baru.
  const typeOptions = Array.from(new Set(["fruit", "account", "joki", ...existingTypes]));

  const [lastId, setLastId] = useState<string | null>(null);
  const currentId = editing?.id ?? "new";
  if (open && lastId !== currentId) {
    setLastId(currentId);
    setTab("dasar");
    const currentType = editing?.product_type ?? "fruit";
    setF({
      product_type: currentType,
      customType: "",
      game_name: editing?.game_name ?? "Blox Fruits",
      name: editing?.name ?? "",
      description: editing?.description ?? "",
      price: String(editing?.price ?? "0"),
      original_price: editing?.original_price != null ? String(editing.original_price) : "",
      stock: String(editing?.stock ?? "0"),
      sold_count: String(editing?.sold_count ?? "0"),
      category_id: editing?.category_id ?? "",
      category: editing?.category ?? "",
      rarity: editing?.rarity ?? "",
      duration: editing?.duration ?? "",
      delivery_info: editing?.delivery_info ?? "",
      features: (editing?.features ?? []).join("\n"),
      badges: (editing?.badges ?? []).join(", "),
      is_active: editing?.is_active ?? true,
      is_featured: editing?.is_featured ?? false,
    });
    setImageUrl(editing?.image_url ?? null);
  }
  if (!open && lastId !== null) setLastId(null);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      setImageUrl(await uploadImage(BUCKETS.products, file));
      toast.success("Gambar berhasil diunggah");
    } catch {
      toast.error("Gagal mengunggah gambar");
    } finally {
      setUploading(false);
    }
  };

  const set = <K extends keyof ProductFormState>(k: K, v: ProductFormState[K]) =>
    setF((prev) => ({ ...prev, [k]: v }));

  const save = async () => {
    if (!f.name.trim()) {
      toast.error("Nama produk wajib diisi");
      setTab("dasar");
      return;
    }
    const finalType = f.product_type === NEW_TYPE_VALUE ? f.customType.trim() : f.product_type;
    if (!finalType) {
      toast.error("Jenis produk wajib diisi");
      setTab("dasar");
      return;
    }
    setSaving(true);
    const payload = {
      product_type: finalType,
      game_name: f.game_name.trim() || "Blox Fruits",
      name: f.name.trim(),
      slug: slugify(f.name) + "-" + Math.random().toString(36).slice(2, 6),
      description: f.description || null,
      price: Number(f.price) || 0,
      original_price: f.original_price ? Number(f.original_price) : null,
      stock: Number(f.stock) || 0,
      sold_count: Number(f.sold_count) || 0,
      category_id: f.category_id || null,
      category: f.category.trim() || null,
      rarity: f.rarity.trim() || null,
      duration: f.duration.trim() || null,
      delivery_info: f.delivery_info || null,
      features: f.features.split("\n").map((s) => s.trim()).filter(Boolean),
      badges: f.badges.split(",").map((s) => s.trim()).filter(Boolean),
      is_active: f.is_active,
      is_featured: f.is_featured,
      image_url: imageUrl,
    };
    try {
      if (editing) {
        const { slug: _s, ...upd } = payload;
        const { error } = await supabase.from("products").update(upd).eq("id", editing.id);
        if (error) throw error;
        await logActivity("update_product", "product", { name: payload.name });
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
        await logActivity("create_product", "product", { name: payload.name });
      }
      toast.success("Tersimpan");
      setOpen(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const effectiveType = f.product_type === NEW_TYPE_VALUE ? f.customType : f.product_type;
  const isJoki = effectiveType === "joki";
  const isFruitOrAccount = effectiveType === "fruit" || effectiveType === "account";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto scrollbar-thin">
        <DialogHeader><DialogTitle>{editing ? "Edit Produk" : "Produk Baru"}</DialogTitle></DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="dasar" className="flex-1">Info Dasar</TabsTrigger>
            <TabsTrigger value="detail" className="flex-1">Detail & Media</TabsTrigger>
          </TabsList>

          <TabsContent value="dasar" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Jenis Produk</Label>
                <Select value={f.product_type} onValueChange={(v) => set("product_type", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((t) => (
                      <SelectItem key={t} value={t}>{DEFAULT_TYPE_LABELS[t] ?? t}</SelectItem>
                    ))}
                    <SelectItem value={NEW_TYPE_VALUE}>+ Tambah jenis baru...</SelectItem>
                  </SelectContent>
                </Select>
                {f.product_type === NEW_TYPE_VALUE && (
                  <Input
                    value={f.customType}
                    onChange={(e) => set("customType", e.target.value)}
                    placeholder="mis. topup, boosting"
                    className="mt-2"
                  />
                )}
              </div>
              <div>
                <Label>Nama Game</Label>
                <Input
                  value={f.game_name}
                  onChange={(e) => set("game_name", e.target.value)}
                  placeholder="mis. Blox Fruits, Mobile Legends"
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label>Nama Produk</Label>
              <Input value={f.name} onChange={(e) => set("name", e.target.value)} className="mt-1.5" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Harga</Label>
                <Input type="number" step="0.01" value={f.price} onChange={(e) => set("price", e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label>Harga Coret (opsional)</Label>
                <Input type="number" step="0.01" value={f.original_price} onChange={(e) => set("original_price", e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label>Stok</Label>
                <Input type="number" value={f.stock} onChange={(e) => set("stock", e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label>Sudah Terjual</Label>
                <Input type="number" value={f.sold_count} onChange={(e) => set("sold_count", e.target.value)} className="mt-1.5" />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label>Aktif (tampil di toko)</Label>
              <Switch checked={f.is_active} onCheckedChange={(v) => set("is_active", v)} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label>Unggulan</Label>
              <Switch checked={f.is_featured} onCheckedChange={(v) => set("is_featured", v)} />
            </div>
          </TabsContent>

          <TabsContent value="detail" className="space-y-4">
            <div>
              <Label>Deskripsi</Label>
              <Textarea value={f.description} onChange={(e) => set("description", e.target.value)} className="mt-1.5" rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Kategori Utama</Label>
                <Select value={f.category_id || "none"} onValueChange={(v) => set("category_id", v === "none" ? "" : v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Pilih" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tanpa Kategori</SelectItem>
                    {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sub-kategori (opsional)</Label>
                <Input value={f.category} onChange={(e) => set("category", e.target.value)} placeholder="mis. Natural, Leveling" className="mt-1.5" />
              </div>
            </div>

            {isFruitOrAccount && (
              <div>
                <Label>Rarity (opsional)</Label>
                <Input value={f.rarity} onChange={(e) => set("rarity", e.target.value)} placeholder="Common / Rare / Legendary / Mythical" className="mt-1.5" />
              </div>
            )}

            {isJoki && (
              <div>
                <Label>Estimasi Durasi (opsional)</Label>
                <Input value={f.duration} onChange={(e) => set("duration", e.target.value)} placeholder="mis. 1-2 jam" className="mt-1.5" />
              </div>
            )}

            <div>
              <Label>Fitur / Isi Produk (satu per baris, opsional)</Label>
              <Textarea value={f.features} onChange={(e) => set("features", e.target.value)} className="mt-1.5" rows={3} placeholder={"Contoh:\nGaransi 7 hari\nProses cepat"} />
            </div>
            <div>
              <Label>Badge (pisahkan dengan koma, opsional)</Label>
              <Input value={f.badges} onChange={(e) => set("badges", e.target.value)} placeholder="Terlaris, Promo" className="mt-1.5" />
            </div>
            <div>
              <Label>Info Pengiriman</Label>
              <Input value={f.delivery_info} onChange={(e) => set("delivery_info", e.target.value)} placeholder="mis. Dikirim dalam 10 menit" className="mt-1.5" />
            </div>

            <div>
              <Label>Gambar</Label>
              <div className="mt-1.5 flex items-center gap-3">
                <div className="h-16 w-16 overflow-hidden rounded-lg border border-border bg-secondary/40">
                  {imageUrl && <img src={imageUrl} alt="" className="h-full w-full object-cover" />}
                </div>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:border-primary/50">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Unggah
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
                </label>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Batal</Button>
          <Button variant="gradient" onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}