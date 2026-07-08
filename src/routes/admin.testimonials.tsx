import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Upload, Star } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/admin";
import { uploadImage, BUCKETS } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/testimonials")({
  head: () => ({ meta: [{ title: "Testimoni — AZ Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminTestimonials,
});

interface Testimonial {
  id: string;
  customer_name: string;
  message: string;
  rating: number;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
}

async function fetchTestimonials() {
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data as Testimonial[];
}

function AdminTestimonials() {
  const qc = useQueryClient();
  const { data: items, isLoading } = useQuery({ queryKey: ["admin-testimonials"], queryFn: fetchTestimonials });
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [open, setOpen] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-testimonials"] });

  const remove = async (t: Testimonial) => {
    const { error } = await supabase.from("testimonials").delete().eq("id", t.id);
    if (error) return toast.error(error.message);
    await logActivity("delete_testimonial", "testimonial", { name: t.customer_name });
    toast.success("Testimoni dihapus");
    refresh();
  };

  return (
    <AdminShell title="Testimoni">
      <div className="mb-4 flex justify-end">
        <Button variant="gradient" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4" /> Testimoni Baru
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items?.map((t) => (
            <div key={t.id} className="flex gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-border bg-secondary/40">
                {t.image_url ? (
                  <img src={t.image_url} alt={t.customer_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-bold text-primary/40">
                    {t.customer_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold">{t.customer_name}</p>
                  {!t.is_active && <Badge variant="secondary">Disembunyikan</Badge>}
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < t.rating ? "fill-warning text-warning" : "text-muted-foreground"}`} />
                  ))}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t.message}</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditing(t); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus testimoni "{t.customer_name}"?</AlertDialogTitle>
                        <AlertDialogDescription>Tindakan ini tidak bisa dibatalkan.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove(t)}>Hapus</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
          {items?.length === 0 && (
            <p className="col-span-full py-12 text-center text-muted-foreground">Belum ada testimoni.</p>
          )}
        </div>
      )}

      <TestimonialDialog open={open} setOpen={setOpen} editing={editing} onSaved={refresh} />
    </AdminShell>
  );
}

function TestimonialDialog({
  open, setOpen, editing, onSaved,
}: { open: boolean; setOpen: (v: boolean) => void; editing: Testimonial | null; onSaved: () => void }) {
  const [customerName, setCustomerName] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [lastId, setLastId] = useState<string | null>(null);
  const currentId = editing?.id ?? "new";
  if (open && lastId !== currentId) {
    setLastId(currentId);
    setCustomerName(editing?.customer_name ?? "");
    setMessage(editing?.message ?? "");
    setRating(editing?.rating ?? 5);
    setSortOrder(editing?.sort_order ?? 0);
    setIsActive(editing?.is_active ?? true);
    setImageUrl(editing?.image_url ?? null);
  }
  if (!open && lastId !== null) setLastId(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      setImageUrl(await uploadImage(BUCKETS.testimonials, file));
      toast.success("Gambar berhasil diunggah");
    } catch {
      toast.error("Gagal mengunggah gambar");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!customerName.trim()) return toast.error("Nama pelanggan wajib diisi");
    if (!message.trim()) return toast.error("Pesan testimoni wajib diisi");
    setSaving(true);
    const payload = {
      customer_name: customerName.trim(),
      message: message.trim(),
      rating,
      sort_order: sortOrder,
      is_active: isActive,
      image_url: imageUrl,
    };
    try {
      if (editing) {
        const { error } = await supabase.from("testimonials").update(payload).eq("id", editing.id);
        if (error) throw error;
        await logActivity("update_testimonial", "testimonial", { name: payload.customer_name });
      } else {
        const { error } = await supabase.from("testimonials").insert(payload);
        if (error) throw error;
        await logActivity("create_testimonial", "testimonial", { name: payload.customer_name });
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto scrollbar-thin">
        <DialogHeader><DialogTitle>{editing ? "Edit Testimoni" : "Testimoni Baru"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nama Pelanggan</Label>
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Pesan Testimoni</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1.5" rows={3} />
          </div>
          <div>
            <Label>Rating</Label>
            <div className="mt-1.5 flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button key={i} type="button" onClick={() => setRating(i + 1)}>
                  <Star className={`h-6 w-6 ${i < rating ? "fill-warning text-warning" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Urutan Tampil</Label>
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="mt-1.5" />
          </div>
          <div>
            <Label>Foto (opsional)</Label>
            <div className="mt-1.5 flex items-center gap-3">
              <div className="h-14 w-14 overflow-hidden rounded-full border border-border bg-secondary/40">
                {imageUrl && <img src={imageUrl} alt="" className="h-full w-full object-cover" />}
              </div>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:border-primary/50">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Unggah
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
              </label>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label>Aktif (tampil di halaman publik)</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
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