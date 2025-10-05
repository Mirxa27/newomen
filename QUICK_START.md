# 🚀 Quick Start Guide

Get the NewWomen platform running locally in 5 minutes.

---

## Prerequisites

- Node.js 18+
- Git
- Supabase account (free tier works)
- OpenAI API key

---

## 1️⃣ Clone & Install (2 minutes)

```bash
# Clone repository
git clone https://github.com/Mirxa27/new-mind-nexus.git
cd new-mind-nexus

# Install dependencies
npm install
```

---

## 2️⃣ Configure Environment (1 minute)

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your credentials
nano .env  # or use your favorite editor
```

Minimum required:
```env
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_URL=https://your-project.supabase.co
```

Get these from: https://supabase.com/dashboard → Your Project → Settings → API

---

## 3️⃣ Setup Database (1 minute)

```bash
# Link to your Supabase project
npx supabase link --project-ref your-project-ref

# Apply migrations
npx supabase db push

# Create storage bucket
npx supabase storage create avatars --public
```

---

## 4️⃣ Configure Edge Functions (1 minute)

In Supabase Dashboard → Edge Functions → Secrets, add:

```
OPENAI_API_KEY=sk-your-openai-key
```

Deploy core functions:
```bash
npx supabase functions deploy ai-content-builder
npx supabase functions deploy realtime-token
```

---

## 5️⃣ Run Development Server

```bash
npm run dev
```

Open http://localhost:5173

---

## ✅ You're Ready!

### First Steps
1. Create an account at `/auth`
2. Complete onboarding
3. Explore the dashboard
4. Try the AI chat at `/chat`
5. Check out wellness library at `/wellness-library`

### Test Features
- Navigate to `/feature-tests` to run automated tests
- Try narrative exploration at `/narrative-exploration`
- Upload a profile picture
- Test audio playback in wellness library

---

## 🔧 Optional: PayPal Integration

To enable subscription payments:

1. Get PayPal credentials from https://developer.paypal.com
2. Add to `.env`:
   ```env
   VITE_PAYPAL_CLIENT_ID=your-client-id
   ```
3. Add to Supabase Edge Function secrets:
   ```
   PAYPAL_CLIENT_ID=your-client-id
   PAYPAL_SECRET=your-secret
   PAYPAL_MODE=sandbox
   ```
4. Deploy PayPal functions:
   ```bash
   npx supabase functions deploy paypal-create-order
   npx supabase functions deploy paypal-capture-order
   ```

See `PAYPAL_SETUP.md` for detailed instructions.

---

## 🆘 Troubleshooting

### Build Fails
```bash
rm -rf node_modules
npm install
npm run build
```

### TypeScript Errors
Restart your editor's TypeScript server:
- VS Code: Cmd/Ctrl + Shift + P → "Restart TS Server"

### Database Connection Issues
Verify environment variables and Supabase project URL

### More Help
- Check `FEATURES_COMPLETED.md` for feature details
- Review `DEPLOYMENT_PRODUCTION.md` for advanced setup
- See `README.md` for comprehensive documentation

---

## 📚 Next Steps

1. **Read Documentation**
   - `FEATURES_COMPLETED.md` - What's implemented
   - `PAYPAL_SETUP.md` - Payment integration
   - `DEPLOYMENT_PRODUCTION.md` - Going live

2. **Explore Code**
   - `src/pages/` - All page components
   - `src/components/` - Reusable components
   - `supabase/functions/` - Edge functions

3. **Customize**
   - Update branding in `src/components/layout/Header.tsx`
   - Modify colors in `src/index.css`
   - Add custom assessments in `src/data/`

4. **Deploy**
   - Follow `DEPLOYMENT_PRODUCTION.md`
   - Use Vercel for easiest deployment
   - Configure custom domain

---

## 🎉 Happy Coding!

The platform is production-ready with zero mocks or placeholders.

**Need Help?** Check the documentation files or review the code - it's well-commented and follows best practices.

**Ready to Deploy?** See `DEPLOYMENT_PRODUCTION.md` for the complete guide.
