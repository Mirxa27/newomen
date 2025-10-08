# 🚀 Production Deployment Checklist

This is the comprehensive checklist for deploying the NewWomen platform to production on Vercel with Mirxa.io domain.

---

## Prerequisites Verified ✅

- [x] Repository cloned and dependencies installed
- [x] TypeScript compilation passes (0 errors)
- [x] Build succeeds without errors
- [x] Supabase project exists: `fkikaozubngmzcrnhkqe`
- [x] Environment variables configured in `.env`
- [x] All 37 database migrations available
- [x] 7 Edge Functions ready for deployment

---

## Phase 1: Database Setup

### 1.1 Apply All Migrations

The migrations are already in the repository. They need to be applied to Supabase:

```bash
# Login to Supabase (requires access token)
npx supabase login

# Link to the project
npx supabase link --project-ref fkikaozubngmzcrnhkqe

# Push all migrations
npx supabase db push
```

**Alternative: Manual Application via Dashboard**
1. Go to https://supabase.com/dashboard/project/fkikaozubngmzcrnhkqe/sql
2. Apply migrations in chronological order from `supabase/migrations/`
3. Verify each migration succeeds before applying the next

**Migration Files (37 total):**
- Core Setup: `user_profiles`, `assessments`, `gamification`, `community`
- AI Features: `ai_powered_assessments`, `ai_configurations_system`, `newme_memory_system`
- Admin: `admin_overhaul`, `add_user_role`, `add_moderator_role`
- Fixes: `fix_signup_trigger`, `fix_chat_rls_policy`, `fix_auth_trigger`

### 1.2 Create Storage Buckets

**Via Supabase CLI:**
```bash
npx supabase storage create avatars --public
```

**Via Dashboard:**
1. Navigate to Storage → New bucket
2. Name: `avatars`
3. Public: `true`
4. File size limit: `5MB`
5. Allowed MIME types: `image/jpeg, image/png, image/webp`

### 1.3 Verify RLS Policies

Run this SQL to ensure RLS policies are active:

```sql
-- Check if RLS is enabled on critical tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'assessments', 'wellness_resources', 'community_connections');

-- Verify storage policies
SELECT * FROM storage.policies WHERE bucket_id = 'avatars';
```

Expected: All tables should have `rowsecurity = true` and storage bucket should have 4 policies (SELECT, INSERT, UPDATE, DELETE).

---

## Phase 2: Edge Functions Deployment

### 2.1 Configure Secrets

**Navigate to:** Supabase Dashboard → Edge Functions → Function Settings → Secrets

Add the following secrets:

```bash
# Required for AI features
OPENAI_API_KEY=sk-...

# Optional for voice synthesis  
ELEVENLABS_API_KEY=...

# Optional for PayPal payments
PAYPAL_CLIENT_ID=...
PAYPAL_SECRET=...
PAYPAL_MODE=live  # or 'sandbox' for testing
```

### 2.2 Deploy Edge Functions

Deploy all 7 functions:

```bash
# Core AI features
npx supabase functions deploy ai-content-builder
npx supabase functions deploy provider-discovery
npx supabase functions deploy realtime-token

# Payment integration
npx supabase functions deploy paypal-create-order
npx supabase functions deploy paypal-capture-order

# Gamification & Analytics
npx supabase functions deploy gamification-engine
npx supabase functions deploy couples-challenge-analyzer
```

### 2.3 Test Edge Functions

```bash
# Test AI content builder
curl -X POST \
  https://fkikaozubngmzcrnhkqe.supabase.co/functions/v1/ai-content-builder \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -d '{"topic":"test","type":"assessment","isPublic":true}'

# Test realtime token
curl -X POST \
  https://fkikaozubngmzcrnhkqe.supabase.co/functions/v1/realtime-token \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```

Expected: 200 OK responses with valid JSON data.

---

## Phase 3: Vercel Deployment

### 3.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 3.2 Configure Environment Variables

**Create Vercel project and set environment variables:**

```bash
# Link to Vercel project (or create new)
vercel link

# Set production environment variables
vercel env add VITE_SUPABASE_URL production
# Enter: https://fkikaozubngmzcrnhkqe.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# Enter: YOUR_ANON_KEY

vercel env add VITE_SUPABASE_PROJECT_ID production
# Enter: fkikaozubngmzcrnhkqe

# Optional: PayPal integration
vercel env add VITE_PAYPAL_CLIENT_ID production
# Enter: YOUR_PAYPAL_CLIENT_ID
```

**Or via Dashboard:**
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add:
   - `VITE_SUPABASE_URL` = `https://fkikaozubngmzcrnhkqe.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (from `.env` file)
   - `VITE_SUPABASE_PROJECT_ID` = `fkikaozubngmzcrnhkqe`
   - `VITE_PAYPAL_CLIENT_ID` = (optional)

### 3.3 Deploy to Vercel

```bash
# Deploy to production
vercel --prod
```

**Or via GitHub Integration:**
1. Connect GitHub repository to Vercel
2. Configure build settings:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
3. Add environment variables
4. Deploy

### 3.4 Verify Deployment

After deployment, test:
- [ ] Homepage loads at Vercel URL
- [ ] Authentication works (sign up/login)
- [ ] Dashboard accessible after login
- [ ] API calls to Supabase succeed
- [ ] No console errors

---

## Phase 4: Domain Configuration (Mirxa.io)

### 4.1 Add Custom Domain to Vercel

**Via Vercel Dashboard:**
1. Project → Settings → Domains
2. Add Domain: `mirxa.io` and `www.mirxa.io`

### 4.2 Configure DNS

**Add these DNS records at your domain registrar:**

**For Apex Domain (mirxa.io):**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 60
```

