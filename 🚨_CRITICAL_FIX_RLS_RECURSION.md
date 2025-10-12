# 🚨 Critical Fix Required - RLS Infinite Recursion

## Problem Identified

**Error**: `infinite recursion detected in policy for relation "user_profiles"`

**Impact**: 
- Admin panel not loading
- Wellness library admin page failing
- 500 errors on all user_profiles queries

## Root Cause

The RLS policies on `user_profiles` table are creating circular dependencies by checking the role column from the same table they're protecting, causing infinite recursion.

Example of problematic policy:
```sql
CREATE POLICY "Admin full access to user profiles"
ON user_profiles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_profiles  -- ❌ Recursion!
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('admin', 'superadmin')
  )
);
```

## Solution

Use email-based admin checks from JWT instead of querying user_profiles:

```sql
-- ✅ Non-recursive approach
CREATE POLICY "Admins can read all profiles"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'email' IN (
    'admin@newomen.me',
    'katerina@newomen.me'
  )
  OR auth.uid() = user_id
);
```

---

## 🔧 Quick Fix Instructions

### Option 1: Via Supabase Dashboard (RECOMMENDED)

1. Go to Supabase Dashboard → SQL Editor
2. Create a new query
3. Paste and run this SQL:

```sql
-- Fix Infinite Recursion in RLS Policies

-- Drop all existing policies on user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admin full access to user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Public read access to user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_profiles;
DROP POLICY IF EXISTS "Allow profile select" ON user_profiles;
DROP POLICY IF EXISTS "Allow own profile update" ON user_profiles;
DROP POLICY IF EXISTS "Allow profile creation via trigger" ON user_profiles;

-- Create non-recursive policies

-- 1. Users can read their own profile
CREATE POLICY "Users read own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = id);

-- 2. Users can update their own profile
CREATE POLICY "Users update own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = id)
WITH CHECK (auth.uid() = user_id OR auth.uid() = id);

-- 3. Users can insert their profile
CREATE POLICY "Users insert own profile"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR auth.uid() = id);

-- 4. Admins can read all profiles (email-based, no recursion)
CREATE POLICY "Admins read all profiles"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'email' IN (
    'admin@newomen.me',
    'katerina@newomen.me'
  )
);

-- 5. Admins can update all profiles (email-based, no recursion)
CREATE POLICY "Admins update all profiles"
ON user_profiles
FOR UPDATE
TO authenticated
USING (
  auth.jwt() ->> 'email' IN (
    'admin@newomen.me',
    'katerina@newomen.me'
  )
)
WITH CHECK (
  auth.jwt() ->> 'email' IN (
    'admin@newomen.me',
    'katerina@newomen.me'
  )
);

-- Fix wellness_resources policies
DROP POLICY IF EXISTS "Public read access for active wellness resources" ON wellness_resources;
DROP POLICY IF EXISTS "Admin full access to wellness resources" ON wellness_resources;
DROP POLICY IF EXISTS "Public read wellness resources" ON wellness_resources;
DROP POLICY IF EXISTS "Admins manage wellness resources" ON wellness_resources;

-- Public can read active wellness resources
CREATE POLICY "Public read wellness"
ON wellness_resources
FOR SELECT
TO public
USING (status = 'active' OR status IS NULL);

-- Admins can manage wellness resources (email-based)
CREATE POLICY "Admins manage wellness"
ON wellness_resources
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'email' IN (
    'admin@newomen.me',
    'katerina@newomen.me'
  )
)
WITH CHECK (
  auth.jwt() ->> 'email' IN (
    'admin@newomen.me',
    'katerina@newomen.me'
  )
);
```

4. Click "Run" or press `Ctrl+Enter`
5. Verify success message
6. Refresh your app

### Option 2: Via Supabase CLI

```bash
# Create the migration file (already done)
# File: supabase/migrations/20251012100000_fix_rls_infinite_recursion.sql

# Apply it directly via SQL
npx supabase db execute --file supabase/migrations/20251012100000_fix_rls_infinite_recursion.sql
```

---

## ✅ Verification Steps

After applying the fix:

1. **Refresh the app** - Hard refresh (Cmd+Shift+R)
2. **Check console** - No more 500 errors
3. **Test admin access**:
   - Login as admin@newomen.me
   - Go to `/admin/wellness-library`
   - Should load without errors
