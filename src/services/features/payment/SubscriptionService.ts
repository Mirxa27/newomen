/**
 * Subscription Management Service
 * Handles talk time minutes and subscription plans
 * Free: 10 minutes | $22: 100 minutes | $222: 1000 minutes
 */

import { supabase } from '@/integrations/supabase/client';
import { errorHandler, ErrorCategory } from '../../shared/core/ErrorHandlingService';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  minutes_included: number;
  is_active: boolean;
  features: string[];
  sort_order: number;
}

export interface UserSubscription {
  remaining_minutes: number;
  subscription_tier: string;
  current_level: number;
  crystal_balance: number;
  active_subscriptions?: Array<{
    id: string;
    plan_name: string;
    minutes_included: number;
    minutes_used: number;
    price: number;
    status: string;
    created_at: string;
  }>;
}

export interface PurchaseResult {
  success: boolean;
  subscription_id?: string;
  minutes_added?: number;
  total_minutes?: number;
  plan_name?: string;
  error?: string;
}

export interface ConsumeMinutesResult {
  success: boolean;
  minutes_consumed?: number;
  remaining_minutes?: number;
  error?: string;
  required_minutes?: number;
}

export class SubscriptionService {
  private static instance: SubscriptionService;

  static getInstance(): SubscriptionService {
    if (!this.instance) {
      this.instance = new SubscriptionService();
    }
    return this.instance;
  }

  /**
   * Get all available subscription plans
   */
  async getPlans(): Promise<SubscriptionPlan[]> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching subscription plans:', error);
        throw error;
      }

      return (data || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : []
      }));
    } catch (error) {
      console.error('Failed to load subscription plans:', error);
      errorHandler.handleError(error, {
        component: 'SubscriptionService',
        action: 'getPlans'
      });
      
      // Return default plans as fallback
      return this.getDefaultPlans();
    }
  }

  /**
   * Get default subscription plans (fallback)
   */
  private getDefaultPlans(): SubscriptionPlan[] {
    return [
      {
        id: 'free',
        name: 'Free Trial',
        description: 'Get started with 10 free minutes',
        price: 0,
        currency: 'USD',
        minutes_included: 10,
        is_active: true,
        features: [
          '10 minutes of talk time',
          'Access to basic features',
          'Community access',
          'Basic assessments'
        ],
        sort_order: 1
      },
      {
        id: '100-mins',
        name: '100 Minutes Pack',
        description: '100 minutes of talk time',
        price: 22,
        currency: 'USD',
        minutes_included: 100,
        is_active: true,
        features: [
          '100 minutes of talk time',
          'All premium features',
          'Advanced AI insights',
          'Priority support',
          'Couples challenges',
          'Wellness library'
        ],
        sort_order: 2
      },
      {
        id: '1000-mins',
        name: '1000 Minutes Pack',
        description: '1000 minutes of talk time - Best Value!',
        price: 222,
        currency: 'USD',
        minutes_included: 1000,
        is_active: true,
        features: [
          '1000 minutes of talk time',
          'All premium features',
          'Advanced AI insights',
          'Priority support',
          'Couples challenges',
          'Wellness library',
          'Exclusive content',
          'Personal coaching sessions'
        ],
        sort_order: 3
      }
    ];
  }

  /**
   * Get user subscription information
   */
  async getUserSubscription(userId: string): Promise<UserSubscription> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_subscription_info', { p_user_id: userId });

      if (error) {
        console.error('Error fetching user subscription:', error);
        throw error;
      }

      return data as UserSubscription;
    } catch (error) {
      console.error('Failed to load user subscription:', error);
      errorHandler.handleError(error, {
        component: 'SubscriptionService',
        action: 'getUserSubscription',
        userId
      });
      
      // Return default values
      return {
        remaining_minutes: 0,
        subscription_tier: 'discovery',
        current_level: 1,
        crystal_balance: 0,
        active_subscriptions: []
      };
    }
  }

  /**
   * Purchase a subscription plan
   */
  async purchaseSubscription(
    userId: string,
    planId: string,
    paymentId: string,
    paymentMethod: string = 'paypal'
  ): Promise<PurchaseResult> {
    try {
      const { data, error } = await supabase
        .rpc('purchase_subscription', {
          p_user_id: userId,
          p_plan_id: planId,
          p_payment_id: paymentId,
          p_payment_method: paymentMethod
        });

      if (error) {
        console.error('Error purchasing subscription:', error);
        throw error;
      }

      return data as PurchaseResult;
    } catch (error) {
      console.error('Failed to purchase subscription:', error);
      
      const errorDetails = errorHandler.handleError(error, {
        component: 'SubscriptionService',
        action: 'purchaseSubscription',
        userId,
        planId
      });

      return {
        success: false,
        error: errorDetails.userFriendlyMessage || 'Failed to purchase subscription'
      };
    }
  }

  /**
   * Consume talk minutes during a session
   */
  async consumeMinutes(userId: string, minutes: number): Promise<ConsumeMinutesResult> {
    try {
      const { data, error } = await supabase
        .rpc('consume_talk_minutes', {
          p_user_id: userId,
          p_minutes_used: minutes
        });

      if (error) {
        console.error('Error consuming minutes:', error);
        throw error;
      }

      return data as ConsumeMinutesResult;
    } catch (error) {
      console.error('Failed to consume minutes:', error);
      
      const errorDetails = errorHandler.handleError(error, {
        component: 'SubscriptionService',
        action: 'consumeMinutes',
        userId,
        minutes
      });

      return {
        success: false,
        error: errorDetails.userFriendlyMessage || 'Failed to consume minutes'
      };
    }
  }

  /**
   * Check if user has sufficient minutes
   */
  async hasMinutes(userId: string, requiredMinutes: number): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId);
      return subscription.remaining_minutes >= requiredMinutes;
    } catch (error) {
      console.error('Error checking minutes:', error);
      return false;
    }
  }

  /**
   * Get remaining minutes for user
   */
  async getRemainingMinutes(userId: string): Promise<number> {
    try {
      const subscription = await this.getUserSubscription(userId);
      return subscription.remaining_minutes;
    } catch (error) {
      console.error('Error getting remaining minutes:', error);
      return 0;
    }
  }

  /**
   * Format minutes to human-readable time
   */
  formatMinutes(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    
    return `${hours}h ${remainingMinutes}m`;
  }

  /**
   * Get plan by ID
   */
  async getPlanById(planId: string): Promise<SubscriptionPlan | null> {
    try {
      const plans = await this.getPlans();
      return plans.find(plan => plan.id === planId) || null;
    } catch (error) {
      console.error('Error getting plan by ID:', error);
      return null;
    }
  }

  /**
   * Calculate cost per minute for a plan
   */
  getCostPerMinute(plan: SubscriptionPlan): number {
    if (plan.price === 0 || plan.minutes_included === 0) return 0;
    return plan.price / plan.minutes_included;
  }

  /**
   * Get recommended plan based on usage
   */
  getRecommendedPlan(estimatedMonthlyMinutes: number, plans: SubscriptionPlan[]): SubscriptionPlan | null {
    // Filter out free plan
    const paidPlans = plans.filter(p => p.price > 0).sort((a, b) => a.price - b.price);
    
    if (paidPlans.length === 0) return null;
    
    // Find the most cost-effective plan for the usage
    for (const plan of paidPlans) {
      if (plan.minutes_included >= estimatedMonthlyMinutes) {
        return plan;
      }
    }
    
    // Return highest tier if usage exceeds all plans
    return paidPlans[paidPlans.length - 1];
  }
}

// Export singleton instance
export const subscriptionService = SubscriptionService.getInstance();
