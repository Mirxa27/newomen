#!/bin/bash
echo "🔑 Setting up OpenAI API Key for Supabase Edge Functions"
echo ""
echo "This script will set the OPENAI_API_KEY secret in your Supabase project."
echo "You can get your API key from: https://platform.openai.com/api-keys"
echo ""

read -p "Enter your OpenAI API key (starts with sk-): " OPENAI_KEY

if [[ -z "$OPENAI_KEY" ]]; then
  echo "❌ API key cannot be empty. Aborting."
  exit 1
fi

if [[ ! "$OPENAI_KEY" == sk-* ]]; then
  echo "⚠️ Warning: API key does not start with 'sk-'. Make sure it's correct."
fi

echo ""
echo "Setting secret in Supabase..."
npx supabase secrets set OPENAI_API_KEY="$OPENAI_KEY"

if [ $? -eq 0 ]; then
  echo "✅ Secret OPENAI_API_KEY set successfully!"
  echo "Please wait a minute for the secret to be available to the function, then try the chat again."
else
  echo "❌ Failed to set secret. Please check your Supabase CLI login and project link."
fi