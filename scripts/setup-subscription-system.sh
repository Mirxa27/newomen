#!/bin/bash

# Subscription System Setup Script
# This script helps set up the subscription system for Newomen platform

set -e

echo "🚀 Setting up Subscription System..."
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found!${NC}"
    echo "Please install it first: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo -e "${GREEN}✓ Supabase CLI found${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found!${NC}"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo -e "${GREEN}✓ Project root directory confirmed${NC}"
echo ""

# Option 1: Apply migration via Supabase CLI
echo "📋 Option 1: Apply migration via Supabase CLI"
echo "============================================"
echo ""
echo -e "${YELLOW}This will sync your local database with remote Supabase.${NC}"
read -p "Do you want to proceed with CLI migration? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Pulling remote database state..."
    supabase db pull || echo -e "${YELLOW}⚠️  Warning: Pull failed, continuing...${NC}"
    
    echo ""
    echo "Pushing new migration..."
    if supabase db push; then
        echo -e "${GREEN}✅ Migration applied successfully!${NC}"
    else
        echo -e "${RED}❌ Migration failed!${NC}"
        echo ""
        echo "You may need to repair migration history:"
        echo "supabase migration repair --status reverted <migration-ids>"
        echo ""
        echo "Or apply manually via Supabase Dashboard (see Option 2 below)"
        exit 1
    fi
else
    echo -e "${YELLOW}Skipped CLI migration${NC}"
    echo ""
    echo "📋 Option 2: Apply migration via Supabase Dashboard"
    echo "=================================================="
    echo ""
    echo "1. Go to your Supabase Dashboard"
    echo "2. Navigate to SQL Editor"
    echo "3. Copy the contents of: supabase/migrations/20250114000002_subscription_system.sql"
    echo "4. Paste and execute the SQL"
    echo "5. Verify that subscription_plans table is created"
    echo ""
    read -p "Press Enter to open the migration file for copying..."
    
    # Try to open the file in default editor
    if command -v code &> /dev/null; then
        code supabase/migrations/20250114000002_subscription_system.sql
        echo -e "${GREEN}Opened in VS Code${NC}"
    elif command -v nano &> /dev/null; then
        nano supabase/migrations/20250114000002_subscription_system.sql
    else
        cat supabase/migrations/20250114000002_subscription_system.sql
    fi
fi

echo ""
echo "🔄 Regenerating TypeScript types..."
echo "===================================="

# Regenerate types if script exists
if [ -f "scripts/regenerate-types.sh" ]; then
    chmod +x scripts/regenerate-types.sh
    ./scripts/regenerate-types.sh || echo -e "${YELLOW}⚠️  Type regeneration failed, you may need to run it manually${NC}"
else
    echo -e "${YELLOW}⚠️  Type regeneration script not found${NC}"
    echo "You may need to run: npm run regenerate-types"
fi

echo ""
echo "✨ Verifying installation..."
echo "============================="

# Check if migration file exists
if [ -f "supabase/migrations/20250114000002_subscription_system.sql" ]; then
    echo -e "${GREEN}✓ Migration file exists${NC}"
else
    echo -e "${RED}✗ Migration file not found${NC}"
fi

# Check if service file exists
if [ -f "src/services/SubscriptionService.ts" ]; then
    echo -e "${GREEN}✓ SubscriptionService exists${NC}"
else
    echo -e "${RED}✗ SubscriptionService not found${NC}"
fi

# Check if component exists
if [ -f "src/components/SubscriptionPlans.tsx" ]; then
    echo -e "${GREEN}✓ SubscriptionPlans component exists${NC}"
else
    echo -e "${RED}✗ SubscriptionPlans component not found${NC}"
fi

echo ""
echo "📝 Next Steps:"
echo "=============="
echo ""
echo "1. ✅ Database migration applied (or manual via dashboard)"
echo "2. 🔄 TypeScript types regenerated"
echo "3. 📱 Test subscription plans in Account Settings"
echo "4. 💳 Integrate with payment flow"
echo "5. 🎙️  Integrate with voice chat (minute consumption)"
echo ""
echo "📚 Documentation: SUBSCRIPTION_SYSTEM_COMPLETE.md"
echo ""
echo -e "${GREEN}🎉 Subscription system setup complete!${NC}"
echo ""

# Optional: Start dev server
read -p "Do you want to start the development server? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run dev
fi
