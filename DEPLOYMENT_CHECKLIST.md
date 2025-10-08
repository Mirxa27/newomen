# ✅ Post-Deployment Checklist
## Newomen Platform - October 8, 2025

---

## 🎯 Immediate Actions (Next 24 Hours)

### 1. Domain Configuration
- [ ] Log into Vercel Dashboard
- [ ] Navigate to Project Settings → Domains
- [ ] Add custom domain: `newomen.me`
- [ ] Copy DNS records provided by Vercel
- [ ] Update DNS at domain registrar:
  - [ ] Add A record pointing to Vercel's IP
  - [ ] Add CNAME for www subdomain
- [ ] Wait for DNS propagation (5-60 minutes)
- [ ] Verify SSL certificate is issued automatically

**Expected Result**: Site accessible at https://newomen.me

---

### 2. Environment Variables Verification
- [ ] Open Vercel Dashboard → Settings → Environment Variables
- [ ] Verify these are set for Production:
  - [ ] `VITE_SUPABASE_URL` = `https://fkikaozubngmzcrnhkqe.supabase.co`
  - [ ] `VITE_SUPABASE_ANON_KEY` = `eyJhbGci...` (anon key)
- [ ] If adding PayPal:
  - [ ] `VITE_PAYPAL_CLIENT_ID` = Your PayPal Client ID
- [ ] Redeploy if any variables were added/changed

**Expected Result**: All features work with correct API connections

---

### 3. Database Health Check
- [ ] Open Supabase Dashboard
- [ ] Navigate to Database → Tables
- [ ] Verify these tables exist:
  - [ ] user_profiles
  - [ ] user_memory_profiles (with narrative_identity_data column)
  - [ ] sessions
  - [ ] messages
  - [ ] assessments
  - [ ] achievements
  - [ ] community_connections
  - [ ] wellness_resources
  - [ ] subscriptions
- [ ] Navigate to Database → Migrations
- [ ] Confirm all 38 migrations are applied

**Expected Result**: Database fully synchronized

---

### 4. Edge Functions Verification
- [ ] Open Supabase Dashboard → Edge Functions
- [ ] Verify all functions show "ACTIVE" status:
  - [ ] ai-content-builder (v59+)
  - [ ] provider-discovery (v61+)
  - [ ] realtime-token (v73+)
  - [ ] paypal-create-order (v52+)
  - [ ] paypal-capture-order (v53+)
  - [ ] gamification-engine (v22+)
  - [ ] couples-challenge-analyzer (v22+)
- [ ] Click each function → View Logs
- [ ] Look for any errors in recent logs

**Expected Result**: All functions healthy, no error logs

---

### 5. Storage Bucket Setup
- [ ] Open Supabase Dashboard → Storage
- [ ] Verify "avatars" bucket exists
- [ ] If not, create bucket:
  - [ ] Name: `avatars`
  - [ ] Public: Yes
  - [ ] File size limit: 5 MB
  - [ ] Allowed MIME types: `image/jpeg, image/png, image/webp`
- [ ] Navigate to Policies tab
- [ ] Verify RLS policies exist for:
  - [ ] Public read access
  - [ ] Authenticated user upload (own files only)
  - [ ] Authenticated user delete (own files only)

**Expected Result**: Users can upload profile avatars

---

## 🧪 Testing Checklist (Critical Paths)

### User Registration & Login
- [ ] Navigate to /auth
- [ ] Sign up with new email
- [ ] Check email for confirmation (if enabled)
- [ ] Verify redirect to dashboard
- [ ] Log out
- [ ] Log back in
- [ ] Verify session persists

**Expected Result**: Smooth authentication flow

---

### Profile Management
- [ ] Navigate to /profile
- [ ] Click avatar to upload image
- [ ] Upload a test image (< 5 MB)
- [ ] Verify image displays correctly
- [ ] Edit nickname
- [ ] Save changes
- [ ] Refresh page, verify changes persist

**Expected Result**: Profile updates work

---

### Narrative Identity Exploration
- [ ] Navigate to /narrative-exploration
- [ ] Answer all 10 questions (50+ chars each)
- [ ] Click "Submit for Analysis"
- [ ] Wait for AI analysis to complete
- [ ] Verify results display:
  - [ ] Personality archetype
  - [ ] Core themes (3-5)
  - [ ] Strength patterns (3-5)
  - [ ] Limiting beliefs (2-4)
  - [ ] Transformation roadmap (4-5 steps)

**Expected Result**: AI analysis completes and displays results

---

### Wellness Library
- [ ] Navigate to /wellness-library
- [ ] Click play on "Morning Meditation"
- [ ] Verify audio plays
- [ ] Test pause button
- [ ] Test progress scrubbing
- [ ] Try filtering by category
- [ ] Try search functionality
- [ ] Click download button

