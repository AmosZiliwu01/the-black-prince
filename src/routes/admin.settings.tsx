import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { fetchSettings, type SiteSettings } from "@/lib/store";
import { logActivity } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — AZ Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminSettings,
});

function AdminSettings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-settings-full"], queryFn: fetchSettings });
  const [draft, setDraft] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);

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
    toast.success("Settings saved");
    setSaving(false);
  };

  if (isLoading || !s) {
    return <AdminShell title="Settings"><div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></AdminShell>;
  }

  return (
    <AdminShell title="Settings">
      <Tabs defaultValue="general" className="max-w-2xl">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="announcement">Announcement</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Field label="Site Name" value={s.general.site_name} onChange={(v) => update("general", { site_name: v })} />
          <Field label="Tagline" value={s.general.tagline} onChange={(v) => update("general", { tagline: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Currency Code" value={s.general.currency} onChange={(v) => update("general", { currency: v })} />
            <Field label="Currency Symbol" value={s.general.currency_symbol} onChange={(v) => update("general", { currency_symbol: v })} />
          </div>
          <Field label="Support Hours" value={s.general.support_hours} onChange={(v) => update("general", { support_hours: v })} />
          <SaveBtn onClick={() => saveSection("general")} saving={saving} />
        </TabsContent>

        <TabsContent value="hero" className="space-y-4">
          <Field label="Title" value={s.hero.title} onChange={(v) => update("hero", { title: v })} />
          <Field label="Subtitle" value={s.hero.subtitle} onChange={(v) => update("hero", { subtitle: v })} textarea />
          <Field label="Button Text" value={s.hero.cta} onChange={(v) => update("hero", { cta: v })} />
          <SaveBtn onClick={() => saveSection("hero")} saving={saving} />
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <Field label="WhatsApp Number" value={s.contact.whatsapp_number} onChange={(v) => update("contact", { whatsapp_number: v })} placeholder="+1 555 000 0000" />
          <Field label="Email" value={s.contact.email} onChange={(v) => update("contact", { email: v })} />
          <Field label="Discord" value={s.contact.discord} onChange={(v) => update("contact", { discord: v })} />
          <Field label="Instagram" value={s.contact.instagram} onChange={(v) => update("contact", { instagram: v })} />
          <SaveBtn onClick={() => saveSection("contact")} saving={saving} />
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Field label="Instructions" value={s.payment.instructions} onChange={(v) => update("payment", { instructions: v })} textarea />
          <div>
            <Label>Payment Methods</Label>
            <div className="mt-2 space-y-2">
              {s.payment.methods.map((m, i) => (
                <div key={i} className="flex gap-2 rounded-lg border border-border p-2">
                  <div className="flex-1 space-y-2">
                    <Input value={m.name} placeholder="Method name" onChange={(e) => {
                      const methods = [...s.payment.methods]; methods[i] = { ...m, name: e.target.value }; update("payment", { methods });
                    }} />
                    <Input value={m.details} placeholder="Details / account info" onChange={(e) => {
                      const methods = [...s.payment.methods]; methods[i] = { ...m, details: e.target.value }; update("payment", { methods });
                    }} />
                  </div>
                  <Button variant="outline" size="icon" onClick={() => update("payment", { methods: s.payment.methods.filter((_, idx) => idx !== i) })}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => update("payment", { methods: [...s.payment.methods, { name: "", details: "" }] })}>
                <Plus className="h-4 w-4" /> Add Method
              </Button>
            </div>
          </div>
          <SaveBtn onClick={() => saveSection("payment")} saving={saving} />
        </TabsContent>

        <TabsContent value="announcement" className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label>Show announcement bar</Label>
            <Switch checked={s.announcement.enabled} onCheckedChange={(v) => update("announcement", { enabled: v })} />
          </div>
          <Field label="Announcement Text" value={s.announcement.text} onChange={(v) => update("announcement", { text: v })} textarea />
          <SaveBtn onClick={() => saveSection("announcement")} saving={saving} />
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
      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
    </Button>
  );
}
