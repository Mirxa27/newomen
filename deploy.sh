#!/bin/bash

# NewWomen Platform - Deployment Script
# This script helps deploy all new features to production

set -e  # Exit on error

echo "🚀 NewWomen Platform Deployment"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Database Migration
echo -e "${BLUE}Step 1: Applying Database Migrations${NC}"
echo "This will add the narrative_identity_data column to user_memory_profiles"
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    supabase migration up || echo -e "${YELLOW}Migration failed. Please run manually.${NC}"
    echo -e "${GREEN}✓ Migration complete${NC}"
fi
echo ""

# Step 2: Storage Bucket
echo -e "${BLUE}Step 2: Creating Storage Bucket for Avatars${NC}"
echo "Creating 'avatars' bucket..."
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    supabase storage create avatars --public || echo -e "${YELLOW}Bucket may already exist.${NC}"
    echo -e "${GREEN}✓ Storage bucket ready${NC}"
fi
echo ""

# Step 3: Deploy Edge Functions
echo -e "${BLUE}Step 3: Deploying Edge Functions${NC}"
echo "Deploying: ai-content-builder, provider-discovery, realtime-token"
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Deploying ai-content-builder..."
    supabase functions deploy ai-content-builder || echo -e "${YELLOW}Deployment failed${NC}"
    
    echo "Deploying provider-discovery..."
    supabase functions deploy provider-discovery || echo -e "${YELLOW}Deployment failed${NC}"
    
    echo "Deploying realtime-token..."
    supabase functions deploy realtime-token || echo -e "${YELLOW}Deployment failed${NC}"
    
    echo -e "${GREEN}✓ Edge functions deployed${NC}"
fi
echo ""

# Step 4: Build Frontend
echo -e "${BLUE}Step 4: Building Frontend${NC}"
echo "Running production build..."
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    bun run build
    echo -e "${GREEN}✓ Build complete${NC}"
fi
echo ""

# Step 5: Environment Check
echo -e "${BLUE}Step 5: Environment Variables Check${NC}"
echo "Checking required environment variables..."
echo ""

# Check for required env vars
if [ -z "$VITE_SUPABASE_URL" ]; then
    echo -e "${YELLOW}⚠ VITE_SUPABASE_URL not set${NC}"
else
    echo -e "${GREEN}✓ VITE_SUPABASE_URL set${NC}"
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo -e "${YELLOW}⚠ VITE_SUPABASE_ANON_KEY not set${NC}"
else
    echo -e "${GREEN}✓ VITE_SUPABASE_ANON_KEY set${NC}"
fi

if [ -z "$OPENAI_API_KEY" ]; then
    echo -e "${YELLOW}⚠ OPENAI_API_KEY not set (required for narrative analysis)${NC}"
else
    echo -e "${GREEN}✓ OPENAI_API_KEY set${NC}"
fi

echo ""

# Step 6: Storage RLS Policies
echo -e "${BLUE}Step 6: Storage RLS Policies${NC}"
echo "You need to manually set RLS policies for the avatars bucket."
echo ""
echo "Run this SQL in Supabase Dashboard:"
echo ""
echo -e "${YELLOW}"
cat << 'EOF'
-- Allow public read access
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK ( 
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING ( 
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING ( 
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
EOF
echo -e "${NC}"
echo ""
read -p "Press enter when policies are set..."
echo ""

# Summary
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}🎉 Deployment Steps Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Next steps:"
echo "1. Deploy the dist/ folder to your hosting platform"
echo "2. Test the narrative exploration flow"
echo "3. Verify avatar uploads work"
echo "4. Check all new pages render correctly"
echo "5. Run feature tests at /feature-tests"
echo ""
echo "For detailed testing instructions, see NEXT_STEPS.md"
echo ""
echo -e "${BLUE}Happy deploying! 🚀${NC}"