**Expected Result**: Audio player works, filtering works

---

### Community Features
- [ ] Navigate to /community
- [ ] Go to "Find Users" tab
- [ ] Search for another user by nickname
- [ ] Send connection request
- [ ] (As other user) Accept request
- [ ] Verify connection appears in "My Connections"

**Expected Result**: User connections work

---

### Account Settings
- [ ] Navigate to /account-settings
- [ ] Test all four tabs:
  - [ ] Account: View email, request password reset
  - [ ] Subscription: View current tier
  - [ ] Privacy: Toggle visibility settings, save
  - [ ] Notifications: Toggle preferences, save
- [ ] Click "Download My Data"
- [ ] Verify JSON file downloads with user data

**Expected Result**: All settings persist, data export works

---

### Admin Panel (Admin Users Only)
- [ ] Log in with admin@newomen.me
- [ ] Navigate to /admin
- [ ] Test Content Management:
  - [ ] Add new affirmation
  - [ ] Delete affirmation
  - [ ] Add couples challenge
- [ ] Test AI Configuration:
  - [ ] View providers
  - [ ] Click "Sync Providers"
  - [ ] Verify sync completes
- [ ] Test Sessions Live:
  - [ ] View active sessions (if any)
- [ ] Test Analytics:
  - [ ] View charts and metrics

**Expected Result**: All admin tools functional

---

### PayPal Integration (If Configured)
- [ ] Navigate to /account-settings → Subscription tab
- [ ] Click "Upgrade to Growth Plan"
- [ ] Complete PayPal checkout (sandbox mode)
- [ ] Verify subscription updates in database
- [ ] Check subscription tier badge updates

**Expected Result**: Payment flow completes, subscription activates

---

## 🔍 Monitoring Setup

### Error Tracking (Recommended)
- [ ] Sign up for Sentry (sentry.io)
- [ ] Install Sentry SDK: `npm install @sentry/react`
- [ ] Add Sentry init to `src/main.tsx`
- [ ] Set `VITE_SENTRY_DSN` in Vercel env vars
- [ ] Redeploy
- [ ] Test error tracking works

---

### Analytics (Recommended)
- [ ] Sign up for analytics service:
  - Option 1: Google Analytics 4
  - Option 2: Mixpanel
  - Option 3: Posthog
- [ ] Add tracking script to `index.html`
- [ ] Set tracking ID in Vercel env vars
- [ ] Redeploy
- [ ] Test events are tracked

---

### Uptime Monitoring (Recommended)
- [ ] Sign up for uptime monitoring:
  - Option 1: UptimeRobot (free)
  - Option 2: Pingdom
  - Option 3: StatusCake
- [ ] Add monitor for: https://newomen.me
- [ ] Set up alerts (email, SMS)
- [ ] Test alert by stopping Vercel deployment

---

## 📊 Performance Optimization

### Lighthouse Audit
- [ ] Open Chrome DevTools
- [ ] Run Lighthouse audit on:
  - [ ] Landing page (/)
  - [ ] Dashboard (/dashboard)
  - [ ] Profile (/profile)
- [ ] Target scores:
  - [ ] Performance: 90+
  - [ ] Accessibility: 95+
  - [ ] Best Practices: 95+
  - [ ] SEO: 90+
- [ ] Address any critical issues found

---

### Bundle Size Optimization (Optional)
- [ ] Run: `npm run build -- --report`
- [ ] Analyze bundle with `source-map-explorer dist/assets/*.js`
- [ ] Consider code splitting for:
  - [ ] Admin pages (lazy load)
  - [ ] Heavy libraries (recharts, etc.)
- [ ] Implement if bundle > 1 MB gzipped

---

## 🔒 Security Hardening

### Headers Configuration
- [ ] Add to `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(self), geolocation=()" }
      ]
    }
  ]
}
```
- [ ] Redeploy
- [ ] Verify headers with: https://securityheaders.com

---

### Rate Limiting (Recommended)
- [ ] Set up Supabase rate limiting for Edge Functions
- [ ] Configure auth rate limits in Supabase Dashboard
- [ ] Test rate limits with rapid API calls

---

### Secrets Rotation
- [ ] Document process for rotating:
  - [ ] Supabase service role key
  - [ ] OpenAI API key
  - [ ] PayPal credentials
- [ ] Set calendar reminder for 90-day rotation

---

## 📱 Mobile Testing

