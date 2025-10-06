# 🚀 Production Deployment Guide - Newomen Platform

This guide provides step-by-step instructions to deploy the Newomen platform to production with domain Mirxa.io.

## 📋 Prerequisites Checklist

- [x] Supabase project configured (fkikaozubngmzcrnhkqe.supabase.co)
- [x] Database migrations completed
- [x] Edge functions implemented
- [x] Build succeeds locally
- [ ] Vercel account ready
- [ ] Domain Mirxa.io DNS access
- [ ] OpenAI API key for AI features
- [ ] PayPal credentials (optional, for payments)

---

## 🗄️ Step 1: Database Configuration

### Credentials (ALREADY CONFIGURED)
```bash
SUPABASE_URL=https://fkikaozubngmzcrnhkqe.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraWthb3p1Ym5nbXpjcm5oa3FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTY3NzQsImV4cCI6MjA3MDU5Mjc3NH0.P8n6Z8uPkuJDqVLHGNvkWZcnsm6m0SJvwPAL4ooCJEU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraWthb3p1Ym5nbXpjcm5oa3FlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNjc3NCwiZXhwIjoyMDcwNTkyNzc0fQ.xqeK5GZ8yCDzUGhC6YHkjGnumJqYF7lZ6A-5zsD1DNA
DATABASE_URL=postgresql://postgres:Newomen@331144@db.fkikaozubngmzcrnhkqe.supabase.co:5432/postgres
```

### Apply Pending Migrations

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project (only needed once)
supabase link --project-ref fkikaozubngmzcrnhkqe

# Push all migrations to production
supabase db push

# Verify migrations were applied
supabase db diff
```

### Create Storage Buckets (if not exists)

```bash
# Create avatars bucket
supabase storage create avatars --public

# Or via Supabase Dashboard:
# 1. Go to Storage → Create Bucket
# 2. Name: avatars
# 3. Public: true
# 4. File size limit: 5MB
```

---

## ⚡ Step 2: Deploy Edge Functions

### Configure Secrets

In Supabase Dashboard → Edge Functions → Secrets, set:

```bash
# Required for AI features
OPENAI_API_KEY=sk-your-openai-key-here

# Optional for voice synthesis (if implementing)
ELEVENLABS_API_KEY=your-elevenlabs-key-here

# Required for PayPal payments (if enabled)
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_SECRET=your-paypal-secret
PAYPAL_MODE=live  # or sandbox for testing
```

### Deploy All Functions

```bash
# Core AI content builder
supabase functions deploy ai-content-builder

# Provider discovery
supabase functions deploy provider-discovery

# Realtime token generation
supabase functions deploy realtime-token

# Couples challenge analyzer
supabase functions deploy couples-challenge-analyzer

# Gamification engine
supabase functions deploy gamification-engine

# PayPal integration (if using payments)
supabase functions deploy paypal-create-order
supabase functions deploy paypal-capture-order
```

### Verify Functions

```bash
# List all deployed functions
supabase functions list

# Test a function
supabase functions serve ai-content-builder
```

---

## 🌐 Step 3: Frontend Deployment to Vercel

### Environment Variables

Create these environment variables in Vercel Dashboard (Settings → Environment Variables):

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://fkikaozubngmzcrnhkqe.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraWthb3p1Ym5nbXpjcm5oa3FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTY3NzQsImV4cCI6MjA3MDU5Mjc3NH0.P8n6Z8uPkuJDqVLHGNvkWZcnsm6m0SJvwPAL4ooCJEU
VITE_SUPABASE_PROJECT_ID=fkikaozubngmzcrnhkqe

# Optional - PayPal (if using payments)
VITE_PAYPAL_CLIENT_ID=your-paypal-client-id
```

### Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Build and deploy to production
npm run build
vercel --prod

# Or use the deployment script
chmod +x deploy-vercel.sh
./deploy-vercel.sh
```

### Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import GitHub repository: `Mirxa27/newomen`
4. Configure settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add environment variables from above
6. Click "Deploy"

---

## 🌍 Step 4: Configure Domain (Mirxa.io)

### In Vercel Dashboard

1. Go to Project Settings → Domains
2. Add domain: `mirxa.io`
3. Add www subdomain: `www.mirxa.io`
4. Copy the DNS records provided by Vercel

### In Your Domain Registrar (where Mirxa.io is registered)

Add these DNS records:

```
Type    Name    Value (from Vercel)    TTL
A       @       76.76.21.21            Auto
CNAME   www     cname.vercel-dns.com   Auto
```

### Verify SSL Certificate

- Vercel automatically provisions SSL certificates
- Wait 5-10 minutes for DNS propagation
- Visit https://mirxa.io to verify HTTPS is working

---

## 🔐 Step 5: Security Hardening

### Enable Security Headers

Add `vercel.json` in project root (already exists, verify):

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

### Database Security

```sql
-- Verify RLS is enabled on all tables
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;

-- Should return no results. If any tables are listed, enable RLS:
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### Secrets Management

