# Z.AI Connection Fix - Assessment Error Resolution

## 🐛 Problem Identified

The AI assessment error ("An error occurred while processing your assessment") was caused by **incorrect API key retrieval** in the Edge Function.

### Root Cause
- Edge Function was calling: `get_provider_api_key({ provider_type: 'zai' })`  
- Database function expects: `get_provider_api_key(p_provider_id uuid)`
- **Mismatch:** String parameter vs UUID parameter

---

## ✅ Solution Implemented

### 1. **Created New Database Function**
`get_provider_api_key_by_type(p_provider_type text)`

This function:
- Accepts provider type/name as a string ('zai', 'openai', etc.)
- Looks up the provider by type or name
- Returns the API key
- Provides better error messages

### 2. **Updated Edge Function**
Changed the API key retrieval in `ai-assessment-processor`:

**Before:**
```typescript
const { data: apiKeyData, error: keyError } = await supabase.rpc('get_provider_api_key', { provider_type: 'zai' });
```

**After:**
```typescript
const { data: apiKeyData, error: keyError } = await supabase.rpc('get_provider_api_key_by_type', { p_provider_type: 'zai' });
```

### 3. **Enhanced Error Handling**
- Better error logging
- Clearer error messages for users
- Detailed console output for debugging

---

## 🔧 Setup Instructions

### **Step 1: Apply Database Migration**

Run this SQL in your Supabase SQL Editor:

```sql
-- Create the new function
CREATE OR REPLACE FUNCTION public.get_provider_api_key_by_type(p_provider_type text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_api_key text;
  v_provider_id uuid;
BEGIN
  -- Service role or admin only
  IF COALESCE(auth.role(), '') <> 'service_role' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'insufficient_privileges';
  END IF;

  -- Find provider by type or name (case-insensitive)
  SELECT id INTO v_provider_id
  FROM public.providers
  WHERE LOWER(type) = LOWER(p_provider_type)
     OR LOWER(name) = LOWER(p_provider_type)
  LIMIT 1;

  IF v_provider_id IS NULL THEN
    RAISE EXCEPTION 'Provider not found: %', p_provider_type;
  END IF;

  -- Get API key
  SELECT api_key INTO v_api_key
  FROM public.provider_api_keys
  WHERE provider_id = v_provider_id;

  IF v_api_key IS NULL THEN
    RAISE EXCEPTION 'API key not configured for provider: %', p_provider_type;
  END IF;

  RETURN v_api_key;
END;
$$;

-- Grant permissions
REVOKE ALL ON FUNCTION public.get_provider_api_key_by_type(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_provider_api_key_by_type(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_provider_api_key_by_type(text) TO service_role;

-- Ensure Z.AI provider exists
INSERT INTO public.providers (id, name, type, api_base, status)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Z.AI',
  'zai',
  'https://api.z.ai/api/coding/paas/v4',
  'active'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  api_base = EXCLUDED.api_base,
  updated_at = now();
```

### **Step 2: Add Your Z.AI API Key**

Run this SQL (replace `YOUR_ACTUAL_ZAI_API_KEY_HERE` with your real API key):

```sql
-- Store your Z.AI API key
INSERT INTO public.provider_api_keys (provider_id, api_key)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid, 
  'YOUR_ACTUAL_ZAI_API_KEY_HERE'
)
ON CONFLICT (provider_id) DO UPDATE SET
  api_key = EXCLUDED.api_key,
  updated_at = now();
```

### **Step 3: Deploy Edge Function**

```bash
cd /Users/abdullahmirxa/dyad-apps/newomen
supabase functions deploy ai-assessment-processor
```

---

## 📊 Verification

### Test the Connection

1. **Check Provider Exists:**
```sql
SELECT * FROM public.providers WHERE type = 'zai';
```

2. **Verify API Key Stored (Admin only):**
```sql
SELECT provider_id, created_at, updated_at 
FROM public.provider_api_keys 
WHERE provider_id = '00000000-0000-0000-0000-000000000001'::uuid;
```

3. **Test Function:**
```sql
SELECT public.get_provider_api_key_by_type('zai');
```
Should return your API key (if you're admin).

---

## 🎯 Expected Results

### Before Fix:
- ❌ Assessments fail with generic error
- ❌ "An error occurred while processing your assessment"
- ❌ No details in logs

### After Fix:
- ✅ Assessments process successfully
- ✅ AI analysis returned
- ✅ Clear error messages if something goes wrong
- ✅ Detailed logging for debugging

---

## 🔍 Troubleshooting

### If assessments still fail:

1. **Check API Key Format**
   - Z.ai API keys usually start with a specific prefix
   - Ensure no extra spaces or newlines
   - Check it's not expired

2. **Verify Network Access**
   - Supabase Edge Functions need to reach `api.z.ai`
   - Check if there are any firewall issues

3. **Check Logs**
   ```bash
   supabase functions logs ai-assessment-processor --tail
   ```

4. **Test Z.ai Directly**
   ```bash
   curl -X POST https://api.z.ai/api/coding/paas/v4/chat/completions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -d '{
       "model": "GLM-4.6",
       "messages": [{"role": "user", "content": "test"}]
     }'
   ```

---

## 📝 Files Changed

1. **supabase/migrations/20251012100000_fix_zai_key_retrieval.sql** (NEW)
   - Creates `get_provider_api_key_by_type` function
   - Ensures Z.AI provider exists

2. **supabase/functions/ai-assessment-processor/index.ts** (UPDATED)
   - Updated API key retrieval call
   - Enhanced error handling

3. **src/services/AIAssessmentService.ts** (PREVIOUSLY UPDATED)
   - Better error messages for users

---

## 🚀 Next Steps

1. Run the SQL migration above
2. Add your Z.AI API key
3. Deploy the Edge Function
4. Test an assessment
5. Monitor logs for any issues

---

## 💡 Getting a Z.AI API Key

If you don't have a Z.AI API key:

1. Visit: https://z.ai
2. Sign up / Log in
3. Go to API settings
4. Generate a new API key
5. Copy the key (it won't be shown again!)
6. Add it using the SQL above

---

## ✅ Verification Checklist

- [ ] Database migration applied
- [ ] Z.AI API key stored
- [ ] Edge Function deployed
- [ ] Test assessment runs successfully
- [ ] AI analysis returned
- [ ] No errors in logs

---

**Status:** Ready to deploy  
**Priority:** HIGH (Assessment feature broken)  
**Impact:** Fixes all AI assessment processing

