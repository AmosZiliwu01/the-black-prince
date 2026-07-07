
-- Remove permissive guest INSERT policies (order creation moves server-side)
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;

-- Revoke anon write/read grants; server code uses service role
REVOKE SELECT, INSERT ON public.orders FROM anon;
REVOKE SELECT, INSERT ON public.order_items FROM anon;

-- Remove public security-definer tracking function (handled server-side now)
DROP FUNCTION IF EXISTS public.track_order(TEXT);
