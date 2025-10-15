import { supabase } from "@/integrations/supabase/client";
import { logError, logInfo } from "@/lib/logging";

export interface PaymentMethod {
  id: string;
  user_id: string;
  stripe_customer_id?: string;
  paypal_account_id?: string;
  card_last_four?: string;
  card_brand?: string;
  is_default: boolean;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  payment_method: 'stripe' | 'paypal' | 'apple' | 'google';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'disputed';
  provider_transaction_id?: string;
  receipt_url?: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  invoice_number: string;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
}

class PaymentIntegrationService {
  /**
   * Create payment method
   */
  async createPaymentMethod(
    userId: string,
    provider: 'stripe' | 'paypal',
    providerData: any
  ): Promise<PaymentMethod> {
    try {
      const paymentMethod = {
        user_id: userId,
        ...(provider === 'stripe' && {
          stripe_customer_id: providerData.customerId,
          stripe_payment_method_id: providerData.paymentMethodId,
          card_last_four: providerData.lastFour,
          card_brand: providerData.brand,
          expiry_month: providerData.expMonth,
          expiry_year: providerData.expYear
        }),
        ...(provider === 'paypal' && {
          paypal_account_id: providerData.accountId
        }),
        is_default: true
      };

      const { data, error } = await supabase
        .from("payment_methods")
        .insert(paymentMethod)
        .select()
        .single();

      if (error) throw error;

      logInfo(`Payment method created for user ${userId} via ${provider}`);
      return data;
    } catch (error) {
      logError("Error creating payment method", error as Error);
      throw error;
    }
  }

  /**
   * Process payment with Stripe
   */
  async processStripePayment(
    userId: string,
    stripeCustomerId: string,
    amount: number,
    currency: string = 'USD',
    description: string = ''
  ): Promise<PaymentTransaction> {
    try {
      // This would call your Stripe backend API
      const paymentData = {
        user_id: userId,
        payment_method: 'stripe' as const,
        amount,
        currency,
        status: 'pending' as const,
        description,
        metadata: {
          stripe_customer_id: stripeCustomerId
        }
      };

      const { data, error } = await supabase
        .from("payment_transactions")
        .insert(paymentData)
        .select()
        .single();

      if (error) throw error;

      logInfo(`Stripe payment initiated for user ${userId}: $${amount} ${currency}`);
      return data;
    } catch (error) {
      logError("Error processing Stripe payment", error as Error);
      throw error;
    }
  }

  /**
   * Process payment with PayPal
   */
  async processPayPalPayment(
    userId: string,
    paypalAccountId: string,
    amount: number,
    currency: string = 'USD',
    description: string = ''
  ): Promise<PaymentTransaction> {
    try {
      // This would call your PayPal backend API
      const paymentData = {
        user_id: userId,
        payment_method: 'paypal' as const,
        amount,
        currency,
        status: 'pending' as const,
        description,
        metadata: {
          paypal_account_id: paypalAccountId
        }
      };

      const { data, error } = await supabase
        .from("payment_transactions")
        .insert(paymentData)
        .select()
        .single();

      if (error) throw error;

      logInfo(`PayPal payment initiated for user ${userId}: $${amount} ${currency}`);
      return data;
    } catch (error) {
      logError("Error processing PayPal payment", error as Error);
      throw error;
    }
  }

