import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shared/ui/card";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import { Switch } from "@/components/shared/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shared/ui/tabs";
import { Badge } from "@/components/shared/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, CreditCard, Shield, Bell, User, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/ui/alert";
import { ConfirmationDialog } from "@/components/shared/ui/ConfirmationDialog";
import { SubscriptionPlans } from "@/components/features/payment/SubscriptionPlans";
import { subscriptionService } from "@/services/features/payment/SubscriptionService";
import type { Tables } from "@/integrations/supabase/types";

export default function AccountSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Tables<'user_profiles'> | null>(null);
  const [subscription, setSubscription] = useState<Tables<'subscriptions'> | null>(null);
  const [notifications, setNotifications] = useState({
    email: true,
    achievements: true,
    weeklyReport: true,
    marketingEmails: false
  });
  const [dialogState, setDialogState] = useState({
    cancelSubscription: false,
    deleteAccount: false,
  });

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (profileError) throw profileError;
      setProfile(profileData);

      const { data: subData, error: subError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (subError && subError.code !== 'PGRST116') { // Ignore no rows found error
        throw subError;
      }
      setSubscription(subData);

    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load account data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePasswordReset = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;
      const { error } = await supabase.auth.resetPasswordForEmail(user.email);
      if (error) throw error;
      toast.success("Password reset email sent! Check your inbox.");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to send password reset email");
    }
  };

  const handleCancelSubscription = async () => {
    try {
      if (!subscription?.id) return;
      
      // Cancel subscription in DB; provider cancellation should be handled server-side webhook/edge
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("id", subscription.id);

      if (error) throw error;
      toast.success("Your subscription has been cancelled.");
      await loadData();
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast.error("Failed to cancel subscription. Please contact support.");
    } finally {
      setDialogState(prev => ({ ...prev, cancelSubscription: false }));
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // This should call a Supabase Edge Function to perform a secure delete
      const { error } = await supabase.functions.invoke('delete-user');

      if (error) throw error;

      toast.success("Your account is being deleted. You will be logged out.");
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account. Please contact support.");
    } finally {
      setDialogState(prev => ({ ...prev, deleteAccount: false }));
    }
  };

  const handleExportData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.functions.invoke('export-user-data');
      if (error) throw error;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `newomen-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Data exported successfully!");
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Failed to export data");
    }
  };

  const handleNotificationToggle = (key: string) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success("Notification preferences updated");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/profile")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Profile
            </Button>
            <div>
              <h1 className="text-4xl font-bold gradient-text">Account Settings</h1>
              <p className="text-muted-foreground">Manage your account preferences and subscription</p>
            </div>
          </div>

          <Tabs defaultValue="account">
            <TabsList className="grid grid-cols-4 w-full glass">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="account" className="space-y-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Email Address</Label>
                    <Input value={profile?.email || ""} disabled className="opacity-50" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Your email is used for login and cannot be changed
                    </p>
                  </div>
                  <div>
                    <Label>Account ID</Label>
                    <Input value={profile?.user_id || ""} disabled className="opacity-50 font-mono text-sm" />
                  </div>
                  <div className="pt-4">
                    <Button onClick={handlePasswordReset} variant="outline" className="glass">
                      Send Password Reset Email
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-red-500/30">
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2">
                    <Trash2 className="w-5 h-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>Irreversible account actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert variant="destructive">
                    <AlertTitle>Delete Your Account</AlertTitle>
                    <AlertDescription>
                      <p className="mb-4">
                        This will permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <Button variant="destructive" onClick={() => setDialogState(prev => ({ ...prev, deleteAccount: true }))}>
                        Delete Account
                      </Button>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscription" className="space-y-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Talk Time & Subscription
                  </CardTitle>
                  <CardDescription>
                    Manage your talk time minutes and subscription plans
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 glass rounded-lg">
                    <div>
                      <h3 className="font-semibold capitalize">
                        {profile?.subscription_tier || "Discovery"} Plan
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {subscriptionService.formatMinutes(profile?.remaining_minutes || 0)} remaining
                      </p>
                    </div>
                    <Badge className="capitalize" variant={subscription?.status === 'active' ? 'default' : 'secondary'}>
                      {subscription?.status || "Free"}
                    </Badge>
                  </div>

                  {subscription?.status === "active" && (
                    <div className="space-y-4">
                      <div className="glass p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Next renewal date:</p>
                        <p className="font-semibold">
                          {subscription?.renewal_date
                            ? new Date(subscription.renewal_date).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="glass"
                        onClick={() => setDialogState(prev => ({ ...prev, cancelSubscription: true }))}
                      >
                        Cancel Subscription
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        To manage your subscription details, please visit the PayPal website.
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="pt-4 border-t">
                      <h3 className="text-lg font-semibold mb-4">Purchase Talk Time</h3>
                      <SubscriptionPlans 
                        userId={profile?.user_id}
                        currentMinutes={profile?.remaining_minutes || 0}
                        onPlanSelect={(plan) => {
                          if (plan.price > 0) {
                            navigate('/pricing', { state: { selectedPlan: plan } });
                          }
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Privacy Settings
                  </CardTitle>
                  <CardDescription>Control your data and visibility</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Profile Visibility</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow others to find and connect with you
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Activity Status</Label>
                      <p className="text-sm text-muted-foreground">
                        Let connections see when you're active
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Data Sharing for AI Improvement</Label>
                      <p className="text-sm text-muted-foreground">
                        Help us improve NewMe with anonymized data
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="pt-4">
                    <Button variant="outline" className="glass" onClick={handleExportData}>
                      Download My Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive important updates via email
                      </p>
                    </div>
                    <Switch
                      checked={notifications.email}
                      onCheckedChange={() => handleNotificationToggle("email")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Achievement Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when you unlock achievements
                      </p>
                    </div>
                    <Switch
                      checked={notifications.achievements}
                      onCheckedChange={() => handleNotificationToggle("achievements")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Weekly Progress Report</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive weekly summary of your journey
                      </p>
                    </div>
                    <Switch
                      checked={notifications.weeklyReport}
                      onCheckedChange={() => handleNotificationToggle("weeklyReport")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive news, tips, and special offers
                      </p>
                    </div>
                    <Switch
                      checked={notifications.marketingEmails}
                      onCheckedChange={() => handleNotificationToggle("marketingEmails")}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <ConfirmationDialog
        open={dialogState.cancelSubscription}
        onOpenChange={(open) => setDialogState(prev => ({ ...prev, cancelSubscription: open }))}
        onConfirm={handleCancelSubscription}
        title="Cancel Subscription?"
        description="Are you sure you want to cancel your subscription? This action cannot be undone."
      />

      <ConfirmationDialog
        open={dialogState.deleteAccount}
        onOpenChange={(open) => setDialogState(prev => ({ ...prev, deleteAccount: open }))}
        onConfirm={handleDeleteAccount}
        title="Delete Account?"
        description="This will permanently delete your account and all associated data. This is irreversible."
      />
    </>
  );
}