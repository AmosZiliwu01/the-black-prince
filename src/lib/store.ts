import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GeneralSettings {
  site_name: string;
  tagline: string;
  currency: string;
  currency_symbol: string;
  support_hours: string;
}
export interface ContactSettings {
  whatsapp_number: string;
  email: string;
  discord: string;
  instagram: string;
}
export interface PaymentMethod {
  name: string;
  details: string;
}
export interface PaymentSettings {
  methods: PaymentMethod[];
  instructions: string;
}
export interface HeroSettings {
  title: string;
  subtitle: string;
  cta: string;
}
export interface AnnouncementSettings {
  enabled: boolean;
  text: string;
}

export interface SiteSettings {
  general: GeneralSettings;
  contact: ContactSettings;
  payment: PaymentSettings;
  hero: HeroSettings;
  announcement: AnnouncementSettings;
}

const DEFAULT_SETTINGS: SiteSettings = {
  general: {
    site_name: "AZ Group",
    tagline: "Premium Roblox Store",
    currency: "USD",
    currency_symbol: "$",
    support_hours: "9AM - 11PM Daily",
  },
  contact: { whatsapp_number: "", email: "support@azgroup.gg", discord: "", instagram: "" },
  payment: { methods: [], instructions: "" },
  hero: {
    title: "Level Up Your Roblox Experience",
    subtitle: "Instant delivery, unbeatable prices, trusted by thousands of gamers.",
    cta: "Shop Now",
  },
  announcement: { enabled: false, text: "" },
};

export async function fetchSettings(): Promise<SiteSettings> {
  const { data } = await supabase.from("site_settings").select("key, value");
  const merged = structuredClone(DEFAULT_SETTINGS) as unknown as Record<string, Record<string, unknown>>;
  for (const row of data ?? []) {
    merged[row.key] = {
      ...(merged[row.key] ?? {}),
      ...(row.value as Record<string, unknown>),
    };
  }
  return merged as unknown as SiteSettings;
}

export const settingsQuery = () =>
  queryOptions({ queryKey: ["settings"], queryFn: fetchSettings, staleTime: 60_000 });

export async function fetchCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export const categoriesQuery = () =>
  queryOptions({ queryKey: ["categories"], queryFn: fetchCategories });

export async function fetchProducts(opts?: { categorySlug?: string; featured?: boolean; search?: string }) {
  let query = supabase
    .from("products")
    .select("*, categories(name, slug)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (opts?.featured) query = query.eq("is_featured", true);
  if (opts?.search) query = query.ilike("name", `%${opts.search}%`);

  const { data, error } = await query;
  if (error) throw error;
  let rows = data ?? [];
  if (opts?.categorySlug) {
    rows = rows.filter((p) => p.categories?.slug === opts.categorySlug);
  }
  return rows;
}

export const productsQuery = (opts?: { categorySlug?: string; featured?: boolean; search?: string }) =>
  queryOptions({
    queryKey: ["products", opts ?? {}],
    queryFn: () => fetchProducts(opts),
  });

export async function fetchProductBySlug(slug: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*, categories(name, slug)")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export const productQuery = (slug: string) =>
  queryOptions({ queryKey: ["product", slug], queryFn: () => fetchProductBySlug(slug) });
