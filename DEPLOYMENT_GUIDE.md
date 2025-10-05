# 🚀 Deployment Guide for Newomen.me

## Prerequisites
- Vercel account linked to your GitHub (Mirxa27/new-mind-nexus)
- Domain: newomen.me registered and ready
- Environment variables ready

## Deployment Steps

### 1. Deploy to Vercel

```bash
# Login to Vercel (if not already logged in)
vercel login

# Deploy to production
vercel --prod
```

### 2. Configure Environment Variables in Vercel Dashboard

Go to your Vercel project settings and add these environment variables:

**Required:**
- `VITE_SUPABASE_URL` = `https://fkikaozubngmzcrnhkqe.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key
- `VITE_OPENAI_API_KEY` = Your OpenAI API key

**Optional:**
- `VITE_ELEVENLABS_API_KEY` = Your ElevenLabs API key (for voice synthesis)

### 3. Configure Custom Domain (newomen.me)

In Vercel Dashboard:
1. Go to your project settings
2. Navigate to "Domains"
3. Add domain: `newomen.me`
4. Add domain: `www.newomen.me` (redirect to newomen.me)

### 4. Update DNS Settings

At your domain registrar (where newomen.me is registered):

**A Record:**
```
Type: A
Name: @
Value: 76.76.21.21
```

**CNAME Record:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**Or use Vercel Nameservers (Recommended):**
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

### 5. Verify Deployment

Once deployed and DNS propagates (can take 5-60 minutes):
- Visit: https://newomen.me
- Visit: https://www.newomen.me (should redirect to newomen.me)
- Test SSL certificate (should be automatic via Vercel)

### 6. Deploy Supabase Edge Functions

```bash
# Deploy realtime-token function
npx supabase functions deploy realtime-token

# Deploy ai-content-builder function
npx supabase functions deploy ai-content-builder
```

### 7. Post-Deployment Checklist

- [ ] Homepage loads correctly
- [ ] Authentication works (sign up/login)
- [ ] Chat interface connects to OpenAI Realtime API
- [ ] Assessments load and save
- [ ] Admin panel accessible at /admin
- [ ] Profile editing works
- [ ] All images and assets load
- [ ] Mobile navigation works
- [ ] SSL certificate active (https://)
- [ ] www redirects to root domain

## Continuous Deployment

Vercel automatically deploys when you push to main branch:

```bash
git add .
git commit -m "Your changes"
git push origin main
# Vercel deploys automatically
```

## Rollback (if needed)

In Vercel Dashboard:
1. Go to Deployments
2. Find a previous successful deployment
3. Click "Promote to Production"

## Environment Variables Reference

### Supabase
- URL: `https://fkikaozubngmzcrnhkqe.supabase.co`
- Get anon key from: Supabase Dashboard → Settings → API

### OpenAI
- Get key from: https://platform.openai.com/api-keys

### Domain Configuration
- Primary: newomen.me
- Redirect: www.newomen.me → newomen.me

## Troubleshooting

### Issue: "Module not found"
- Ensure all dependencies in package.json
- Run `npm install` locally and commit package-lock.json

### Issue: Environment variables not working
- Ensure `VITE_` prefix for client-side variables
- Redeploy after adding variables

### Issue: 404 on routes
- Vercel should handle this via vercel.json rewrites
- Check vercel.json exists and is correct

### Issue: Build fails
- Check build logs in Vercel dashboard
- Test build locally: `npm run build`

## Support

- **GitHub Issues**: https://github.com/Mirxa27/new-mind-nexus/issues
- **Email**: admin@newomen.me
- **Vercel Docs**: https://vercel.com/docs

---

**Current Status**: ✅ Code pushed to GitHub, ready for Vercel deployment
**Next Step**: Run `vercel --prod` to deploy
