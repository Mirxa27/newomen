# Assessment AI Configuration Guide

## Overview
The assessment system uses **AI-powered analysis** to provide personalized feedback, scoring, and growth recommendations. You can configure different AI providers and models.

## Current Setup

### Default AI Configuration
- **Provider:** OpenAI
- **Model:** `gpt-4-turbo-preview`
- **Temperature:** 0.7 (balanced creativity/consistency)
- **Max Tokens:** 2000 (comprehensive analysis)

### All Assessments Configured ✅
- **11 Active Assessments** - All with 4-5 questions each
- **AI Config Assigned** - All linked to default AI analyzer
- **Questions Added** - All assessments ready to use

## Changing AI Provider/Model

### Option 1: Update Default Configuration (Affects All Assessments)

```sql
UPDATE ai_assessment_configs
SET 
  ai_provider = 'openai',  -- or 'anthropic', 'google', etc.
  ai_model = 'gpt-4-turbo-preview',  -- your preferred model
  temperature = 0.7,
  max_tokens = 2000
WHERE name = 'Default Assessment Analyzer';
```

### Option 2: Create Assessment-Specific Configuration

```sql
-- Create new AI config
INSERT INTO ai_assessment_configs (
  name,
  description,
  ai_provider,
  ai_model,
  temperature,
  max_tokens,
  system_prompt,
  is_active
) VALUES (
  'GPT-4o Mini Config',
  'Cost-effective analysis with GPT-4o-mini',
  'openai',
  'gpt-4o-mini',  -- or 'claude-3-sonnet', 'gemini-pro', etc.
  0.8,
  1500,
  'You are an expert psychologist...',  -- your custom prompt
  true
) RETURNING id;

-- Assign to specific assessment
UPDATE assessments_enhanced
SET ai_config_id = '<NEW_CONFIG_ID>'
WHERE title = 'Personality Assessment';
```

## Supported AI Providers

### OpenAI
```json
{
  "ai_provider": "openai",
  "ai_model": "gpt-4-turbo-preview",
  "api_endpoint": "https://api.openai.com/v1/chat/completions"
}
```

**Models:**
- `gpt-4-turbo-preview` (Recommended - Best quality)
- `gpt-4o` (Faster, similar quality)
- `gpt-4o-mini` (Cost-effective)
- `gpt-3.5-turbo` (Budget option)

### Anthropic (Claude) - Coming Soon
```json
{
  "ai_provider": "anthropic",
  "ai_model": "claude-3-opus-20240229",
  "api_endpoint": "https://api.anthropic.com/v1/messages"
}
```

### Google (Gemini) - Coming Soon
```json
{
  "ai_provider": "google",
  "ai_model": "gemini-pro",
  "api_endpoint": "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent"
}
```

## Testing Your Configuration

### 1. Check Current Config
```sql
SELECT 
  a.title,
  c.name as ai_config_name,
  c.ai_provider,
  c.ai_model,
  c.temperature,
  jsonb_array_length(a.questions) as question_count
FROM assessments_enhanced a
LEFT JOIN ai_assessment_configs c ON a.ai_config_id = c.id
WHERE a.is_active = true;
```

### 2. Test an Assessment
1. Navigate to `/assessments`
2. Click any assessment
3. Answer all questions
4. Submit and verify AI analysis appears

### 3. Check AI Usage Logs
```sql
SELECT 
  provider_name,
  model_name,
  tokens_used,
  cost_usd,
  processing_time_ms,
  success,
  created_at
FROM ai_usage_logs
ORDER BY created_at DESC
LIMIT 10;
```

## Cost Management

### Current Costs (OpenAI GPT-4)
- **Input:** $0.01 per 1K tokens
- **Output:** $0.03 per 1K tokens
- **Average per assessment:** $0.05-0.15

### Cost Optimization Tips
1. Use `gpt-4o-mini` for simpler assessments
2. Reduce `max_tokens` for shorter feedback
3. Increase `temperature` only when needed
4. Monitor via `ai_usage_logs` table

## System Prompt Customization

The system prompt determines AI personality and output format. Current prompt ensures:
- ✅ Warm, encouraging tone
- ✅ Specific, actionable insights
- ✅ JSON-structured output
- ✅ Personalized to user responses

### Customize System Prompt
```sql
UPDATE ai_assessment_configs
SET system_prompt = 'Your custom prompt here...

IMPORTANT: Always return valid JSON with this structure:
{
  "score": <0-100>,
  "feedback": "<string>",
  "explanation": "<string>",
  "insights": ["<string>"],
  "recommendations": ["<string>"],
  "strengths": ["<string>"],
  "areas_for_improvement": ["<string>"]
}'
WHERE name = 'Default Assessment Analyzer';
```

## Environment Variables

Required in Supabase Edge Functions:
```bash
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...
```

Set via Supabase Dashboard:
1. Project Settings → Edge Functions
2. Add environment variables
3. Restart functions

## Next Steps

1. **Test Current Setup:** Try all 11 assessments ✅
2. **Monitor Costs:** Check `ai_usage_logs` regularly
3. **Customize Prompts:** Tailor system prompt to your brand
4. **Add New Models:** Create configs for different use cases
5. **Scale:** Add more assessments with specific AI configs

## Troubleshooting

### "No AI configuration found"
```sql
-- Verify AI config exists
SELECT * FROM ai_assessment_configs WHERE is_active = true;

-- Relink assessments
UPDATE assessments_enhanced
SET ai_config_id = (SELECT id FROM ai_assessment_configs WHERE is_active = true LIMIT 1)
WHERE ai_config_id IS NULL;
```

### "OpenAI API key not configured"
```bash
# Set in Supabase Dashboard
supabase secrets set OPENAI_API_KEY=sk-your-key-here
```

### "Assessment not found"
```sql
-- Make assessments public and active
UPDATE assessments_enhanced
SET is_public = true, is_active = true
WHERE is_active = false;
```

## Support

For AI provider setup or configuration help, refer to:
- OpenAI: https://platform.openai.com/docs
- Anthropic: https://docs.anthropic.com
- Google: https://ai.google.dev/docs

---

**Status:** ✅ **ALL SYSTEMS OPERATIONAL**
- 11 Assessments Ready
- AI Configuration Active
- Questions Populated
- Edge Function Deployed

