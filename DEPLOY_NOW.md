# 🚀 Quick Deploy Instructions for Newomen.me

## ✅ All Changes Ready!

Your code is ready for deployment. Here's what's been done:

### ✅ Completed:
1. ✅ All "NewWomen" → "Newomen" branding updated
2. ✅ Package.json configured with proper metadata
3. ✅ Vercel.json configuration created
4. ✅ Production build verified (builds successfully)
5. ✅ All changes committed and pushed to GitHub
6. ✅ Database migrations applied to Supabase
7. ✅ README.md created with comprehensive documentation
8. ✅ .vercelignore for optimized deployments

---

## 🌐 Deploy to Vercel (2 Options)

### Option 1: Vercel Dashboard (Recommended - Easiest)

1. **Go to Vercel**: https://vercel.com/new
2. **Import Git Repository**:
   - Select GitHub
   - Choose repository: `Mirxa27/new-mind-nexus`
   - Click "Import"

3. **Configure Project**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Add Environment Variables** (IMPORTANT!):
   Click "Environment Variables" and add:
   ```
   VITE_SUPABASE_URL = https://fkikaozubngmzcrnhkqe.supabase.co
   
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraWthb3p1Ym5nbXpjcm5oa3FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTY3NzQsImV4cCI6MjA3MDU5Mjc3NH0.P8n6Z8uPkuJDqVLHGNvkWZcnsm6m0SJvwPAL4ooCJEU
   
   VITE_OPENAI_API_KEY = [Get from Supabase Edge Functions secrets or OpenAI dashboard]
   ```

5. **Deploy**: Click "Deploy"

6. **Configure Domain**:
   - After deployment, go to project Settings → Domains
   - Add domain: `newomen.me`
   - Add domain: `www.newomen.me`
   - Follow Vercel's DNS instructions

---

### Option 2: Vercel CLI (Manual Auth Required)

If you prefer CLI deployment, you'll need to authenticate:

1. **Login to Vercel**:
   - Visit: https://vercel.com/oauth/device
   - Enter code: `BBPC-DDWQ` (or get a new one with `vercel login`)
   - Authorize GitHub integration

2. **Deploy**:
   ```bash
   cd /workspaces/new-mind-nexus
   vercel --prod
   ```

3. **Follow prompts**:
   - Link to existing project or create new
   - Confirm settings
   - Add environment variables when prompted

---

## 📋 DNS Configuration for newomen.me

Once deployed, update your DNS at your domain registrar:

### Method 1: Vercel Nameservers (Recommended)
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

### Method 2: A Record + CNAME
```
A Record:
  Name: @
  Value: 76.76.21.21

CNAME:
  Name: www
  Value: cname.vercel-dns.com
```

DNS propagation can take 5-60 minutes.

---

## ✅ Post-Deployment Checklist

After deploying:

- [ ] Visit your Vercel deployment URL
- [ ] Test authentication (sign up/login)
- [ ] Test chat interface
- [ ] Verify admin panel works
- [ ] Check all pages load correctly
- [ ] Test on mobile device
- [ ] Verify SSL certificate (https://)
- [ ] Test domain: newomen.me (after DNS propagates)

---

## 🔑 Environment Variables Summary

**Required in Vercel:**
```env
VITE_SUPABASE_URL=https://fkikaozubngmzcrnhkqe.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_OPENAI_API_KEY=sk-proj-... (get from OpenAI or Supabase)
```

**Optional:**
```env
VITE_ELEVENLABS_API_KEY=... (for voice synthesis)
```

---

## 🆘 Troubleshooting

**Build fails?**
- Check error logs in Vercel dashboard
- Verify all dependencies are in package.json
- Build works locally (`npm run build`)

**Environment variables not working?**
- Must have `VITE_` prefix
- Redeploy after adding variables
- Check Vercel Dashboard → Settings → Environment Variables

**404 on routes?**
- vercel.json should handle this (already configured ✅)
- Check vercel.json exists in root

**OpenAI API key missing?**
- Get from: https://platform.openai.com/api-keys
- Or check Supabase Edge Functions environment variables

---

## 📞 Support

- **Documentation**: See README.md and DEPLOYMENT_GUIDE.md
- **GitHub**: https://github.com/Mirxa27/new-mind-nexus
- **Email**: admin@newomen.me

---

## 🎉 You're Ready to Deploy!

**Recommended Next Step:**
1. Go to https://vercel.com/new
2. Import your GitHub repository: `Mirxa27/new-mind-nexus`
3. Add environment variables
4. Click Deploy!

Your site will be live at: `https://your-project.vercel.app`
Then configure domain to: `newomen.me`

---

**Made with 💜 by the Newomen Team**