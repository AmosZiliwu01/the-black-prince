import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Upload, Zap } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { slugify, logActivity } from "@/lib/admin";
import { uploadImage } from "@/lib/storage";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/products")({
  head: () => ({ meta: [{ title: "Products — AZ Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminProducts,
});

interface Product {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
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
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-products"] });

  const remove = async (p: Product) => {
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    await logActivity("delete_product", "product", { name: p.name });
    toast.success("Product deleted");
    refresh();
  };

  return (
    <AdminShell title="Products">
      <div className="mb-4 flex justify-end">
        <Button variant="gradient" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4" /> New Product
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <div className="divide-y divide-border">
            {products?.map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-4">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary/40">
                  {p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center"><Zap className="h-5 w-5 text-primary/40" /></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold">{p.name}</p>
                    {p.is_featured && <Badge variant="accent">Featured</Badge>}
                    {!p.is_active && <Badge variant="secondary">Hidden</Badge>}
                    {p.stock <= 0 && <Badge variant="destructive">Sold Out</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{formatCurrency(Number(p.price))} · Stock: {p.stock}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete “{p.name}”?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove(p)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
            {products?.length === 0 && <p className="p-12 text-center text-muted-foreground">No products yet.</p>}
          </div>
        </div>
      )}

      <ProductDialog open={open} setOpen={setOpen} editing={editing} cats={cats ?? []} onSaved={refresh} />
    </AdminShell>
  );
}

function ProductDialog({
  open, setOpen, editing, cats, onSaved,
}: {
  open: boolean; setOpen: (v: boolean) => void; editing: Product | null;
  cats: { id: string; name: string }[]; onSaved: () => void;
}) {
  const [f, setF] = useState({
    name: "", description: "", price: "0", compare: "", stock: "0",
    category_id: "", delivery_info: "", is_active: true, is_featured: false,
  });
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [lastId, setLastId] = useState<string | null>(null);
  const currentId = editing?.id ?? "new";
  if (open && lastId !== currentId) {
    setLastId(currentId);
    setF({
      name: editing?.name ?? "",
      description: editing?.description ?? "",
      price: String(editing?.price ?? "0"),
      compare: editing?.compare_at_price != null ? String(editing.compare_at_price) : "",
      stock: String(editing?.stock ?? "0"),
      category_id: editing?.category_id ?? "",
      delivery_info: editing?.delivery_info ?? "",
      is_active: editing?.is_active ?? true,
      is_featured: editing?.is_featured ?? false,
    });
    setImageUrl(editing?.image_url ?? null);
  }
  if (!open && lastId !== null) setLastId(null);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      setImageUrl(await uploadImage("product-images", file));
      toast.success("Image uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!f.name.trim()) return toast.error("Name is required");
    setSaving(true);
    const payload = {
      name: f.name.trim(),
      slug: slugify(f.name) + "-" + Math.random().toString(36).slice(2, 6),
      description: f.description || null,
      price: Number(f.price) || 0,
      compare_at_price: f.compare ? Number(f.compare) : null,
      stock: Number(f.stock) || 0,
      category_id: f.category_id || null,
      delivery_info: f.delivery_info || null,
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
      toast.success("Saved");
      setOpen(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const set = (k: keyof typeof f, v: string | boolean) => setF((prev) => ({ ...prev, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? "Edit Product" : "New Product"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={f.name} onChange={(e) => set("name", e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={f.description} onChange={(e) => set("description", e.target.value)} className="mt-1.5" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Price</Label>
              <Input type="number" step="0.01" value={f.price} onChange={(e) => set("price", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Compare-at (optional)</Label>
              <Input type="number" step="0.01" value={f.compare} onChange={(e) => set("compare", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Stock</Label>
              <Input type="number" value={f.stock} onChange={(e) => set("stock", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={f.category_id || "none"} onValueChange={(v) => set("category_id", v === "none" ? "" : v)}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Uncategorized</SelectItem>
                  {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Delivery Info</Label>
            <Input value={f.delivery_info} onChange={(e) => set("delivery_info", e.target.value)} placeholder="e.g. Delivered within 10 minutes" className="mt-1.5" />
          </div>
          <div>
            <Label>Image</Label>
            <div className="mt-1.5 flex items-center gap-3">
              <div className="h-16 w-16 overflow-hidden rounded-lg border border-border bg-secondary/40">
                {imageUrl && <img src={imageUrl} alt="" className="h-full w-full object-cover" />}
              </div>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:border-primary/50">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              </label>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label>Active</Label>
            <Switch checked={f.is_active} onCheckedChange={(v) => set("is_active", v)} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Featured</Label>
            <Switch checked={f.is_featured} onCheckedChange={(v) => set("is_featured", v)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="gradient" onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
