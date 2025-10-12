#!/bin/bash

# PayPal Live Configuration Setup Script
# Configures PayPal for production payments

echo "🔐 PayPal Live Configuration Setup"
echo "===================================="
echo ""
echo "⚠️  WARNING: This will configure LIVE PayPal credentials"
echo "   Real money will be charged to customers!"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Setup cancelled"
    exit 1
fi

echo ""
echo "📝 Configuring Supabase Edge Function Secrets..."
echo ""

# Set PayPal secrets
npx supabase secrets set PAYPAL_CLIENT_ID=AR0Jsu6JyP_Q8RbZdNrC8xWpu4RetvW9FSA9Z-aC5EL5_reTQ9QhsfKarv5-_bW0dKLa9sKG5DumOsHc

npx supabase secrets set PAYPAL_CLIENT_SECRET=EAJaeQHSUzXoOSW9QuICSBfsnz5nq2yDnoV57F8aNtVaMJZTLTxrLIr9bkuOha5GARpmhY18VtHT5JMN

npx supabase secrets set PAYPAL_MODE=live

echo ""
echo "✅ Secrets configured"
echo ""
echo "📦 Deploying Edge Functions..."
echo ""

# Deploy PayPal functions
npx supabase functions deploy paypal-create-order
npx supabase functions deploy paypal-capture-order

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Edge functions deployed successfully!"
    echo ""
    echo "🎉 PayPal Live Configuration Complete!"
    echo ""
    echo "📋 What was configured:"
    echo "  - PayPal Client ID (Live)"
    echo "  - PayPal Client Secret (Live)"  
    echo "  - PayPal Mode: LIVE"
    echo "  - Edge functions deployed"
    echo ""
    echo "⚠️  IMPORTANT NEXT STEPS:"
    echo ""
    echo "1. Update Vercel environment variables:"
    echo "   VITE_PAYPAL_CLIENT_ID=AR0Jsu6JyP_Q8RbZdNrC8xWpu4RetvW9FSA9Z-aC5EL5_reTQ9QhsfKarv5-_bW0dKLa9sKG5DumOsHc"
    echo ""
    echo "2. Redeploy frontend:"
    echo "   vercel --prod"
    echo ""
    echo "3. Test payment with small amount first!"
    echo ""
    echo "🔴 LIVE MODE ACTIVE - Real payments will be processed"
    echo ""
else
    echo ""
    echo "❌ Deployment failed. Check errors above."
    exit 1
fi

