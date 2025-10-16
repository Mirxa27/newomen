import { supabase } from "@/integrations/supabase/client";
import { logError, logInfo } from "@/lib/logging";
import { Json } from "@/types/supabase";

export interface EngagementMetrics {
  user_id: string;
  daily_active_streak: number;
  weekly_sessions: number;
  monthly_sessions: number;
  engagement_score: number;
  churn_risk_score: number;
  features_used?: string[];
}

export interface RevenueMetrics {
  date: string;
  total_revenue: number;
  subscription_revenue: number;
  new_subscribers: number;
  churned_subscribers: number;
  mrr: number;
  arr: number;
}

export interface ChurnPrediction {
  user_id: string;
  churn_risk_score: number;
  predicted_category: 'high' | 'medium' | 'low';
  churn_reasons: string[];
}

export interface FunnelMetric {
    id: string;
    funnel_name: string;
    step_number: number;
    step_name: string;
    users_reached: number;
    users_completed: number;
    conversion_rate: number;
    recorded_date: string;
}

export interface HeatmapData {
    id: string;
    page_url: string;
    element_selector: string;
    recorded_date: string;
    click_count: number;
    hover_count: number;
    scroll_depth: number;
}

export type CohortAnalysis = Record<string, unknown>;
export type RetentionRate = Record<string, unknown>;

