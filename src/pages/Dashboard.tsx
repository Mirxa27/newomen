import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  MessageSquare, 
  Target, 
  Users, 
  BookOpen, 
  Trophy,
  LogOut 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    } else {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8">
          <p>Loading your journey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold gradient-text">Your Dashboard</h1>
            <p className="text-muted-foreground">Welcome back to your growth journey</p>
          </div>
          <Button 
            variant="outline" 
            className="glass"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Daily Affirmation */}
        <div className="glass-card space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-accent" />
            <h2 className="text-2xl font-bold">Today's Affirmation</h2>
          </div>
          <p className="text-xl italic">
            "You are capable of amazing things. Every step forward is progress."
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ActionCard
            icon={MessageSquare}
            title="Start Conversation"
            description="Talk with your AI companion"
            onClick={() => navigate("/chat")}
            featured
          />
          <ActionCard
            icon={Target}
            title="Assessments"
            description="Explore your personality and growth areas"
            onClick={() => toast({ title: "Coming soon!" })}
          />
          <ActionCard
            icon={Users}
            title="Community"
            description="Connect with others on the same journey"
            onClick={() => toast({ title: "Coming soon!" })}
          />
          <ActionCard
            icon={BookOpen}
            title="Wellness Library"
            description="Access guided meditations and more"
            onClick={() => toast({ title: "Coming soon!" })}
          />
          <ActionCard
            icon={Trophy}
            title="Achievements"
            description="View your progress and rewards"
            onClick={() => toast({ title: "Coming soon!" })}
          />
        </div>

        {/* Progress Overview */}
        <div className="glass-card space-y-6">
          <h2 className="text-2xl font-bold">Your Progress</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <StatCard label="Current Level" value="1" />
            <StatCard label="Crystals" value="0" />
            <StatCard label="Daily Streak" value="0" />
          </div>
        </div>
      </div>
    </div>
  );
};

const ActionCard = ({ 
  icon: Icon, 
  title, 
  description, 
  onClick, 
  featured = false 
}: any) => (
  <button
    onClick={onClick}
    className={`glass-card text-left space-y-4 hover:scale-105 transition-all duration-300 ${
      featured ? 'ring-2 ring-primary animate-pulse-glow' : ''
    }`}
  >
    <div className="clay w-12 h-12 rounded-2xl flex items-center justify-center">
      <Icon className="w-6 h-6 text-primary" />
    </div>
    <div>
      <h3 className="text-xl font-bold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </button>
);

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="clay p-6 text-center space-y-2">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-4xl font-bold gradient-text">{value}</p>
  </div>
);

export default Dashboard;