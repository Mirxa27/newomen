# ⚡ PayPal Live Setup - Quick Guide

## 🎯 3 Steps to Accept Real Payments

**Total Time**: 5 minutes
**Difficulty**: Easy
**Status**: Code ready, just configure secrets

---

## Step 1: Configure Supabase Secrets (2 min)

Copy and paste this entire block into your terminal:

```bash
npx supabase secrets set PAYPAL_CLIENT_ID=AR0Jsu6JyP_Q8RbZdNrC8xWpu4RetvW9FSA9Z-aC5EL5_reTQ9QhsfKarv5-_bW0dKLa9sKG5DumOsHc

npx supabase secrets set PAYPAL_CLIENT_SECRET=EAJaeQHSUzXoOSW9QuICSBfsnz5nq2yDnoV57F8aNtVaMJZTLTxrLIr9bkuOha5GARpmhY18VtHT5JMN

npx supabase secrets set PAYPAL_MODE=live
```

✅ **Done!** Secrets configured.

---

## Step 2: Deploy Edge Functions (2 min)

```bash
npx supabase functions deploy paypal-create-order
npx supabase functions deploy paypal-capture-order
```

✅ **Done!** Functions deployed.

---

## Step 3: Update Vercel & Redeploy (1 min)

### A. Add Environment Variable in Vercel:

1. Go to: https://vercel.com/mirxa27s-projects/newomen/settings/environment-variables
2. Click "Add New"
3. Enter:
   - **Name**: `VITE_PAYPAL_CLIENT_ID`
   - **Value**: `AR0Jsu6JyP_Q8RbZdNrC8xWpu4RetvW9FSA9Z-aC5EL5_reTQ9QhsfKarv5-_bW0dKLa9sKG5DumOsHc`
   - **Environment**: Check all three (Production, Preview, Development)
4. Click "Save"

### B. Redeploy:

```bash
vercel --prod
```

✅ **Done!** Live payments active!

---

## 🎉 You're Live!

**PayPal is now configured for production!**

Test it:
1. Go to your production site
2. Visit `/pricing`
3. Click "Subscribe" on $22 Growth plan
4. Complete PayPal checkout
5. Verify subscription activated

---

## 🔴 IMPORTANT

**LIVE MODE = REAL MONEY**

- You'll be charged real PayPal fees (~2.9% + $0.30)
- Customers will be charged real USD
- Transactions appear in your PayPal business account
- Test with Growth plan ($22) first before promoting

---

## 📋 Quick Reference

**Client ID**: `AR0Jsu6JyP_Q8RbZdNrC8xWpu4RetvW9FSA9Z-aC5EL5_reTQ9QhsfKarv5-_bW0dKLa9sKG5DumOsHc`
**Business Email**: Abdullah@sourcekom.com
**Plans**: $22 (Growth) / $222 (Transformation)

---

## ✅ Checklist

- [ ] Run Step 1 (Supabase secrets)
- [ ] Run Step 2 (Deploy functions)
- [ ] Run Step 3A (Vercel env var)
- [ ] Run Step 3B (Redeploy)
- [ ] Test payment with $22
- [ ] Verify in PayPal dashboard
- [ ] Check database subscription

---

**Need help?** See `PAYPAL_LIVE_SETUP_INSTRUCTIONS.md` for detailed guide.

