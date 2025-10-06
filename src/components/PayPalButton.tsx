import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface PayPalButtonProps {
  amount: string;
  planName: string;
  onSuccess: (orderId: string) => void;
  onError?: (error: unknown) => void;
}

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onError: (err: unknown) => void;
        style?: {
          layout?: string;
          color?: string;
          shape?: string;
          label?: string;
        };
      }) => {
        render: (container: string | HTMLElement) => Promise<void>;
      };
    };
  }
}

export default function PayPalButton({ amount, planName, onSuccess, onError }: PayPalButtonProps) {
  const paypalRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Load PayPal SDK
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${import.meta.env.VITE_PAYPAL_CLIENT_ID || 'test'}&currency=USD`;
    script.async = true;
    
    script.onload = () => {
      setScriptLoaded(true);
      setIsLoading(false);
    };
    
    script.onerror = () => {
      setIsLoading(false);
      toast.error("Failed to load PayPal SDK");
    };
    
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector(`script[src^="https://www.paypal.com/sdk/js"]`);
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  useEffect(() => {
    if (scriptLoaded && window.paypal && paypalRef.current) {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      window.paypal
        .Buttons({
          createOrder: async () => {
            try {
              // Call Supabase edge function to create PayPal order
              const response = await fetch(`${supabaseUrl}/functions/v1/paypal-create-order`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  amount,
                  planName,
                }),
              });

              if (!response.ok) {
                throw new Error("Failed to create order");
              }

              const order = await response.json();
              return order.id;
            } catch (error) {
              console.error("Error creating order:", error);
              toast.error("Failed to create PayPal order");
              throw error;
            }
          },
          onApprove: async (data) => {
            try {
              // Call Supabase edge function to capture the payment
              const response = await fetch(`${supabaseUrl}/functions/v1/paypal-capture-order`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  orderID: data.orderID,
                }),
              });

              if (!response.ok) {
                throw new Error("Failed to capture payment");
              }

              const captureData = await response.json();
              
              if (captureData.status === "COMPLETED") {
                toast.success("Payment successful!");
                onSuccess(data.orderID);
              } else {
                throw new Error("Payment not completed");
              }
            } catch (error) {
              console.error("Error capturing payment:", error);
              toast.error("Payment processing failed");
              if (onError) onError(error);
            }
          },
          onError: (err) => {
            console.error("PayPal error:", err);
            toast.error("PayPal error occurred");
            if (onError) onError(err);
          },
          style: {
            layout: "vertical",
            color: "gold",
            shape: "rect",
            label: "paypal",
          },
        })
        .render(paypalRef.current);
    }
  }, [scriptLoaded, amount, planName, onSuccess, onError]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!import.meta.env.VITE_PAYPAL_CLIENT_ID) {
    return (
      <div className="p-4 border border-yellow-500 bg-yellow-50 rounded-lg">
        <p className="text-sm text-yellow-800">
          PayPal integration is available but requires VITE_PAYPAL_CLIENT_ID environment variable.
          Contact support to enable payments.
        </p>
      </div>
    );
  }

  return <div ref={paypalRef} id="paypal-button-container" />;
}
