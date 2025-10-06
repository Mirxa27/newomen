#!/bin/bash

# Quick Deployment Script for Newomen Platform
# This script automates the deployment process using the provided credentials

set -e

echo "🚀 Newomen Platform - Quick Deployment to Vercel"
echo "================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Verify build
echo -e "${BLUE}Step 1: Building application...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo "❌ Build failed. Please fix errors before deploying."
    exit 1
fi

echo ""
echo -e "${BLUE}Step 2: Environment Variables${NC}"
echo "The following environment variables will be needed in Vercel:"
echo ""
echo "VITE_SUPABASE_URL=https://fkikaozubngmzcrnhkqe.supabase.co"
echo "VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraWthb3p1Ym5nbXpjcm5oa3FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTY3NzQsImV4cCI6MjA3MDU5Mjc3NH0.P8n6Z8uPkuJDqVLHGNvkWZcnsm6m0SJvwPAL4ooCJEU"
echo "VITE_SUPABASE_PROJECT_ID=fkikaozubngmzcrnhkqe"
echo ""
echo -e "${YELLOW}Note: Set these in Vercel Dashboard → Settings → Environment Variables${NC}"
echo ""

# Step 3: Deployment options
echo -e "${BLUE}Step 3: Choose Deployment Method${NC}"
echo ""
echo "Option A: Deploy via Vercel Dashboard (Recommended)"
echo "  1. Go to https://vercel.com"
echo "  2. Click 'New Project'"
echo "  3. Import repository: Mirxa27/newomen"
echo "  4. Configure:"
echo "     - Framework: Vite"
echo "     - Build Command: npm run build"
echo "     - Output Directory: dist"
echo "  5. Add environment variables from above"
echo "  6. Click 'Deploy'"
echo ""

echo "Option B: Deploy via Vercel CLI"
echo "  Run: vercel --prod"
echo "  (Requires Vercel CLI: npm install -g vercel)"
echo ""

# Ask user which option
read -p "Continue with Vercel CLI deployment? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        echo "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    echo ""
    echo -e "${BLUE}Deploying to Vercel...${NC}"
    vercel --prod
    
    echo ""
    echo -e "${GREEN}✓ Deployment initiated!${NC}"
else
    echo ""
    echo "Deployment cancelled. Use Vercel Dashboard for manual deployment."
fi

echo ""
echo -e "${BLUE}Step 4: Post-Deployment Tasks${NC}"
echo ""
echo "After deployment completes:"
echo "  1. Configure custom domain:"
echo "     - Go to Vercel → Project Settings → Domains"
echo "     - Add domain: mirxa.io"
echo "     - Update DNS records at your registrar"
echo ""
echo "  2. Deploy Edge Functions:"
echo "     - supabase functions deploy ai-content-builder"
echo "     - supabase functions deploy provider-discovery"
echo "     - supabase functions deploy realtime-token"
echo "     - supabase functions deploy couples-challenge-analyzer"
echo "     - supabase functions deploy gamification-engine"
echo "     - supabase functions deploy paypal-create-order"
echo "     - supabase functions deploy paypal-capture-order"
echo ""
echo "  3. Set Edge Function Secrets in Supabase Dashboard:"
echo "     - OPENAI_API_KEY=sk-your-key"
echo "     - PAYPAL_CLIENT_ID=your-client-id (if using payments)"
echo "     - PAYPAL_SECRET=your-secret (if using payments)"
echo ""
echo "  4. Run smoke tests:"
echo "     - Visit https://mirxa.io"
echo "     - Test user registration"
echo "     - Test login flow"
echo "     - Test AI features"
echo ""

echo -e "${GREEN}📚 For detailed instructions, see PRODUCTION_DEPLOYMENT_GUIDE.md${NC}"
echo ""
