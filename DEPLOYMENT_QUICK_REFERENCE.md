# 🚀 Quick Deployment Reference Card

**TL;DR:** Complete production deployment in 4 hours or less.

---

## Prerequisites Checklist ✅

- [ ] OpenAI API Key acquired
- [ ] Supabase project access: `fkikaozubngmzcrnhkqe`
- [ ] Vercel account ready
- [ ] Domain registrar access (for Mirxa.io)
- [ ] PayPal Business account (optional)

---

## Quick Deploy Commands

```bash
# 1. One-line automated deployment
./deploy-production-full.sh

# 2. Manual deployment (if needed)
npm install
npm run build
npx supabase functions deploy --all
vercel --prod
```

---

## Environment Variables

### Vercel (Frontend)
```env
VITE_SUPABASE_URL=https://fkikaozubngmzcrnhkqe.supabase.co
VITE_SUPABASE_ANON_KEY=<from .env>
VITE_SUPABASE_PROJECT_ID=fkikaozubngmzcrnhkqe
VITE_PAYPAL_CLIENT_ID=<optional>
```

### Supabase Edge Functions
```bash
npx supabase secrets set OPENAI_API_KEY=sk-proj-...
npx supabase secrets set PAYPAL_CLIENT_ID=...     # Optional
npx supabase secrets set PAYPAL_SECRET=...        # Optional
```

---

## Deployment Phases (3-4 hours)

| Phase | Time | Key Actions |
|-------|------|-------------|
| 1. Database | 30 min | Apply migrations, create buckets, verify RLS |
| 2. Edge Functions | 30 min | Configure secrets, deploy functions, test |
| 3. Vercel | 20 min | Set env vars, deploy, verify |
| 4. Domain | 60 min | Add domain, configure DNS, wait for SSL |
| 5. Testing | 60 min | Smoke tests, critical journeys, performance |

---

## Critical Smoke Tests

After deployment, verify these work:

1. **Authentication**: Sign up → Verify email → Login ✓
2. **Dashboard**: Load user data and progress ✓
3. **Features**: Profile upload, wellness audio, connections ✓
4. **Admin**: Content management, AI config, monitoring ✓
5. **Performance**: Lighthouse score > 80 ✓

---

## Troubleshooting Quick Fixes

**Build fails:**
```bash
rm -rf node_modules dist
PUPPETEER_SKIP_DOWNLOAD=true npm install
npm run build
```

**Edge function errors:**
```bash
npx supabase functions logs <function-name>
# Check secrets are set
npx supabase secrets list
```

**Vercel deployment fails:**
- Check environment variables in dashboard
- Verify build command: `npm run build`
- Confirm output directory: `dist`

**Domain not resolving:**
- DNS propagation takes 5-60 minutes
- Check with: `nslookup mirxa.io`
- Verify SSL with: `curl -I https://mirxa.io`

---

## Success Indicators

✅ Build completes without errors  
✅ All Edge Functions respond with 200 OK  
✅ Vercel shows "Ready" status  
✅ Domain loads with green SSL padlock  
✅ User can sign up and login  
✅ Dashboard displays user data  
✅ Admin panel accessible to admins  
✅ No console errors on homepage  

---

## Resources

- **Full Guide**: [PRODUCTION_DEPLOYMENT_CHECKLIST.md](./PRODUCTION_DEPLOYMENT_CHECKLIST.md)
- **Environment Setup**: [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
- **Testing Guide**: [PRODUCTION_TESTING_GUIDE.md](./PRODUCTION_TESTING_GUIDE.md)
- **Automated Script**: [deploy-production-full.sh](./deploy-production-full.sh)

---

## Support

**Dashboards:**
- Supabase: https://supabase.com/dashboard/project/fkikaozubngmzcrnhkqe
- Vercel: https://vercel.com/dashboard

**Logs:**
```bash
# Supabase Edge Function logs
npx supabase functions logs <function-name>

# Vercel deployment logs
vercel logs <deployment-url>
```

---

**Print this card and keep it handy during deployment!** 📋

**Estimated Total Time:** 3-4 hours  
**Difficulty Level:** Intermediate  
**Prerequisites:** Basic CLI knowledge, API key management
