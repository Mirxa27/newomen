import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PayPalButtonProps {
  tier: 'Growth' | 'Transformation';
}

const PayPalButton = ({ tier }: PayPalButtonProps) => {
  const { user } = useAuth();

  const createOrder = (data: any, actions: any) => {
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

  const onApprove = (data: any, actions: any) => {
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
        'client-id': import.meta.env.VITE_PAYPAL_CLIENT_ID,
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
};

export default PayPalButton;