**For WWW Subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 60
```

### 4.3 Wait for SSL Certificate

Vercel automatically provisions SSL certificates via Let's Encrypt. This takes 5-15 minutes.

### 4.4 Verify Domain

- [ ] `https://mirxa.io` loads correctly
- [ ] `https://www.mirxa.io` redirects to `https://mirxa.io`
- [ ] SSL certificate is valid (green padlock)
- [ ] No mixed content warnings

---

## Phase 5: Observability & Monitoring

### 5.1 Enable Vercel Analytics

```bash
# Add Vercel Analytics
npm install @vercel/analytics
```

Update `src/main.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';

// Add to root component
<Analytics />
```

### 5.2 Configure Supabase Logs

**In Supabase Dashboard:**
1. Navigate to Logs → Query Performance
2. Enable slow query logging (>1000ms)
3. Set up alerts for:
   - Database connections > 80%
   - Storage usage > 80%
   - Edge function errors > 5% rate

### 5.3 Set Up Error Tracking (Optional but Recommended)

**Option A: Sentry**
```bash
npm install @sentry/react @sentry/vite-plugin
```

**Option B: LogRocket**
```bash
npm install logrocket
```

---

## Phase 6: Testing & Validation

### 6.1 Smoke Tests

Run these tests on production:

**Authentication Flow:**
- [ ] Sign up with new email
- [ ] Receive verification email
- [ ] Log in with credentials
- [ ] Password reset works

**Core Features:**
- [ ] Dashboard loads user data
- [ ] Profile avatar upload works
- [ ] Wellness library audio plays
- [ ] Community connections work
- [ ] Narrative exploration completes
- [ ] Account settings save

**Admin Features:**
- [ ] Admin panel accessible to admin users
- [ ] Content management works
- [ ] AI configuration syncs
- [ ] Session monitoring displays

### 6.2 Performance Tests

Use Lighthouse or WebPageTest:

**Target Metrics:**
- [ ] First Contentful Paint < 1.8s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Total Blocking Time < 200ms
- [ ] Cumulative Layout Shift < 0.1
- [ ] Speed Index < 3.4s

### 6.3 Security Audit

- [ ] All API keys in environment variables (not in code)
- [ ] RLS policies enforce data access rules
- [ ] CORS headers properly configured
- [ ] HTTPS enforced (no HTTP access)
- [ ] CSP headers configured
- [ ] Rate limiting on API endpoints

---

## Phase 7: Post-Deployment

### 7.1 Create Admin User

```sql
-- In Supabase SQL Editor
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';
```

### 7.2 Populate Initial Content

**Wellness Resources:**
1. Navigate to `/admin/content-management`
2. Verify 8 wellness resources exist
3. Add more if needed

**AI Configurations:**
1. Navigate to `/admin/ai-configuration`
2. Sync providers
3. Configure default GPT-4 model

**Challenges:**
1. Add starter challenges
2. Set reward amounts
3. Publish to users

### 7.3 Documentation Updates

Update the following files:
- [x] `README.md` - Add production URL
- [ ] `DEPLOYMENT_PRODUCTION.md` - Mark as deployed
- [ ] `FEATURES_COMPLETED.md` - Update deployment status

### 7.4 Marketing Launch

- [ ] Announce on social media
- [ ] Send launch email to beta users
- [ ] Post on Product Hunt
- [ ] Update website with live demo link

---

## Success Criteria ✅

Your deployment is successful when:

- [x] All 37 database migrations applied
- [ ] All 7 Edge Functions deployed and responding
- [ ] Vercel deployment shows "Ready" status
- [ ] Custom domain (mirxa.io) resolves with SSL
- [ ] All smoke tests pass
- [ ] Performance metrics meet targets
- [ ] No critical errors in logs
- [ ] Admin access configured
- [ ] Initial content populated

---

## Rollback Plan

If deployment fails:

1. **Database Issues:**
   ```bash
   # Revert last migration
   npx supabase db reset --linked
   ```

2. **Edge Function Issues:**
   - Check function logs in Supabase Dashboard
   - Redeploy with fixes
   - Verify secrets are set

3. **Vercel Deployment Issues:**
   - Rollback to previous deployment in Vercel Dashboard
   - Check build logs for errors
   - Verify environment variables

4. **Domain Issues:**
   - Temporarily point DNS back to old hosting
   - Debug SSL/DNS propagation
   - Re-verify domain ownership

---

## Support Resources

- **Supabase Dashboard:** https://supabase.com/dashboard/project/fkikaozubngmzcrnhkqe
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Docs:** https://supabase.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Project Docs:** See `DEPLOYMENT_PRODUCTION.md`, `README.md`

---

## Status

**Current Phase:** Phase 1 - Database Setup  
**Deployment Status:** In Progress  
**Target Go-Live:** Pending completion of all phases  

**Last Updated:** 2025-10-08
