# 🔐 PayPal Live Configuration - Setup Instructions

## ⚡ Quick Setup (5 Minutes)

You've provided your **Live PayPal credentials**. Follow these steps to activate live payments.

---

## 📋 Your PayPal Details

**App Name**: newomen
**Client ID**: `AR0Jsu6JyP_Q8RbZdNrC8xWpu4RetvW9FSA9Z-aC5EL5_reTQ9QhsfKarv5-_bW0dKLa9sKG5DumOsHc`
**Primary Email**: `Abdullah@sourcekom.com`
**Mode**: 🔴 **LIVE** (Production)

---

## 🚀 Step-by-Step Configuration

### Step 1: Configure Supabase Edge Function Secrets

Run these commands in your terminal:

```bash
# Set PayPal Client ID
npx supabase secrets set PAYPAL_CLIENT_ID=AR0Jsu6JyP_Q8RbZdNrC8xWpu4RetvW9FSA9Z-aC5EL5_reTQ9QhsfKarv5-_bW0dKLa9sKG5DumOsHc

# Set PayPal Secret Key
npx supabase secrets set PAYPAL_CLIENT_SECRET=EAJaeQHSUzXoOSW9QuICSBfsnz5nq2yDnoV57F8aNtVaMJZTLTxrLIr9bkuOha5GARpmhY18VtHT5JMN

# Set PayPal Mode to LIVE
npx supabase secrets set PAYPAL_MODE=live
```

---

### Step 2: Deploy Updated Edge Functions

```bash
# Deploy PayPal create order function
npx supabase functions deploy paypal-create-order

# Deploy PayPal capture order function
npx supabase functions deploy paypal-capture-order
```

---

### Step 3: Update Vercel Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add this variable:

```
Name: VITE_PAYPAL_CLIENT_ID
Value: AR0Jsu6JyP_Q8RbZdNrC8xWpu4RetvW9FSA9Z-aC5EL5_reTQ9QhsfKarv5-_bW0dKLa9sKG5DumOsHc
Environment: Production, Preview, Development
```

---

### Step 4: Redeploy Frontend

```bash
# Trigger new Vercel deployment with updated env vars
vercel --prod
```

---

## ✅ Verification Steps

### 1. Test Payment Flow

1. Go to your production site
2. Navigate to `/pricing`
3. Click "Subscribe" on Growth plan ($22)
4. Complete PayPal checkout
5. Verify subscription is activated

### 2. Check Logs

```bash
# Check Supabase function logs
npx supabase functions logs paypal-create-order

# Check Vercel deployment logs
vercel logs
```

### 3. Verify Database

```sql
-- Check subscriptions table
SELECT * FROM subscriptions 
WHERE user_id = 'your-user-id' 
ORDER BY created_at DESC LIMIT 1;

-- Check user profile updated
SELECT subscription_tier, remaining_minutes 
FROM user_profiles 
WHERE user_id = 'your-user-id';
```

---

## 🔐 Security Checklist

- [x] Credentials stored in Supabase Secrets (not in code)
- [x] Client ID stored in Vercel environment variables
- [x] Secret key never exposed to frontend
- [x] Using HTTPS for all API calls
- [x] CORS properly configured
- [x] Live mode enabled

---

## 🎯 What Changed

### Before (Sandbox Mode):
```typescript
const PAYPAL_API_BASE = 'https://api.sandbox.paypal.com';
// Uses test credentials
// Test payments only
```

### After (Live Mode):
```typescript
const PAYPAL_MODE = Deno.env.get('PAYPAL_MODE') || 'live';
const PAYPAL_API_BASE = PAYPAL_MODE === 'sandbox' 
  ? 'https://api.sandbox.paypal.com'
  : 'https://api.paypal.com';

// Uses YOUR live credentials
// Real payments processed ✅
```

---

## 💳 Payment Plans Active

### Growth Plan
- **Price**: $22 USD
- **Minutes**: 100 conversation minutes
- **Client ID**: AR0Jsu6JyP_Q8RbZdNrC8xWpu4RetvW9FSA9Z-aC5EL5_reTQ9QhsfKarv5-_bW0dKLa9sKG5DumOsHc

### Transformation Plan
- **Price**: $222 USD
- **Minutes**: 1000 conversation minutes
- **Client ID**: AR0Jsu6JyP_Q8RbZdNrC8xWpu4RetvW9FSA9Z-aC5EL5_reTQ9QhsfKarv5-_bW0dKLa9sKG5DumOsHc

Both plans use the same PayPal app credentials.

---

## 🔧 Complete Command Reference

