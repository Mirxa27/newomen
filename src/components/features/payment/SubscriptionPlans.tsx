import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Check, Clock, Zap, Crown } from 'lucide-react';
import { subscriptionService, type SubscriptionPlan } from '@/services/features/payment/SubscriptionService';
import { toast } from 'sonner';

interface SubscriptionPlansProps {
  userId?: string;
  onPlanSelect?: (plan: SubscriptionPlan) => void;
  currentMinutes?: number;
}

export function SubscriptionPlans({ userId, onPlanSelect, currentMinutes = 0 }: SubscriptionPlansProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const plansData = await subscriptionService.getPlans();
      setPlans(plansData);
    } catch (error) {
      console.error('Error loading plans:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan.id);
    if (onPlanSelect) {
      onPlanSelect(plan);
    }
  };

  const getPlanIcon = (planName: string) => {
    if (planName.toLowerCase().includes('free')) return Clock;
    if (planName.toLowerCase().includes('1000')) return Crown;
    return Zap;
  };

  const getPlanBadge = (plan: SubscriptionPlan) => {
    if (plan.price === 0) return <Badge variant="secondary">Free</Badge>;
    if (plan.minutes_included === 1000) return <Badge className="bg-yellow-500 hover:bg-yellow-600">Best Value</Badge>;
    if (plan.minutes_included === 100) return <Badge variant="default">Popular</Badge>;
    return null;
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return `$${price.toFixed(2)}`;
  };

  const getCostPerMinute = (plan: SubscriptionPlan) => {
    if (plan.price === 0) return 'Free';
    const cost = subscriptionService.getCostPerMinute(plan);
    return `$${cost.toFixed(2)}/min`;
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full">
      {currentMinutes > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Current Balance:</strong> {subscriptionService.formatMinutes(currentMinutes)} remaining
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const Icon = getPlanIcon(plan.name);
          const isSelected = selectedPlan === plan.id;
          const isFree = plan.price === 0;
          const isBestValue = plan.minutes_included === 1000;

          return (
            <Card
              key={plan.id}
              className={`relative transition-all duration-200 ${
                isSelected ? 'ring-2 ring-primary shadow-lg' : ''
              } ${isBestValue ? 'border-yellow-400 border-2' : ''}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${isBestValue ? 'text-yellow-500' : 'text-primary'}`} />
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                  </div>
                  {getPlanBadge(plan)}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{formatPrice(plan.price)}</span>
                    {!isFree && <span className="text-gray-500 text-sm">USD</span>}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {plan.minutes_included} minutes included
                    {!isFree && ` (${getCostPerMinute(plan)})`}
                  </p>
                </div>

                <div className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={isSelected ? 'default' : isFree ? 'outline' : 'default'}
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isFree && currentMinutes > 0}
                >
                  {isFree ? 'Get Started' : isSelected ? 'Selected' : 'Select Plan'}
                </Button>
              </CardFooter>

              {isBestValue && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-yellow-500 hover:bg-yellow-600 px-3 py-1">
                    BEST VALUE
                  </Badge>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No subscription plans available at the moment.</p>
          <Button onClick={loadPlans} variant="outline" className="mt-4">
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
