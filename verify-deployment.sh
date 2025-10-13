#!/bin/bash

# Deployment Verification Script for NewWomen Platform
# This script verifies that all components are ready for deployment

echo "🚀 NewWomen Platform - Deployment Verification"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Not in project root directory${NC}"
    exit 1
fi

echo "📋 Running pre-deployment checks..."
echo ""

# 1. Check Node modules
echo -n "1. Checking node_modules... "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Missing - Run: npm install${NC}"
    exit 1
fi

# 2. Check environment variables
echo -n "2. Checking environment variables... "
if [ -f ".env" ]; then
    if grep -q "VITE_SUPABASE_URL" .env && grep -q "VITE_SUPABASE_ANON_KEY" .env; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗ Missing required variables${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ .env file not found${NC}"
    exit 1
fi

# 3. TypeScript Check
echo -n "3. Running TypeScript check... "
if npx tsc --noEmit > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ TypeScript errors found${NC}"
    npx tsc --noEmit
    exit 1
fi

# 4. Build Check
echo -n "4. Running production build... "
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    npm run build
    exit 1
fi

# 5. Check build output
echo -n "5. Verifying build output... "
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    BUILD_SIZE=$(du -sh dist/ | cut -f1)
    echo -e "${GREEN}✓ (Size: $BUILD_SIZE)${NC}"
else
    echo -e "${RED}✗ dist/ directory incomplete${NC}"
    exit 1
fi

# 6. Check critical files
echo -n "6. Checking critical files... "
MISSING_FILES=0
CRITICAL_FILES=(
    "dist/index.html"
    "dist/assets/index-*.js"
    "dist/assets/index-*.css"
)

for pattern in "${CRITICAL_FILES[@]}"; do
    if ! ls $pattern > /dev/null 2>&1; then
        echo -e "${RED}✗ Missing: $pattern${NC}"
        ((MISSING_FILES++))
    fi
done

if [ $MISSING_FILES -eq 0 ]; then
    echo -e "${GREEN}✓${NC}"
else
    exit 1
fi

# 7. Verify Vercel configuration
echo -n "7. Checking Vercel configuration... "
if [ -f "vercel.json" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠ vercel.json not found (optional)${NC}"
fi

# 8. Check for common issues
echo -n "8. Scanning for common deployment issues... "
ISSUES=0

# Check for console.log in production code (warning only)
if grep -r "console\.log" src/ --include="*.tsx" --include="*.ts" | grep -v "// " | grep -v "/\*" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Warning: console.log statements found${NC}"
fi

# Check for hardcoded localhost URLs
if grep -r "localhost" src/ --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" | grep -v "comment" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Warning: localhost references found${NC}"
fi

echo -e "${GREEN}✓${NC}"

echo ""
echo "=============================================="
echo -e "${GREEN}✅ All checks passed! Ready for deployment${NC}"
echo "=============================================="
echo ""
echo "📊 Build Statistics:"
echo "   - Build size: $(du -sh dist/ | cut -f1)"
echo "   - Files: $(find dist/ -type f | wc -l | tr -d ' ') files"
echo "   - Assets: $(find dist/assets/ -type f 2>/dev/null | wc -l | tr -d ' ') assets"
echo ""
echo "🔗 Next Steps:"
echo "   1. Git status is clean and pushed to main"
echo "   2. Vercel will auto-deploy from GitHub"
echo "   3. Check Vercel dashboard for deployment status"
echo "   4. Visit: https://vercel.com/team_a7jwzFVJrcEgqDf5HJXD7sZ3/newomen"
echo ""
echo "💡 To manually deploy:"
echo "   - Run: vercel --prod"
echo ""

