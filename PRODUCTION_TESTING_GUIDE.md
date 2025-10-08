# 🧪 Production Testing Guide

Comprehensive testing checklist for production deployment.

---

## Pre-Deployment Testing

Run these tests BEFORE deploying to production:

### Build & Code Quality

- [x] `npm run build` succeeds without errors
- [x] `npm run lint` passes (warnings acceptable)
- [ ] No TypeScript errors in IDE
- [ ] All imports resolve correctly
- [ ] No console.error() in production code

### Local Testing

Start dev server: `npm run dev`

**Authentication:**
- [ ] Sign up with new email works
- [ ] Email verification link received
- [ ] Login with credentials works
- [ ] Logout works
- [ ] Password reset flow works
- [ ] Session persists on page reload

**Dashboard:**
- [ ] Dashboard loads after login
- [ ] User profile data displays
- [ ] Navigation menu works
- [ ] Gamification stats show correctly
- [ ] Featured cards are clickable

**Profile:**
- [ ] Profile page loads
- [ ] Avatar upload works (requires Supabase storage)
- [ ] Edit profile form saves
- [ ] Achievements display
- [ ] Progress bars render

**Wellness Library:**
- [ ] Audio resources load
- [ ] Audio player plays/pauses
- [ ] Search filters resources
- [ ] Category filters work
- [ ] Download button works

**Community:**
- [ ] User search finds users
- [ ] Send connection request works
- [ ] Pending requests show
- [ ] Accept/decline request works
- [ ] Connections list displays

**Narrative Exploration:**
- [ ] Form renders all 10 questions
- [ ] Validation enforces min 50 chars
- [ ] Progress saves on back/forward
- [ ] Submit triggers AI analysis (requires OpenAI)
- [ ] Results display with insights

**Account Settings:**
- [ ] All tabs accessible
- [ ] Subscription info displays
- [ ] Privacy toggles save
- [ ] Data export downloads JSON
- [ ] Account deletion confirmation works

---

## Post-Deployment Testing

Run these tests AFTER deploying to production:

### Smoke Tests

**Homepage (Public):**
```
URL: https://yourapp.vercel.app (or https://mirxa.io)
```
- [ ] Page loads in < 3 seconds
- [ ] No JavaScript errors in console
- [ ] All images load
- [ ] Navigation menu works
- [ ] "Get Started" button redirects to /auth

**Authentication Flow:**
```
URL: /auth
```
- [ ] Sign up form submits
- [ ] Verification email received
- [ ] Login redirects to /dashboard
- [ ] Protected routes redirect to /auth if not logged in

**Dashboard:**
```
URL: /dashboard (requires login)
```
- [ ] User data loads from Supabase
- [ ] Real-time updates work (if applicable)
- [ ] No CORS errors
- [ ] API calls return data

**Admin Panel:**
```
URL: /admin (requires admin role)
```
- [ ] Admin users can access
- [ ] Non-admin users redirected
- [ ] All admin tabs load
- [ ] Content management works
- [ ] AI configuration syncs

### API Integration Tests

**Supabase Connection:**
```bash
# Test auth endpoint
curl https://YOUR_SUPABASE_URL/auth/v1/health

# Expected: {"version":"...","health":"ok"}
```

**Edge Functions:**
```bash
# Test realtime-token
curl -X POST https://YOUR_SUPABASE_URL/functions/v1/realtime-token \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"

# Expected: 200 OK with token
```

**Database Queries:**
```bash
# Test public table access
curl https://YOUR_SUPABASE_URL/rest/v1/wellness_resources?select=*&limit=5 \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Expected: Array of wellness resources
```

### Performance Tests

**Use Lighthouse (Chrome DevTools):**

1. Open Chrome DevTools (F12)
2. Navigate to Lighthouse tab
3. Select "Performance" category
4. Click "Analyze page load"

**Target Metrics:**
- [ ] Performance Score > 80
- [ ] First Contentful Paint < 1.8s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Total Blocking Time < 200ms
- [ ] Cumulative Layout Shift < 0.1

