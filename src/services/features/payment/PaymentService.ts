// Comprehensive payment service for Newomen platform
import { supabase } from '@/integrations/supabase/client';
import { errorHandler, ErrorFactory } from '@/utils/shared/core/error-handling';
import type { PaymentCreate, Payment, APIResponse } from '@/types/validation';
import { Json } from '@/integrations/supabase/types';

export interface PaymentConfig {
  paypalClientId: string;
  paypalClientSecret: string;
  paypalEnvironment: 'sandbox' | 'production';
  stripePublishableKey: string;
  stripeSecretKey: string;
  currency: string;
  taxRate: number;
}

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  createdAt: string;
  error?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly' | 'lifetime';
  features: string[];
  isPopular: boolean;
  stripePriceId?: string;
  paypalPlanId?: string;
}

interface PayPalOrder {
    id: string;
    status: 'CREATED' | 'SAVED' | 'APPROVED' | 'VOIDED' | 'COMPLETED' | 'PAYER_ACTION_REQUIRED';
    // Add other properties as needed from the PayPal API response
}

export class PaymentService {
  private static instance: PaymentService;
  private config: PaymentConfig | null = null;

  private constructor() {}

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  // Initialize payment service
  public async initialize(): Promise<void> {
    try {
      // Get payment configuration from environment or database
      this.config = {
        paypalClientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || '',
        paypalClientSecret: import.meta.env.VITE_PAYPAL_CLIENT_SECRET || '',
        paypalEnvironment: (import.meta.env.VITE_PAYPAL_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
        stripePublishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
        stripeSecretKey: import.meta.env.VITE_STRIPE_SECRET_KEY || '',
        currency: 'USD',
        taxRate: 0.08, // 8% tax rate
      };

      console.log('✅ Payment service initialized');
    } catch (error) {
      console.error('❌ Payment service initialization failed:', error);
      throw error;
    }
  }

  // Create PayPal payment
  public async createPayPalPayment(
    paymentData: PaymentCreate,
    userId: string
  ): Promise<APIResponse<PaymentResult>> {
    try {
      if (!this.config) {
        throw ErrorFactory.internal('Payment service not initialized');
      }

      // Create PayPal order
      const paypalOrder = await this.createPayPalOrder(paymentData);
      
      // Store payment record in database
      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          amount: paymentData.amount,
          currency: paymentData.currency,
          status: 'pending',
          payment_method: 'paypal',
          transaction_id: paypalOrder.id,
          description: paymentData.description,
          subscription_type: paymentData.subscription_type,
          created_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) throw error;

      // Log payment creation
      await this.logPaymentEvent('payment_created', {
        payment_id: payment.id,
        user_id: userId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        method: 'paypal',
      });

      return {
        success: true,
        data: {
          success: true,
          paymentId: payment.id,
          transactionId: paypalOrder.id,
          amount: paymentData.amount,
          currency: paymentData.currency,
          status: 'pending',
          paymentMethod: 'paypal',
          createdAt: payment.created_at,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return errorHandler.handle(error as Error, {
        operation: 'createPayPalPayment',
        userId,
        amount: paymentData.amount,
      });
    }
  }

  // Capture PayPal payment
  public async capturePayPalPayment(
    paymentId: string,
    orderId: string,
    userId: string
  ): Promise<APIResponse<PaymentResult>> {
    try {
      if (!this.config) {
        throw ErrorFactory.internal('Payment service not initialized');
      }

      // Capture PayPal order
      const captureResult = await this.capturePayPalOrder(orderId);
      
      if (!captureResult.success) {
        throw ErrorFactory.payment('PayPal payment capture failed', 'paypal', captureResult);
      }

      // Update payment record
      const { data: payment, error } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentId)
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) throw error;

      // Update user subscription
      await this.updateUserSubscription(userId, payment.subscription_type);

      // Log payment completion
      await this.logPaymentEvent('payment_completed', {
        payment_id: paymentId,
        user_id: userId,
        amount: payment.amount,
        currency: payment.currency,
        method: 'paypal',
      });

      // Trigger gamification for premium upgrade
      await this.triggerGamificationEvent('premium_upgrade', userId, {
        subscription_type: payment.subscription_type,
        amount: payment.amount,
      });

      return {
        success: true,
        data: {
          success: true,
          paymentId: payment.id,
          transactionId: orderId,
          amount: payment.amount,
          currency: payment.currency,
          status: 'completed',
          paymentMethod: 'paypal',
          createdAt: payment.created_at,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return errorHandler.handle(error as Error, {
        operation: 'capturePayPalPayment',
        paymentId,
        userId,
      });
    }
  }

  // Create Stripe payment intent
  public async createStripePayment(
    paymentData: PaymentCreate,
    userId: string
  ): Promise<APIResponse<{ clientSecret: string; paymentId: string }>> {
    try {
      if (!this.config) {
        throw ErrorFactory.internal('Payment service not initialized');
      }

      // Create Stripe payment intent
      const stripeResponse = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(paymentData.amount * 100), // Convert to cents
          currency: paymentData.currency.toLowerCase(),
          metadata: {
            userId,
            subscriptionType: paymentData.subscription_type,
          },
        }),
      });

      if (!stripeResponse.ok) {
        throw ErrorFactory.payment('Stripe payment intent creation failed');
      }

      const { client_secret, id } = await stripeResponse.json();

