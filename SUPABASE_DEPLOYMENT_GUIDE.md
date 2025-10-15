# 🚀 Supabase Deployment Guide

**Project:** Newomen Platform  
**Supabase Project ID:** `fkikaozubngmzcrnhkqe`  
**Date:** October 15, 2025

---

## 📋 Prerequisites

Before deploying, ensure you have:
- ✅ Supabase CLI installed (`npm install -g supabase`)
- ✅ Supabase access token
- ✅ Project linked to Supabase

---

## 🔐 Step 1: Get Your Supabase Access Token

### Option A: Via Supabase Dashboard
1. Go to https://supabase.com/dashboard/account/tokens
2. Create a new access token
3. Copy the token

### Option B: Via CLI Login
```bash
supabase login
```

---

## 🔗 Step 2: Link Your Project

```bash
# Set your access token (replace YOUR_TOKEN with actual token)
export SUPABASE_ACCESS_TOKEN="your_access_token_here"

# Link to your project
cd /Users/abdullahmirxa/dyad-apps/newomen
supabase link --project-ref fkikaozubngmzcrnhkqe
```

---

## 📊 Step 3: Check Migration Status

Check what migrations need to be applied:

```bash
supabase db remote list
```

---

## 🗄️ Step 4: Deploy Database Migrations

Deploy all pending migrations to production:

```bash
# Deploy all migrations
supabase db push

# Or deploy specific migration
supabase migration up
```

### Migrations to Deploy (63 total):
1. Initial schema setup
2. User profiles and authentication
3. AI provider management
4. Assessment system
5. Community features
6. Payment/subscription system
7. Gamification system
8. And 56 more...

**Important Migrations:**
- `20250101000000_unified_ai_management.sql` - AI provider system
- `20250101000001_ai_feature_integration.sql` - AI features
- `20250114000000_community_connections_functions.sql` - Community
- `20250114000002_subscription_system.sql` - Payments
- `20250114000003_ensure_free_minutes.sql` - Free tier setup

---

## ⚡ Step 5: Deploy Edge Functions

Deploy all 13 edge functions to production:

```bash
# Deploy all functions at once
supabase functions deploy --project-ref fkikaozubngmzcrnhkqe

# Or deploy individually
supabase functions deploy realtime-token
supabase functions deploy gamification-engine
supabase functions deploy ai-assessment-processor
supabase functions deploy ai-assessment-helper
supabase functions deploy ai-content-builder
supabase functions deploy ai-provider-proxy
supabase functions deploy community-operations
supabase functions deploy couples-challenge-analyzer
supabase functions deploy paypal-create-order
supabase functions deploy paypal-capture-order
supabase functions deploy provider-discovery
supabase functions deploy provider-discovery-simple
supabase functions deploy quiz-processor
```

### Edge Functions List:
| Function | Purpose |
|----------|---------|
| `realtime-token` | Generate realtime connection tokens |
| `gamification-engine` | Handle achievements and points |
| `ai-assessment-processor` | Process AI assessments |
| `ai-assessment-helper` | AI assessment utilities |
| `ai-content-builder` | Generate AI content |
| `ai-provider-proxy` | Proxy AI provider requests |
| `community-operations` | Community CRUD operations |
| `couples-challenge-analyzer` | Analyze couple responses |
| `paypal-create-order` | Create PayPal orders |
| `paypal-capture-order` | Capture PayPal payments |
| `provider-discovery` | Discover AI providers |
| `provider-discovery-simple` | Simplified provider discovery |
| `quiz-processor` | Process quiz/assessment results |

---

## 🔑 Step 6: Set Edge Function Secrets

Set required environment variables for edge functions:

```bash
# OpenAI API Key
supabase secrets set OPENAI_API_KEY="your_openai_key"

# Z.AI API Key
supabase secrets set ZAI_API_KEY="your_zai_key"

# PayPal Credentials
supabase secrets set PAYPAL_CLIENT_ID="your_paypal_client_id"
supabase secrets set PAYPAL_SECRET="your_paypal_secret"
supabase secrets set PAYPAL_MODE="live"

# Google AI API Key (optional)
supabase secrets set GOOGLE_AI_API_KEY="your_google_key"

# Anthropic API Key (optional)
supabase secrets set ANTHROPIC_API_KEY="your_anthropic_key"
```

View existing secrets:
```bash
supabase secrets list
```

---

## 🔄 Step 7: Verify Deployment

### Check Migrations
```bash
# List applied migrations
supabase db remote list

# Check database schema
supabase db diff
```

### Check Functions
```bash
# List deployed functions
supabase functions list

# View function logs
supabase functions logs <function-name>
```

### Test Functions
```bash
# Test a function locally first
supabase functions serve <function-name>

# Test deployed function
curl -i --location --request POST 'https://fkikaozubngmzcrnhkqe.supabase.co/functions/v1/<function-name>' \
  --header 'Authorization: Bearer <ANON_KEY>' \
  --header 'Content-Type: application/json' \
  --data '{"test": true}'
```

---

## 🌐 Step 8: Update Frontend Environment

Update Vercel environment variables if needed:

```bash
# Via Vercel CLI
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Or via Vercel Dashboard
# https://vercel.com/mirxa27s-projects/newomen/settings/environment-variables
```

---

## 📦 Quick Deployment Script

Create a deployment script for future use:

```bash
#!/bin/bash
# deploy-supabase.sh

echo "🚀 Deploying to Supabase..."

# Check if token is set
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "❌ Error: SUPABASE_ACCESS_TOKEN not set"
    echo "Run: export SUPABASE_ACCESS_TOKEN='your_token'"
    exit 1
fi

# Link project
echo "🔗 Linking project..."
supabase link --project-ref fkikaozubngmzcrnhkqe

# Deploy migrations
echo "🗄️  Deploying migrations..."
supabase db push

# Deploy functions
echo "⚡ Deploying edge functions..."
supabase functions deploy --project-ref fkikaozubngmzcrnhkqe

echo "✅ Deployment complete!"
echo "📊 View dashboard: https://supabase.com/dashboard/project/fkikaozubngmzcrnhkqe"
```

Make it executable:
```bash
chmod +x deploy-supabase.sh
```

Run it:
```bash
export SUPABASE_ACCESS_TOKEN="your_token"
./deploy-supabase.sh
```

---

## 🔍 Troubleshooting

### Issue: "Access token not provided"
**Solution:**
```bash
export SUPABASE_ACCESS_TOKEN="your_token_here"
```

### Issue: "Migration conflicts"
**Solution:**
```bash
# Pull remote schema
supabase db pull

# Resolve conflicts
supabase db diff

# Force push if needed (careful!)
supabase db push --dry-run  # Preview first
supabase db push
```

### Issue: "Function deployment failed"
**Solution:**
```bash
# Check function syntax
cd supabase/functions/<function-name>
deno check index.ts

# Deploy with debug
supabase functions deploy <function-name> --debug
```

### Issue: "Cannot connect to Docker"
**Solution:**
This is only needed for local development. For production deployment, Docker is not required.

---

## 🎯 Deployment Checklist

Before deploying:
- [ ] Supabase access token obtained
- [ ] Project linked to Supabase
- [ ] All API keys ready (OpenAI, PayPal, etc.)
- [ ] Migrations reviewed and tested
- [ ] Functions tested locally
- [ ] Backup database (if modifying existing tables)

During deployment:
- [ ] Migrations deployed successfully
- [ ] All 13 edge functions deployed
- [ ] Secrets set for edge functions
- [ ] No errors in deployment logs

After deployment:
- [ ] Verify migrations applied: `supabase db remote list`
- [ ] Test edge functions via API
- [ ] Check function logs for errors
- [ ] Test frontend functionality
- [ ] Monitor error rates in dashboard

---

## 📚 Useful Commands

```bash
# Status and info
supabase status                    # Local status
supabase projects list             # List your projects
supabase db remote list            # List remote migrations

# Migrations
supabase migration list            # List local migrations
supabase db push                   # Deploy migrations
supabase db pull                   # Pull remote schema
supabase db diff                   # Compare local vs remote
supabase migration repair          # Fix migration state

# Functions
supabase functions list            # List deployed functions
supabase functions deploy <name>   # Deploy specific function
supabase functions delete <name>   # Delete function
supabase functions logs <name>     # View logs

# Secrets
supabase secrets list              # List all secrets
supabase secrets set KEY=value     # Set secret
supabase secrets unset KEY         # Remove secret

# Database
supabase db reset                  # Reset local DB
supabase db dump                   # Dump database
supabase db remote commit          # Commit remote changes
```

---

## 🔗 Important Links

| Resource | URL |
|----------|-----|
| **Supabase Dashboard** | https://supabase.com/dashboard/project/fkikaozubngmzcrnhkqe |
| **Database** | https://supabase.com/dashboard/project/fkikaozubngmzcrnhkqe/editor |
| **Auth** | https://supabase.com/dashboard/project/fkikaozubngmzcrnhkqe/auth/users |
| **Edge Functions** | https://supabase.com/dashboard/project/fkikaozubngmzcrnhkqe/functions |
| **API Settings** | https://supabase.com/dashboard/project/fkikaozubngmzcrnhkqe/settings/api |
| **Logs** | https://supabase.com/dashboard/project/fkikaozubngmzcrnhkqe/logs/explorer |
| **Access Tokens** | https://supabase.com/dashboard/account/tokens |

---

## 💡 Tips

1. **Always test locally first:** Use `supabase start` and test migrations/functions locally
2. **Use dry-run:** Add `--dry-run` flag to preview changes
3. **Check logs:** Monitor function logs after deployment
4. **Incremental deployment:** Deploy and test one function at a time if issues arise
5. **Backup first:** Always backup production data before major migrations
6. **Version control:** All migrations are in Git - you can rollback if needed

---

## 🚨 Important Notes

⚠️ **Production Deployment:**
- Migrations are **irreversible** - test thoroughly before deploying
- Function deployments **overwrite** existing functions
- Secrets are **encrypted** and cannot be retrieved once set
- **Database changes** require downtime planning for large tables

✅ **Safe Practices:**
- Always use `--dry-run` first
- Test functions with small data sets
- Deploy during low-traffic periods
- Have rollback plan ready
- Monitor logs immediately after deployment

---

## 🎉 Post-Deployment

After successful deployment:

1. **Test the app:** https://newomen-bsfeukc5b-mirxa27s-projects.vercel.app
2. **Check function health:** Monitor logs for errors
3. **Verify database:** Ensure all tables and data are intact
4. **Test API endpoints:** Verify edge functions respond correctly
5. **Monitor performance:** Watch for any degradation

---

**Ready to deploy?**

```bash
# Quick start:
export SUPABASE_ACCESS_TOKEN="your_token"
supabase link --project-ref fkikaozubngmzcrnhkqe
supabase db push
supabase functions deploy
```

Good luck! 🚀