### iOS Safari
- [ ] Test on iPhone SE (320px width)
- [ ] Test on iPhone 13 (390px width)
- [ ] Test on iPhone 14 Pro Max (428px width)
- [ ] Test on iPad (768px width)
- [ ] Verify touch targets work (44px minimum)
- [ ] Verify no horizontal scroll
- [ ] Test audio playback in wellness library

---

### Android Chrome
- [ ] Test on small Android (360px width)
- [ ] Test on medium Android (412px width)
- [ ] Test on large Android (540px width)
- [ ] Test on Android tablet (768px width)
- [ ] Verify touch targets work
- [ ] Test audio playback

---

## 📧 Email Configuration

### Transactional Emails
- [ ] Open Supabase Dashboard → Authentication → Email Templates
- [ ] Customize templates:
  - [ ] Confirmation email
  - [ ] Password reset email
  - [ ] Magic link email
- [ ] Add branding (logo, colors)
- [ ] Test each template

---

### SMTP Configuration (Optional)
- [ ] If using custom SMTP:
  - [ ] Configure in Supabase Dashboard
  - [ ] Test email delivery
  - [ ] Verify SPF/DKIM records

---

## 📈 User Onboarding

### First User Experience
- [ ] Create test account
- [ ] Go through full onboarding flow
- [ ] Time how long each step takes
- [ ] Note any confusing parts
- [ ] Gather feedback from 5 beta testers
- [ ] Iterate on onboarding based on feedback

---

### Welcome Content
- [ ] Create welcome email campaign (if using email service)
- [ ] Add tutorial tooltips to dashboard
- [ ] Create video walkthroughs for key features
- [ ] Add FAQ section to About page

---

## 🎯 Marketing Launch

### Pre-Launch
- [ ] Prepare launch announcement
- [ ] Create social media posts
- [ ] Set up social media accounts:
  - [ ] Twitter/X
  - [ ] LinkedIn
  - [ ] Instagram (optional)
- [ ] Write blog post about platform launch
- [ ] Reach out to beta testers

---

### Launch Day
- [ ] Post on social media
- [ ] Send email to beta testers
- [ ] Post on relevant communities:
  - [ ] Product Hunt
  - [ ] Reddit (r/selfimprovement, r/productivity)
  - [ ] Hacker News (Show HN)
- [ ] Monitor for traffic spikes
- [ ] Respond to feedback quickly

---

### Post-Launch (Week 1)
- [ ] Monitor error logs daily
- [ ] Track key metrics:
  - [ ] Sign-ups
  - [ ] Active users
  - [ ] Narrative explorations completed
  - [ ] Subscription conversions
- [ ] Gather user feedback
- [ ] Create prioritized backlog for improvements

---

## 🐛 Known Issues to Monitor

### Low Priority Items
1. **Mock Assessment Stats** (pages/AssessmentTest.tsx)
   - Stats use placeholder data
   - Database table exists, needs population logic
   - Impact: Low (UI display only)

2. **Gamification Settings Mock Save** (admin/GamificationSettings.tsx)
   - Save is simulated
   - Backend table may be needed
   - Impact: Low (admin-only feature)

3. **Large Bundle Warning**
   - React core is 887 KB (245 KB gzipped)
   - Consider code splitting for admin pages
   - Impact: Low (still acceptable performance)

---

## ✅ Success Metrics

### Technical KPIs
- [ ] 99.9% uptime (track with monitoring)
- [ ] < 3 second page load time (Lighthouse)
- [ ] < 1% error rate (Sentry)
- [ ] Zero security vulnerabilities (npm audit)

### User KPIs
- [ ] 100+ sign-ups in first week
- [ ] 50% complete narrative exploration
- [ ] 20% create community connections
- [ ] 5% convert to paid subscriptions

### Business KPIs
- [ ] $1000+ MRR in first month
- [ ] < $100 CAC (customer acquisition cost)
- [ ] 70%+ user retention (30-day)
- [ ] 4.5+ star rating (if collecting reviews)

---

## 📞 Emergency Contacts

### Critical Issues
- **Vercel Support**: https://vercel.com/help
- **Supabase Support**: https://supabase.com/support
- **OpenAI Support**: https://help.openai.com

### Rollback Procedure
If critical issues arise:
1. Go to Vercel Dashboard
2. Click "Deployments"
3. Find last working deployment
4. Click "..." → "Promote to Production"
5. Confirm rollback
6. Investigate issue locally
7. Deploy fix when ready

---

## 🎉 Completion

**Once all items are checked:**
- [ ] Mark deployment as stable
- [ ] Update team/stakeholders
- [ ] Celebrate launch! 🎊
- [ ] Plan next iteration

---

**Current Status**: Deployed to Production ✅  
**Next Review**: 24 hours post-launch  
**Version**: 1.0.0  
**Deployed**: October 8, 2025
