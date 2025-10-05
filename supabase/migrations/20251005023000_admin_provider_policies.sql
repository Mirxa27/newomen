-- Admin policies for provider management

-- Allow designated admin user to insert providers
DROP POLICY IF EXISTS "Admin can insert providers" ON public.providers;
CREATE POLICY "Admin can insert providers" ON public.providers
FOR INSERT TO authenticated
WITH CHECK (lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@newomen.me');

-- Allow admin to update providers
DROP POLICY IF EXISTS "Admin can update providers" ON public.providers;
CREATE POLICY "Admin can update providers" ON public.providers
FOR UPDATE TO authenticated
USING (lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@newomen.me')
WITH CHECK (lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@newomen.me');

-- Allow admin to delete providers
DROP POLICY IF EXISTS "Admin can delete providers" ON public.providers;
CREATE POLICY "Admin can delete providers" ON public.providers
FOR DELETE TO authenticated
USING (lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@newomen.me');

-- Allow admin to manage models associated with providers
DROP POLICY IF EXISTS "Admin can insert models" ON public.models;
CREATE POLICY "Admin can insert models" ON public.models
FOR INSERT TO authenticated
WITH CHECK (lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@newomen.me');

DROP POLICY IF EXISTS "Admin can update models" ON public.models;
CREATE POLICY "Admin can update models" ON public.models
FOR UPDATE TO authenticated
USING (lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@newomen.me')
WITH CHECK (lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@newomen.me');

DROP POLICY IF EXISTS "Admin can delete models" ON public.models;
CREATE POLICY "Admin can delete models" ON public.models
FOR DELETE TO authenticated
USING (lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@newomen.me');

-- Allow admin to manage voices
DROP POLICY IF EXISTS "Admin can insert voices" ON public.voices;
CREATE POLICY "Admin can insert voices" ON public.voices
FOR INSERT TO authenticated
WITH CHECK (lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@newomen.me');

DROP POLICY IF EXISTS "Admin can update voices" ON public.voices;
CREATE POLICY "Admin can update voices" ON public.voices
FOR UPDATE TO authenticated
USING (lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@newomen.me')
WITH CHECK (lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@newomen.me');

DROP POLICY IF EXISTS "Admin can delete voices" ON public.voices;
CREATE POLICY "Admin can delete voices" ON public.voices
FOR DELETE TO authenticated
USING (lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@newomen.me');
