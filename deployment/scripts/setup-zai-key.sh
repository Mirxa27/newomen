#!/bin/bash

# Setup Z.AI API Key for Newomen
# This script configures the Z.ai API key in Supabase

set -e

echo "🔧 Z.AI API Key Setup"
echo "===================="
echo ""

# Check if user provided API key as argument
if [ -z "$1" ]; then
    echo "Please enter your Z.AI API key:"
    read -s ZAI_API_KEY
    echo ""
else
    ZAI_API_KEY="$1"
fi

if [ -z "$ZAI_API_KEY" ]; then
    echo "❌ Error: API key cannot be empty"
    exit 1
fi

echo "📝 Applying database migration..."
supabase db push

echo ""
echo "🔐 Storing Z.AI API key..."

# Store the API key using SQL
supabase db execute <<SQL
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

-- Store the API key
INSERT INTO public.provider_api_keys (provider_id, api_key)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, '$ZAI_API_KEY')
ON CONFLICT (provider_id) DO UPDATE SET
  api_key = EXCLUDED.api_key,
  updated_at = now();
SQL

echo ""
echo "✅ Z.AI API key configured successfully!"
echo ""
echo "🚀 Deploying Edge Function..."
supabase functions deploy ai-assessment-processor

echo ""
echo "✨ Setup complete! Your AI assessments should now work."
echo ""
echo "📊 To test, visit: https://newomen-3xoxj6l69-mirxa27s-projects.vercel.app/assessments"
echo ""

