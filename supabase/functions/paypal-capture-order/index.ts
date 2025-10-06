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
    const { orderID } = await req.json();

    // Validate input
    if (!orderID) {
      return new Response(
        JSON.stringify({ error: "Missing orderID" }),
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

    // Capture the payment
    const captureResponse = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}/capture`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!captureResponse.ok) {
      const errorText = await captureResponse.text();
      console.error("PayPal capture failed:", errorText);
      throw new Error("Failed to capture PayPal payment");
    }

    const captureData = await captureResponse.json();

    // Log successful capture
    console.log("PayPal payment captured successfully:", {
      orderId: orderID,
      status: captureData.status,
      amount: captureData.purchase_units?.[0]?.payments?.captures?.[0]?.amount,
    });

    return new Response(
      JSON.stringify(captureData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in paypal-capture-order:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