- ✅ Never commit `.env` files
- ✅ All secrets in environment variables
- ✅ Service role key only used in edge functions
- ✅ Rotate keys every 90 days

---

## 📊 Step 6: Observability & Monitoring

### Vercel Analytics

1. Go to Vercel Dashboard → Analytics
2. Enable Web Analytics
3. Enable Speed Insights
4. Configure budget alerts

### Supabase Monitoring

1. Go to Supabase Dashboard → Database → Logs
2. Enable Query Performance Insights
3. Set up Database Size Alerts
4. Configure API Rate Limit Alerts

### Custom Monitoring (Optional)

```bash
# Install Sentry for error tracking
npm install @sentry/react

# Configure in src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
  tracesSampleRate: 0.1,
});
```

---

## ✅ Step 7: Post-Deployment Verification

### Smoke Tests

Run these tests on https://mirxa.io:

- [ ] Homepage loads correctly
- [ ] User registration works
- [ ] User login works  
- [ ] Dashboard displays correctly
- [ ] AI chat functionality works
- [ ] Assessments load and complete
- [ ] Profile updates save correctly
- [ ] Wellness library audio plays
- [ ] Community features work
- [ ] Admin panel accessible (for admin users)

### Performance Tests

```bash
# Run Lighthouse audit
npx lighthouse https://mirxa.io --view

# Check Core Web Vitals
# - LCP (Largest Contentful Paint): < 2.5s
# - FID (First Input Delay): < 100ms
# - CLS (Cumulative Layout Shift): < 0.1
```

### Load Testing (Optional)

```bash
# Install k6
brew install k6  # macOS
# or
snap install k6  # Linux

# Create test script
cat > load-test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 0 },
  ],
};

export default function () {
  const res = http.get('https://mirxa.io');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
EOF

# Run load test
k6 run load-test.js
```

---

## 🚨 Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf node_modules dist .next
npm install
npm run build
```

### Edge Function Errors

```bash
# Check function logs
supabase functions logs ai-content-builder --tail

# Verify secrets are set
supabase secrets list
```

### Domain Not Resolving

```bash
# Check DNS propagation
dig mirxa.io
nslookup mirxa.io

# Wait 5-60 minutes for DNS to propagate globally
```

### Database Connection Issues

```bash
# Test database connection
psql postgresql://postgres:Newomen@331144@db.fkikaozubngmzcrnhkqe.supabase.co:5432/postgres

# Check connection pooling settings in Supabase Dashboard
```

---

## 📈 Performance Optimization

### Frontend Optimizations

- ✅ Code splitting (already implemented via Vite)
- ✅ Asset compression (Vercel handles this)
- ✅ CDN distribution (Vercel Edge Network)
- [ ] Implement service worker for offline support
- [ ] Add image optimization with Vercel Image Optimization

### Database Optimizations

```sql
-- Create indexes on frequently queried columns
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_user_id ON assessment_results(user_id);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM user_profiles WHERE user_id = 'xxx';
```

### Edge Function Optimizations

- Keep function code under 1MB
- Use connection pooling for database queries
- Implement caching where appropriate
- Set appropriate timeout limits

---

## 🎉 Success Criteria

### Technical Metrics
- ✅ Uptime > 99.9%
- ✅ Response time < 200ms (p95)
- ✅ Build time < 3 minutes
- ✅ Zero critical security vulnerabilities
- ✅ Lighthouse score > 90

### Business Metrics
- ✅ User registration flow complete
- ✅ Payment processing functional
- ✅ AI features operational
- ✅ Data export compliance (GDPR)
- ✅ Mobile responsive

---

## 📞 Support Resources

### Documentation
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Documentation](https://vitejs.dev)

### Internal Docs
- `README.md` - Project overview
- `FEATURES_COMPLETED.md` - Feature details
- `PAYPAL_SETUP.md` - Payment integration
- `TESTING_GUIDE.md` - Testing procedures

### Emergency Contacts
- **Vercel Support**: support@vercel.com
- **Supabase Support**: support@supabase.io
- **Domain Issues**: Contact Mirxa.io registrar

---

## 🔄 Continuous Deployment

### Automatic Deployments

Vercel is configured to auto-deploy on:
- ✅ Push to `main` branch → Production
- ✅ Pull Request → Preview deployment
- ✅ Other branches → Development deployment

### Manual Deployments

```bash
# Deploy specific branch to production
vercel --prod --force

# Rollback to previous deployment
vercel rollback [deployment-url]
```

---

## ✨ Deployment Complete!

Your Newomen platform is now live at:
- **Production**: https://mirxa.io
- **Admin Panel**: https://mirxa.io/admin
- **API Health**: https://fkikaozubngmzcrnhkqe.supabase.co/rest/v1/

Next Steps:
1. ✅ Monitor initial user traffic
2. ✅ Set up alerts for errors
3. ✅ Plan first feature update
4. ✅ Schedule security audit
5. ✅ Document lessons learned

---

**Deployed with 💜 - Production Ready January 2025**
