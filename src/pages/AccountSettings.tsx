import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Subscriptions } from "@/integrations/supabase/tables/subscriptions";
import { Badge } from "@/components/ui/badge"; // Import Badge component

export default function AccountSettings() {
  const { profile, loading: profileLoading, error: profileError, updateProfile } = useUserProfile();
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [subscription, setSubscription] = useState<Subscriptions['Row'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSubscription = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", profile.user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 means no rows found, which is fine
      setSubscription(data);
    } catch (e) {
      console.error("Error fetching subscription:", e);
      toast.error("Failed to load subscription details.");
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (profile) {
      setEmail(profile.email);
      setNickname(profile.nickname || "");
      void fetchSubscription();
    }
  }, [profile, fetchSubscription]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSubmitting(true);
    await updateProfile({ nickname });
    setIsSubmitting(false);
  };

  const handleSubscriptionCancel = async () => {
    if (!subscription) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "cancelled" } as Partial<Subscriptions['Update']>)
        .eq("id", subscription.id);

      if (error) throw error;
      setSubscription(prev => prev ? { ...prev, status: "cancelled" } : null);
      toast.success("Subscription cancelled successfully.");
    } catch (e) {
      console.error("Error cancelling subscription:", e);
      toast.error("Failed to cancel subscription.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (profileLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (profileError) {
    return <div className="text-destructive text-center mt-8">{profileError}</div>;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold gradient-text">Account Settings</h1>
        <p className="text-muted-foreground">Manage your profile and subscription details.</p>

        <Tabs defaultValue="profile">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Public Profile</CardTitle>
                <CardDescription>This information will be displayed publicly.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} disabled className="glass" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="nickname">Nickname</Label>
                    <Input
                      id="nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="glass"
                    />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="clay-button">
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Subscription Details</CardTitle>
                <CardDescription>Manage your current plan and billing.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {subscription ? (
                  <>
                    <p>
                      Current Plan: <Badge variant="secondary">{subscription.plan_id || "Free"}</Badge>
                    </p>
                    <p>Status: <Badge variant={subscription.status === "active" ? "default" : "destructive"}>{subscription.status}</Badge></p>
                    <p>Starts: {new Date(subscription.start_date).toLocaleDateString()}</p>
                    {subscription.end_date && (
                      <p>Ends: {new Date(subscription.end_date).toLocaleDateString()}</p>
                    )}
                    {subscription.status === "active" && (
                      <Button onClick={handleSubscriptionCancel} disabled={isSubmitting} variant="destructive" className="clay-button">
                        {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Cancel Subscription
                      </Button>
                    )}
                  </>
                ) : (
                  <p>No active subscription found.</p>
                )}
                <Button onClick={() => toast.info("Billing portal integration coming soon!")} className="clay-button">
                  Manage Billing
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}