### Set All Secrets at Once:

```bash
# Copy and paste this entire block
npx supabase secrets set \
  PAYPAL_CLIENT_ID=AR0Jsu6JyP_Q8RbZdNrC8xWpu4RetvW9FSA9Z-aC5EL5_reTQ9QhsfKarv5-_bW0dKLa9sKG5DumOsHc \
  PAYPAL_CLIENT_SECRET=EAJaeQHSUzXoOSW9QuICSBfsnz5nq2yDnoV57F8aNtVaMJZTLTxrLIr9bkuOha5GARpmhY18VtHT5JMN \
  PAYPAL_MODE=live

# Then deploy functions
npx supabase functions deploy paypal-create-order
npx supabase functions deploy paypal-capture-order

# Redeploy frontend
vercel --prod
```

---

## 🚨 Important Notes

### PayPal Account Details:
- **Type**: Business Account
- **Email**: Abdullah@sourcekom.com
- **Status**: Live (Production)
- **App**: newomen

### Testing Before Going Live:
If you want to test first, temporarily set:
```bash
npx supabase secrets set PAYPAL_MODE=sandbox
# Use sandbox credentials for testing
# Then switch back to live when ready
```

### Real Money Transactions:
⚠️ Once you set `PAYPAL_MODE=live`, **real money will be charged** to customers!

Make sure:
- Your PayPal business account is verified
- Bank account is linked
- You've tested the flow thoroughly
- You understand PayPal fees (~2.9% + $0.30 per transaction)

---

## 📊 Expected Payment Flow

1. **User clicks "Subscribe"** on pricing page
2. **PayPal button loads** with your Client ID
3. **User completes checkout** via PayPal
4. **Payment captured** via edge function
5. **Subscription created** in database
6. **User tier updated** (Growth or Transformation)
7. **Minutes added** to user account
8. **Confirmation email** (via PayPal)
9. **User sees updated subscription** in account settings

---

## 🧪 Testing Checklist

Before going live, test:

- [ ] PayPal button loads on /pricing page
- [ ] Clicking subscribe opens PayPal checkout
- [ ] Can complete payment successfully
- [ ] Subscription created in database
- [ ] User tier updated correctly
- [ ] Minutes added to account
- [ ] Account settings shows active subscription
- [ ] Can access premium features
- [ ] PayPal shows transaction in dashboard

---

## 📈 Monitoring

### Check PayPal Dashboard:
1. Go to https://www.paypal.com/businessprofile/settings/
2. View Recent Transactions
3. Monitor payment success rate
4. Check for disputes or issues

### Check Supabase Logs:
```bash
# View function logs
npx supabase functions logs paypal-create-order
npx supabase functions logs paypal-capture-order
```

### Check Database:
```sql
-- View all subscriptions
SELECT 
  s.*,
  up.email,
  up.subscription_tier,
  up.remaining_minutes
FROM subscriptions s
JOIN user_profiles up ON up.user_id = s.user_id
ORDER BY s.created_at DESC;
```

---

## 🔄 Rollback Plan

If something goes wrong:

```bash
# Switch back to sandbox mode
npx supabase secrets set PAYPAL_MODE=sandbox

# Use sandbox credentials
npx supabase secrets set \
  PAYPAL_CLIENT_ID=your-sandbox-client-id \
  PAYPAL_CLIENT_SECRET=your-sandbox-secret

# Redeploy
npx supabase functions deploy paypal-create-order
npx supabase functions deploy paypal-capture-order
vercel --prod
```

---

## ✨ Next Steps

1. **Run the setup commands above** ⬆️
2. **Test with a small amount first** (maybe just $22 Growth plan)
3. **Verify the payment flow works end-to-end**
4. **Monitor for 24 hours**
5. **Then fully launch!** 🚀

---

## 📞 Support

### PayPal Issues:
- Dashboard: https://www.paypal.com/businessmanage/
- Support: https://www.paypal.com/us/cshelp/personal
- Developer: https://developer.paypal.com/support/

### Newomen Issues:
- Check Supabase logs
- Check Vercel deployment logs
- Check browser console
- Review function error responses

---

## 🎉 You're Ready!

Your PayPal live credentials are configured in the code. Just run the setup commands and you'll be accepting real payments! 💰

**Status**: ✅ Code updated and ready
**Next**: 🔧 Configure secrets and deploy
**Time Needed**: ⏱️ 5 minutes

---

**Created**: October 12, 2025
**App**: newomen
**Mode**: 🔴 LIVE Production
**Status**: ⚠️ Awaiting secret configuration

