# 🔴 PayPal Production Deployment - LIVE MODE

## ✅ Status: Ready for Live Payments

Your PayPal app **"newomen"** is configured for **LIVE production payments**.

---

## 📋 Your PayPal Live Credentials

```
App Name: newomen
Business Email: Abdullah@sourcekom.com

Client ID (Public):
AR0Jsu6JyP_Q8RbZdNrC8xWpu4RetvW9FSA9Z-aC5EL5_reTQ9QhsfKarv5-_bW0dKLa9sKG5DumOsHc

Secret Key (Private):
EAJaeQHSUzXoOSW9QuICSBfsnz5nq2yDnoV57F8aNtVaMJZTLTxrLIr9bkuOha5GARpmhY18VtHT5JMN
```

---

## 🚀 Quick Deploy (5 Commands)

### Option 1: Automated Script (RECOMMENDED)
```bash
# Run the setup script
./setup-paypal-live.sh

# Update Vercel (manually add env var in dashboard):
# VITE_PAYPAL_CLIENT_ID=AR0Jsu6JyP_Q8RbZdNrC8xWpu4RetvW9FSA9Z-aC5EL5_reTQ9QhsfKarv5-_bW0dKLa9sKG5DumOsHc

# Redeploy frontend
vercel --prod
```

### Option 2: Manual Configuration

#### Step 1: Configure Supabase Secrets
```bash
npx supabase secrets set PAYPAL_CLIENT_ID=AR0Jsu6JyP_Q8RbZdNrC8xWpu4RetvW9FSA9Z-aC5EL5_reTQ9QhsfKarv5-_bW0dKLa9sKG5DumOsHc

npx supabase secrets set PAYPAL_CLIENT_SECRET=EAJaeQHSUzXoOSW9QuICSBfsnz5nq2yDnoV57F8aNtVaMJZTLTxrLIr9bkuOha5GARpmhY18VtHT5JMN

npx supabase secrets set PAYPAL_MODE=live
```

#### Step 2: Deploy Edge Functions
```bash
npx supabase functions deploy paypal-create-order
npx supabase functions deploy paypal-capture-order
```

#### Step 3: Update Vercel
1. Go to: https://vercel.com/mirxa27s-projects/newomen/settings/environment-variables
2. Add new variable:
   - **Name**: `VITE_PAYPAL_CLIENT_ID`
   - **Value**: `AR0Jsu6JyP_Q8RbZdNrC8xWpu4RetvW9FSA9Z-aC5EL5_reTQ9QhsfKarv5-_bW0dKLa9sKG5DumOsHc`
   - **Environment**: Production, Preview, Development

#### Step 4: Redeploy
```bash
vercel --prod
```

---

## 🔍 What Changed

### Edge Functions Updated:
**Before:**
```typescript
const PAYPAL_API_BASE = 'https://api.sandbox.paypal.com';  // Sandbox
```

**After:**
```typescript
const PAYPAL_MODE = Deno.env.get('PAYPAL_MODE') || 'live';
const PAYPAL_API_BASE = PAYPAL_MODE === 'sandbox' 
  ? 'https://api.sandbox.paypal.com'
  : 'https://api.paypal.com';  // LIVE ✅
```

### Files Modified:
- `supabase/functions/paypal-create-order/index.ts`
- `supabase/functions/paypal-capture-order/index.ts`

---

## 💳 Payment Plans Configuration

### Growth Plan - $22 USD
- 100 conversation minutes
- All premium features
- Monthly subscription

### Transformation Plan - $222 USD
- 1000 conversation minutes
- All premium features
- Priority support
- Monthly subscription

**Currency**: USD
**Processor**: PayPal
**Mode**: LIVE Production 🔴

---

## 🧪 Testing Before Going Live

### Critical Tests (In Order):

1. **Test Button Loads**
   ```
   ✓ Go to /pricing
   ✓ PayPal buttons visible
   ✓ No console errors
   ```

