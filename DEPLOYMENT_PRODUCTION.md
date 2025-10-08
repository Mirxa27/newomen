# 🚀 Production Deployment Guide

Complete step-by-step guide to deploy the Newomen platform to production.

---

## Prerequisites

- [x] Supabase account
- [x] PayPal Business account (optional, for payments)
- [x] OpenAI API key
- [x] Domain name (optional)
- [x] Vercel/Netlify account (or other hosting)

---

## 1️⃣ Database Setup

### Apply Migrations

```bash
# Using Supabase CLI
supabase db push

# Or via Supabase Dashboard
# - Go to SQL Editor
# - Run all migration files in order
```

### Create Storage Buckets

```bash
# Create avatars bucket
supabase storage create avatars --public
```

Or via Dashboard:
1. Go to Storage → Create Bucket
2. Name: `avatars`
3. Public: `true`
4. File size limit: `5MB`

### Set RLS Policies

Run in SQL Editor:

```sql
-- Avatar storage policies
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK ( 
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING ( 
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING ( 
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 2️⃣ Edge Functions Deployment

### Configure Secrets

In Supabase Dashboard → Edge Functions → Secrets:

```bash
# Required for AI features
OPENAI_API_KEY=sk-...

# Optional for voice synthesis
ELEVENLABS_API_KEY=...

# Required for PayPal (if using payments)
PAYPAL_CLIENT_ID=your-client-id
PAYPAL_SECRET=your-secret
PAYPAL_MODE=live  # or sandbox for testing
```

### Deploy Functions

```bash
# Core AI content builder (already exists)
supabase functions deploy ai-content-builder

# Provider discovery (already exists)
supabase functions deploy provider-discovery

# Realtime token (already exists)
supabase functions deploy realtime-token

# NEW: PayPal integration
supabase functions deploy paypal-create-order
supabase functions deploy paypal-capture-order
```

### Test Functions

```bash
# Test AI content builder
curl -X POST \
  https://your-project.supabase.co/functions/v1/ai-content-builder \
  -H 'Content-Type: application/json' \
  -d '{"topic":"test","type":"assessment","isPublic":true}'

# Test PayPal create order
curl -X POST \
  https://your-project.supabase.co/functions/v1/paypal-create-order \
  -H 'Content-Type: application/json' \
  -d '{"amount":"22","planName":"Growth"}'
```

---

## 3️⃣ Frontend Deployment

### Environment Variables

Create `.env` file (or configure in hosting platform):

```env
# Required
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_URL=https://your-project.supabase.co

# Optional - for PayPal payments
VITE_PAYPAL_CLIENT_ID=your-paypal-client-id
```

### Build Application

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Test build locally
npm run preview
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Or use Vercel Dashboard:
1. Import GitHub repository
2. Set environment variables
3. Deploy

### Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
netlify deploy --prod
```

Or use Netlify Dashboard:
1. Import GitHub repository
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Set environment variables
5. Deploy

---

## 4️⃣ PayPal Integration (Optional)

If you want to enable subscription payments:

### 1. Create PayPal App

1. Go to https://developer.paypal.com/dashboard/applications
2. Create new app (type: Merchant)
3. Note Client ID and Secret

### 2. Configure Environment

In Supabase Dashboard → Edge Functions → Secrets:
```
PAYPAL_CLIENT_ID=your-client-id
PAYPAL_SECRET=your-secret
PAYPAL_MODE=live
```

In your hosting platform:
```
VITE_PAYPAL_CLIENT_ID=your-client-id
```

### 3. Deploy PayPal Functions

```bash
supabase functions deploy paypal-create-order
supabase functions deploy paypal-capture-order
```

### 4. Test Payment Flow

1. Navigate to `/account-settings`
2. Click "Upgrade to Growth"
3. Complete PayPal checkout
4. Verify subscription updates in database

See `PAYPAL_SETUP.md` for detailed instructions.

---

## 5️⃣ DNS & Domain Setup (Optional)

### Vercel Custom Domain

1. Vercel Dashboard → Project → Settings → Domains
2. Add your domain
3. Configure DNS records as instructed

### Netlify Custom Domain

1. Netlify Dashboard → Domain Settings
2. Add custom domain
3. Configure DNS records

---

