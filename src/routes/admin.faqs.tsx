import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/admin";
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

export const Route = createFileRoute("/admin/faqs")({
  head: () => ({ meta: [{ title: "FAQ — AZ Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminFaqs,
});

interface Faq {
  id: string;
  category: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
}

async function fetchFaqs() {
  const { data, error } = await supabase
    .from("faqs")
    .select("*")
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data as Faq[];
}

function AdminFaqs() {
  const qc = useQueryClient();
  const { data: items, isLoading } = useQuery({ queryKey: ["admin-faqs"], queryFn: fetchFaqs });
  const [editing, setEditing] = useState<Faq | null>(null);
  const [open, setOpen] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-faqs"] });

  const remove = async (f: Faq) => {
    const { error } = await supabase.from("faqs").delete().eq("id", f.id);
    if (error) return toast.error(error.message);
    await logActivity("delete_faq", "faq", { question: f.question });
    toast.success("FAQ dihapus");
    refresh();
  };

  // Kelompokkan berdasarkan kategori untuk tampilan yang rapi
  const grouped = (items ?? []).reduce<Record<string, Faq[]>>((acc, f) => {
    (acc[f.category] ??= []).push(f);
    return acc;
  }, {});

  return (
    <AdminShell title="FAQ">
      <div className="mb-4 flex justify-end">
        <Button variant="gradient" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4" /> FAQ Baru
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : Object.keys(grouped).length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">Belum ada FAQ.</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, faqs]) => (
            <div key={category}>
              <h3 className="mb-2 flex items-center gap-2 font-display font-semibold">
                <HelpCircle className="h-4 w-4 text-primary" /> {category}
              </h3>
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
                <div className="divide-y divide-border">
                  {faqs.map((f) => (
                    <div key={f.id} className="flex items-start gap-3 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{f.question}</p>
                          {!f.is_active && <Badge variant="secondary">Disembunyikan</Badge>}
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{f.answer}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setEditing(f); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus FAQ ini?</AlertDialogTitle>
                              <AlertDialogDescription>Tindakan ini tidak bisa dibatalkan.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => remove(f)}>Hapus</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <FaqDialog open={open} setOpen={setOpen} editing={editing} onSaved={refresh} />
    </AdminShell>
  );
}

function FaqDialog({
  open, setOpen, editing, onSaved,
}: { open: boolean; setOpen: (v: boolean) => void; editing: Faq | null; onSaved: () => void }) {
  const [category, setCategory] = useState("Umum");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const [lastId, setLastId] = useState<string | null>(null);
  const currentId = editing?.id ?? "new";
  if (open && lastId !== currentId) {
    setLastId(currentId);
    setCategory(editing?.category ?? "Umum");
    setQuestion(editing?.question ?? "");
    setAnswer(editing?.answer ?? "");
    setSortOrder(editing?.sort_order ?? 0);
    setIsActive(editing?.is_active ?? true);
  }
  if (!open && lastId !== null) setLastId(null);

  const save = async () => {
    if (!question.trim()) return toast.error("Pertanyaan wajib diisi");
    if (!answer.trim()) return toast.error("Jawaban wajib diisi");
    setSaving(true);
    const payload = {
      category: category.trim() || "Umum",
      question: question.trim(),
      answer: answer.trim(),
      sort_order: sortOrder,
      is_active: isActive,
    };
    try {
      if (editing) {
        const { error } = await supabase.from("faqs").update(payload).eq("id", editing.id);
        if (error) throw error;
        await logActivity("update_faq", "faq", { question: payload.question });
      } else {
        const { error } = await supabase.from("faqs").insert(payload);
        if (error) throw error;
        await logActivity("create_faq", "faq", { question: payload.question });
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
        <DialogHeader><DialogTitle>{editing ? "Edit FAQ" : "FAQ Baru"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Kategori</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="mis. Umum, Pembayaran, Pengiriman" className="mt-1.5" />
          </div>
          <div>
            <Label>Pertanyaan</Label>
            <Input value={question} onChange={(e) => setQuestion(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Jawaban</Label>
            <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} className="mt-1.5" rows={4} />
          </div>
          <div>
            <Label>Urutan Tampil</Label>
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="mt-1.5" />
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