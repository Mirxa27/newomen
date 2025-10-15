#!/bin/bash

# Newomen Deployment Script
# This script deploys the Newomen platform to Vercel

set -e

echo "🚀 Newomen Platform - Vercel Deployment"
echo "========================================"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "✅ Vercel CLI ready"
echo ""

# Build the project first
echo "📦 Building production bundle..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed. Fix errors before deploying."
    exit 1
fi

echo ""
echo "🚀 Deploying to Vercel..."
echo ""
echo "⚠️  Make sure you have set these environment variables in Vercel Dashboard:"
echo "   - VITE_SUPABASE_URL"
echo "   - VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY)"
echo "   - VITE_OPENAI_API_KEY (get from Supabase secrets if not in .env)"
echo ""
echo "Press ENTER to continue with deployment..."
read

# Deploy to production
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Post-Deployment Checklist:"
echo "   1. Configure custom domain 'newomen.me' in Vercel Dashboard"
echo "   2. Update DNS records at your domain registrar"
echo "   3. Verify environment variables are set correctly"
echo "   4. Test the live site at your Vercel URL"
echo "   5. Deploy Supabase Edge Functions if needed"
echo ""
echo "📚 See DEPLOYMENT_GUIDE.md for detailed instructions"
echo ""
