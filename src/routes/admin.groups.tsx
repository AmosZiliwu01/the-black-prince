import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Upload, Users as UsersIcon } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/admin";
import { uploadGroupImage } from "@/lib/storage";
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

export const Route = createFileRoute("/admin/groups")({
  head: () => ({ meta: [{ title: "Join Grup — AZ Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminGroups,
});

interface CommunityGroup {
  id: string;
  name: string;
  game_name: string;
  description: string | null;
  link_url: string;
  image_url: string | null;
  member_count: string | null;
  is_active: boolean;
  sort_order: number;
}

async function fetchGroups() {
  const { data, error } = await supabase
    .from("community_groups")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data as CommunityGroup[];
}

function AdminGroups() {
  const qc = useQueryClient();
  const { data: groups, isLoading } = useQuery({ queryKey: ["admin-groups"], queryFn: fetchGroups });
  const [editing, setEditing] = useState<CommunityGroup | null>(null);
  const [open, setOpen] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-groups"] });

  const remove = async (g: CommunityGroup) => {
    const { error } = await supabase.from("community_groups").delete().eq("id", g.id);
    if (error) return toast.error(error.message);
    await logActivity("delete_group", "community_group", { name: g.name });
    toast.success("Grup dihapus");
    refresh();
  };

  return (
    <AdminShell title="Join Grup">
      <div className="mb-4 flex justify-end">
        <Button variant="gradient" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4" /> Grup Baru
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups?.map((g) => (
            <div key={g.id} className="flex gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary/40">
                {g.image_url ? (
                  <img src={g.image_url} alt={g.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center"><UsersIcon className="h-6 w-6 text-primary/40" /></div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold">{g.name}</p>
                  {!g.is_active && <Badge variant="secondary">Disembunyikan</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{g.game_name} {g.member_count ? `· ${g.member_count}` : ""}</p>
                {g.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{g.description}</p>}
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditing(g); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus grup "{g.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>Tindakan ini tidak bisa dibatalkan.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove(g)}>Hapus</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
          {groups?.length === 0 && (
            <p className="col-span-full py-12 text-center text-muted-foreground">Belum ada grup.</p>
          )}
        </div>
      )}

      <GroupDialog open={open} setOpen={setOpen} editing={editing} onSaved={refresh} />
    </AdminShell>
  );
}

function GroupDialog({
  open, setOpen, editing, onSaved,
}: { open: boolean; setOpen: (v: boolean) => void; editing: CommunityGroup | null; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [gameName, setGameName] = useState("Blox Fruits");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [memberCount, setMemberCount] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [lastId, setLastId] = useState<string | null>(null);
  const currentId = editing?.id ?? "new";
  if (open && lastId !== currentId) {
    setLastId(currentId);
    setName(editing?.name ?? "");
    setGameName(editing?.game_name ?? "Blox Fruits");
    setDescription(editing?.description ?? "");
    setLinkUrl(editing?.link_url ?? "");
    setMemberCount(editing?.member_count ?? "");
    setSortOrder(editing?.sort_order ?? 0);
    setIsActive(editing?.is_active ?? true);
    setImageUrl(editing?.image_url ?? null);
  }
  if (!open && lastId !== null) setLastId(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      setImageUrl(await uploadGroupImage(file));
      toast.success("Gambar berhasil diunggah");
    } catch {
      toast.error("Gagal mengunggah gambar");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!name.trim()) return toast.error("Nama grup wajib diisi");
    if (!linkUrl.trim()) return toast.error("Link grup wajib diisi");
    setSaving(true);
    const payload = {
      name: name.trim(),
      game_name: gameName.trim() || "Blox Fruits",
      description: description || null,
      link_url: linkUrl.trim(),
      member_count: memberCount || null,
      sort_order: sortOrder,
      is_active: isActive,
      image_url: imageUrl,
    };
    try {
      if (editing) {
        const { error } = await supabase.from("community_groups").update(payload).eq("id", editing.id);
        if (error) throw error;
        await logActivity("update_group", "community_group", { name: payload.name });
      } else {
        const { error } = await supabase.from("community_groups").insert(payload);
        if (error) throw error;
        await logActivity("create_group", "community_group", { name: payload.name });
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
        <DialogHeader><DialogTitle>{editing ? "Edit Grup" : "Grup Baru"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nama Grup</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" placeholder="mis. Private Server Blox Fruits VIP" />
          </div>
          <div>
            <Label>Nama Game</Label>
            <Input value={gameName} onChange={(e) => setGameName(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Deskripsi (opsional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1.5" rows={3} />
          </div>
          <div>
            <Label>Link Grup</Label>
            <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="mt-1.5" placeholder="https://discord.gg/..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Jumlah Member (opsional)</Label>
              <Input value={memberCount} onChange={(e) => setMemberCount(e.target.value)} placeholder="mis. 120+ member" className="mt-1.5" />
            </div>
            <div>
              <Label>Urutan Tampil</Label>
              <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label>Gambar</Label>
            <div className="mt-1.5 flex items-center gap-3">
              <div className="h-14 w-14 overflow-hidden rounded-lg border border-border bg-secondary/40">
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