# 🔧 Realtime Chat Issue - Action Required

## Issue Identified

The NewMe chat feature is failing with a **500 Internal Server Error** because the `OPENAI_API_KEY` environment variable is **not set** in Supabase Edge Function secrets.

### Error Details
```
POST https://fkikaozubngmzcrnhkqe.supabase.co/functions/v1/realtime-token 500 (Internal Server Error)
Error: OPENAI_API_KEY is not configured. Please set it in Supabase Edge Function secrets.
```

## ✅ What Was Done

1. **Enhanced Error Logging** - Updated the `realtime-token` function to provide better error messages
2. **Redeployed Function** - Latest version is now live with improved diagnostics
3. **Created Setup Scripts** - Automated tools to help you configure the API key

## 🚨 Action Required: Set Your OpenAI API Key

You need to set the `OPENAI_API_KEY` in Supabase Edge Function secrets. Choose one of these methods:

### Method 1: Use the Setup Script (Easiest)

Run this command and follow the prompts:

```bash
./setup-openai-key.sh
```

It will guide you through setting up the API key.

### Method 2: Set Manually via Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/fkikaozubngmzcrnhkqe/settings/functions
2. Navigate to "Edge Functions" → "Manage secrets"
3. Add new secret:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (starts with `sk-`)
4. Save

### Method 3: Set via CLI

```bash
npx supabase secrets set OPENAI_API_KEY=sk-your-actual-key-here
```

## 📝 Getting an OpenAI API Key

If you don't have an OpenAI API key:

1. Visit: https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. **Important**: Select a key with access to the **Realtime API** (GPT-4 Realtime Preview)
5. Copy the key (starts with `sk-`)
6. Use it in one of the methods above

## ✅ After Setting the Key

1. **Wait 1-2 minutes** for the secret to propagate
2. **Test the chat** - Try starting a NewMe conversation
3. **Check logs** if issues persist:
   - https://supabase.com/dashboard/project/fkikaozubngmzcrnhkqe/logs/edge-functions

## 🔍 Verify Setup

After setting the key, verify it's configured:

```bash
npx supabase secrets list
```

You should see:
```
OPENAI_API_KEY (set)
```

## 💡 Important Notes

- **Security**: Never commit your OpenAI API key to the repository
- **Cost**: OpenAI Realtime API usage will incur charges on your OpenAI account
- **Access**: Make sure your API key has access to `gpt-4o-realtime-preview-2024-12-17` model
- **Credits**: Ensure your OpenAI account has available credits

## 🐛 Troubleshooting

### Still getting 500 errors?

1. **Check Supabase logs**:
   ```bash
   npx supabase functions logs realtime-token
   ```

2. **Verify the secret is set**:
   ```bash
   npx supabase secrets list
   ```

3. **Test your OpenAI key** independently:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

4. **Redeploy the function**:
   ```bash
   npx supabase functions deploy realtime-token
   ```

### Getting "insufficient quota" errors?

- Check your OpenAI account credits: https://platform.openai.com/usage
- Add credits to your OpenAI account if needed

### Getting "model not found" errors?

- Your API key might not have access to the Realtime API
- Contact OpenAI support to request access
- Or wait for broader availability of the Realtime API

## 📚 Additional Resources

- **Setup Guide**: See `SETUP_OPENAI_API_KEY.md` for detailed instructions
- **OpenAI Realtime API Docs**: https://platform.openai.com/docs/guides/realtime
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions

## 🎯 Summary

**What's broken**: NewMe chat can't get ephemeral tokens from OpenAI

**Why**: Missing `OPENAI_API_KEY` environment variable

**Fix**: Set the API key using one of the methods above

**Time to fix**: 2-3 minutes

---

**Status**: ⚠️ Action Required
**Priority**: High (blocks NewMe chat feature)
**Last Updated**: October 7, 2025, 12:40 AM