4. **Test user access**:
   - Login as regular user
   - Go to `/wellness-library`
   - Should load resources

---

## 🔍 How to Identify Admin Users

The fix uses email-based checks. To make a user admin:

### Method 1: Update via SQL (Recommended)
```sql
-- Make yourself admin
UPDATE user_profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

### Method 2: Update via Dashboard
1. Go to Table Editor → user_profiles
2. Find your user
3. Edit the `role` column to `admin`

### Method 3: Sign up with admin email
- Use `admin@newomen.me` or `katerina@newomen.me`

---

## 📊 Impact Assessment

### Before Fix:
- ❌ Admin panel: Not loading
- ❌ Wellness library admin: 500 errors
- ❌ User profile queries: Failing
- ❌ Role checks: Infinite recursion

### After Fix:
- ✅ Admin panel: Working
- ✅ Wellness library admin: Loading
- ✅ User profile queries: Success
- ✅ Role checks: Email-based (fast & non-recursive)

---

## 🎯 Why This Works

### Email-Based Admin Check (Non-Recursive):
```sql
auth.jwt() ->> 'email' IN ('admin@newomen.me')
```
✅ Reads from JWT token (no database query)
✅ No recursion possible
✅ Fast and secure

### Role-Based Check (Recursive - DON'T USE):
```sql
EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_id = auth.uid()
  AND role = 'admin'
)
```
❌ Queries user_profiles from within user_profiles policy
❌ Creates infinite loop
❌ Results in 500 errors

---

## 🚀 Alternative: Use a Separate Admin Table (Future Enhancement)

For a more scalable solution, consider:

```sql
-- Create separate admin roles table
CREATE TABLE admin_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Then use in policies
CREATE POLICY "Admins access"
ON user_profiles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_roles
    WHERE admin_roles.user_id = auth.uid()
  )
);
```

This avoids recursion because the check is on a different table.

---

## 📝 Prevention Guidelines

### DO ✅:
- Use `auth.jwt()` for admin checks
- Use email whitelists for admin access
- Query separate tables for role checks
- Test RLS policies before deploying

### DON'T ❌:
- Query the same table from its own RLS policy
- Use nested EXISTS on the same table
- Check role from user_profiles in user_profiles policies
- Create circular dependencies

---

## 🔗 Resources

- **Supabase RLS Docs**: https://supabase.com/docs/guides/auth/row-level-security
- **JWT Functions**: https://supabase.com/docs/guides/database/functions#jwt-functions
- **Migration File**: `supabase/migrations/20251012100000_fix_rls_infinite_recursion.sql`

---

## ⚡ Quick Action

**Run this now in Supabase SQL Editor:**

```sql
-- Quick fix - just copy and paste this entire block
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow profile select" ON user_profiles;
DROP POLICY IF EXISTS "Allow own profile update" ON user_profiles;

CREATE POLICY "Users read own" ON user_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id OR auth.uid() = id);
CREATE POLICY "Users update own" ON user_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id OR auth.uid() = id);
CREATE POLICY "Users insert own" ON user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR auth.uid() = id);
CREATE POLICY "Admins read all" ON user_profiles FOR SELECT TO authenticated USING (auth.jwt() ->> 'email' IN ('admin@newomen.me', 'katerina@newomen.me'));
CREATE POLICY "Admins update all" ON user_profiles FOR UPDATE TO authenticated USING (auth.jwt() ->> 'email' IN ('admin@newomen.me', 'katerina@newomen.me'));

DROP POLICY IF EXISTS "Public read wellness resources" ON wellness_resources;
DROP POLICY IF EXISTS "Admins manage wellness resources" ON wellness_resources;

CREATE POLICY "Public read wellness" ON wellness_resources FOR SELECT TO public USING (status = 'active' OR status IS NULL);
CREATE POLICY "Admins manage wellness" ON wellness_resources FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('admin@newomen.me', 'katerina@newomen.me'));
```

**Then refresh the app!** 🎉

---

**Status**: ⚠️ **CRITICAL - APPLY IMMEDIATELY**
**Priority**: 🔴 **HIGH**
**Estimated Fix Time**: ⏱️ **2 minutes**