class AnalyticsService {
  /**
   * Track user activity
   */
  async trackActivity(
    userId: string,
    activityType: string,
    featureName: string,
    durationSeconds?: number,
    metadata?: Json
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("user_activity_log")
        .insert({
          user_id: userId,
          activity_type: activityType,
          feature_name: featureName,
          duration_seconds: durationSeconds,
          metadata: metadata || {},
          user_agent: navigator.userAgent
        });

      if (error) throw error;

      logInfo(`Activity tracked: ${userId} - ${activityType} - ${featureName}`);
    } catch (error) {
      logError("Error tracking activity", error as Error);
      // Don't throw - analytics should not break app functionality
    }
  }

  /**
   * Update engagement metrics
   */
  async updateEngagementMetrics(userId: string): Promise<EngagementMetrics> {
    try {
      // Get recent activity
      const { data: activities, error: activitiesError } = await supabase
        .from("user_activity_log")
        .select("*")
        .eq("user_id", userId)
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (activitiesError) throw activitiesError;

      // Calculate metrics
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const weeklySessions = activities.filter(a => new Date(a.created_at) > weekAgo).length;
      const monthlySessions = activities.filter(a => new Date(a.created_at) > monthAgo).length;

      // Calculate engagement score (0-100)
      const engagementScore = Math.min(100, (monthlySessions / 30) * 10 * 10);
      
      // Calculate churn risk (0-100, where 100 = highest risk)
      const daysSinceLastActive = Math.floor(
        (Date.now() - new Date(activities[0]?.created_at || Date.now()).getTime()) / (24 * 60 * 60 * 1000)
      );
      const churnRiskScore = Math.min(100, Math.max(0, daysSinceLastActive * 5));

      const { data, error } = await supabase
        .from("user_engagement_metrics")
        .upsert({
          user_id: userId,
          weekly_sessions: weeklySessions,
          monthly_sessions: monthlySessions,
          engagement_score: engagementScore,
          churn_risk_score: churnRiskScore,
          last_active_at: new Date().toISOString(),
          last_calculated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      logInfo(`Engagement metrics updated for user ${userId}`);
      return data;
    } catch (error) {
      logError("Error updating engagement metrics", error as Error);
      throw error;
    }
  }

  /**
   * Track feature usage
   */
  async trackFeatureUsage(
    featureName: string,
    featureCategory: string,
    isCompleted: boolean,
    satisfactionRating?: number
  ): Promise<void> {
    try {
      // Get or create feature analytics
      const { data: existing } = await supabase
        .from("feature_analytics")
        .select("*")
        .eq("feature_name", featureName)
        .eq("recorded_date", new Date().toISOString().split('T')[0])
        .single();

      if (existing) {
        await supabase
          .from("feature_analytics")
          .update({
            total_users_used: existing.total_users_used + 1,
            completion_rate: isCompleted ? existing.completion_rate + 1 : existing.completion_rate,
            satisfaction_rating: satisfactionRating || existing.satisfaction_rating
          })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("feature_analytics")
          .insert({
            feature_name: featureName,
            feature_category: featureCategory,
            total_users_used: 1,
            unique_daily_users: 1,
            total_sessions: 1,
            completion_rate: isCompleted ? 1 : 0,
            satisfaction_rating: satisfactionRating || 0,
            recorded_date: new Date().toISOString().split('T')[0]
          });
      }

      logInfo(`Feature usage tracked: ${featureName}`);
    } catch (error) {
      logError("Error tracking feature usage", error as Error);
    }
  }

  /**
   * Get user engagement score
   */
  async getUserEngagementScore(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from("user_engagement_metrics")
        .select("engagement_score")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      return data?.engagement_score || 0;
    } catch (error) {
      logError(`Error getting engagement score for user ${userId}`, error as Error);
      return 0;
    }
  }

  /**
   * Predict churn
   */
  async predictChurn(userId: string): Promise<ChurnPrediction> {
    try {
      const { data: metrics, error: metricsError } = await supabase
        .from("user_engagement_metrics")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (metricsError) throw metricsError;

      const churnRiskScore = metrics?.churn_risk_score || 0;
      
      let category: 'high' | 'medium' | 'low' = 'low';
      if (churnRiskScore > 70) category = 'high';
      else if (churnRiskScore > 40) category = 'medium';

      const churnReasons: string[] = [];
      if (metrics.weekly_sessions === 0) churnReasons.push('No recent activity');
      if (metrics.engagement_score < 20) churnReasons.push('Low engagement');
      if ((metrics.features_used || []).length < 3) churnReasons.push('Limited feature usage');

      logInfo(`Churn prediction for user ${userId}: ${category} risk`);

      return {
        user_id: userId,
        churn_risk_score: churnRiskScore,
        predicted_category: category,
        churn_reasons: churnReasons
      };
    } catch (error) {
      logError("Error predicting churn", error as Error);
      throw error;
    }
  }

  /**
   * Get revenue metrics
   */
  async getRevenueMetrics(startDate: string, endDate: string): Promise<RevenueMetrics[]> {
    try {
      const { data, error } = await supabase
        .from("revenue_analytics")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError("Error fetching revenue metrics", error as Error);
      throw error;
    }
  }

  /**
   * Record revenue event
   */
  async recordRevenueEvent(
    transactionAmount: number,
    isSubscription: boolean = false,
    newSubscriber: boolean = false
  ): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: existing } = await supabase
        .from("revenue_analytics")
        .select("*")
        .eq("date", today)
        .single();

      if (existing) {
        await supabase
          .from("revenue_analytics")
          .update({
            total_revenue: existing.total_revenue + transactionAmount,
            subscription_revenue: isSubscription 
              ? existing.subscription_revenue + transactionAmount
              : existing.subscription_revenue,
            transaction_count: existing.transaction_count + 1,
            new_subscribers: newSubscriber ? existing.new_subscribers + 1 : existing.new_subscribers
          })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("revenue_analytics")
          .insert({
            date: today,
            total_revenue: transactionAmount,
            subscription_revenue: isSubscription ? transactionAmount : 0,
            transaction_count: 1,
            new_subscribers: newSubscriber ? 1 : 0,
            churned_subscribers: 0
          });
      }

      logInfo(`Revenue event recorded: $${transactionAmount}`);
    } catch (error) {
      logError("Error recording revenue event", error as Error);
    }
  }

  /**
   * Get funnel metrics
   */
  async getFunnelMetrics(funnelName: string): Promise<FunnelMetric[]> {
    try {
      const { data, error } = await supabase
        .from("funnel_analytics")
        .select("*")
        .eq("funnel_name", funnelName)
        .order("step_number", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError(`Error fetching funnel metrics for ${funnelName}`, error as Error);
      throw error;
    }
  }

  /**
   * Track funnel step
   */
  async trackFunnelStep(
    funnelName: string,
    stepNumber: number,
    stepName: string,
    userCompleted: boolean = true
  ): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: existing } = await supabase
        .from("funnel_analytics")
        .select("*")
        .eq("funnel_name", funnelName)
        .eq("step_number", stepNumber)
        .eq("recorded_date", today)
        .single();

      if (existing) {
        await supabase
          .from("funnel_analytics")
          .update({
            users_reached: existing.users_reached + 1,
            users_completed: userCompleted ? existing.users_completed + 1 : existing.users_completed
          })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("funnel_analytics")
          .insert({
            funnel_name: funnelName,
            step_number: stepNumber,
            step_name: stepName,
            users_reached: 1,
            users_completed: userCompleted ? 1 : 0,
            conversion_rate: userCompleted ? 100 : 0,
            recorded_date: today
          });
      }

      logInfo(`Funnel step tracked: ${funnelName} - Step ${stepNumber}`);
    } catch (error) {
      logError("Error tracking funnel step", error as Error);
    }
  }

  /**
   * Track custom event
   */
  async trackCustomEvent(
    userId: string,
    eventName: string,
    eventCategory: string,
    eventValue?: number,
    metadata?: Json
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("custom_events")
        .insert({
          user_id: userId,
          event_name: eventName,
          event_category: eventCategory,
          event_value: eventValue,
          metadata: metadata || {}
        });

      if (error) throw error;

      logInfo(`Custom event tracked: ${userId} - ${eventName}`);
    } catch (error) {
      logError("Error tracking custom event", error as Error);
    }
  }

  /**
   * Get cohort analysis
   */
  async getCohortAnalysis(cohortStartDate: string): Promise<CohortAnalysis | null> {
    try {
      const { data, error } = await supabase
        .from("cohort_analysis")
        .select("*")
        .eq("cohort_start_date", cohortStartDate)
        .single();

      if (error) throw error;
      return data || null;
    } catch (error) {
      logError(`Error fetching cohort analysis for ${cohortStartDate}`, error as Error);
      throw error;
    }
  }

  /**
   * Get retention rates
   */
  async getRetentionRates(startDate: string, endDate: string): Promise<RetentionRate[]> {
    try {
      const { data, error } = await supabase
        .from("retention_rates")
        .select("*")
        .gte("start_date", startDate)
        .lte("end_date", endDate);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError("Error fetching retention rates", error as Error);
      throw error;
    }
  }

  /**
   * Track heatmap data
   */
  async trackHeatmapData(
    pageUrl: string,
    elementSelector: string,
    eventType: 'click' | 'hover',
    scrollDepth?: number
  ): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: existing } = await supabase
        .from("heatmap_data")
        .select("*")
        .eq("page_url", pageUrl)
        .eq("element_selector", elementSelector)
        .eq("recorded_date", today)
        .single();

      if (existing) {
        const updates: Partial<HeatmapData> = { recorded_date: today };
        if (eventType === 'click') updates.click_count = existing.click_count + 1;
        if (eventType === 'hover') updates.hover_count = existing.hover_count + 1;
        if (scrollDepth !== undefined) updates.scroll_depth = scrollDepth;

        await supabase
          .from("heatmap_data")
          .update(updates)
          .eq("id", existing.id);
      } else {
        const data: Partial<HeatmapData> = {
          page_url: pageUrl,
          element_selector: elementSelector,
          recorded_date: today
        };
        if (eventType === 'click') data.click_count = 1;
        if (eventType === 'hover') data.hover_count = 1;
        if (scrollDepth !== undefined) data.scroll_depth = scrollDepth;

        await supabase.from("heatmap_data").insert(data);
      }
    } catch (error) {
      logError("Error tracking heatmap data", error as Error);
    }
  }

  /**
   * Track performance metrics
   */
  async trackPerformanceMetric(
    pageUrl: string,
    metricName: string,
    metricValue: number,
    deviceType: string,
    browserName: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("performance_metrics")
        .insert({
          page_url: pageUrl,
          metric_name: metricName,
          metric_value: metricValue,
          unit: metricName.includes('time') ? 'ms' : metricName.includes('cls') ? 'score' : 'count',
          device_type: deviceType,
          browser_name: browserName
        });

      if (error) throw error;

      logInfo(`Performance metric tracked: ${metricName} = ${metricValue}`);
    } catch (error) {
      logError("Error tracking performance metric", error as Error);
    }
  }
}

export const analyticsService = new AnalyticsService();
