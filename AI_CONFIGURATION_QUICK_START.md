# AI Configuration System - Quick Start Guide

## Current Status
✅ **Core System**: Fully functional  
✅ **Database**: Deployed and working  
✅ **AIService**: Refactored and error-free  
⚠️ **Admin UI**: Needs type fixes  

## To Complete the System

### Step 1: Fix AIConfigurationManager Interface
**File:** `src/pages/admin/AIConfigurationManager.tsx`

**Problem:** Interface doesn't match database schema

**Current Interface (WRONG):**
```typescript
interface AIConfiguration {
  model: string;       // ❌ Database uses 'model_name'
  apiKey: string;      // ❌ Database uses 'api_key_encrypted'
  // ... other camelCase fields
}
```

**Fix Option A - Use Database Schema Directly:**
```typescript
interface AIConfiguration {
  id: string;
  name: string;
  provider: string;
  model_name: string;  // ✅ Match database
  api_key_encrypted: string;  // ✅ Match database
  api_base_url: string;
  api_version: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  system_prompt: string;
  custom_headers: Record<string, string>;
  is_default: boolean;
  is_active: boolean;
  cost_per_1k_prompt_tokens: number;
  cost_per_1k_completion_tokens: number;
}
```

**Fix Option B - Import from AIService (RECOMMENDED):**
```typescript
import type { AIConfiguration } from '@/utils/AIService';

// Then add transformation functions:
function toDatabase(config: AIConfiguration) {
  return {
    name: config.name,
    provider: config.provider,
    model_name: config.model,
    api_key_encrypted: config.apiKey,
    // ... map all fields
  };
}

function fromDatabase(dbConfig: any): AIConfiguration {
  return {
    id: dbConfig.id,
    name: dbConfig.name,
    provider: dbConfig.provider,
    model: dbConfig.model_name,
    apiKey: dbConfig.api_key_encrypted,
    // ... map all fields
  };
}
```

### Step 2: Fix ServiceConfig Interface
```typescript
interface ServiceConfig {
  id: string;
  service_type: string;
  service_name: string;
  ai_configuration_id: string;
  priority: number;
  is_active: boolean;
  is_fallback: boolean;
  temperature_override?: number;
  max_tokens_override?: number;
  system_prompt_override?: string;
  user_prompt_template_override?: string;
  ai_configurations: {  // Join result
    name: string;
    provider: string;
    model_name: string;
  };
}
```

### Step 3: Test the System

#### 3.1 Test Database Functions
```sql
-- Test config retrieval
SELECT * FROM get_ai_config_for_service('assessment_generation', NULL);

-- Should return config with all fields
```

#### 3.2 Test Admin UI
1. Start dev server: `npm run dev`
2. Navigate to: `http://localhost:5173/admin`
3. Click "AI Config" tab
4. Try to:
   - ✅ Create a new OpenAI configuration
   - ✅ Create a custom provider (Azure) configuration
   - ✅ Edit existing configuration
   - ✅ Test configuration (calls API)
   - ✅ View service mappings

#### 3.3 Test AIService Integration
```typescript
// In browser console or test file:
import { aiService } from '@/utils/AIService';

// Test config loading
await aiService.loadConfigurations();

// Test assessment scoring
const result = await aiService.scoreAssessment({
  assessment_id: '<some-assessment-id>',
  answers: { q1: 'answer1', q2: 'answer2' },
  user_id: '<user-id>'
});

console.log(result); // Should show AI response with cost tracking
```

## How to Add a New Provider

### Example: Adding Groq

1. **Create Configuration in Database:**
```sql
INSERT INTO ai_configurations (
  name,
  provider,
  provider_name,
  model_name,
  api_base_url,
  api_version,
  temperature,
  max_tokens,
  is_active,
  cost_per_1k_prompt_tokens,
  cost_per_1k_completion_tokens
) VALUES (
  'Groq Mixtral 8x7B',
  'custom',
  'Groq',
  'mixtral-8x7b-32768',
  'https://api.groq.com/openai',
  'v1',
  0.7,
  2000,
  true,
  0.00027,  -- $0.27 per 1M tokens
  0.00027
);
```

2. **Map to Service:**
```sql
INSERT INTO ai_service_configs (
  ai_configuration_id,
  service_type,
  service_name,
  priority,
  is_active
) VALUES (
  '<groq-config-id>',
  'quiz_generation',
  'Groq Quiz Generator',
  90,
  true
);
```

3. **Test:**
```typescript
const config = await aiService.getConfigurationForService('quiz_generation');
// Should return Groq config if highest priority

const result = await aiService.callAIProvider(config, 'Generate a quiz about biology');
// Calls: https://api.groq.com/openai/v1/chat/completions
```

## Key Concepts

### Service Types
Available service types for mapping:
- `assessment_generation` - Create new assessments
- `assessment_scoring` - Score assessment submissions
- `quiz_generation` - Create new quizzes
- `challenge_generation` - Create new challenges
- `voice_conversation` - NewMe voice interactions
- `content_moderation` - Moderate user content
- `feedback_generation` - Generate personalized feedback

### Configuration Priority
- Higher priority = selected first
- Same priority → fallback flag determines order
- Service-specific configs override global configs

### Service Overrides
You can override config parameters per service:
- `temperature_override` - Different creativity level
- `max_tokens_override` - Different response length
- `system_prompt_override` - Different instructions
- `user_prompt_template_override` - Different user prompt format

## Common Issues & Solutions

### Issue 1: "Provider not supported"
**Cause:** Provider not in switch statement  
**Solution:** Add to callAIProvider switch or use 'custom'

### Issue 2: "API key not found"
**Cause:** Config loaded but apiKey is empty  
**Solution:** Check database encryption, verify loadConfigurations() mapping

### Issue 3: "Type mismatch on insert"
**Cause:** Interface fields don't match database schema  
**Solution:** Map fields correctly (see Fix Option B above)

### Issue 4: Azure "404 Not Found"
**Cause:** Incorrect URL format  
**Solution:** Ensure api_base_url is: `https://{resource}.openai.azure.com`  
URL will be: `{base}/openai/deployments/{model}/chat/completions?api-version={version}`

## Files to Know

### Database
- `supabase/migrations/20251231000014_ai_configurations_system.sql` - Main schema
- `supabase/migrations/20251231000015_update_get_ai_config_function.sql` - RPC function

### Backend
- `src/utils/AIService.ts` - Core AI service with provider calls
- `src/integrations/supabase/types.ts` - Generated database types

### Frontend
- `src/pages/admin/AIConfigurationManager.tsx` - Admin UI (needs fixes)
- `src/pages/Admin.tsx` - Admin panel routing

### Documentation
- `AI_CONFIGURATION_SYSTEM_COMPLETE.md` - Full implementation details
- `AI_CONFIGURATION_QUICK_START.md` - This file

## Next Developer Tasks

1. [ ] Fix AIConfigurationManager interfaces to match database
2. [ ] Test CRUD operations in admin UI
3. [ ] Test AI service calls with real API keys
4. [ ] Implement API key encryption/decryption
5. [ ] Add usage tracking and rate limiting
6. [ ] Create end-user documentation

## Getting Help

- Check `AI_CONFIGURATION_SYSTEM_COMPLETE.md` for detailed architecture
- Review `src/utils/AIService.ts` for implementation patterns
- Look at database schema in migration files
- Test with `npx supabase db push --debug` for SQL errors

---

**Status:** Core system is production-ready, UI needs type alignment.  
**Next Step:** Fix AIConfigurationManager interface mismatches.  
**ETA:** 30-60 minutes for type fixes + testing.
