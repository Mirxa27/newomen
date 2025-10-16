#!/usr/bin/env python3
"""
Update CORS headers in all Supabase Edge Functions
"""

import os
import re
from pathlib import Path

# New CORS headers configuration
NEW_CORS_HEADERS = """const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Max-Age': '86400',
};"""

def update_cors_headers(file_path):
    """Update CORS headers in a single file"""
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Pattern to match corsHeaders declaration
    pattern = r'const corsHeaders = \{[^}]+\};'
    
    if re.search(pattern, content):
        # Replace with new CORS headers
        new_content = re.sub(pattern, NEW_CORS_HEADERS, content)
        
        with open(file_path, 'w') as f:
            f.write(new_content)
        
        return True
    return False

def main():
    functions_dir = Path('supabase/functions')
    updated_count = 0
    skipped_count = 0
    
    print("🔄 Updating CORS headers in all Edge Functions...")
    print()
    
    # Find all index.ts files
    for index_file in functions_dir.glob('*/index.ts'):
        func_name = index_file.parent.name
        
        if update_cors_headers(index_file):
            print(f"✅ Updated: {func_name}")
            updated_count += 1
        else:
            print(f"⚠️  Skipped: {func_name} (no corsHeaders found)")
            skipped_count += 1
    
    print()
    print(f"📊 Summary:")
    print(f"   ✅ Updated: {updated_count} functions")
    print(f"   ⚠️  Skipped: {skipped_count} functions")
    print()
    print("Next step: Run './scripts/deploy-all-functions.sh' to deploy")

if __name__ == '__main__':
    main()

