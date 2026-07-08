-- Testimonial images: admin manage, publik bisa lihat (bucket public jadi SELECT tidak perlu policy khusus,
-- tapi tetap kita batasi write hanya admin)
CREATE POLICY "Admins manage testimonial images" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'testimonial-images' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'testimonial-images' AND public.has_role(auth.uid(), 'admin'));

-- Site assets (misal: QRIS dukung admin, logo, dsb): admin manage
CREATE POLICY "Admins manage site assets" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));