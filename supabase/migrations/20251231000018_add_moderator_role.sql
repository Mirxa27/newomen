-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Session history viewable by admins only" ON sessions;
DROP POLICY IF EXISTS "NewMe conversations viewable by admins only" ON newme_conversations;
DROP POLICY IF EXISTS "Public profiles are insertable" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_profiles;

-- Add role column to user_profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name = 'role'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN role text DEFAULT 'MODERATOR';
    END IF;
END $$;

-- Create trigger function to sync auth.users with user_profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, role)
    VALUES (new.id, new.email, 'MODERATOR');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update user_profiles policies for proper access control
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_profiles;
CREATE POLICY "Enable read access for all users" ON public.user_profiles
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow individual insert" ON public.user_profiles;
CREATE POLICY "Allow individual insert" ON public.user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE newme_conversations ENABLE ROW LEVEL SECURITY;

-- Create policy for sessions table
CREATE POLICY "Session history viewable by admins only"
ON sessions
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

-- Create policy for newme_conversations table
CREATE POLICY "NewMe conversations viewable by admins only"
ON newme_conversations
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
