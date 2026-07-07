import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { slugify, logActivity } from "@/lib/admin";
import { uploadImage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/categories")({
  head: () => ({ meta: [{ title: "Categories — AZ Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminCategories,
});

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

async function fetchAll() {
  const { data, error } = await supabase.from("categories").select("*").order("sort_order");
  if (error) throw error;
  return data as Category[];
}

function AdminCategories() {
  const qc = useQueryClient();
  const { data: categories, isLoading } = useQuery({ queryKey: ["admin-categories"], queryFn: fetchAll });
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-categories"] });

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (c: Category) => { setEditing(c); setOpen(true); };

  const remove = async (c: Category) => {
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    await logActivity("delete_category", "category", { name: c.name });
    toast.success("Category deleted");
    refresh();
  };

  return (
    <AdminShell title="Categories">
      <div className="mb-4 flex justify-end">
        <Button variant="gradient" onClick={openNew}><Plus className="h-4 w-4" /> New Category</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories?.map((c) => (
            <div key={c.id} className="flex gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary/40">
                {c.image_url && <img src={c.image_url} alt={c.name} className="h-full w-full object-cover" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{c.name}</p>
                  {!c.is_active && <Badge variant="secondary">Hidden</Badge>}
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete “{c.name}”?</AlertDialogTitle>
                        <AlertDialogDescription>This cannot be undone. Products in this category will be uncategorized.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove(c)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
          {categories?.length === 0 && (
            <p className="col-span-full py-12 text-center text-muted-foreground">No categories yet.</p>
          )}
        </div>
      )}

      <CategoryDialog open={open} setOpen={setOpen} editing={editing} onSaved={refresh} />
    </AdminShell>
  );
}

function CategoryDialog({
  open, setOpen, editing, onSaved,
}: { open: boolean; setOpen: (v: boolean) => void; editing: Category | null; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync when dialog opens
  const [lastId, setLastId] = useState<string | null>(null);
  const currentId = editing?.id ?? "new";
  if (open && lastId !== currentId) {
    setLastId(currentId);
    setName(editing?.name ?? "");
    setDescription(editing?.description ?? "");
    setSortOrder(editing?.sort_order ?? 0);
    setIsActive(editing?.is_active ?? true);
    setImageUrl(editing?.image_url ?? null);
  }
  if (!open && lastId !== null) setLastId(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImage("category-images", file);
      setImageUrl(url);
      toast.success("Image uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!name.trim()) return toast.error("Name is required");
    setSaving(true);
    const payload = {
      name: name.trim(),
      slug: slugify(name),
      description: description || null,
      sort_order: sortOrder,
      is_active: isActive,
      image_url: imageUrl,
    };
    try {
      if (editing) {
        const { error } = await supabase.from("categories").update(payload).eq("id", editing.id);
        if (error) throw error;
        await logActivity("update_category", "category", { name: payload.name });
      } else {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) throw error;
        await logActivity("create_category", "category", { name: payload.name });
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{editing ? "Edit Category" : "New Category"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1.5" rows={2} />
          </div>
          <div>
            <Label>Sort Order</Label>
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="mt-1.5" />
          </div>
          <div>
            <Label>Image</Label>
            <div className="mt-1.5 flex items-center gap-3">
              <div className="h-14 w-14 overflow-hidden rounded-lg border border-border bg-secondary/40">
                {imageUrl && <img src={imageUrl} alt="" className="h-full w-full object-cover" />}
              </div>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:border-primary/50">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
              </label>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label>Active (visible on store)</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
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
