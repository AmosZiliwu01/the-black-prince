-- ========== PRODUCTS: generalize for fruit / account / joki ==========
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'fruit',
  ADD COLUMN IF NOT EXISTS game_name TEXT NOT NULL DEFAULT 'Blox Fruits',
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS rarity TEXT,
  ADD COLUMN IF NOT EXISTS duration TEXT,
  ADD COLUMN IF NOT EXISTS features TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS badges TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sold_count INTEGER NOT NULL DEFAULT 0;

-- RENAME COLUMN harus statement ALTER TABLE terpisah, tidak boleh digabung
-- dengan ADD COLUMN dalam satu statement. Dibungkus DO block + cek kolom
-- supaya aman (idempotent) kalau migrasi ini pernah retry sebagian.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'compare_at_price'
  ) THEN
    ALTER TABLE public.products RENAME COLUMN compare_at_price TO original_price;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_game ON public.products(game_name);

-- ========== COMMUNITY GROUPS (Join Grup) ==========
CREATE TABLE IF NOT EXISTS public.community_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  game_name TEXT NOT NULL DEFAULT 'Blox Fruits',
  description TEXT,
  link_url TEXT NOT NULL,
  image_url TEXT,
  member_count TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.community_groups TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_groups TO authenticated;
GRANT ALL ON public.community_groups TO service_role;
ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active groups" ON public.community_groups;
CREATE POLICY "Anyone can view active groups" ON public.community_groups
  FOR SELECT USING (is_active OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage groups" ON public.community_groups;
CREATE POLICY "Admins manage groups" ON public.community_groups
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_groups_updated ON public.community_groups;
CREATE TRIGGER trg_groups_updated BEFORE UPDATE ON public.community_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== ORDERS: payment proof tracking ==========
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS proof_submitted_on_web BOOLEAN NOT NULL DEFAULT false;

-- ========== TESTIMONIALS ==========
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  message TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.testimonials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active testimonials" ON public.testimonials;
CREATE POLICY "Anyone can view active testimonials" ON public.testimonials
  FOR SELECT USING (is_active OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage testimonials" ON public.testimonials;
CREATE POLICY "Admins manage testimonials" ON public.testimonials
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ========== FAQS ==========
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'Umum',
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.faqs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faqs TO authenticated;
GRANT ALL ON public.faqs TO service_role;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active faqs" ON public.faqs;
CREATE POLICY "Anyone can view active faqs" ON public.faqs
  FOR SELECT USING (is_active OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage faqs" ON public.faqs;
CREATE POLICY "Admins manage faqs" ON public.faqs
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ========== SITE SETTINGS: tambah key contact & payment baru ==========
UPDATE public.site_settings
SET value = value || '{"discord": ""}'::jsonb
WHERE key = 'contact' AND NOT (value ? 'discord');

UPDATE public.site_settings
SET value = value || '{"tiktok": "", "facebook": ""}'::jsonb
WHERE key = 'contact' AND NOT (value ? 'tiktok');

UPDATE public.site_settings
SET value = value || '{"qris_enabled": false, "dana_enabled": false, "gopay_enabled": false, "bank_enabled": true}'::jsonb
WHERE key = 'payment' AND NOT (value ? 'qris_enabled');

INSERT INTO public.site_settings (key, value)
VALUES ('support', '{"support_enabled": false, "support_title": "Dukung Admin", "support_message": "Lagi butuh bantuan buat sewa private server baru? Dukungan kamu sangat berarti 🙏", "support_qris_image_url": ""}')
ON CONFLICT (key) DO NOTHING;

-- ========== BOOTSTRAP ADMIN TRIGGER (user pertama daftar otomatis jadi admin) ==========
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tg_bootstrap_admin ON auth.users;
CREATE TRIGGER tg_bootstrap_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.bootstrap_first_admin();