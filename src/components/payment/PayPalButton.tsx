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
  [key: string]: unknown;
}

interface PayPalOnApproveData {
  orderID: string;
  payerID?: string;
  [key: string]: unknown;
}

export const PayPalButton = ({ amount, currency = 'USD', onSuccess, onError, tier }: PayPalButtonProps) => {
  const { user } = useAuth();

  const createOrder = async (_data: PayPalCreateOrderData, _actions: Record<string, unknown>): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('paypal-create-order', {
        body: { tier },
      });
      if (error) throw error;
      if (!data || !data.orderID) throw new Error("Order ID not returned from function.");
      return data.orderID;
    } catch (e) {
      console.error('Error creating order:', e);
      return '';
    }
  };

  const onApprove = async (data: PayPalOnApproveData, _actions: Record<string, unknown>): Promise<void> => {
    try {
      const { error } = await supabase.functions.invoke('paypal-capture-order', {
        body: { orderID: data.orderID, tier, userId: user?.id },
      });
      if (error) throw error;
      console.log('Order captured successfully');
      // Handle success, update UI, show confirmation
    } catch (e) {
      console.error('Error capturing order:', e);
      // Handle error, show message to user
    }
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