      // Store payment record
      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          amount: paymentData.amount,
          currency: paymentData.currency,
          status: 'pending',
          payment_method: 'stripe',
          transaction_id: id,
          description: paymentData.description,
          subscription_type: paymentData.subscription_type,
          created_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) throw error;

      return {
        success: true,
        data: {
          clientSecret: client_secret,
          paymentId: payment.id,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return errorHandler.handle(error as Error, {
        operation: 'createStripePayment',
        userId,
        amount: paymentData.amount,
      });
    }
  }

  // Get subscription plans
  public async getSubscriptionPlans(): Promise<APIResponse<SubscriptionPlan[]>> {
    try {
      const plans: SubscriptionPlan[] = [
        {
          id: 'basic',
          name: 'Basic',
          description: 'Essential features for personal growth',
          price: 9.99,
          currency: 'USD',
          interval: 'monthly',
          features: [
            'Unlimited assessments',
            'Basic AI insights',
            'Community access',
            'Mobile app access',
          ],
          isPopular: false,
        },
        {
          id: 'premium',
          name: 'Premium',
          description: 'Advanced features for deeper insights',
          price: 19.99,
          currency: 'USD',
          interval: 'monthly',
          features: [
            'Everything in Basic',
            'Advanced AI analysis',
            'Couples challenges',
            'Personalized recommendations',
            'Priority support',
          ],
          isPopular: true,
        },
        {
          id: 'lifetime',
          name: 'Lifetime',
          description: 'One-time payment for lifetime access',
          price: 299.99,
          currency: 'USD',
          interval: 'lifetime',
          features: [
            'Everything in Premium',
            'Lifetime updates',
            'Exclusive content',
            'VIP community access',
            'Personal coaching sessions',
          ],
          isPopular: false,
        },
      ];

      return {
        success: true,
        data: plans,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return errorHandler.handle(error as Error, {
        operation: 'getSubscriptionPlans',
      });
    }
  }

  // Get user payment history
  public async getUserPayments(userId: string): Promise<APIResponse<Payment[]>> {
    try {
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: payments || [],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return errorHandler.handle(error as Error, {
        operation: 'getUserPayments',
        userId,
      });
    }
  }

  // Refund payment
  public async refundPayment(
    paymentId: string,
    userId: string,
    reason?: string
  ): Promise<APIResponse<{ success: boolean }>> {
    try {
      // Get payment details
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .eq('user_id', userId)
        .single();

      if (paymentError || !payment) {
        throw ErrorFactory.notFound('Payment', paymentId);
      }

      if (payment.status !== 'completed') {
        throw ErrorFactory.conflict('Only completed payments can be refunded');
      }

      // Process refund based on payment method
      let refundResult;
      if (payment.payment_method === 'paypal') {
        refundResult = await this.refundPayPalPayment(payment.transaction_id);
      } else if (payment.payment_method === 'stripe') {
        refundResult = await this.refundStripePayment(payment.transaction_id);
      } else {
        throw ErrorFactory.payment('Unsupported payment method for refund');
      }

      if (!refundResult.success) {
        throw ErrorFactory.payment('Refund processing failed');
      }

      // Update payment status
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'refunded',
          refunded_at: new Date().toISOString(),
          refund_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentId);

      if (updateError) throw updateError;

      // Log refund
      await this.logPaymentEvent('payment_refunded', {
        payment_id: paymentId,
        user_id: userId,
        amount: payment.amount,
        reason,
      });

      return {
        success: true,
        data: { success: true },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return errorHandler.handle(error as Error, {
        operation: 'refundPayment',
        paymentId,
        userId,
      });
    }
  }

  // Private helper methods
  private async createPayPalOrder(paymentData: PaymentCreate): Promise<PayPalOrder> {
    const response = await fetch(`${this.getPayPalBaseUrl()}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${this.config!.paypalClientId}:${this.config!.paypalClientSecret}`)}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: paymentData.currency,
            value: paymentData.amount.toString(),
          },
          description: paymentData.description,
        }],
        application_context: {
          return_url: `${window.location.origin}/payment/success`,
          cancel_url: `${window.location.origin}/payment/cancel`,
        },
      }),
    });

    if (!response.ok) {
      throw ErrorFactory.payment('PayPal order creation failed');
    }

    return await response.json();
  }

  private async capturePayPalOrder(orderId: string): Promise<{ success: boolean; data?: PayPalOrder }> {
    const response = await fetch(`${this.getPayPalBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${this.config!.paypalClientId}:${this.config!.paypalClientSecret}`)}`,
      },
    });

    if (!response.ok) {
      return { success: false };
    }

    const data = await response.json();
    return { success: true, data };
  }

  private async refundPayPalPayment(transactionId: string): Promise<{ success: boolean }> {
    // Implement PayPal refund logic
    // This would require PayPal's refund API
    return { success: true };
  }

  private async refundStripePayment(transactionId: string): Promise<{ success: boolean }> {
    // Implement Stripe refund logic
    // This would require Stripe's refund API
    return { success: true };
  }

  private getPayPalBaseUrl(): string {
    return this.config!.paypalEnvironment === 'production'
      ? 'https://api.paypal.com'
      : 'https://api.sandbox.paypal.com';
  }

  private async updateUserSubscription(userId: string, subscriptionType: string): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        subscription_status: subscriptionType,
        is_premium: true,
        premium_expires_at: subscriptionType === 'lifetime' 
          ? null 
          : new Date(Date.now() + (subscriptionType === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
  }

  private async logPaymentEvent(eventType: string, data: Json): Promise<void> {
    try {
      await supabase
        .from('payment_events')
        .insert({
          event_type: eventType,
          data,
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Failed to log payment event:', error);
    }
  }

  private async triggerGamificationEvent(eventType: string, userId: string, metadata: Json): Promise<void> {
    try {
      await supabase.functions.invoke('gamification-engine', {
        body: {
          event_type: eventType,
          user_id: userId,
          metadata,
        },
      });
    } catch (error) {
      console.error('Failed to trigger gamification event:', error);
    }
  }
}

// Export singleton instance
export const paymentService = PaymentService.getInstance();
