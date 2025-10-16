/**
 * Subscription Management Service
 * Handles talk time minutes and subscription plans
 * Free: 10 minutes | $22: 100 minutes | $222: 1000 minutes
 */

import { supabase } from "@/integrations/supabase/client";
import { logError, logInfo } from "@/lib/logging";

export interface SubscriptionPlan {
  id: string;
  tier_name: string;
  display_name: string;
  monthly_price: number;
  yearly_price: number;
  description: string;
  features: string[];
  max_meditations: number;
  max_affirmations: number;
  max_habits: number;
  has_podcasts: boolean;
  has_buddy_system: boolean;
  has_community_events: boolean;
  has_ad_free: boolean;
  is_active: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  from_tier: string;
  to_tier: string;
  amount_paid: number;
  billing_period_start: string;
  billing_period_end: string;
  status: 'active' | 'cancelled' | 'failed' | 'refunded';
  created_at: string;
}

export interface FeatureAccess {
  user_id: string;
  feature_name: string;
  has_access: boolean;
  access_level: string;
  access_expires_at: string | null;
}

export interface PromoCode {
    id: string;
    code: string;
    discount_type: 'percentage' | 'fixed_amount';
    discount_value: number;
    max_uses: number;
    current_uses: number;
    is_active: boolean;
    applicable_tiers?: string[];
}

export interface BillingInvoice {
    id: string;
    user_id: string;
    amount: number;
    status: 'paid' | 'unpaid' | 'failed';
    billing_date: string;
    pdf_url?: string;
}

export interface RefundRequest {
    id: string;
    user_id: string;
    invoice_id: string;
    amount: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
}

export interface SubscriptionUsage {
    id: string;
    user_id: string;
    month: string;
    [key: string]: string | number;
}