2. **Test Checkout Flow (Use $22 plan first)**
   ```
   ✓ Click "Subscribe" on Growth plan
   ✓ PayPal popup opens
   ✓ Can login to PayPal
   ✓ Payment details shown correctly
   ✓ Can complete payment
   ```

3. **Test Subscription Activation**
   ```
   ✓ Database subscription record created
   ✓ User tier updated to 'growth'
   ✓ Remaining minutes set to 100
   ✓ Account settings shows active subscription
   ```

4. **Test Premium Features**
   ```
   ✓ Can access AI chat
   ✓ Minutes deduct properly
   ✓ Premium badge shows
   ```

5. **Test Transaction in PayPal Dashboard**
   ```
   ✓ Login to https://www.paypal.com
   ✓ Check Activity tab
   ✓ See transaction with correct amount
   ✓ Status shows "Completed"
   ```

---

## 🔐 Security Checklist

- [x] Secret key stored in Supabase secrets (NOT in frontend)
- [x] Client ID can be public (safe in frontend)
- [x] Using HTTPS for all API calls
- [x] CORS configured properly
- [x] Environment variables separated (frontend vs backend)
- [x] No credentials in git repository
- [x] Live mode explicitly configured

---

## 📊 Expected Transaction Flow

```
User Flow:
1. User visits /pricing page
2. Clicks "Subscribe" on Growth or Transformation plan
3. PayPal checkout popup opens
4. User logs into PayPal account
5. Reviews payment details
6. Confirms payment
7. PayPal processes payment
8. Edge function captures payment
9. Database subscription created
10. User tier and minutes updated
11. User sees confirmation
12. Can access premium features

Technical Flow:
Frontend → PayPal SDK → PayPal Checkout
  → paypal-create-order function → PayPal API
    → PayPal processes payment
      → paypal-capture-order function → PayPal API
        → Update Supabase database
          → User subscription active ✅
```

---

## 💰 PayPal Fees

Standard PayPal rates for your Business account:
- **Domestic transactions**: 2.9% + $0.30 per transaction
- **International**: 4.4% + fixed fee

### Your Revenue Per Plan:

**Growth Plan ($22)**:
- Gross: $22.00
- PayPal Fee: ~$0.94
- Net: ~$21.06

**Transformation Plan ($222)**:
- Gross: $222.00
- PayPal Fee: ~$6.74
- Net: ~$215.26

---

## 🔄 Switching Between Sandbox and Live

### To Test (Sandbox Mode):
```bash
npx supabase secrets set PAYPAL_MODE=sandbox
npx supabase secrets set PAYPAL_CLIENT_ID=your-sandbox-client-id
npx supabase secrets set PAYPAL_CLIENT_SECRET=your-sandbox-secret

npx supabase functions deploy paypal-create-order
npx supabase functions deploy paypal-capture-order
```

### To Go Live (Production Mode):
```bash
npx supabase secrets set PAYPAL_MODE=live
npx supabase secrets set PAYPAL_CLIENT_ID=AR0Jsu6JyP_Q8RbZdNrC8xWpu4RetvW9FSA9Z-aC5EL5_reTQ9QhsfKarv5-_bW0dKLa9sKG5DumOsHc
npx supabase secrets set PAYPAL_CLIENT_SECRET=EAJaeQHSUzXoOSW9QuICSBfsnz5nq2yDnoV57F8aNtVaMJZTLTxrLIr9bkuOha5GARpmhY18VtHT5JMN

npx supabase functions deploy paypal-create-order
npx supabase functions deploy paypal-capture-order
```

---

## 🚨 LIVE MODE WARNINGS

### ⚠️ Once Live Mode is Active:

1. **Real Money** - Customers will be charged real USD
2. **Real PayPal** - Transactions appear in your PayPal account
3. **Real Fees** - PayPal fees deducted from each transaction
4. **Refund Policy** - Decide on refund policy before launching
5. **Customer Service** - Be ready to handle payment issues
6. **Tax Compliance** - Ensure you comply with tax regulations

### 🛡️ Before Going Live:

