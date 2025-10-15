#!/bin/bash
echo "🔑 Please enter your OpenAI API key (it starts with sk-):"
read -s OPENAI_API_KEY

if [[ -z "$OPENAI_API_KEY" ]]; then
  echo "❌ No API key entered. Aborting."
  exit 1
fi

echo "Setting OPENAI_API_KEY secret in Supabase..."
npx supabase secrets set OPENAI_API_KEY="$OPENAI_API_KEY"

if [ $? -eq 0 ]; then
  echo "✅ Secret set successfully!"
  echo "🚀 Please redeploy the realtime-token function to apply the new secret:"
  echo "npx supabase functions deploy realtime-token"
else
  echo "🔥 Failed to set secret. Please check your Supabase login and project setup."
fi