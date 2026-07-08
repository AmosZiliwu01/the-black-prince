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
  tiktok: string;
  facebook: string;
}

export interface PaymentMethodEntry {
  name: string;
  details: string;
  image_url?: string;
}

export interface PaymentSettings {
  methods: PaymentMethodEntry[];
  instructions: string;
  qris_enabled: boolean;
  dana_enabled: boolean;
  gopay_enabled: boolean;
  bank_enabled: boolean;
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

export interface SupportSettings {
  support_enabled: boolean;
  support_title: string;
  support_message: string;
  support_qris_image_url: string;
}

export interface SiteSettings {
  general: GeneralSettings;
  contact: ContactSettings;
  payment: PaymentSettings;
  hero: HeroSettings;
  announcement: AnnouncementSettings;
  support: SupportSettings;
}

const DEFAULT_SETTINGS: SiteSettings = {
  general: {
    site_name: "AZ Group",
    tagline: "Premium Roblox Store",
    currency: "IDR",
    currency_symbol: "Rp",
    support_hours: "9AM - 11PM Setiap Hari",
  },
  contact: {
    whatsapp_number: "",
    email: "support@azgroup.gg",
    discord: "",
    instagram: "",
    tiktok: "",
    facebook: "",
  },
  payment: {
    methods: [],
    instructions: "",
    qris_enabled: false,
    dana_enabled: false,
    gopay_enabled: false,
    bank_enabled: true,
  },
  hero: {
    title: "Level Up Pengalaman Roblox Kamu",
    subtitle: "Pengiriman instan, harga terbaik, dipercaya ribuan gamer.",
    cta: "Belanja Sekarang",
  },
  announcement: { enabled: false, text: "" },
  support: {
    support_enabled: false,
    support_title: "Dukung Admin",
    support_message: "Lagi butuh bantuan buat sewa private server baru? Dukungan kamu sangat berarti.",
    support_qris_image_url: "",
  },
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
  queryOptions({ queryKey: ["settings"], queryFn: fetchSettings, staleTime: 60000 });

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

export interface ProductFilters {
  categorySlug?: string;
  productType?: string;
  gameName?: string;
  featured?: boolean;
  search?: string;
}

export async function fetchProducts(opts?: ProductFilters) {
  let query = supabase
    .from("products")
    .select("*, categories(name, slug)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (opts?.featured) query = query.eq("is_featured", true);
  if (opts?.search) query = query.ilike("name", "%" + opts.search + "%");
  if (opts?.productType) query = query.eq("product_type", opts.productType);
  if (opts?.gameName) query = query.eq("game_name", opts.gameName);

  const { data, error } = await query;
  if (error) throw error;
  let rows = data ?? [];
  if (opts?.categorySlug) {
    rows = rows.filter((p) => p.categories?.slug === opts.categorySlug);
  }
  return rows;
}

export const productsQuery = (opts?: ProductFilters) =>
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

export async function fetchProductFacets() {
  const { data, error } = await supabase
    .from("products")
    .select("product_type, game_name")
    .eq("is_active", true);
  if (error) throw error;
  const types = Array.from(new Set((data ?? []).map((p) => p.product_type))).sort();
  const games = Array.from(new Set((data ?? []).map((p) => p.game_name))).sort();
  return { types, games };
}

export const productFacetsQuery = () =>
  queryOptions({ queryKey: ["product-facets"], queryFn: fetchProductFacets });

export async function fetchCommunityGroups() {
  const { data, error } = await supabase
    .from("community_groups")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export const communityGroupsQuery = () =>
  queryOptions({ queryKey: ["community-groups"], queryFn: fetchCommunityGroups });

export async function fetchTestimonials() {
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export const testimonialsQuery = () =>
  queryOptions({ queryKey: ["testimonials"], queryFn: fetchTestimonials });

export async function fetchFaqs() {
  const { data, error } = await supabase
    .from("faqs")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export const faqsQuery = () => queryOptions({ queryKey: ["faqs"], queryFn: fetchFaqs });