## 6️⃣ Security Checklist

- [ ] All environment variables set correctly
- [ ] Supabase RLS policies enabled
- [ ] Storage buckets have correct permissions
- [ ] HTTPS enforced
- [ ] CORS configured properly
- [ ] Rate limiting considered
- [ ] No secrets in git repository
- [ ] `.env` file in `.gitignore`
- [ ] API keys rotated from development

---

## 7️⃣ Monitoring & Analytics

### Supabase Dashboard

Monitor:
- Database usage
- Edge function invocations
- Storage usage
- Authentication activity

### Application Monitoring

Consider adding:
- Sentry for error tracking
- Google Analytics for user analytics
- LogRocket for session replay
- Mixpanel for product analytics

---

## 8️⃣ Testing in Production

### Manual Testing Checklist

- [ ] User registration works
- [ ] User login works
- [ ] Profile editing works
- [ ] Avatar upload works
- [ ] Wellness audio plays correctly
- [ ] Community features work
- [ ] Narrative exploration completes
- [ ] Account settings save properly
- [ ] PayPal payment works (if enabled)
- [ ] Data export works
- [ ] All pages responsive on mobile

### Automated Testing

```bash
# Run feature tests
# Navigate to /feature-tests in browser
# Click "Run All Tests"
```

---

## 9️⃣ Post-Deployment

### Initial Setup

1. Create admin user account
2. Test all features end-to-end
3. Populate wellness resources
4. Create sample assessments
5. Configure AI prompts

### User Documentation

Update:
- Help center
- FAQ page
- Tutorial videos
- Email templates

### Marketing

- Social media announcements
- Email campaign
- Press release
- Product Hunt launch

---

## 🔟 Maintenance

### Regular Tasks

**Daily**:
- Monitor error logs
- Check user feedback
- Verify payment processing

**Weekly**:
- Review analytics
- Update content
- Check edge function usage
- Backup database

**Monthly**:
- Security updates
- Dependency updates
- Performance optimization
- Feature enhancements

### Backup Strategy

```bash
# Backup database
supabase db dump > backup-$(date +%Y%m%d).sql

# Backup storage
# Use Supabase Dashboard → Storage → Download
```

---

## 🆘 Troubleshooting

### Build Fails

1. Clear node_modules: `rm -rf node_modules && npm install`
2. Clear build cache: `rm -rf dist`
3. Check TypeScript errors: `npm run lint`

### Edge Functions Fail

1. Check function logs: `supabase functions logs <function-name>`
2. Verify secrets are set
3. Test locally: `supabase functions serve`

### Database Issues

1. Check RLS policies
2. Verify table permissions
3. Review migration history

### PayPal Issues

1. Verify credentials in secrets
2. Check PAYPAL_MODE (sandbox vs live)
3. Review PayPal dashboard for errors
4. Check edge function logs

---

## 📊 Performance Optimization

### Frontend

- Enable code splitting
- Optimize images
- Lazy load components
- Configure CDN
- Enable compression

### Backend

- Database indexes
- Query optimization
- Edge function caching
- Connection pooling

---

## 🔐 Security Hardening

### Checklist

- [ ] Enable 2FA for all admin accounts
- [ ] Regular security audits
- [ ] Dependency vulnerability scanning
- [ ] Rate limiting on API endpoints
- [ ] Input validation everywhere
- [ ] SQL injection prevention (RLS)
- [ ] XSS prevention (React default)
- [ ] CSRF protection
- [ ] Secure headers configured

---

## 📞 Support

### Resources

- Supabase Docs: https://supabase.com/docs
- PayPal Docs: https://developer.paypal.com/docs
- Vercel Docs: https://vercel.com/docs
- Project Documentation: See `/docs`

### Getting Help

- Check `FEATURES_COMPLETED.md` for implementation details
- Review `PAYPAL_SETUP.md` for payment integration
- Check Supabase community forum
- Review GitHub issues

---

## ✅ Deployment Complete!

Your Newomen platform is now live and production-ready! 🎉

Monitor the application closely during the first 24-48 hours to catch any issues early.

Remember to:
- Celebrate the launch! 🎊
- Thank your team
- Gather user feedback
- Iterate and improve

**Platform Status: DEPLOYED ✅**