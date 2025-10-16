#!/usr/bin/env python3
"""
Add apikey header to all fetch requests to Supabase Edge Functions
"""

import re
from pathlib import Path

def add_apikey_header(file_path):
    """Add apikey header to fetch requests in a file"""
    with open(file_path, 'r') as f:
        content = f.read()
    
    original_content = content
    
    # Pattern 1: Headers with 'Authorization' and 'Content-Type' but no 'apikey'
    pattern1 = r"(headers:\s*\{[^}]*'Authorization':[^}]*'Content-Type':[^}]*)\}"
    
    def replace_func1(match):
        headers_block = match.group(1)
        if 'apikey' not in headers_block:
            # Check if using import.meta.env or process.env
            if 'import.meta.env' in file_path.read_text():
                return headers_block + ",\n          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY\n        }"
            else:
                return headers_block + ",\n          'apikey': process.env.VITE_SUPABASE_ANON_KEY\n        }"
        return match.group(0)
    
    content = re.sub(pattern1, replace_func1, content)
    
    # Pattern 2: Headers with only Content-Type (double quotes)
    pattern2 = r'(headers:\s*\{[^}]*"Content-Type":[^}]*)\}'
    
    def replace_func2(match):
        headers_block = match.group(1)
        if 'apikey' not in headers_block and 'Authorization' in headers_block:
            if 'import.meta.env' in file_path.read_text():
                return headers_block + ',\n          "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY\n        }'
            else:
                return headers_block + ',\n          "apikey": process.env.VITE_SUPABASE_ANON_KEY\n        }'
        return match.group(0)
    
    content = re.sub(pattern2, replace_func2, content)
    
    if content != original_content:
        with open(file_path, 'w') as f:
            f.write(content)
        return True
    return False

def main():
    files_to_check = [
        'src/hooks/features/community/useCommunityPosts.ts',
        'src/hooks/features/community/useCommunityPost.ts',
        'src/services/features/ai/UnifiedAIAssessmentService.ts',
    ]
    
    updated_count = 0
    
    print("🔄 Adding apikey headers to fetch requests...")
    print()
    
    for file_path in files_to_check:
        path = Path(file_path)
        if path.exists():
            if add_apikey_header(path):
                print(f"✅ Updated: {file_path}")
                updated_count += 1
            else:
                print(f"⏭️  Skipped: {file_path} (already has apikey or no matches)")
        else:
            print(f"⚠️  Not found: {file_path}")
    
    print()
    print(f"📊 Updated {updated_count} files")

if __name__ == '__main__':
    main()

