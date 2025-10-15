#!/bin/bash

# Script to regenerate Supabase types
# This ensures TypeScript types match your actual database schema

echo "🔄 Regenerating Supabase types..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI is not installed"
    echo "📦 Install it with: npm install -g supabase"
    exit 1
fi

# Check if SUPABASE_PROJECT_ID is set
if [ -z "$SUPABASE_PROJECT_ID" ]; then
    echo "⚠️  SUPABASE_PROJECT_ID environment variable not set"
    echo "💡 You can set it with: export SUPABASE_PROJECT_ID=your-project-id"
    echo ""
    echo "Or run the command manually:"
    echo "supabase gen types typescript --project-id <your-project-id> > src/integrations/supabase/types.generated.ts"
    exit 1
fi

# Generate types
echo "📝 Generating types for project: $SUPABASE_PROJECT_ID"

supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > src/integrations/supabase/types.generated.ts

if [ $? -eq 0 ]; then
    echo "✅ Types generated successfully!"
    echo "📄 File: src/integrations/supabase/types.generated.ts"
    echo ""
    echo "🔍 Checking if new types include required tables..."
    
    # Check for required tables
    if grep -q "community_connections" src/integrations/supabase/types.generated.ts; then
        echo "✅ community_connections table found"
    else
        echo "⚠️  community_connections table NOT found - may need to run migrations"
    fi
    
    if grep -q "user_profiles" src/integrations/supabase/types.generated.ts; then
        echo "✅ user_profiles table found"
    else
        echo "⚠️  user_profiles table NOT found - may need to run migrations"
    fi
    
    if grep -q "wellness_resources" src/integrations/supabase/types.generated.ts; then
        echo "✅ wellness_resources table found"
    else
        echo "⚠️  wellness_resources table NOT found - may need to run migrations"
    fi
    
    if grep -q "error_reports" src/integrations/supabase/types.generated.ts; then
        echo "✅ error_reports table found"
    else
        echo "⚠️  error_reports table NOT found - may need to run migrations"
    fi
    
    echo ""
    echo "📋 Next steps:"
    echo "1. Review the generated types file"
    echo "2. Update Community.tsx to use useCommunity instead of useCommunityReal if all tables are present"
    echo "3. Run TypeScript compiler to verify: npm run type-check"
else
    echo "❌ Failed to generate types"
    echo "💡 Make sure you're logged in to Supabase CLI: supabase login"
    exit 1
fi