class SubscriptionService {
  /**
   * Get all active subscription plans
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("monthly_price", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError("Error fetching subscription plans", error);
      throw error;
    }
  }

  /**
   * Get specific subscription plan by tier name
   */
  async getSubscriptionPlan(tierName: string): Promise<SubscriptionPlan | null> {
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("tier_name", tierName)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data || null;
    } catch (error) {
      logError(`Error fetching subscription plan for tier ${tierName}`, error);
      throw error;
    }
  }

  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const { data, error } = await supabase
        .from("subscription_history")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data || null;
    } catch (error) {
      logError(`Error fetching subscription for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Upgrade or downgrade subscription
   */
  async updateSubscription(
    userId: string,
    newTier: string,
    paymentMethod: string = 'stripe'
  ): Promise<UserSubscription> {
    try {
      // Get current subscription
      const currentSub = await this.getUserSubscription(userId);
      const fromTier = currentSub?.to_tier || 'free';

      // Get new plan pricing
      const newPlan = await this.getSubscriptionPlan(newTier);
      if (!newPlan) throw new Error(`Subscription tier ${newTier} not found`);

      // Create subscription history entry
      const { data, error } = await supabase
        .from("subscription_history")
        .insert({
          user_id: userId,
          from_tier: fromTier,
          to_tier: newTier,
          amount_paid: newPlan.monthly_price,
          billing_period_start: new Date().toISOString(),
          billing_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          payment_method: paymentMethod,
          status: 'active',
          reason: 'user_upgrade'
        })
        .select()
        .single();

      if (error) throw error;

      // Update user profile subscription tier
      await supabase
        .from("user_profiles")
        .update({
          subscription_tier: newTier,
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          subscription_auto_renew: true
        })
        .eq("user_id", userId);

      // Grant feature access
      await this.grantFeatureAccess(userId, newTier, newPlan.features);

      logInfo(`Subscription updated for user ${userId} to tier ${newTier}`);
      return data;
    } catch (error) {
      logError(`Error updating subscription for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string, reason: string = 'user_requested'): Promise<void> {
    try {
      const currentSub = await this.getUserSubscription(userId);
      if (!currentSub) throw new Error('No active subscription found');

      // Update subscription status to cancelled
      const { error } = await supabase
        .from("subscription_history")
        .update({
          status: 'cancelled',
          reason: reason
        })
        .eq("id", currentSub.id);

      if (error) throw error;

      // Update user profile to free tier
      await supabase
        .from("user_profiles")
        .update({
          subscription_tier: 'free',
          subscription_cancel_at: new Date().toISOString()
        })
        .eq("user_id", userId);

      // Remove premium feature access
      await this.revokeFeatureAccess(userId, ['podcasts', 'buddy_system', 'community_events', 'advanced_analytics']);

      logInfo(`Subscription cancelled for user ${userId}`);
    } catch (error) {
      logError(`Error cancelling subscription for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Grant feature access to user
   */
  async grantFeatureAccess(userId: string, tier: string, features: string[]): Promise<void> {
    try {
      const featureRecords = features.map(feature => ({
        user_id: userId,
        feature_name: feature,
        access_level: tier,
        has_access: true
      }));

      const { error } = await supabase
        .from("feature_access")
        .upsert(featureRecords, { onConflict: 'user_id,feature_name' });

      if (error) throw error;

      logInfo(`Features granted to user ${userId} for tier ${tier}`);
    } catch (error) {
      logError(`Error granting feature access to user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Revoke feature access from user
   */
  async revokeFeatureAccess(userId: string, features: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from("feature_access")
        .update({ has_access: false })
        .eq("user_id", userId)
        .in("feature_name", features);

      if (error) throw error;

      logInfo(`Features revoked from user ${userId}`);
    } catch (error) {
      logError(`Error revoking feature access from user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Check if user has access to a feature
   */
  async hasFeatureAccess(userId: string, featureName: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("feature_access")
        .select("has_access")
        .eq("user_id", userId)
        .eq("feature_name", featureName)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data?.has_access ?? false;
    } catch (error) {
      logError(`Error checking feature access for user ${userId}`, error);
      return false;
    }
  }

  /**
   * Apply promo code to subscription
   */
  async applyPromoCode(userId: string, code: string): Promise<{ discount: number; tier: string }> {
    try {
      const { data: promoData, error: promoError } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .single();

      if (promoError) throw new Error('Invalid promo code');

      if (promoData.current_uses >= promoData.max_uses) {
        throw new Error('Promo code has reached maximum uses');
      }

      let discount = 0;
      if (promoData.discount_type === 'percentage') {
        discount = promoData.discount_value;
      } else {
        discount = promoData.discount_value;
      }

      // Record promo usage
      await supabase
        .from("user_promo_usage")
        .insert({
          user_id: userId,
          promo_code_id: promoData.id,
          discount_applied: discount,
          used_at: new Date().toISOString()
        });

      // Increment promo code usage
      await supabase
        .from("promo_codes")
        .update({ current_uses: promoData.current_uses + 1 })
        .eq("id", promoData.id);

      logInfo(`Promo code ${code} applied to user ${userId}`);
      return { discount, tier: promoData.applicable_tiers?.[0] || 'lite' };
    } catch (error) {
      logError(`Error applying promo code for user ${userId}`, error as Error);
      throw error;
    }
  }

  /**
   * Get billing history for user
   */
  async getBillingHistory(userId: string, limit: number = 12): Promise<UserSubscription[]> {
    try {
      const { data, error } = await supabase
        .from("subscription_history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError(`Error fetching billing history for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Get invoices for user
   */
  async getInvoices(userId: string): Promise<BillingInvoice[]> {
    try {
      const { data, error } = await supabase
        .from("billing_invoices")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "paid")
        .order("billing_date", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError(`Error fetching invoices for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Request refund
   */
  async requestRefund(userId: string, invoiceId: string, reason: string): Promise<RefundRequest> {
    try {
      const { data: invoice } = await supabase
        .from("billing_invoices")
        .select("*")
        .eq("id", invoiceId)
        .eq("user_id", userId)
        .single();

      if (!invoice) throw new Error('Invoice not found');

      const { data, error } = await supabase
        .from("refund_requests")
        .insert({
          user_id: userId,
          invoice_id: invoiceId,
          amount: invoice.amount,
          reason: reason,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      logInfo(`Refund requested for user ${userId} on invoice ${invoiceId}`);
      return data;
    } catch (error) {
      logError(`Error requesting refund for user ${userId}`, error as Error);
      throw error;
    }
  }

  /**
   * Track subscription usage
   */
  async trackSubscriptionUsage(userId: string, metric: string, increment: number = 1): Promise<void> {
    try {
      const today = new Date();
      const month = new Date(today.getFullYear(), today.getMonth(), 1);

      const { data: existing } = await supabase
        .from("subscription_usage")
        .select("*")
        .eq("user_id", userId)
        .eq("month", month.toISOString())
        .single();

      if (existing) {
        const updateData: Partial<SubscriptionUsage> = {};
        updateData[metric] = ((existing as SubscriptionUsage)[metric] as number || 0) + increment;
        
        await supabase
          .from("subscription_usage")
          .update(updateData)
          .eq("id", existing.id);
      } else {
        const insertData: Partial<SubscriptionUsage> = {
          user_id: userId,
          month: month.toISOString()
        };
        insertData[metric] = increment;

        await supabase
          .from("subscription_usage")
          .insert(insertData);
      }
    } catch (error) {
      logError(`Error tracking subscription usage for user ${userId}`, error as Error);
    }
  }
}

export const subscriptionService = new SubscriptionService();
