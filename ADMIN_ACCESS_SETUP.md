# 👑 Admin & Moderation Access Setup Guide

**Version**: 1.0.0  
**Date**: October 16, 2025  

---

## Granting Admin Access to Katrina@newomen.me

### Quick Setup

The platform uses a role-based access control system where users have roles in the `user_profiles` table.

**Available Roles:**
- `user` - Regular user (default)
- `moderator` - Can moderate content
- `admin` - Full admin and moderation access

### Step-by-Step Instructions

#### Option 1: Via Supabase Dashboard SQL Editor (Recommended)

1. Go to **Supabase Dashboard** → Your Project
2. Click **SQL Editor** (left sidebar)
3. Create a new query
4. Copy and paste the SQL from `database/scripts/grant_katrina_admin_moderation.sql`:

```sql
-- Check if user exists
SELECT id, email, role FROM public.user_profiles 
WHERE lower(email) = lower('Katrina@newomen.me');

-- Grant admin role
UPDATE public.user_profiles
SET role = 'admin'
WHERE lower(email) = lower('Katrina@newomen.me');

-- Verify success
SELECT id, email, role FROM public.user_profiles 
WHERE lower(email) = lower('Katrina@newomen.me');
```

5. Click **Run** button
6. Verify the role shows as `'admin'` in the result

#### Option 2: Via Supabase CLI

```bash
# First, make sure the user has signed up through the app
# Then run:
npx supabase db execute --file database/scripts/grant_katrina_admin_moderation.sql
```

#### Option 3: Programmatically (In Your App)

```typescript
// This function can be called from the app or a backend
import { supabase } from '@/integrations/supabase/client';

async function grantAdminAccess(email: string) {
  const { error } = await supabase
    .from('user_profiles')
    .update({ role: 'admin' })
    .eq('email', email.toLowerCase());

  if (error) {
    console.error('Failed to grant admin access:', error);
    return false;
  }
  return true;
}

// Usage:
await grantAdminAccess('Katrina@newomen.me');
```

---

## Important Prerequisites

**The user must exist in the system before you can grant them admin access.**

### If Katrina@newomen.me Hasn't Signed Up Yet:

1. They need to sign up through the app at `/auth` 
2. After successful signup, they will have a `user_profiles` record
3. Then run the SQL above to grant admin access

### Verification Checklist

After running the SQL, verify:

- [ ] User exists in `user_profiles` table
- [ ] Role is set to `'admin'` (exactly, not `'ADMIN'` or other variants)
- [ ] Email matches (case-insensitive)
- [ ] User can access `/admin` route
- [ ] Admin panel loads successfully
- [ ] All moderation features are accessible

---

## Admin Access Verification

### Check Current Admin Status

**In Supabase:**
```sql
SELECT id, email, role, created_at 
FROM public.user_profiles 
WHERE lower(email) = lower('Katrina@newomen.me');
```

**Expected Result:**
| id | email | role | created_at |
|---|---|---|---|
| [uuid] | Katrina@newomen.me | admin | [timestamp] |

### Test in Application

1. Log in as `Katrina@newomen.me`
2. Navigate to `/admin`
3. Should see admin dashboard (not redirect to `/dashboard`)
4. Can access all admin features:
   - Analytics
   - User Management
   - Content Management
   - AI Configuration
   - Session Monitoring
   - Announcements

---

## Admin Capabilities

Once granted the `admin` role, Katrina@newomen.me will have access to:

### 📊 Analytics Dashboard
- User statistics
- System health monitoring
- Activity metrics
- Performance monitoring

### 👥 User Management
- View all users
- Update user profiles
- Manage user roles
- Ban/unban users

### 📝 Content Management
- Create/edit content
- Manage resources
- Generate content with AI
- Review submissions

### ⚙️ System Settings
- AI provider configuration
- Voice training setup
- API settings
- Feature flags
- Announcements

### 🔍 Moderation Tools
- Content moderation
- User reports
- Community guidelines
- Violation tracking

---

## Database Schema

The admin access is controlled by the `user_profiles` table:

```sql
CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role text NOT NULL DEFAULT 'user' 
    CHECK (role IN ('user', 'admin', 'moderator')),
  -- ... other columns
);
```

**Key Points:**
- Role is case-sensitive (`'admin'` not `'ADMIN'`)
- Role is required, defaults to `'user'`
- Valid values: `'user'`, `'admin'`, `'moderator'`

---

## Security Notes

### Access Control in Code

The system checks admin status in multiple places:

**1. Frontend (React)**
- `AdminRoute` component redirects non-admins
- `useAdmin` hook checks role before rendering admin UI

**2. Backend (RLS Policies)**
- Database row-level security enforces admin-only access to sensitive data
- Prevents direct SQL abuse

**3. API Layer**
- Edge functions validate admin status
- Service role credentials encrypted

### Best Practices

✅ **DO:**
- Use the SQL script for setup
- Verify role change immediately after
- Test access in the application
- Keep admin email secure
- Document who has admin access
- Rotate admin credentials periodically

❌ **DON'T:**
- Manually edit the database without proper checks
- Grant admin access to untrusted users
- Leave default admin accounts active
- Share admin credentials
- Use admin account for regular user actions

---

## Troubleshooting

### Issue: User still can't access admin panel

**Solution:**
1. Verify role is exactly `'admin'` (case-sensitive)
2. Clear browser cache and cookies
3. Log out and log back in
4. Check that `user_id` matches the auth user ID

```sql
-- Debug query
SELECT 
  up.id,
  up.email,
  up.role,
  au.id as auth_id,
  au.email as auth_email
FROM public.user_profiles up
JOIN auth.users au ON up.user_id = au.id
WHERE lower(up.email) = lower('Katrina@newomen.me');
```

### Issue: "Role not found" error

**Solution:**
- User must exist in both `auth.users` and `user_profiles`
- The user must have signed up first
- Check the user wasn't deleted

### Issue: Role reverted to 'user'

**Solution:**
- Check if there's an automatic trigger resetting the role
- Verify the `handle_new_user` trigger logic
- Look for any competing migrations

---

## Granting Multiple Admin Accounts

To add additional admin users:

```sql
-- Add multiple admins
UPDATE public.user_profiles
SET role = 'admin'
WHERE lower(email) IN (
  lower('Katrina@newomen.me'),
  lower('admin@newomen.me'),
  lower('another-admin@newomen.me')
);

-- Verify all admins
SELECT email, role FROM public.user_profiles
WHERE role = 'admin'
ORDER BY email;
```

---

## Revoking Admin Access

If you need to remove admin access:

```sql
-- Revoke admin access
UPDATE public.user_profiles
SET role = 'user'
WHERE lower(email) = lower('Katrina@newomen.me');

-- Verify change
SELECT email, role FROM public.user_profiles
WHERE lower(email) = lower('Katrina@newomen.me');
```

---

## Support

If you encounter issues:

1. Check `database/scripts/grant_katrina_admin_moderation.sql`
2. Review the `useAdmin` hook in `src/hooks/features/admin/useAdmin.tsx`
3. Check browser console for error messages
4. Review Supabase logs for database errors

---

## Status ✅

**Admin Access Setup**: Ready for production  
**Katrina@newomen.me**: Ready to receive admin access  
**Date Configured**: October 16, 2025  

All components are in place. Follow the steps above to grant access.
