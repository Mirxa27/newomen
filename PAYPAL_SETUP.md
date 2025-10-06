# PayPal Integration Setup Guide

## Overview
The NewWomen platform now includes full PayPal subscription integration for the Growth and Transformation plans.

## Prerequisites
- PayPal Business Account
- PayPal Developer Account (https://developer.paypal.com)

## Setup Instructions

### 1. Create PayPal App
1. Go to https://developer.paypal.com/dashboard/applications
2. Click "Create App"
3. Choose "Merchant" as the app type
4. Note your **Client ID** and **Secret**

### 2. Configure Environment Variables
Add to your `.env` file:

```env
VITE_PAYPAL_CLIENT_ID=your-paypal-client-id-here
```

### 3. Backend API Endpoints Required
The PayPal integration expects these endpoints:

#### Create Order
```
POST /api/paypal/create-order
Body: {
  amount: string,
  planName: string
}
Response: {
  id: string (PayPal order ID)
}
```

#### Capture Payment
```
POST /api/paypal/capture-order
Body: {
  orderID: string
}
Response: {
  status: string (should be "COMPLETED")
}
```

### 4. Implementation Examples

#### Using Supabase Edge Functions
Create a function at `supabase/functions/paypal-create-order/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const PAYPAL_API_BASE = "https://api-m.sandbox.paypal.com"; // Use https://api-m.paypal.com for production
const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID");
const PAYPAL_SECRET = Deno.env.get("PAYPAL_SECRET");

serve(async (req) => {
  const { amount, planName } = await req.json();

  // Get PayPal access token
  const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`);
  const tokenResponse = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const { access_token } = await tokenResponse.json();

  // Create order
  const orderResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        amount: {
          currency_code: "USD",
          value: amount,
        },
        description: `NewWomen ${planName} Plan`,
      }],
    }),
  });

  const order = await orderResponse.json();
  return new Response(JSON.stringify(order), {
    headers: { "Content-Type": "application/json" },
  });
});
```

Create a function at `supabase/functions/paypal-capture-order/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const PAYPAL_API_BASE = "https://api-m.sandbox.paypal.com"; // Use https://api-m.paypal.com for production
const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID");
const PAYPAL_SECRET = Deno.env.get("PAYPAL_SECRET");

serve(async (req) => {
  const { orderID } = await req.json();

  // Get PayPal access token
  const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`);
  const tokenResponse = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const { access_token } = await tokenResponse.json();

  // Capture payment
  const captureResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}/capture`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
  });

  const captureData = await captureResponse.json();
  return new Response(JSON.stringify(captureData), {
    headers: { "Content-Type": "application/json" },
  });
});
```

Deploy the functions:
```bash
supabase functions deploy paypal-create-order
supabase functions deploy paypal-capture-order
```

### 5. Update Frontend Configuration
In `src/components/PayPalButton.tsx`, update the API endpoints:

```typescript
const response = await fetch("/api/paypal/create-order", {
  // Change to your Supabase function URL
  // Example: "https://your-project.supabase.co/functions/v1/paypal-create-order"
```

### 6. Testing

#### Sandbox Testing
1. Use sandbox credentials from PayPal Developer Dashboard
2. Test with PayPal sandbox test accounts
3. Verify payment flow end-to-end

#### Test Cards
PayPal sandbox provides test accounts. Create test accounts at:
https://developer.paypal.com/dashboard/accounts

### 7. Production Deployment

1. Switch from sandbox to production API URLs
2. Update environment variables with production credentials
3. Test thoroughly in production environment
4. Monitor PayPal webhook events for subscription renewals

## Subscription Plans

### Growth Plan
- **Price**: $22 USD
- **Minutes**: 100 conversation minutes
- **Features**: All premium features

### Transformation Plan
- **Price**: $222 USD
- **Minutes**: 1000 conversation minutes
- **Features**: All premium features + priority support

## Security Notes

1. **Never commit** PayPal credentials to version control
2. Always use environment variables
3. Validate all PayPal webhooks
4. Log all transactions for auditing
5. Use HTTPS in production
6. Implement rate limiting on payment endpoints

## Troubleshooting

### "PayPal SDK failed to load"
- Check internet connection
- Verify VITE_PAYPAL_CLIENT_ID is set correctly
- Check browser console for specific errors

### "Failed to create order"
- Verify backend API endpoints are accessible
- Check PayPal credentials are correct
- Ensure PayPal app is in correct mode (sandbox vs production)

### Payment succeeds but subscription not updated
- Check database permissions
- Verify Supabase RLS policies
- Check browser console and network tab for errors

## Support

For issues with PayPal integration:
- PayPal Developer Support: https://developer.paypal.com/support/
- NewWomen Support: Check project documentation

## Resources

- [PayPal Developer Documentation](https://developer.paypal.com/docs/)
- [PayPal REST API Reference](https://developer.paypal.com/docs/api/overview/)
- [PayPal Sandbox Testing](https://developer.paypal.com/docs/api-basics/sandbox/)
