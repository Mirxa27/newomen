#!/bin/bash

# Voice Chat System Check Script
# Run this to verify all components are working

echo "🔍 NewMe Voice Chat System Check"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Edge Function Status
echo "1️⃣  Checking Edge Function Status..."
FUNC_STATUS=$(npx supabase functions list 2>/dev/null | grep "realtime-token" | grep "ACTIVE")
if [ ! -z "$FUNC_STATUS" ]; then
    echo -e "${GREEN}✅ Edge Function 'realtime-token' is ACTIVE${NC}"
else
    echo -e "${RED}❌ Edge Function 'realtime-token' is NOT active${NC}"
    exit 1
fi
echo ""

# Check 2: Secrets Configuration
echo "2️⃣  Checking Secrets Configuration..."
SECRET_CHECK=$(npx supabase secrets list 2>/dev/null | grep "OPENAI_API_KEY")
if [ ! -z "$SECRET_CHECK" ]; then
    echo -e "${GREEN}✅ OPENAI_API_KEY secret is configured${NC}"
else
    echo -e "${RED}❌ OPENAI_API_KEY secret is NOT configured${NC}"
    exit 1
fi
echo ""

# Check 3: Environment Variables
echo "3️⃣  Checking Environment Variables..."
if [ -f .env ]; then
    if grep -q "VITE_SUPABASE_URL" .env && grep -q "VITE_SUPABASE_ANON_KEY" .env; then
        echo -e "${GREEN}✅ Environment variables are configured${NC}"
    else
        echo -e "${RED}❌ Missing required environment variables${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi
echo ""

# Check 4: Test Edge Function
echo "4️⃣  Testing Edge Function..."
SUPABASE_URL=$(cat .env | grep VITE_SUPABASE_URL | cut -d'"' -f2)
SUPABASE_KEY=$(cat .env | grep VITE_SUPABASE_ANON_KEY | cut -d'"' -f2)

RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/realtime-token" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json")

if echo "$RESPONSE" | grep -q "client_secret"; then
    echo -e "${GREEN}✅ Edge Function returns valid ephemeral token${NC}"
    EXPIRES_AT=$(echo "$RESPONSE" | grep -o '"expires_at":[0-9]*' | cut -d':' -f2)
    if [ ! -z "$EXPIRES_AT" ]; then
        echo -e "   Token expires at: $(date -r $EXPIRES_AT 2>/dev/null || echo 'N/A')"
    fi
else
    echo -e "${RED}❌ Edge Function returned error:${NC}"
    echo "$RESPONSE" | head -c 200
    exit 1
fi
echo ""

# Check 5: Build Status
echo "5️⃣  Checking Build Status..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Build succeeds${NC}"
else
    echo -e "${RED}❌ Build failed - run 'npm run build' for details${NC}"
    exit 1
fi
echo ""

# Check 6: TypeScript Errors
echo "6️⃣  Checking for TypeScript Errors..."
TS_ERRORS=$(npx tsc --noEmit 2>&1 | grep "error TS" | wc -l)
if [ "$TS_ERRORS" -eq "0" ]; then
    echo -e "${GREEN}✅ No TypeScript errors${NC}"
else
    echo -e "${YELLOW}⚠️  Found $TS_ERRORS TypeScript errors${NC}"
    echo "   Run 'npx tsc --noEmit' to see details"
fi
echo ""

# Summary
echo "=================================="
echo -e "${GREEN}🎉 All System Checks Passed!${NC}"
echo ""
echo "📝 Next Steps:"
echo "   1. Open the app in browser (with HTTPS)"
echo "   2. Navigate to NewMe Voice Chat"
echo "   3. Open Browser DevTools Console (F12)"
echo "   4. Click 'Start Conversation'"
echo "   5. Grant microphone permissions"
echo "   6. Check console logs for detailed output"
echo ""
echo "📚 For debugging help, see: VOICE_CHAT_DEBUG_GUIDE.md"
echo ""
echo "🔗 Quick Links:"
echo "   • OpenAI Dashboard: https://platform.openai.com/usage"
echo "   • OpenAI API Keys: https://platform.openai.com/api-keys"
echo "   • Supabase Dashboard: https://supabase.com/dashboard"
echo ""
