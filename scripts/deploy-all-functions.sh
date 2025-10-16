#!/bin/bash

# Deploy all Supabase Edge Functions with updated CORS headers
# Project: Newomen (fkikaozubngmzcrnhkqe)

set -e  # Exit on error

PROJECT_REF="fkikaozubngmzcrnhkqe"
FUNCTIONS_DIR="supabase/functions"

echo "🚀 Deploying all Supabase Edge Functions..."
echo "📦 Project: $PROJECT_REF"
echo ""

# Counter
success_count=0
fail_count=0

# Get all function directories
for func_dir in "$FUNCTIONS_DIR"/*/ ; do
    if [ -d "$func_dir" ]; then
        func_name=$(basename "$func_dir")
        
        # Skip if not a valid function directory
        if [ ! -f "${func_dir}index.ts" ]; then
            continue
        fi
        
        echo "📤 Deploying: $func_name"
        
        if supabase functions deploy "$func_name" --project-ref "$PROJECT_REF" --no-verify-jwt 2>&1 | grep -q "Deployed"; then
            echo "   ✅ Success"
            ((success_count++))
        else
            echo "   ❌ Failed"
            ((fail_count++))
        fi
        
        echo ""
    fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Deployment Summary:"
echo "   ✅ Successful: $success_count"
echo "   ❌ Failed: $fail_count"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔗 View functions: https://supabase.com/dashboard/project/$PROJECT_REF/functions"

