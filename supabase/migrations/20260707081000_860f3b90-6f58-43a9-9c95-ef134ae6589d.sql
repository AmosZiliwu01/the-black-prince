
-- Product images: admins manage
CREATE POLICY "Admins manage product images" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- Category images: admins manage
CREATE POLICY "Admins manage category images" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'category-images' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'category-images' AND public.has_role(auth.uid(), 'admin'));

-- Payment proofs: anyone can upload, only admins can read/manage
CREATE POLICY "Anyone can upload payment proof" ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'payment-proofs');
CREATE POLICY "Admins read payment proofs" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage payment proofs" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete payment proofs" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(), 'admin'));
