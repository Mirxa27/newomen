-- Create set_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create newme_conversations table
CREATE TABLE IF NOT EXISTS public.newme_conversations (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()),
  prompt TEXT,
  response TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.newme_conversations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "NewMe conversations viewable by admins only"
ON public.newme_conversations
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'ADMIN'
    )
);

-- Add trigger for updated_at
CREATE TRIGGER update_newme_conversations_updated_at
  BEFORE UPDATE ON public.newme_conversations
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();