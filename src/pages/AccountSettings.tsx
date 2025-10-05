import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, CreditCard, Shield, Bell, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AccountSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [notifications, setNotifications] = useState({
    email: true,
    achievements: true,
    weeklyReport: true,
    marketingEmails: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setProfile(profileData);

      const { data: subData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", profileData?.id)
        .single();

      setSubscription(subData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(profile.email);
      if (error) throw error;
      toast.success("Password reset email sent! Check your inbox.");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to send password reset email");
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription?")) return;

    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("id", subscription.id);

      if (error) throw error;
      toast.success("Subscription cancelled");
      loadData();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to cancel subscription");
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
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-4">
            <Card>
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
                  <Input value={profile?.id || ""} disabled className="opacity-50 font-mono text-sm" />
                </div>

                <div className="pt-4">
                  <Button onClick={handlePasswordReset} variant="outline">
                    Send Password Reset Email
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Irreversible account actions</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertDescription>
                    <p className="mb-4">
                      Deleting your account will permanently remove all your data, including conversations,
                      assessments, and progress. This action cannot be undone.
                    </p>
                    <Button variant="destructive" onClick={() => toast.error("Please contact support to delete your account")}>
                      Delete Account
                    </Button>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Subscription Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 glass rounded-lg">
                  <div>
                    <h3 className="font-semibold capitalize">
                      {profile?.subscription_tier || "Discovery"} Plan
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {profile?.remaining_minutes || 0} minutes remaining
                    </p>
                  </div>
                  <Badge className="capitalize">
                    {subscription?.status || "Free"}
                  </Badge>
                </div>

                {profile?.subscription_tier === "discovery" ? (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Upgrade to unlock more conversation time and premium features
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="glass p-4 rounded-lg space-y-2">
                        <h4 className="font-semibold">Growth Plan</h4>
                        <p className="text-2xl font-bold gradient-text">$22</p>
                        <p className="text-sm text-muted-foreground">100 minutes</p>
                        <Button className="w-full" onClick={() => toast.info("PayPal integration coming soon")}>
                          Upgrade to Growth
                        </Button>
                      </div>
                      <div className="glass p-4 rounded-lg space-y-2 border-2 border-primary">
                        <h4 className="font-semibold">Transformation Plan</h4>
                        <p className="text-2xl font-bold gradient-text">$222</p>
                        <p className="text-sm text-muted-foreground">1000 minutes</p>
                        <Button className="w-full" onClick={() => toast.info("PayPal integration coming soon")}>
                          Upgrade to Transformation
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subscription?.status === "active" && (
                      <div className="glass p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Next renewal date:</p>
                        <p className="font-semibold">
                          {subscription?.renewal_date
                            ? new Date(subscription.renewal_date).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      onClick={handleCancelSubscription}
                      disabled={subscription?.status !== "active"}
                    >
                      Cancel Subscription
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-4">
            <Card>
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
                  <Button variant="outline" onClick={() => toast.info("Data export feature coming soon")}>
                    Download My Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
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
  );
}
