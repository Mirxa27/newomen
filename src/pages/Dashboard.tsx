import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Brain, Heart, Users, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { profile, loading } = useUserProfile();
  const [affirmation, setAffirmation] = useState("Loading your daily inspiration...");

  useEffect(() => {
    const fetchAffirmation = async () => {
      const { data, error } = await supabase
        .from("affirmations")
        .select("content")
        .limit(1)
        .single(); // Using .single() simplifies things

      if (error) {
        console.error("Error fetching affirmation:", error);
        setAffirmation("You are capable of amazing things!");
      } else {
        setAffirmation(data?.content || "You are capable of amazing things!");
      }
    };

    void fetchAffirmation();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold gradient-text">
            Welcome back, {profile?.nickname || "friend"}!
          </h1>
          <p className="text-muted-foreground mt-2 text-lg italic">
            "{affirmation}"
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardCard
            title="AI Assessments"
            description="Gain insights into your personality and growth areas."
            link="/assessments"
            icon={<Brain className="w-8 h-8 text-primary" />}
          />
          <DashboardCard
            title="Couples Challenges"
            description="Strengthen your bond with guided exercises."
            link="/couples-challenge"
            icon={<Heart className="w-8 h-8 text-primary" />}
          />
          <DashboardCard
            title="Community"
            description="Connect with others on a similar journey."
            link="/community"
            icon={<Users className="w-8 h-8 text-primary" />}
          />
          <DashboardCard
            title="Admin Panel"
            description="Manage the application and its users."
            link="/admin"
            icon={<ShieldCheck className="w-8 h-8 text-primary" />}
          />
        </div>

        {/* Add more sections like recent activity, progress overview, etc. */}
      </div>
    </div>
  );
}

interface DashboardCardProps {
  title: string;
  description: string;
  link: string;
  icon: React.ReactNode;
}

function DashboardCard({ title, description, link, icon }: DashboardCardProps) {
  return (
    <Card className="glass-card flex flex-col">
      <CardHeader className="flex-grow">
        <div className="mb-4">{icon}</div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link to={link}>
          <Button className="w-full clay-button">Explore</Button>
        </Link>
      </CardContent>
    </Card>
  );
}