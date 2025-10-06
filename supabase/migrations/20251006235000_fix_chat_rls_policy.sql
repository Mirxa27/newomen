-- Apply more permissive RLS policies to newme_conversations

BEGIN;

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "NewMe conversations viewable by admins only" ON public.newme_conversations;

-- Policy for users to manage their own conversations
CREATE POLICY "Users can manage their own conversations"
ON public.newme_conversations
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for admins to have full access
CREATE POLICY "Admins have full access to all conversations"
ON public.newme_conversations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE user_profiles.user_id = auth.uid() AND user_profiles.role = 'ADMIN'
  )
);

COMMIT;
