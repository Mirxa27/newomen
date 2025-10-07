# Setting Up Supabase Edge Function Secrets

## Critical: OPENAI_API_KEY Required for NewMe Chat

The `realtime-token` edge function requires the `OPENAI_API_KEY` environment variable to be set in Supabase secrets.

### Option 1: Set via Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard/project/fkikaozubngmzcrnhkqe/settings/functions
2. Click on "Edge Functions" in the left sidebar
3. Click on "Manage secrets" or "Environment variables"
4. Add a new secret:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (starts with `sk-`)
5. Save the secret

### Option 2: Set via Supabase CLI

Run this command from your terminal:

```bash
npx supabase secrets set OPENAI_API_KEY=your_openai_api_key_here
```

Replace `your_openai_api_key_here` with your actual OpenAI API key.

### Verify the Secret is Set

After setting the secret, you can verify it's configured:

```bash
npx supabase secrets list
```

You should see `OPENAI_API_KEY` in the list (the value will be hidden for security).

### Test the Function

After setting the secret, try starting a NewMe chat conversation again. The error should be resolved.

### Other Required Secrets

The following environment variables are automatically provided by Supabase:
- ✅ `SUPABASE_URL` - Automatically set
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Automatically set

You only need to manually set:
- ❌ `OPENAI_API_KEY` - **Must be set manually** (see above)

### Getting an OpenAI API Key

If you don't have an OpenAI API key:

1. Go to: https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (it starts with `sk-`)
5. Add it to Supabase secrets as shown above

**Important**: Keep your API key secure and never commit it to your repository.

### Troubleshooting

If you continue to see 500 errors:

1. **Check the Supabase logs**:
   - Go to: https://supabase.com/dashboard/project/fkikaozubngmzcrnhkqe/logs/edge-functions
   - Look for error messages from `realtime-token` function

2. **Verify the secret is set correctly**:
   ```bash
   npx supabase secrets list
   ```

3. **Redeploy the function** after setting the secret:
   ```bash
   npx supabase functions deploy realtime-token
   ```

4. **Check your OpenAI API key is valid**:
   - Make sure it hasn't expired
   - Check your OpenAI account has available credits
   - Verify the key has access to the Realtime API

### Function Dependencies

The `realtime-token` function also depends on:
- OpenAI Realtime API access (GPT-4 Realtime Preview)
- Proper network connectivity to `api.openai.com`
- Valid Supabase project credentials

---

**Last Updated**: October 7, 2025
**Project**: Newomen Platform
**Function**: realtime-token