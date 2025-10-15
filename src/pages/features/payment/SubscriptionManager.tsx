'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Zap, Crown } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Card } from '@/components/shared/ui/card';
import { subscriptionService } from '@/services/features/payment/SubscriptionService';
import { useAuth } from '@/hooks/features/auth/useAuth';
import { toast } from 'sonner';

export default function SubscriptionManager() {
  const { user } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  // Fetch subscription plans
  const { data: plans = [] } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => subscriptionService.getSubscriptionPlans()
  });

  // Fetch user's current subscription
  const { data: currentSubscription } = useQuery({
    queryKey: ['user-subscription', user?.id],
    queryFn: () => user?.id ? subscriptionService.getUserSubscription(user.id) : Promise.resolve(null),
    enabled: !!user?.id
  });

  // Fetch billing history
  const { data: billingHistory = [] } = useQuery({
    queryKey: ['billing-history', user?.id],
    queryFn: () => user?.id ? subscriptionService.getBillingHistory(user.id) : Promise.resolve([]),
    enabled: !!user?.id
  });

  const handleUpgrade = async (tierName: string) => {
    if (!user?.id) {
      toast.error('Please sign in first');
      return;
    }

    try {
      await subscriptionService.updateSubscription(user.id, tierName);
      toast.success('Subscription updated successfully!');
    } catch (error) {
      toast.error('Failed to update subscription');
    }
  };

  const getCurrentTier = () => currentSubscription?.to_tier || 'free';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Subscription Plans</h1>
          <p className="text-gray-600 dark:text-gray-400">Choose the perfect plan for your wellness journey</p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-1 inline-flex">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                billingPeriod === 'yearly'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Yearly (Save 17%)
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => {
            const isCurrentPlan = getCurrentTier() === plan.tier_name;
            const price = billingPeriod === 'monthly' ? plan.monthly_price : plan.yearly_price;
            const isPopular = index === 2;

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all ${
                  isPopular ? 'ring-2 ring-purple-600 md:scale-105' : ''
                } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
              >
                {isPopular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold py-2 text-center">
                    Most Popular
                  </div>
                )}

                <div className="p-8 pt-12">
                  {/* Plan Name & Price */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {plan.display_name}
                    </h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        ${price.toFixed(2)}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        /{billingPeriod === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-6">{plan.description}</p>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features?.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleUpgrade(plan.tier_name)}
                    disabled={isCurrentPlan}
                    className="w-full"
                    variant={isCurrentPlan ? 'outline' : 'default'}
                  >
                    {isCurrentPlan ? 'Current Plan' : 'Upgrade Now'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Current Subscription & Billing */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Subscription */}
          {currentSubscription && (
            <Card className="p-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Subscription</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Plan</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                    {currentSubscription.to_tier}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Renewal Date</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {new Date(currentSubscription.billing_period_end).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Next Payment</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    ${currentSubscription.amount_paid.toFixed(2)}
                  </p>
                </div>

                <Button variant="outline" className="w-full">
                  Cancel Subscription
                </Button>
              </div>
            </Card>
          )}

          {/* Billing History */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Billing History</h2>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {billingHistory.length > 0 ? (
                billingHistory.map((history, idx) => (
                  <div key={idx} className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white capitalize">
                        {history.to_tier} Plan
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(history.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        ${history.amount_paid.toFixed(2)}
                      </p>
                      <p className={`text-sm ${
                        history.status === 'active' ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {history.status}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">No billing history yet</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
