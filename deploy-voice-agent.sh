#!/bin/bash

# Voice Agent Deployment Script
# Deploys realtime voice chat functionality to Supabase

set -e

echo "🚀 Starting Voice Agent Deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_REF="fkikaozubngmzcrnhkqe"

# Check if Supabase CLI is installed
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ npx not found. Please install Node.js${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Checking Supabase CLI...${NC}"
npx supabase --version

# Step 1: Link project
echo -e "${YELLOW}🔗 Linking Supabase project...${NC}"
echo "Project Reference: $PROJECT_REF"
echo "You may be prompted for your database password: Newomen@331144"
npx supabase link --project-ref $PROJECT_REF || {
    echo -e "${RED}❌ Failed to link project. Please check credentials.${NC}"
    exit 1
}

# Step 2: Set OpenAI API Key
echo -e "${YELLOW}🔑 Setting OpenAI API Key...${NC}"
read -sp "Enter your OpenAI API Key: " OPENAI_KEY
echo
if [ -z "$OPENAI_KEY" ]; then
    echo -e "${RED}❌ OpenAI API Key is required${NC}"
    exit 1
fi

npx supabase secrets set OPENAI_API_KEY="$OPENAI_KEY" --project-ref $PROJECT_REF || {
    echo -e "${RED}❌ Failed to set OpenAI API Key${NC}"
    exit 1
}

echo -e "${GREEN}✅ OpenAI API Key configured${NC}"

# Step 3: Deploy Edge Function
echo -e "${YELLOW}📦 Deploying realtime-token edge function...${NC}"
npx supabase functions deploy realtime-token --project-ref $PROJECT_REF || {
    echo -e "${RED}❌ Failed to deploy edge function${NC}"
    exit 1
}

echo -e "${GREEN}✅ Edge function deployed successfully${NC}"

# Step 4: Verify deployment
echo -e "${YELLOW}🔍 Verifying deployment...${NC}"
npx supabase functions list --project-ref $PROJECT_REF

# Step 5: Build frontend
echo -e "${YELLOW}🏗️  Building frontend...${NC}"
npm install
npm run build

echo -e "${GREEN}✅ Frontend built successfully${NC}"

# Summary
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Voice Agent Deployment Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Deploy frontend to Vercel/hosting platform"
echo "2. Navigate to /chat/realtime to test voice chat"
echo "3. Grant microphone permissions when prompted"
echo "4. Click 'Start Session' to begin conversation"
echo ""
echo -e "${YELLOW}Edge Function URL:${NC}"
echo "https://$PROJECT_REF.supabase.co/functions/v1/realtime-token"
echo ""
echo -e "${YELLOW}Documentation:${NC}"
echo "See VOICE_AGENT_DEPLOYMENT.md for detailed info"
echo ""
