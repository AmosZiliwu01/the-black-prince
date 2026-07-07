import { supabase } from "@/integrations/supabase/client";

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function logActivity(
  action: string,
  entity?: string,
  details?: Record<string, unknown>,
) {
  const { data } = await supabase.auth.getUser();
  await supabase.from("activity_logs").insert({
    admin_id: data.user?.id ?? null,
    action,
    entity: entity ?? null,
    details: (details ?? {}) as never,
  });
}
