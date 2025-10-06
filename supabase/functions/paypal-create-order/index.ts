import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, planName } = await req.json();

    // Validate input
    if (!amount || !planName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get PayPal configuration from environment
    const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID");
    const PAYPAL_SECRET = Deno.env.get("PAYPAL_SECRET");
    const PAYPAL_MODE = Deno.env.get("PAYPAL_MODE") || "sandbox"; // sandbox or live

    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
      return new Response(
        JSON.stringify({ error: "PayPal credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const PAYPAL_API_BASE = PAYPAL_MODE === "live" 
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";

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

    if (!tokenResponse.ok) {
      throw new Error("Failed to get PayPal access token");
    }

    const { access_token } = await tokenResponse.json();

    // Create PayPal order
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
          description: `NewWomen ${planName} Plan - AI Personal Growth Subscription`,
        }],
        application_context: {
          brand_name: "NewWomen",
          landing_page: "BILLING",
          user_action: "PAY_NOW",
          return_url: `${req.headers.get("origin")}/account-settings`,
          cancel_url: `${req.headers.get("origin")}/account-settings`,
        },
      }),
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error("PayPal order creation failed:", errorText);
      throw new Error("Failed to create PayPal order");
    }

    const order = await orderResponse.json();

    return new Response(
      JSON.stringify(order),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in paypal-create-order:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
