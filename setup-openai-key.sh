#!/bin/bash

# Setup script for configuring Supabase Edge Function secrets
# This script helps you set the OPENAI_API_KEY required for NewMe chat

echo "🔐 Supabase Edge Function Secrets Setup"
echo "========================================"
echo ""

# Check if user has Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI not found. Installing via npx..."
fi

echo "📝 This script will help you set the OPENAI_API_KEY for the realtime-token function."
echo ""
echo "You need an OpenAI API key that has access to the Realtime API."
echo "If you don't have one, get it from: https://platform.openai.com/api-keys"
echo ""

# Prompt for API key
read -sp "Enter your OpenAI API Key (starts with sk-): " OPENAI_KEY
echo ""

if [ -z "$OPENAI_KEY" ]; then
    echo "❌ No API key provided. Exiting."
    exit 1
fi

if [[ ! $OPENAI_KEY == sk-* ]]; then
    echo "⚠️  Warning: API key doesn't start with 'sk-'. Are you sure this is correct?"
    read -p "Continue anyway? (y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo "❌ Cancelled."
        exit 1
    fi
fi

echo ""
echo "🔄 Setting OPENAI_API_KEY secret in Supabase..."

# Set the secret
npx supabase secrets set OPENAI_API_KEY="$OPENAI_KEY"

if [ $? -eq 0 ]; then
    echo "✅ Secret set successfully!"
    echo ""
    echo "📋 Verifying secrets..."
    npx supabase secrets list
    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Test the NewMe chat functionality"
    echo "2. Check Supabase logs if you encounter issues:"
    echo "   https://supabase.com/dashboard/project/fkikaozubngmzcrnhkqe/logs/edge-functions"
    echo ""
else
    echo "❌ Failed to set secret. Please check your Supabase connection and try again."
    echo ""
    echo "You can also set it manually via the Supabase Dashboard:"
    echo "https://supabase.com/dashboard/project/fkikaozubngmzcrnhkqe/settings/functions"
    exit 1
fi
