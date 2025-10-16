#!/bin/bash

# Script to update CORS headers in all Supabase Edge Functions
# This ensures proper CORS configuration for all functions

FUNCTIONS_DIR="supabase/functions"

# Define the updated CORS headers
NEW_CORS_HEADERS="const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Max-Age': '86400',
};"

echo "🔄 Updating CORS headers in all Edge Functions..."
echo ""

# Counter for updated functions
updated_count=0

# Loop through all function directories
for func_dir in "$FUNCTIONS_DIR"/*/ ; do
    if [ -d "$func_dir" ]; then
        func_name=$(basename "$func_dir")
        index_file="${func_dir}index.ts"
        
        if [ -f "$index_file" ]; then
            # Check if file contains corsHeaders
            if grep -q "corsHeaders" "$index_file"; then
                echo "📝 Updating: $func_name"
                
                # Create backup
                cp "$index_file" "${index_file}.bak"
                
                # Use sed to replace CORS headers section
                # This is a simplified approach - may need manual verification
                if [[ "$OSTYPE" == "darwin"* ]]; then
                    # macOS
                    sed -i '' '/const corsHeaders = {/,/};/{
                        /const corsHeaders = {/!{
                            /};/!d
                        }
                    }' "$index_file"
                else
                    # Linux
                    sed -i '/const corsHeaders = {/,/};/{
                        /const corsHeaders = {/!{
                            /};/!d
                        }
                    }' "$index_file"
                fi
                
                # Insert new CORS headers
                if [[ "$OSTYPE" == "darwin"* ]]; then
                    sed -i '' "/const corsHeaders = {/r /dev/stdin" "$index_file" <<< "
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Max-Age': '86400',
"
                fi
                
                ((updated_count++))
            else
                echo "⚠️  Skipping: $func_name (no corsHeaders found)"
            fi
        fi
    fi
done

echo ""
echo "✅ Updated $updated_count Edge Functions"
echo ""
echo "Next steps:"
echo "1. Review the changes: git diff supabase/functions"
echo "2. Deploy functions: ./scripts/deploy-all-functions.sh"

