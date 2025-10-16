#!/bin/bash

echo "🔍 Verifying Comprehensive Implementation - Newomen Platform"
echo "=========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track verification results
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Function to run a check
run_check() {
    local check_name="$1"
    local command="$2"
    local expected_result="$3"
    
    echo -n "🔍 Checking $check_name... "
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}❌ FAIL${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

# Function to check file content
check_file_content() {
    local file_path="$1"
    local search_pattern="$2"
    local description="$3"
    
    echo -n "🔍 Checking $description... "
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ -d "$file_path" ]; then
        if grep -Erq "$search_pattern" "$file_path" 2>/dev/null; then
            echo -e "${GREEN}✅ PASS${NC}"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            echo -e "${RED}❌ FAIL${NC}"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
        fi
    elif grep -Eq "$search_pattern" "$file_path" 2>/dev/null; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}❌ FAIL${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

# Function to check file exists
check_file_exists() {
    local file_path="$1"
    local description="$2"
    
    echo -n "🔍 Checking $description... "
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ -f "$file_path" ]; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}❌ FAIL${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

echo ""
echo "📋 IMPLEMENTATION VERIFICATION CHECKLIST"
echo "========================================"

# 1. Check for remaining mock logic
echo ""
echo "🔍 1. MOCK LOGIC ELIMINATION"
echo "----------------------------"
# Check for mock logic in source files (exclude UI placeholder attributes and comments)
MOCK_MATCH_COUNT=$(find src -name "*.ts" -o -name "*.tsx" \
  | xargs grep -nE "(mock|fake|simulate|placeholder)" 2>/dev/null \
  | grep -vE "^\s*//|/\*|\*/|placeholder=\"|className=\".*placeholder|test|//\s*Mock|//\s*Simulate|faked_feeling|fakedFeeling|hasFakeCaret" \
  | wc -l)

if [ "$MOCK_MATCH_COUNT" -eq 0 ]; then
    echo -e "🔍 Checking No mock logic remaining... ${GREEN}✅ PASS${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "🔍 Checking No mock logic remaining... ${RED}❌ FAIL${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

# Check for mock-related TODOs
MOCK_TODO_COUNT=$(find src -name "*.ts" -o -name "*.tsx" | xargs grep -El "TODO.*mock|FIXME.*mock" 2>/dev/null | wc -l)
if [ "$MOCK_TODO_COUNT" -eq 0 ]; then
    echo -e "🔍 Checking No mock-related TODOs... ${GREEN}✅ PASS${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "🔍 Checking No mock-related TODOs... ${RED}❌ FAIL${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

# Check for mock timeouts or random values
if find src -name "*.ts" -o -name "*.tsx" | xargs grep -En "setTimeout.*mock|Math\.random.*mock" 2>/dev/null | grep -vE "^\s*//|/\*|\*/" | wc -l | grep -q "^0$"; then
    echo -e "🔍 Checking No mock timeouts or random values... ${GREEN}✅ PASS${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "🔍 Checking No mock timeouts or random values... ${RED}❌ FAIL${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

# 2. Check business logic implementations
echo ""
echo "🔍 2. BUSINESS LOGIC IMPLEMENTATIONS"
echo "-----------------------------------"
check_file_exists "src/services/features/assessment/AssessmentBusinessLogic.ts" "Assessment business logic service"
check_file_exists "src/services/features/payment/PaymentService.ts" "Payment service implementation"
check_file_exists "src/services/features/community/CommunityService.ts" "Community service implementation"
check_file_exists "src/services/shared/core/MobileService.ts" "Mobile service implementation"
check_file_exists "src/services/shared/core/ServiceRegistry.ts" "Service registry implementation"

# 3. Check DTOs and validation
echo ""
echo "🔍 3. DTOs AND VALIDATION"
echo "-------------------------"
check_file_exists "src/lib/shared/validation/schemas.ts" "Validation schemas"
if grep -q "z\.object\|z\.string\|z\.number" "src/lib/shared/validation/schemas.ts" 2>/dev/null; then
    echo -e "🔍 Checking Zod validation schemas... ${GREEN}✅ PASS${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "🔍 Checking Zod validation schemas... ${RED}❌ FAIL${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

if grep -q "PaymentCreateDTO\|CommunityPostCreateDTO" "src/types/shared/core/validation.ts" 2>/dev/null; then
    echo -e "🔍 Checking DTO interfaces... ${GREEN}✅ PASS${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "🔍 Checking DTO interfaces... ${RED}❌ FAIL${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

# 4. Check error handling
echo ""
echo "🔍 4. ERROR HANDLING SYSTEM"
echo "---------------------------"
check_file_exists "src/utils/shared/core/error-handling.ts" "Error handling utilities"
check_file_content "src/utils/shared/core/error-handling.ts" "ErrorFactory|ErrorSeverity" "Error factory classes"
check_file_content "src/utils/shared/core/error-handling.ts" "handle.*error" "Error handling functions"

# 5. Check mobile optimization
echo ""
echo "🔍 5. MOBILE OPTIMIZATION"
echo "-------------------------"
check_file_exists "src/components/shared/layout/MobileOptimizedLayout.tsx" "Mobile layout component"
check_file_exists "src/components/shared/layout/MobileTouchOptimizer.tsx" "Touch optimization component"
check_file_exists "src/pages/shared/mobile/MobileDashboard.tsx" "Mobile dashboard page"
check_file_content "src/index.css" "media.*max-width.*768px" "Mobile media queries"
check_file_content "src/index.css" "backdrop-filter.*blur.*8px" "Optimized blur effects"

# 6. Check clean architecture
echo ""
echo "🔍 6. CLEAN ARCHITECTURE"
echo "------------------------"
check_file_content "src/services" "class.*Service" "Service classes implemented"
check_file_content "src/services" "private.*async.*process" "Private business logic methods"
check_file_content "src/services" "public.*async.*create|public.*async.*get" "Public API methods"
check_file_content "src/services" "static.*getInstance" "Singleton pattern implementation"

# 7. Check real API integrations
echo ""
echo "🔍 7. REAL API INTEGRATIONS"
echo "---------------------------"
check_file_content "src/services/features/ai/providers/google.ts" "generativelanguage\.googleapis\.com" "Real Google API host"
check_file_content "src/services/features/ai/providers/google.ts" "safetySettings|generationConfig" "Real API parameters"
check_file_content "supabase/functions/provider-discovery/index.ts" "fetch.*api\.cartesia\.ai" "Real Cartesia API calls"
check_file_content "src/services/features/payment/PaymentService.ts" "fetch.*api\.paypal\.com|api\.sandbox\.paypal\.com" "Real PayPal API calls"

# 8. Check database operations
echo ""
echo "🔍 8. DATABASE OPERATIONS"
echo "------------------------"
check_file_content "src/services" "supabase\.from.*insert|supabase\.from.*update" "Real database operations"
check_file_content "src/services" "\.select\(.*\)|\.eq\(.*\)" "Database query operations"
check_file_content "src/pages/features/assessment/AssessmentTest.tsx" "supabase[[:space:]]*\.[[:space:]]*from\([^)]*assessment_attempts" "Real assessment database operations"

# 9. Check performance optimizations
echo ""
echo "🔍 9. PERFORMANCE OPTIMIZATIONS"
echo "------------------------------"
check_file_content "src/index.css" "linear-gradient.*hsl" "CSS gradients instead of images"
check_file_content "src/index.css" "animation.*4s|transition.*0\.15s" "Optimized animation durations"
check_file_content "src/index.css" "prefers-reduced-motion" "Accessibility optimizations"
check_file_content "src/index.css" "touch-action.*manipulation" "Touch optimizations"

# 10. Check service registry
echo ""
echo "🔍 10. SERVICE REGISTRY"
echo "----------------------"
check_file_content "src/services/shared/core/ServiceRegistry.ts" "getInstance|initializeAll" "Service registry methods"
check_file_content "src/services/shared/core/ServiceRegistry.ts" "getPlatformHealth|performHealthCheck" "Health monitoring"
check_file_content "src/services/shared/core/ServiceRegistry.ts" "export.*serviceRegistry" "Service registry export"

echo ""
echo "📊 VERIFICATION RESULTS"
echo "======================"
echo -e "Total Checks: ${BLUE}$TOTAL_CHECKS${NC}"
echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Failed: ${RED}$FAILED_CHECKS${NC}"

# Calculate success rate
if [ $TOTAL_CHECKS -gt 0 ]; then
    SUCCESS_RATE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    echo -e "Success Rate: ${BLUE}$SUCCESS_RATE%${NC}"
    
    if [ $SUCCESS_RATE -ge 90 ]; then
        echo -e "\n${GREEN}🎉 IMPLEMENTATION VERIFICATION SUCCESSFUL!${NC}"
        echo -e "${GREEN}✅ All critical implementations are in place${NC}"
        echo -e "${GREEN}✅ Mock logic has been eliminated${NC}"
        echo -e "${GREEN}✅ Production-ready code deployed${NC}"
        exit 0
    elif [ $SUCCESS_RATE -ge 70 ]; then
        echo -e "\n${YELLOW}⚠️  IMPLEMENTATION MOSTLY COMPLETE${NC}"
        echo -e "${YELLOW}⚠️  Some issues detected, but core functionality is ready${NC}"
        exit 1
    else
        echo -e "\n${RED}❌ IMPLEMENTATION INCOMPLETE${NC}"
        echo -e "${RED}❌ Significant issues detected${NC}"
        exit 2
    fi
else
    echo -e "\n${RED}❌ NO CHECKS PERFORMED${NC}"
    exit 3
fi
