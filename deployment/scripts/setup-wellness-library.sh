#!/bin/bash

# Wellness Library Setup Script
# Simple one-command setup for YouTube-based wellness resources

echo "🧘 Wellness Library Setup"
echo "=========================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install supabase --save-dev
fi

echo "✅ Supabase CLI found"
echo ""

# Run migrations
echo "📦 Applying database migrations..."
npx supabase db push

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migrations applied successfully!"
    echo ""
    echo "🎉 Wellness Library is ready!"
    echo ""
    echo "📋 What was added:"
    echo "  - 13 free YouTube wellness resources"
    echo "  - Categories: Meditation, Breathing, Affirmations, Sleep, Focus, Relaxation"
    echo ""
    echo "🚀 Next Steps:"
    echo "  1. Start dev server: npm run dev"
    echo "  2. User page: http://localhost:5173/wellness-library"
    echo "  3. Admin page: http://localhost:5173/admin/wellness-library"
    echo ""
    echo "📖 Documentation: WELLNESS_LIBRARY_SETUP.md"
    echo ""
else
    echo ""
    echo "❌ Migration failed. Please check your Supabase connection:"
    echo "   1. Make sure Supabase project is linked: npx supabase link"
    echo "   2. Check your .env file has correct credentials"
    echo ""
fi

