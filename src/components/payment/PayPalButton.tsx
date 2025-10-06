import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

interface PayPalButtonProps {
  tier: 'Growth' | 'Transformation';
  amount: number;
  currency?: string;
  onSuccess?: (details: { orderID: string; payerID: string }) => void;
  onError?: (error: { message: string; code: string }) => void;
}

interface PayPalCreateOrderData {
  // PayPal create order data structure
  [key: string]: unknown;
}

interface PayPalOnApproveData {
  orderID: string;
  payerID?: string;
  [key: string]: unknown;
}

export const PayPalButton = ({ amount, currency = 'USD', onSuccess, onError, tier }: PayPalButtonProps) => {
  const { user } = useAuth();

  const createOrder = (_data: PayPalCreateOrderData, _actions: Record<string, unknown>): Promise<string> => {
    return supabase.functions.invoke('paypal-create-order', {
      body: { tier },
    }).then((res) => {
      if (res.error) {
        console.error('Error creating order:', res.error);
        return '';
      }
      return res.data.orderID;
    });
  };

  const onApprove = (data: PayPalOnApproveData, _actions: Record<string, unknown>): Promise<void> => {
    return supabase.functions.invoke('paypal-capture-order', {
      body: { orderID: data.orderID, tier, userId: user?.id },
    }).then((res) => {
      if (res.error) {
        console.error('Error capturing order:', res.error);
        // Handle error, show message to user
      } else {
        console.log('Order captured:', res.data);
        // Handle success, update UI, show confirmation
      }
    });
  };

  return (
    <PayPalScriptProvider
      options={{
        clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
        currency: 'USD',
        intent: 'capture',
      }}
    >
      <PayPalButtons
        style={{ layout: 'vertical' }}
        createOrder={createOrder}
        onApprove={onApprove}
      />
    </PayPalScriptProvider>
  );
}