  /**
   * Confirm payment
   */
  async confirmPayment(
    transactionId: string,
    providerTransactionId: string,
    receiptUrl?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("payment_transactions")
        .update({
          status: 'completed',
          provider_transaction_id: providerTransactionId,
          receipt_url: receiptUrl,
          updated_at: new Date().toISOString()
        })
        .eq("id", transactionId);

      if (error) throw error;

      logInfo(`Payment confirmed: ${transactionId}`);
    } catch (error) {
      logError("Error confirming payment", error as Error);
      throw error;
    }
  }

  /**
   * Handle payment failure
   */
  async handlePaymentFailure(
    transactionId: string,
    failureReason: string,
    retryable: boolean = true
  ): Promise<void> {
    try {
      const updates: any = {
        status: retryable ? 'pending' : 'failed',
        failed_reason: failureReason,
        retry_count: (0 + 1)
      };

      if (retryable) {
        updates.next_retry_at = new Date(Date.now() + 3600000).toISOString(); // Retry in 1 hour
      }

      const { error } = await supabase
        .from("payment_transactions")
        .update(updates)
        .eq("id", transactionId);

      if (error) throw error;

      logInfo(`Payment failure handled: ${transactionId} - ${failureReason}`);
    } catch (error) {
      logError("Error handling payment failure", error as Error);
      throw error;
    }
  }

  /**
   * Get payment transactions
   */
  async getPaymentTransactions(userId: string): Promise<PaymentTransaction[]> {
    try {
      const { data, error } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError(`Error fetching payment transactions for user ${userId}`, error as Error);
      throw error;
    }
  }

  /**
   * Request refund
   */
  async requestRefund(
    transactionId: string,
    userId: string,
    reason: string,
    amount?: number
  ): Promise<void> {
    try {
      // Get the transaction first
      const { data: transaction, error: txError } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("id", transactionId)
        .single();

      if (txError) throw txError;

      const refundAmount = amount || transaction.amount;

      const { error } = await supabase
        .from("payment_refunds")
        .insert({
          transaction_id: transactionId,
          refund_amount: refundAmount,
          reason,
          requested_by: userId,
          status: 'pending'
        });

      if (error) throw error;

      logInfo(`Refund requested for transaction ${transactionId}: $${refundAmount}`);
    } catch (error) {
      logError("Error requesting refund", error as Error);
      throw error;
    }
  }

  /**
   * Approve refund
   */
  async approveRefund(refundId: string, adminId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("payment_refunds")
        .update({
          status: 'approved',
          approved_by: adminId,
          updated_at: new Date().toISOString()
        })
        .eq("id", refundId);

      if (error) throw error;

      logInfo(`Refund approved: ${refundId}`);
    } catch (error) {
      logError("Error approving refund", error as Error);
      throw error;
    }
  }

  /**
   * Generate invoice
   */
  async generateInvoice(
    userId: string,
    transactionId: string,
    items: any[],
    taxAmount: number = 0,
    discountAmount: number = 0
  ): Promise<Invoice> {
    try {
      const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0) + taxAmount - discountAmount;
      const invoiceNumber = `INV-${Date.now()}`;

      const { data, error } = await supabase
        .from("payment_invoices")
        .insert({
          user_id: userId,
          transaction_id: transactionId,
          invoice_number: invoiceNumber,
          invoice_date: new Date().toISOString(),
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          total_amount: totalAmount,
          tax_amount: taxAmount,
          discount_amount: discountAmount,
          items,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      logInfo(`Invoice generated: ${invoiceNumber} for user ${userId}`);
      return data;
    } catch (error) {
      logError("Error generating invoice", error as Error);
      throw error;
    }
  }

  /**
   * Send invoice
   */
  async sendInvoice(invoiceId: string, recipientEmail: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("payment_invoices")
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq("id", invoiceId);

      if (error) throw error;

      // Here you would integrate with your email service
      logInfo(`Invoice sent: ${invoiceId} to ${recipientEmail}`);
    } catch (error) {
      logError("Error sending invoice", error as Error);
      throw error;
    }
  }

  /**
   * Get invoices
   */
  async getInvoices(userId: string): Promise<Invoice[]> {
    try {
      const { data, error } = await supabase
        .from("payment_invoices")
        .select("*")
        .eq("user_id", userId)
        .order("invoice_date", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError(`Error fetching invoices for user ${userId}`, error as Error);
      throw error;
    }
  }

  /**
   * Handle payment dispute
   */
  async handleDispute(
    transactionId: string,
    userId: string,
    provider: string,
    reason: string,
    amount: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("payment_disputes")
        .insert({
          transaction_id: transactionId,
          user_id: userId,
          provider,
          reason,
          amount,
          status: 'opened'
        });

      if (error) throw error;

      // Update transaction status
      await supabase
        .from("payment_transactions")
        .update({ status: 'disputed' })
        .eq("id", transactionId);

      logInfo(`Payment dispute opened: ${transactionId}`);
    } catch (error) {
      logError("Error handling payment dispute", error as Error);
      throw error;
    }
  }

  /**
   * Log webhook event
   */
  async logWebhookEvent(
    provider: string,
    eventType: string,
    eventId: string,
    payload: any
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("payment_webhooks_log")
        .insert({
          provider,
          event_type: eventType,
          event_id: eventId,
          payload,
          status: 'received'
        });

      if (error) throw error;

      logInfo(`Webhook logged: ${provider} - ${eventType}`);
    } catch (error) {
      logError("Error logging webhook event", error as Error);
      throw error;
    }
  }

  /**
   * Get payment plans
   */
  async getPaymentPlans(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("payment_plans")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError("Error fetching payment plans", error as Error);
      throw error;
    }
  }

  /**
   * Calculate tax
   */
  async calculateTax(amount: number, userLocation: any): Promise<number> {
    try {
      const { data, error } = await supabase
        .from("tax_configuration")
        .select("tax_rate")
        .eq("country_code", userLocation.countryCode)
        .eq("state_code", userLocation.stateCode || "")
        .eq("is_active", true);

      if (error) throw error;

      const taxRate = (data && data.length > 0) ? data[0].tax_rate : 0;
      return (amount * taxRate) / 100;
    } catch (error) {
      logError("Error calculating tax", error as Error);
      return 0;
    }
  }
}

export const paymentIntegrationService = new PaymentIntegrationService();
