import { createServerFn } from "@tanstack/react-start";

const DEFAULT_ADMIN_EMAIL = "admin@azgroup.gg";
const DEFAULT_ADMIN_PASSWORD = "AZGroup#2026";
const DEFAULT_ROBLOX = "theblackprince";

// Idempotent bootstrap: creates the single admin account only if none exists.
export const ensureAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: existing } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("role", "admin")
    .limit(1);

  if (existing && existing.length > 0) {
    return { created: false, email: DEFAULT_ADMIN_EMAIL };
  }

  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email: DEFAULT_ADMIN_EMAIL,
    password: DEFAULT_ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { roblox_username: DEFAULT_ROBLOX, display_name: "AZ Admin" },
  });

  let userId = created?.user?.id;

  // If the user already exists in auth but has no role, find and promote them.
  if (createErr || !userId) {
    const { data: list } = await supabaseAdmin.auth.admin.listUsers();
    const match = list?.users.find((u) => u.email === DEFAULT_ADMIN_EMAIL);
    if (!match) throw new Error("Could not create admin account");
    userId = match.id;
  }

  await supabaseAdmin
    .from("profiles")
    .upsert({ user_id: userId, roblox_username: DEFAULT_ROBLOX, display_name: "AZ Admin" }, { onConflict: "user_id" });

  await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

  return { created: true, email: DEFAULT_ADMIN_EMAIL };
});
