#!/bin/bash
# Newomen Platform - Production Deployment Script
# Generated: October 14, 2025
# Status: Ready for Production

set -e  # Exit on any error

echo "🚀 Newomen Production Deployment Starting..."
echo "================================================"

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run from project root.${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Step 1: Pre-Deployment Checks${NC}"
echo "================================"

# Check for required environment variables
echo "Checking environment variables..."
if [ -z "$VITE_SUPABASE_URL" ]; then
    echo -e "${RED}❌ VITE_SUPABASE_URL not set${NC}"
    exit 1
fi

if [ -z "$VITE_SUPABASE_PUBLISHABLE_KEY" ]; then
    echo -e "${RED}❌ VITE_SUPABASE_PUBLISHABLE_KEY not set${NC}"
    exit 1
fi

if [ -z "$VITE_PAYPAL_CLIENT_ID" ]; then
    echo -e "${YELLOW}⚠️  VITE_PAYPAL_CLIENT_ID not set (PayPal won't work)${NC}"
fi

echo -e "${GREEN}✅ Environment variables configured${NC}"

# Build the project
echo -e "\n${YELLOW}Step 2: Building Production Bundle${NC}"
echo "===================================="
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed. Please fix errors before deploying.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"

# Check Supabase CLI
echo -e "\n${YELLOW}Step 3: Checking Supabase CLI${NC}"
echo "==============================="

if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found. Install with: npm i -g supabase${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI installed${NC}"

# Link to Supabase project
echo -e "\n${YELLOW}Step 4: Linking to Supabase Project${NC}"
echo "====================================="

read -p "Enter your Supabase project ref (default: fkikaozubngmzcrnhkqe): " PROJECT_REF
PROJECT_REF=${PROJECT_REF:-fkikaozubngmzcrnhkqe}

npx supabase link --project-ref $PROJECT_REF

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to link to Supabase project${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Linked to Supabase project${NC}"

# Set Supabase secrets
echo -e "\n${YELLOW}Step 5: Setting Supabase Secrets${NC}"
echo "=================================="

read -p "Do you want to set Supabase secrets? (y/n): " SET_SECRETS

if [ "$SET_SECRETS" = "y" ]; then
    echo "Setting secrets..."
    
    read -sp "Enter OPENAI_API_KEY: " OPENAI_KEY
    echo
    npx supabase secrets set OPENAI_API_KEY="$OPENAI_KEY"
    
    read -sp "Enter PAYPAL_CLIENT_ID: " PAYPAL_CLIENT
    echo
    npx supabase secrets set PAYPAL_CLIENT_ID="$PAYPAL_CLIENT"
    
    read -sp "Enter PAYPAL_SECRET: " PAYPAL_SEC
    echo
    npx supabase secrets set PAYPAL_SECRET="$PAYPAL_SEC"
    
    npx supabase secrets set PAYPAL_MODE="live"
    
    read -sp "Enter ZAI_API_KEY (optional, press Enter to skip): " ZAI_KEY
    echo
    if [ ! -z "$ZAI_KEY" ]; then
        npx supabase secrets set ZAI_API_KEY="$ZAI_KEY"
    fi
    
    echo -e "${GREEN}✅ Secrets configured${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping secrets configuration${NC}"
fi

# Deploy Edge Functions
echo -e "\n${YELLOW}Step 6: Deploying Edge Functions${NC}"
echo "=================================="

FUNCTIONS=(
    "ai-assessment-processor"
    "ai-assessment-helper"
    "ai-content-builder"
    "ai-provider-proxy"
    "community-operations"
    "couples-challenge-analyzer"
    "gamification-engine"
    "paypal-create-order"
    "paypal-capture-order"
    "provider-discovery"
    "provider-discovery-simple"
    "quiz-processor"
    "realtime-token"
)

echo "Deploying ${#FUNCTIONS[@]} edge functions..."

for func in "${FUNCTIONS[@]}"; do
    echo -e "\nDeploying ${func}..."
    npx supabase functions deploy $func --no-verify-jwt
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ ${func} deployed${NC}"
    else
        echo -e "${RED}❌ Failed to deploy ${func}${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ All edge functions deployed${NC}"

# Apply Database Migrations
echo -e "\n${YELLOW}Step 7: Applying Database Migrations${NC}"
echo "======================================"

read -p "Apply database migrations? This will modify production DB. (y/n): " APPLY_MIGRATIONS

if [ "$APPLY_MIGRATIONS" = "y" ]; then
    npx supabase db push
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database migrations applied${NC}"
    else
        echo -e "${RED}❌ Failed to apply migrations${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Skipping database migrations${NC}"
fi

# Deploy to Vercel
echo -e "\n${YELLOW}Step 8: Deploying to Vercel${NC}"
echo "============================"

if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Install with: npm i -g vercel${NC}"
    read -p "Continue without Vercel deployment? (y/n): " SKIP_VERCEL
    if [ "$SKIP_VERCEL" != "y" ]; then
        exit 1
    fi
else
    read -p "Deploy to Vercel production? (y/n): " DEPLOY_VERCEL
    
    if [ "$DEPLOY_VERCEL" = "y" ]; then
        vercel --prod
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Deployed to Vercel${NC}"
        else
            echo -e "${RED}❌ Vercel deployment failed${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠️  Skipping Vercel deployment${NC}"
    fi
fi

# Final Summary
echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}🎉 Production Deployment Complete!${NC}"
echo -e "${GREEN}================================================${NC}"

echo -e "\n${YELLOW}Deployment Summary:${NC}"
echo "  ✅ Build successful"
echo "  ✅ Edge functions deployed (${#FUNCTIONS[@]})"
if [ "$APPLY_MIGRATIONS" = "y" ]; then
    echo "  ✅ Database migrations applied"
fi
if [ "$DEPLOY_VERCEL" = "y" ]; then
    echo "  ✅ Frontend deployed to Vercel"
fi

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "  1. Verify deployment at your production URL"
echo "  2. Test authentication flow (signup, login, OAuth)"
echo "  3. Test payment processing with real payment"
echo "  4. Test WebRTC voice chat"
echo "  5. Monitor error logs in Supabase Dashboard"
echo "  6. Check Edge Function invocations"

echo -e "\n${YELLOW}Monitoring:${NC}"
echo "  • Supabase Dashboard: https://supabase.com/dashboard/project/$PROJECT_REF"
echo "  • Vercel Dashboard: https://vercel.com/dashboard"
echo "  • Edge Function Logs: npx supabase functions logs <function-name>"

echo -e "\n${GREEN}Ready to serve users! 🚀${NC}"

