# 🚨 URGENT: Apply This SQL NOW to Fix Database Errors

## ⚠️ Your App Is Broken - Fix in 1 Minute!

**Error**: `infinite recursion detected in policy for relation "user_profiles"`

**What's Broken**:
- ❌ Admin panel not loading
- ❌ User profiles not loading
- ❌ Wellness library showing errors
- ❌ 500 errors everywhere

---

## ⚡ IMMEDIATE FIX (60 Seconds)

### Step 1: Open Supabase SQL Editor

1. Go to: https://app.supabase.com
2. Select project: `fkikaozubngmzcrnhkqe`
3. Click: **SQL Editor** (in left sidebar)
4. Click: **New Query**

### Step 2: Copy & Paste This SQL

**Copy the ENTIRE SQL below** and paste into the editor:

```sql
-- EMERGENCY FIX FOR RLS INFINITE RECURSION
-- Copy and run this entire block

-- Drop ALL old policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow profile select" ON user_profiles;
DROP POLICY IF EXISTS "Allow own profile update" ON user_profiles;
DROP POLICY IF EXISTS "Allow self profile creation" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_profiles;

-- Create new NON-RECURSIVE policies
CREATE POLICY "user_read_own" ON user_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id OR auth.uid() = id);

CREATE POLICY "user_update_own" ON user_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id OR auth.uid() = id) WITH CHECK (auth.uid() = user_id OR auth.uid() = id);

CREATE POLICY "user_insert_own" ON user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR auth.uid() = id);

CREATE POLICY "admin_read_all" ON user_profiles FOR SELECT TO authenticated USING (auth.jwt() ->> 'email' IN ('admin@newomen.me', 'katerina@newomen.me', 'Abdullah@sourcekom.com'));

CREATE POLICY "admin_update_all" ON user_profiles FOR UPDATE TO authenticated USING (auth.jwt() ->> 'email' IN ('admin@newomen.me', 'katerina@newomen.me', 'Abdullah@sourcekom.com')) WITH CHECK (auth.jwt() ->> 'email' IN ('admin@newomen.me', 'katerina@newomen.me', 'Abdullah@sourcekom.com'));

-- Fix wellness_resources
DROP POLICY IF EXISTS "Public read wellness resources" ON wellness_resources;
DROP POLICY IF EXISTS "Admins manage wellness resources" ON wellness_resources;
DROP POLICY IF EXISTS "Public read wellness" ON wellness_resources;
DROP POLICY IF EXISTS "Admins manage wellness" ON wellness_resources;

CREATE POLICY "wellness_public_read" ON wellness_resources FOR SELECT TO public USING (status = 'active' OR status IS NULL);

CREATE POLICY "wellness_admin_all" ON wellness_resources FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('admin@newomen.me', 'katerina@newomen.me', 'Abdullah@sourcekom.com')) WITH CHECK (auth.jwt() ->> 'email' IN ('admin@newomen.me', 'katerina@newomen.me', 'Abdullah@sourcekom.com'));
```

### Step 3: Run It!

Click **RUN** button (or press Ctrl+Enter / Cmd+Enter)

You should see: ✅ **"Success. No rows returned"**

### Step 4: Refresh Your App

Press **Cmd+Shift+R** (Mac) or **Ctrl+Shift+F5** (Windows)

---

## ✅ Verification

After applying the fix, your app should:
- ✅ Load without 500 errors
- ✅ User profiles load correctly
- ✅ Admin panel accessible
- ✅ Wellness library works
- ✅ No infinite recursion errors

---

## 🎯 What This Does

**Before (Broken)**:
```sql
-- This creates infinite loop! ❌
USING (
  EXISTS (
    SELECT 1 FROM user_profiles  -- Queries same table!
    WHERE role = 'admin'          -- Creates recursion!
  )
)
```

**After (Fixed)**:
```sql
-- This checks JWT token directly ✅
USING (
  auth.jwt() ->> 'email' IN ('admin@newomen.me')  -- No database query!
)
```

---

## 🚀 Quick Test

After applying, test these URLs:

1. **Dashboard**: Should load without errors
2. **Admin Panel**: `http://localhost:5173/admin`
3. **Wellness Library**: `http://localhost:5173/wellness-library`
4. **Wellness Admin**: `http://localhost:5173/admin/wellness-library`

All should work now! ✅

---

## 💡 Admin Access

To access admin features, login with one of these emails:
- admin@newomen.me
- katerina@newomen.me
- Abdullah@sourcekom.com

These are hardcoded in the new policies (no database lookup = no recursion!)

---

## ⏱️ Time to Fix

**Total time**: 60 seconds
**Difficulty**: Just copy/paste
**Impact**: Fixes entire app ✅

---

## 🆘 If It Still Doesn't Work

1. **Check** SQL ran successfully (green checkmark)
2. **Clear browser cache** completely
3. **Try incognito window** to test
4. **Check** Supabase project ID matches: `fkikaozubngmzcrnhkqe`
5. **View** Table Editor → user_profiles → Policies tab (should see new policies)

---

## 🎉 After Fixing

Once this is applied, your app will be **fully functional**! Then you can:
- Add wellness resources
- Manage users
- Configure PayPal
- Launch to users

---

**Status**: ⚠️ APPLY IMMEDIATELY
**File**: `apply_rls_fix_now.sql`
**Method**: Supabase SQL Editor
**Time**: 60 seconds
**Impact**: Fixes entire app ✅

