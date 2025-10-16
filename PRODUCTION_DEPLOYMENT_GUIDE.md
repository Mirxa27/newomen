# 🚀 Newomen Production Deployment Guide

**Version**: 1.0.0  
**Last Updated**: October 16, 2025  
**Status**: ✅ PRODUCTION READY  

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Web Application Deployment](#web-application-deployment)
5. [iOS App Deployment](#ios-app-deployment)
6. [Android App Deployment](#android-app-deployment)
7. [Monitoring & Logging](#monitoring--logging)
8. [Security Hardening](#security-hardening)
9. [Performance Optimization](#performance-optimization)
10. [Rollback Procedures](#rollback-procedures)
11. [Support & Troubleshooting](#support--troubleshooting)

---

## ✅ Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] No linting errors: `npm run lint`
- [ ] TypeScript compilation: `npx tsc --noEmit`
- [ ] All changes committed to git
- [ ] All branches merged to main
- [ ] Production build size verified (< 2MB gzipped)

### Security Review
- [ ] Row-level security (RLS) policies reviewed
- [ ] API keys and secrets in environment variables
- [ ] CORS policies configured correctly
- [ ] Rate limiting enabled
- [ ] SSL/TLS certificates ready
- [ ] OAuth providers configured
- [ ] Database backups configured

### Feature Verification
- [ ] All wellness features tested
- [ ] AI integrations tested with real API keys
- [ ] Payment system tested (if applicable)
- [ ] Community features working
- [ ] Admin panel accessible
- [ ] Mobile responsiveness verified
- [ ] Dark mode working correctly
- [ ] Error pages configured

### Performance Testing
- [ ] Lighthouse score > 80
- [ ] First Contentful Paint < 2s
- [ ] Largest Contentful Paint < 3s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Database queries optimized
- [ ] Images optimized and cached
- [ ] JavaScript bundles code-split

---

## 🔧 Environment Setup

### Required Environment Variables

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# AI Provider Keys
VITE_OPENAI_API_KEY=sk-...
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_GOOGLE_GEMINI_KEY=...
VITE_ZAI_API_KEY=...

# Payment Integration
VITE_PAYPAL_CLIENT_ID=...
VITE_STRIPE_PUBLIC_KEY=... (if using Stripe)

# URLs
VITE_APP_URL=https://newomen.com
VITE_API_URL=https://api.newomen.com

# Feature Flags
VITE_ENABLE_AI_FEATURES=true
VITE_ENABLE_PAYMENTS=true
VITE_ENABLE_COMMUNITY=true
VITE_ENABLE_ADMIN_PANEL=true

# Analytics
VITE_SENTRY_DSN=...
VITE_ANALYTICS_ID=...
```

### Production Environment Files

```bash
# Create production environment file
cp .env.example .env.production

# Edit with production values
nano .env.production

# For local testing with production config
cp .env.production .env.local
```

---

## 🗄️ Database Configuration

### Initial Setup

```bash
# 1. Apply all migrations
npx supabase db push

# 2. Verify migrations applied
npx supabase db status

# 3. Seed initial data (if needed)
npx supabase db remote commit

# 4. Enable RLS on all tables
# This is automatic with migrations, verify with:
psql -h your-db-host -U postgres -d your_db -c \
  "SELECT tablename FROM pg_tables \
   WHERE schemaname = 'public' AND rowsecurity = false;"
```

### Database Backups

```bash
# Daily automated backups via Supabase
# Check backup schedule in Supabase Dashboard:
# 1. Go to Database > Backups
# 2. Verify daily backup enabled
# 3. Set backup window to off-peak hours

# Manual backup
npx supabase db pull > backup-$(date +%Y%m%d-%H%M%S).sql
```

### Connection Pooling

```sql
-- Enable PgBouncer in Supabase
-- Dashboard > Project Settings > Database > Connection Pooling
-- Set pool mode to "Transaction" for best compatibility
```

---

## 🌐 Web Application Deployment

### Option 1: Vercel (Recommended)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy to production
vercel deploy --prod

# 4. Set environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
# ... add all environment variables

# 5. Trigger redeploy with new variables
vercel deploy --prod
```

### Option 2: Docker Deployment

```bash
# 1. Build Docker image
docker build -t newomen:latest .

# 2. Tag for registry (e.g., Docker Hub, ECR)
docker tag newomen:latest yourregistry/newomen:latest

# 3. Push to registry
docker push yourregistry/newomen:latest

# 4. Deploy to server
docker run -d \
  -e VITE_SUPABASE_URL=$SUPABASE_URL \
  -e VITE_SUPABASE_ANON_KEY=$SUPABASE_KEY \
  -p 80:3000 \
  yourregistry/newomen:latest

# 5. Setup reverse proxy (nginx)
# See nginx-config.conf
```

### Option 3: Custom Server (Node.js)

```bash
# 1. Build application
npm run build

# 2. Copy to server
scp -r dist/* user@server:/var/www/newomen/

# 3. Setup nginx reverse proxy
sudo cp nginx-config.conf /etc/nginx/sites-available/newomen
sudo ln -s /etc/nginx/sites-available/newomen /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 4. Setup SSL with Let's Encrypt
sudo certbot certonly --webroot -w /var/www/newomen \
  -d newomen.com -d www.newomen.com

# 5. Update nginx config with SSL certificates
# Update nginx-config.conf with certificate paths
```

### Dockerfile Example

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

---

## 📱 iOS App Deployment

### TestFlight Distribution (Beta Testing)

```bash
# 1. Build for iOS
npm run ios:build

# 2. In Xcode
# - Select "Any iOS Device (arm64)"
# - Product > Archive
# - Window > Organizer
# - Select Archive > Validate App
# - Distribute App > TestFlight

# 3. In App Store Connect
# - Add test users
# - Configure test notes
# - Submit for beta review
```

### App Store Submission

```bash
# 1. Complete app setup
# - App name, description, keywords
# - Screenshots for all device sizes
# - App preview video
# - Rating questionnaire
# - Privacy policy URL

# 2. Build and submit
npm run ios:build

# 3. In Xcode
# - Product > Archive
# - Window > Organizer
# - Select Archive > Validate App
# - Distribute App > App Store Connect

# 4. Submit for review
# - In App Store Connect dashboard
# - Click "Submit for Review"
# - Provide beta test feedback form
# - Review requirements

# 5. Approval and release
# - Wait for Apple review (typically 24-48 hours)
# - Approve when ready to release
# - Set release date or release immediately
```

### Code Signing Setup

```bash
# 1. Create certificate signing request (CSR)
# - In Xcode: Xcode > Preferences > Accounts
# - Select team > Download Manual Profiles

# 2. Create development and distribution certificates
# - In Apple Developer Portal: Certificates, IDs & Profiles
# - Create iOS App Development certificate
# - Create iOS Distribution certificate (App Store)

# 3. Create provisioning profiles
# - App ID for com.newomen.app
# - Development provisioning profile
# - Distribution provisioning profile (App Store)

# 4. Download and install certificates
# - Double-click .cer files to install
# - Import into Xcode

# 5. Configure in Xcode
# - Project Settings > Signing & Capabilities
# - Set Team ID
# - Enable automatic code signing
```

---

## 🤖 Android App Deployment

### Build for Play Store

```bash
# 1. Generate production keystore
keytool -genkey -v -keystore newomen-release-key.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias newomen-key

# 2. Build AAB (Android App Bundle)
npm run android:build

# 3. In Android Studio
# - Build > Generate Signed Bundle/APK
# - Select "Android App Bundle (AAB)"
# - Select keystore and signing key
# - Build for release

# 4. Upload to Google Play Console
# - Select app > Release > Production
# - Upload AAB file
# - Fill app details and screenshots
# - Submit for review
```

---

## 📊 Monitoring & Logging

### Application Monitoring

```bash
# 1. Setup Sentry for error tracking
npm install @sentry/react @sentry/tracing

# 2. Initialize in main.tsx
import * as Sentry from "@sentry/react";
Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

### Database Monitoring

```bash
# Supabase automatically monitors:
# - Query performance
# - Connection health
# - Storage usage

# Access via Dashboard:
# - Project > Monitoring
# - Monitor real-time metrics
# - Check slow queries
# - Review database size
```

### Log Aggregation

```bash
# Option 1: Supabase Logs
# - Dashboard > Logs
# - View API logs, database logs, function logs

# Option 2: Third-party services
# - CloudFlare Workers Analytics
# - Datadog APM
# - New Relic
# - LogRocket
```

---

## 🔒 Security Hardening

### SSL/TLS Configuration

```bash
# 1. Setup HTTPS (all deployments)
# - Obtain SSL certificate (Let's Encrypt, Cloudflare, AWS)
# - Configure in web server/reverse proxy
# - Enable HSTS headers

# 2. Nginx HSTS configuration
add_header Strict-Transport-Security \
  "max-age=31536000; includeSubDomains" always;
```

### API Security

```typescript
// 1. Rate Limiting (configured in Supabase)
// Project Settings > API > Rate Limiting

// 2. CORS Configuration
// Verify CORS headers in vercel.json or nginx config

// 3. API Key Rotation
// Monthly rotation recommended for AI provider keys

// 4. Request Signing
// All sensitive requests should be signed
```

### Environment Variable Security

```bash
# 1. Never commit .env files
echo ".env*" >> .gitignore
echo ".env.local" >> .gitignore

# 2. Use deployment platform's secret management
# - Vercel: Environment Variables
# - Docker: Secrets
# - Kubernetes: Secrets
# - AWS: Secrets Manager

# 3. Rotate keys regularly
# - Set rotation schedule (quarterly recommended)
# - Update in all environments
# - Log key rotation events
```

---

## ⚡ Performance Optimization

### Build Optimization

```bash
# 1. Analyze bundle size
npm run build -- --analyze

# 2. Code splitting
# Already configured in vite.config.ts
# Routes are lazy-loaded automatically

# 3. Image optimization
# All images should be optimized before deployment
# Use tools: TinyPNG, Squoosh, or ImageOptim
```

### Runtime Optimization

```typescript
// 1. Enable caching headers
// Configured in vercel.json

// 2. Use Service Workers
// PWA support with Workbox

// 3. Database query optimization
// Verify indexes: Dashboard > Table Editor
```

---

## 🔄 Rollback Procedures

### Rollback Web Application

```bash
# Vercel
vercel rollback

# Docker
docker ps
docker stop <container-id>
docker run -d -e VITE_SUPABASE_URL=... previous-image:tag

# Manual Server
git revert HEAD~1
npm run build
# Copy new build to server
```

### Rollback Database

```bash
# 1. From Supabase backup
# - Dashboard > Backups
# - Select backup point
# - Restore (this creates a new project)

# 2. Manual SQL rollback
psql -h your-host -U postgres -d your_db -f rollback.sql
```

---

## 🆘 Support & Troubleshooting

### Common Issues

**Issue**: Build fails with "module not found"
```bash
# Solution
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Issue**: Supabase connection timeout
```bash
# Check connection string
echo $VITE_SUPABASE_URL

# Verify firewall allows outbound to Supabase
# Test connection: npx supabase db status
```

**Issue**: AI API calls failing
```bash
# Verify API keys in environment
# Test API key validity
# Check rate limits haven't been exceeded
# Review API logs in dashboard
```

### Support Contacts

- **Supabase Support**: https://supabase.com/support
- **Vercel Support**: https://vercel.com/support
- **GitHub Issues**: https://github.com/your-org/newomen/issues

---

## 📞 Post-Deployment Tasks

### Immediate (Day 1)

- [ ] Monitor error rates (should be < 0.1%)
- [ ] Check performance metrics
- [ ] Test all major user flows
- [ ] Verify email notifications working
- [ ] Confirm backup jobs running

### Week 1

- [ ] Analyze user behavior
- [ ] Review database performance
- [ ] Check for security issues
- [ ] Collect user feedback
- [ ] Plan for v1.0.1 bug fixes

### Monthly

- [ ] Review security logs
- [ ] Analyze feature usage
- [ ] Update dependencies
- [ ] Optimize slow queries
- [ ] Plan next features

---

## 📝 Deployment Checklist Template

Use this template for each deployment:

```
Deployment: Version X.Y.Z
Date: YYYY-MM-DD
Deployed By: [Name]

Pre-Deployment:
- [ ] Tests passing
- [ ] Build successful
- [ ] No linting errors
- [ ] Database migrations reviewed

Deployment:
- [ ] Web app deployed to [platform]
- [ ] Environment variables configured
- [ ] DNS updated (if needed)
- [ ] SSL certificates valid

Post-Deployment:
- [ ] Health checks passing
- [ ] Error rates normal
- [ ] Performance metrics good
- [ ] No user-facing issues

Rollback Plan:
[If needed, describe rollback steps]
```

---

**Deployment Status**: ✅ READY FOR PRODUCTION  
**Last Verified**: October 16, 2025  
**Next Review**: [Date]  

For questions or issues, contact the DevOps team or create an issue on GitHub.
