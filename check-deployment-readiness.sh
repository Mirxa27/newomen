#!/bin/bash

# Production Deployment Readiness Checklist
# This script verifies that all prerequisites are met for deployment

# Don't exit on error, we want to complete all checks
# set -e

echo "🔍 Newomen Platform - Deployment Readiness Check"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASS=0
FAIL=0
WARN=0

# Check functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL++))
}

check_warn() {
    echo -e "${YELLOW}!${NC} $1"
    ((WARN++))
}

echo "📦 Build System Checks"
echo "---------------------"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    check_pass "Node.js installed ($NODE_VERSION)"
else
    check_fail "Node.js not installed"
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    check_pass "npm installed ($NPM_VERSION)"
else
    check_fail "npm not installed"
fi

# Check if dependencies are installed
if [ -d "node_modules" ]; then
    check_pass "Dependencies installed"
else
    check_fail "Dependencies not installed (run: npm install)"
fi

echo ""
echo "🔧 Environment Configuration"
echo "---------------------------"

# Check .env file
if [ -f ".env" ]; then
    check_pass ".env file exists"
    
    # Check required variables
    if grep -q "VITE_SUPABASE_URL" .env; then
        check_pass "VITE_SUPABASE_URL configured"
    else
        check_fail "VITE_SUPABASE_URL not set in .env"
    fi
    
    if grep -q "VITE_SUPABASE_ANON_KEY" .env || grep -q "VITE_SUPABASE_PUBLISHABLE_KEY" .env; then
        check_pass "Supabase anon key configured"
    else
        check_fail "Supabase anon key not set in .env"
    fi
else
    check_fail ".env file not found (copy from .env.example)"
fi

echo ""
echo "🏗️  Build Checks"
echo "---------------"

# Try to build
if npm run build &> /dev/null; then
    check_pass "Production build succeeds"
else
    check_fail "Production build fails (run: npm run build)"
fi

# Check dist directory
if [ -d "dist" ]; then
    check_pass "dist/ directory exists"
    
    # Check index.html
    if [ -f "dist/index.html" ]; then
        check_pass "dist/index.html exists"
    else
        check_fail "dist/index.html missing"
    fi
else
    check_fail "dist/ directory not found"
fi

echo ""
echo "🔐 Security Checks"
echo "-----------------"

# Check for exposed secrets in code
if grep -r "sk-" src/ 2>/dev/null | grep -v "example" &> /dev/null; then
    check_warn "Potential API keys found in source code"
else
    check_pass "No hardcoded API keys detected"
fi

# Check .gitignore
if [ -f ".gitignore" ]; then
    if grep -q "\.env" .gitignore; then
        check_pass ".env in .gitignore"
    else
        check_warn ".env not in .gitignore"
    fi
else
    check_fail ".gitignore not found"
fi

echo ""
echo "📋 Supabase Setup"
echo "----------------"

# Check if supabase CLI is installed
if command -v supabase &> /dev/null; then
    check_pass "Supabase CLI installed"
else
    check_warn "Supabase CLI not installed (optional)"
fi

# Check for migrations
if [ -d "supabase/migrations" ] && [ "$(ls -A supabase/migrations)" ]; then
    MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
    check_pass "Database migrations present ($MIGRATION_COUNT files)"
else
    check_warn "No database migrations found"
fi

# Check for edge functions
if [ -d "supabase/functions" ] && [ "$(ls -A supabase/functions)" ]; then
    FUNCTION_COUNT=$(ls -d supabase/functions/*/ 2>/dev/null | wc -l)
    check_pass "Edge functions present ($FUNCTION_COUNT functions)"
else
    check_warn "No edge functions found"
fi

echo ""
echo "🌐 Deployment Prerequisites"
echo "--------------------------"

# Check for Vercel CLI
if command -v vercel &> /dev/null; then
    check_pass "Vercel CLI installed"
else
    check_warn "Vercel CLI not installed (run: npm install -g vercel)"
fi

# Check for deployment scripts
if [ -f "deploy-vercel.sh" ]; then
    check_pass "Deployment script exists"
    if [ -x "deploy-vercel.sh" ]; then
        check_pass "Deployment script is executable"
    else
        check_warn "Deployment script not executable (run: chmod +x deploy-vercel.sh)"
    fi
else
    check_warn "Deployment script not found"
fi

# Check vercel.json
if [ -f "vercel.json" ]; then
    check_pass "vercel.json configuration exists"
else
    check_warn "vercel.json not found (optional)"
fi

echo ""
echo "📊 Summary"
echo "----------"
echo -e "${GREEN}Passed:${NC} $PASS"
echo -e "${YELLOW}Warnings:${NC} $WARN"
echo -e "${RED}Failed:${NC} $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✨ All critical checks passed! Ready for deployment.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Review PRODUCTION_DEPLOYMENT_GUIDE.md"
    echo "  2. Set environment variables in Vercel"
    echo "  3. Deploy: ./deploy-vercel.sh or vercel --prod"
    echo "  4. Configure domain Mirxa.io in Vercel Dashboard"
    exit 0
else
    echo -e "${RED}❌ Deployment readiness check failed.${NC}"
    echo "Please fix the issues above before deploying."
    exit 1
fi