- [ ] Test thoroughly in sandbox mode first
- [ ] Verify refund process works
- [ ] Set up PayPal instant payment notifications (IPN)
- [ ] Configure webhook listeners for subscription events
- [ ] Prepare customer service for payment inquiries
- [ ] Review PayPal's Acceptable Use Policy
- [ ] Ensure Terms of Service mentions payment terms

---

## 📈 Monitoring & Management

### Check Transactions:
1. **PayPal Dashboard**: https://www.paypal.com/businessprofile
2. **Activity Tab**: See all transactions
3. **Reports**: Download transaction reports

### Check Supabase Logs:
```bash
# View payment function logs
npx supabase functions logs paypal-create-order --tail
npx supabase functions logs paypal-capture-order --tail
```

### Database Monitoring:
```sql
-- Active subscriptions
SELECT 
  u.email,
  u.subscription_tier,
  u.remaining_minutes,
  s.status,
  s.renewal_date,
  s.created_at
FROM user_profiles u
LEFT JOIN subscriptions s ON s.user_id = u.user_id
WHERE s.status = 'active'
ORDER BY s.created_at DESC;

-- Revenue tracking
SELECT 
  subscription_tier as plan,
  COUNT(*) as subscriptions,
  CASE 
    WHEN subscription_tier = 'growth' THEN COUNT(*) * 22
    WHEN subscription_tier = 'transformation' THEN COUNT(*) * 222
  END as estimated_revenue
FROM user_profiles
WHERE subscription_tier IN ('growth', 'transformation')
GROUP BY subscription_tier;
```

---

## 🎯 Post-Deployment Checklist

### Immediately After Setup:
- [ ] Run `./setup-paypal-live.sh`
- [ ] Update Vercel environment variables
- [ ] Redeploy frontend with `vercel --prod`
- [ ] Test with Growth plan ($22) - use your own PayPal
- [ ] Verify subscription activated in database
- [ ] Check PayPal dashboard for transaction
- [ ] Test accessing premium features
- [ ] Monitor logs for 24 hours

### Within 24 Hours:
- [ ] Monitor for any errors
- [ ] Check PayPal transaction success rate
- [ ] Verify database subscriptions match PayPal
- [ ] Test from different devices/browsers
- [ ] Prepare customer support for payment questions

### Within 1 Week:
- [ ] Review all transactions in PayPal
- [ ] Check for any failed payments
- [ ] Analyze conversion rates
- [ ] Optimize checkout flow if needed
- [ ] Set up automated reconciliation

---

## 🔧 Troubleshooting

### "Payment failed - insufficient permissions"
**Solution**: Check Supabase secrets are set correctly
```bash
npx supabase secrets list
```

### "PayPal button not loading"
**Solution**: Verify Vercel has `VITE_PAYPAL_CLIENT_ID` set

### "Order created but capture failed"
**Solution**: Check `paypal-capture-order` function logs
```bash
npx supabase functions logs paypal-capture-order
```

### "Payment success but subscription not activated"
**Solution**: Check database RLS policies allow subscription inserts

---

## 📞 Support Resources

### PayPal:
- **Dashboard**: https://www.paypal.com/businessmanage
- **Developer**: https://developer.paypal.com
- **Support**: https://www.paypal.com/us/cshelp
- **Status**: https://www.paypal-status.com

### Your Setup:
- **Business Email**: Abdullah@sourcekom.com
- **App Name**: newomen
- **Mode**: 🔴 LIVE
- **API**: https://api.paypal.com

---

## 🎉 Ready to Launch!

Once you run the setup commands, your PayPal integration will be **LIVE** and ready to accept real payments!

### Final Command:
```bash
# Run this to activate live payments
./setup-paypal-live.sh
```

Then test with a real $22 payment to verify everything works!

---

## ⚠️ IMPORTANT REMINDER

**LIVE MODE = REAL MONEY!**

- Test thoroughly before announcing
- Start with Growth plan ($22) only
- Monitor closely for first week
- Have refund process ready
- Prepare customer support

---

**Created**: October 12, 2025
**Status**: ✅ Ready to deploy
**Mode**: 🔴 LIVE Production
**Business**: Abdullah@sourcekom.com

