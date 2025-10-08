# 🔧 Environment Variables Setup Guide

Complete guide for configuring environment variables for production deployment.

---

## Overview

The NewWomen platform requires environment variables for:
- Supabase connection (Database, Auth, Storage)
- PayPal payment integration (optional)
- OpenAI AI features (Edge Functions only)

---

## Frontend Environment Variables

### Required Variables

These must be set in your deployment platform (Vercel) and in `.env` for local development:

```env
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://fkikaozubngmzcrnhkqe.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraWthb3p1Ym5nbXpjcm5oa3FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTY3NzQsImV4cCI6MjA3MDU5Mjc3NH0.P8n6Z8uPkuJDqVLHGNvkWZcnsm6m0SJvwPAL4ooCJEU
VITE_SUPABASE_PROJECT_ID=fkikaozubngmzcrnhkqe
```

### Optional Variables

```env
# PayPal Integration (Optional - for subscription payments)
VITE_PAYPAL_CLIENT_ID=your-paypal-client-id
```

---

## Backend Environment Variables (Supabase Edge Functions)

These must be set in **Supabase Dashboard → Edge Functions → Secrets**:

### Required for AI Features

```bash
# OpenAI API Key (REQUIRED for AI assessments, content generation)
OPENAI_API_KEY=sk-proj-...

# Project Supabase URL (auto-set by Supabase)
PROJECT_SUPABASE_URL=https://fkikaozubngmzcrnhkqe.supabase.co

# Service Role Key (auto-set by Supabase)
PROJECT_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Optional for Enhanced Features

```bash
# ElevenLabs API (Optional - for voice synthesis)
ELEVENLABS_API_KEY=your-elevenlabs-key

# PayPal Integration (Optional - for payments)
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_SECRET=your-paypal-secret
PAYPAL_MODE=live  # or 'sandbox' for testing
```

---

## Setup Instructions

### 1. Local Development (.env file)

Create `.env` in the project root:

```bash
# Copy example file
cp .env.example .env

# Edit with your values
nano .env
```

**Required for Local Development:**
```env
VITE_SUPABASE_URL=https://fkikaozubngmzcrnhkqe.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraWthb3p1Ym5nbXpjcm5oa3FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTY3NzQsImV4cCI6MjA3MDU5Mjc3NH0.P8n6Z8uPkuJDqVLHGNvkWZcnsm6m0SJvwPAL4ooCJEU
VITE_SUPABASE_PROJECT_ID=fkikaozubngmzcrnhkqe
```

### 2. Vercel Production

**Option A: Vercel CLI**

```bash
# Login to Vercel
vercel login

# Link project
vercel link

# Add environment variables
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_SUPABASE_PROJECT_ID production
vercel env add VITE_PAYPAL_CLIENT_ID production  # Optional
```

**Option B: Vercel Dashboard**

1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add each variable:
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://fkikaozubngmzcrnhkqe.supabase.co`
   - Environment: Production
   - Click "Save"

Repeat for all required variables.

### 3. Supabase Edge Functions Secrets

**Via Supabase Dashboard:**

1. Go to https://supabase.com/dashboard/project/fkikaozubngmzcrnhkqe
2. Navigate to Edge Functions → Secrets
3. Click "Add Secret"
4. Add:
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key
   - Click "Save"

**Via Supabase CLI:**

```bash
# Set OpenAI API key
npx supabase secrets set OPENAI_API_KEY=sk-proj-...

# Optional: PayPal credentials
npx supabase secrets set PAYPAL_CLIENT_ID=your-client-id
npx supabase secrets set PAYPAL_SECRET=your-secret
npx supabase secrets set PAYPAL_MODE=live

# Optional: ElevenLabs
npx supabase secrets set ELEVENLABS_API_KEY=your-key

# List all secrets
npx supabase secrets list
```

---

## How to Obtain API Keys

### Supabase Credentials

**Already provided in this project:**
- URL: `https://fkikaozubngmzcrnhkqe.supabase.co`
- Anon Key: See `.env` file
- Project ID: `fkikaozubngmzcrnhkqe`

**To find them yourself:**
1. Go to https://supabase.com/dashboard/project/fkikaozubngmzcrnhkqe/settings/api
2. Copy:
   - Project URL
   - anon/public key
   - Project Reference ID

### OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Name it "NewWomen Production"
4. Copy the key (starts with `sk-proj-`)
5. **Important:** Save it immediately (you can't view it again)

**Pricing:** Pay-as-you-go, approximately $0.01-0.02 per AI assessment.

### PayPal Credentials (Optional)

1. Go to https://developer.paypal.com/dashboard/
2. Log in with PayPal Business account
3. Navigate to "My Apps & Credentials"
4. Create new app:
   - Type: Merchant
   - Name: "NewWomen Subscriptions"
5. Copy:
   - Client ID
   - Secret

**For Live Mode:**
- Switch to "Live" tab in PayPal Dashboard
- Use Live credentials in production

**For Testing:**
- Use Sandbox credentials
- Set `PAYPAL_MODE=sandbox`

### ElevenLabs API Key (Optional)

1. Go to https://elevenlabs.io/
2. Sign up for account
3. Navigate to Profile → API Keys
4. Generate new key
5. Copy the key

**Pricing:** Free tier available, then pay-as-you-go.

---

## Verification

### Test Frontend Variables

Run this in your browser console after deployment:

```javascript
// Should see your Supabase URL
console.log(import.meta.env.VITE_SUPABASE_URL);

// Should see your project ID
console.log(import.meta.env.VITE_SUPABASE_PROJECT_ID);

// Should see your PayPal Client ID (if set)
console.log(import.meta.env.VITE_PAYPAL_CLIENT_ID);
```

### Test Backend Secrets

Check Edge Function logs after deployment:

```bash
# View logs for a specific function
npx supabase functions logs ai-content-builder

# Should not see "API key not found" errors
```

### Test API Connections

**Supabase Connection:**
```bash
curl https://fkikaozubngmzcrnhkqe.supabase.co/rest/v1/ \
  -H "apikey: YOUR_ANON_KEY"

# Should return: {"hint":"...","message":"..."}
```

**OpenAI (via Edge Function):**
```bash
curl -X POST https://fkikaozubngmzcrnhkqe.supabase.co/functions/v1/ai-content-builder \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"topic":"test"}'

# Should return AI-generated content
```

---

## Security Best Practices

### ✅ DO

- Store all secrets in environment variables
- Use different API keys for development and production
- Rotate API keys every 90 days
- Set minimum required permissions on API keys
- Use Vercel/Supabase secret managers (never commit to git)
- Monitor API usage for anomalies

### ❌ DON'T

- Commit `.env` file to git (already in `.gitignore`)
- Share API keys in chat/email/Slack
- Use production keys in development
- Hardcode secrets in source code
- Expose service role keys to frontend
- Use same PayPal credentials across environments

---

## Troubleshooting

### "Cannot connect to Supabase"

- Verify `VITE_SUPABASE_URL` is correct
- Check `VITE_SUPABASE_ANON_KEY` is the anon key (not service role)
- Ensure project ID matches your Supabase project

### "OpenAI API Error"

- Verify `OPENAI_API_KEY` is set in Supabase Edge Functions secrets
- Check API key is valid on OpenAI platform
- Ensure billing is enabled on OpenAI account
- Check Edge Function logs for exact error

### "PayPal payment fails"

- Verify `PAYPAL_CLIENT_ID` and `PAYPAL_SECRET` are for correct mode
- Check `PAYPAL_MODE` matches your credentials (sandbox vs live)
- Ensure PayPal app has correct permissions
- Test with PayPal Sandbox first

### "Environment variable not found"

- Clear Vercel build cache and redeploy
- Verify variable is set in correct environment (Production/Preview/Development)
- Check variable name has correct prefix (`VITE_` for frontend)
- Restart development server after changing `.env`

---

## Environment Variable Reference

| Variable | Location | Required | Description |
|----------|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Frontend | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Yes | Public anon key for client |
| `VITE_SUPABASE_PROJECT_ID` | Frontend | Yes | Project reference ID |
| `VITE_PAYPAL_CLIENT_ID` | Frontend | No | PayPal app client ID |
| `OPENAI_API_KEY` | Edge Functions | Yes* | OpenAI API key for AI features |
| `ELEVENLABS_API_KEY` | Edge Functions | No | ElevenLabs for voice synthesis |
| `PAYPAL_CLIENT_ID` | Edge Functions | No | PayPal client ID for server |
| `PAYPAL_SECRET` | Edge Functions | No | PayPal secret for server |
| `PAYPAL_MODE` | Edge Functions | No | `sandbox` or `live` |

\* Required if using AI features (assessments, content generation)

---

## Updates

**Last Updated:** 2025-10-08  
**Current Environment:** Production-ready  
**Next Review:** After first deployment