**Use WebPageTest (https://www.webpagetest.org/):**

1. Enter your production URL
2. Select test location closest to users
3. Run test

**Target Metrics:**
- [ ] Start Render < 1.5s
- [ ] Speed Index < 3.0s
- [ ] Time to Interactive < 3.5s

### Security Tests

**SSL/HTTPS:**
```bash
# Check SSL certificate
curl -I https://mirxa.io

# Expected: HTTP/2 200
```

**Headers:**
```bash
# Check security headers
curl -I https://mirxa.io | grep -i "content-security-policy\|x-frame-options\|strict-transport-security"

# Expected: Security headers present
```

**RLS Policies:**
```sql
-- In Supabase SQL Editor
-- Try to access another user's data (should fail)
SELECT * FROM user_profiles WHERE user_id != auth.uid();

-- Expected: Empty result (RLS blocks access)
```

### Load Tests (Optional but Recommended)

**Use Artillery (https://www.artillery.io/):**

```yaml
# load-test.yml
config:
  target: "https://mirxa.io"
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Homepage Load"
    flow:
      - get:
          url: "/"
```

Run: `npx artillery run load-test.yml`

**Target Metrics:**
- [ ] Response time p95 < 500ms
- [ ] Error rate < 1%
- [ ] Successful requests > 99%

---

## Critical User Journeys

Test these complete flows end-to-end:

### Journey 1: New User Onboarding

1. Visit homepage
2. Click "Get Started"
3. Sign up with email/password
4. Verify email
5. Complete onboarding
6. Land on dashboard
7. Explore narrative identity
8. Complete 10 questions
9. View AI analysis

**Expected:** Smooth flow, no errors, all data saved.

### Journey 2: Returning User

1. Visit homepage
2. Click "Login"
3. Enter credentials
4. Redirect to dashboard
5. View progress since last visit
6. Upload profile avatar
7. Connect with another user
8. Play wellness audio

**Expected:** Session restored, data persists, features work.

### Journey 3: Subscription Purchase (If PayPal Enabled)

1. Login as user
2. Navigate to /account-settings
3. Click "Upgrade to Growth"
4. Complete PayPal checkout
5. Return to app
6. Verify subscription updated
7. Check conversation minutes added
8. Receive confirmation email

**Expected:** Payment processed, subscription active, minutes credited.

### Journey 4: Admin Workflow

1. Login as admin user
2. Navigate to /admin
3. Sync AI providers
4. Create new assessment
5. Publish content to users
6. Monitor live sessions
7. View analytics

**Expected:** Admin features functional, content published successfully.

---

## Browser Compatibility Testing

Test on these browsers:

**Desktop:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Mobile:**
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Samsung Internet

**Test Cases:**
- [ ] Homepage renders correctly
- [ ] Authentication works
- [ ] Dashboard is responsive
- [ ] Forms submit correctly
- [ ] Audio player works
- [ ] Modals/dialogs display properly

---

## Automated Testing (Future Enhancement)

### Unit Tests (Recommended Setup)

```bash
# Install testing framework
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom

# Create test file
# src/components/__tests__/Dashboard.test.tsx
```

### Integration Tests

```bash
# Install Playwright
npm install --save-dev @playwright/test

# Run tests
npx playwright test
```

### E2E Tests

```typescript
// tests/auth.spec.ts
import { test, expect } from '@playwright/test';

test('user can sign up and login', async ({ page }) => {
  await page.goto('/auth');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

---

## Monitoring & Alerts

### Set Up Monitoring

**Vercel Analytics:**
- [ ] Enable in Vercel Dashboard
- [ ] Install `@vercel/analytics` package
- [ ] Add `<Analytics />` to root component

**Supabase Logs:**
- [ ] Enable query performance tracking
- [ ] Set up slow query alerts (>1000ms)
- [ ] Monitor Edge Function errors

**Error Tracking (Recommended):**
```bash
# Install Sentry
npm install @sentry/react @sentry/vite-plugin

# Configure in src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

### Alert Thresholds

Set up alerts for:
- [ ] Error rate > 5%
- [ ] Response time p95 > 2000ms
- [ ] Database connections > 80%
- [ ] Storage usage > 80%
- [ ] Edge Function failures > 10%

---

## Regression Testing

After any deployment, re-run:

1. **Critical Path Tests:**
   - Authentication flow
   - Dashboard load
   - Core feature (narrative exploration)

2. **API Health Checks:**
   - Supabase connection
   - Edge Functions responding
   - Database queries working

3. **Performance Spot Check:**
   - Run Lighthouse on homepage
   - Check API response times

---

## Bug Reporting

When finding bugs, document:

**Title:** Brief description  
**Environment:** Production/Staging/Local  
**Browser:** Chrome 120.0.6099.109  
**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected:** What should happen  
**Actual:** What actually happened  
**Screenshot:** Attach if applicable  
**Console Errors:** Copy/paste any errors  

---

## Sign-Off Checklist

Before declaring production ready:

**Functionality:**
- [ ] All critical user journeys tested and passing
- [ ] No blocking bugs found
- [ ] Payment flow tested (if applicable)
- [ ] Admin features verified

**Performance:**
- [ ] Lighthouse score > 80
- [ ] Page load time < 3s
- [ ] No memory leaks detected

**Security:**
- [ ] RLS policies verified
- [ ] API keys not exposed
- [ ] HTTPS enforced
- [ ] CORS configured correctly

**Observability:**
- [ ] Logging enabled
- [ ] Error tracking configured
- [ ] Analytics installed
- [ ] Alerts set up

**Documentation:**
- [ ] User guide updated
- [ ] API docs current
- [ ] Deployment notes recorded
- [ ] Known issues documented

---

## Resources

- **Lighthouse:** Chrome DevTools → Lighthouse
- **WebPageTest:** https://www.webpagetest.org/
- **Supabase Logs:** https://supabase.com/dashboard/project/fkikaozubngmzcrnhkqe/logs
- **Vercel Analytics:** https://vercel.com/dashboard
- **Sentry:** https://sentry.io/

---

**Last Updated:** 2025-10-08  
**Test Status:** Ready for execution  
**Next Review:** After first production deployment
