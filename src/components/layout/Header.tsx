import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import {
  Menu,
  X,
  User,
  LogOut,
  Sparkles,
  Settings,
  BookOpen,
  Users,
  Heart,
  Home,
  Target,
  Shield,
  Timer,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  user_id: string;
  nickname?: string;
  avatar_url?: string;
  subscription_tier?: string;
  remaining_minutes?: number;
  role?: string;
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!user) {
        setProfile(null);
        return;
      }

      setProfileLoading(true);
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, user_id, nickname, avatar_url, subscription_tier, remaining_minutes, role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        console.error("Error loading profile", error);
      }

      setProfile(data ?? null);
      setProfileLoading(false);
    };

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const isActive = (path: string) => location.pathname === path;

  const publicLinks = useMemo(
    () => [
      { to: "/", label: "Home", icon: Home },
      { to: "/about", label: "About", icon: BookOpen },
      { to: "/assessments", label: "Free Assessments", icon: Sparkles },
    ],
    []
  );

  const authenticatedLinks = useMemo(() => {
    const links = [
      { to: "/dashboard", label: "Dashboard", icon: Home },
      { to: "/narrative-exploration", label: "Narrative", icon: Sparkles },
      { to: "/community", label: "Community", icon: Users },
      { to: "/wellness-library", label: "Wellness", icon: Heart },
      { to: "/member-assessments", label: "Assessments", icon: Target },
    ];

    if (isAdmin) {
      links.push({ to: "/admin", label: "Admin", icon: Shield });
    }

    return links;
  }, [isAdmin]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    toast({
      title: "Signed out successfully",
      description: "Come back soon!",
    });
  };

  const subscriptionTier = profile?.subscription_tier?.replace(/\b\w/g, (char) => char.toUpperCase()) ?? "Discovery";
  const remainingMinutes = profile?.remaining_minutes ?? 0;

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "glass-card shadow-lg backdrop-blur-xl bg-background/95 border-b border-white/20"
          : "glass border-b border-white/10"
      }`}
    >
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center group">
          <div className="h-12 w-auto transition-transform group-hover:scale-105">
            <img src="/Newomen logo.svg" alt="Newomen" className="h-12 w-auto" />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {(user ? authenticatedLinks : publicLinks).map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive(link.to) ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Auth & Quick Stats */}
        <div className="hidden md:flex items-center gap-4">
          {user && !profileLoading && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-white/10 text-xs capitalize">
                {subscriptionTier}
              </Badge>
              <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Timer className="h-4 w-4" />
                <span>{remainingMinutes} min</span>
              </div>
            </div>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 glass-card hover:bg-white/10"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                      {profile?.nickname?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden lg:block">
                    {profile?.nickname || "User"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 glass-card border-white/10">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem disabled className="flex-col items-start">
                  <span className="text-xs text-muted-foreground">Subscription</span>
                  <span className="text-sm font-semibold capitalize">{subscriptionTier}</span>
                </DropdownMenuItem>
                <DropdownMenuItem disabled className="flex-col items-start">
                  <span className="text-xs text-muted-foreground">Remaining Minutes</span>
                  <span className="text-sm font-semibold">{remainingMinutes} min</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/account-settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/narrative-exploration")}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Narrative Exploration
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/admin")}> 
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Console
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                variant="ghost"
                className="glass-card"
                onClick={() => navigate("/auth")}
              >
                Sign In
              </Button>
              <Button
                className="clay-button bg-gradient-to-r from-primary to-accent"
                onClick={() => navigate("/auth")}
              >
                Get Started
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-card rounded-b-2xl mt-2 animate-in slide-in-from-top duration-200">
          <div className="container mx-auto px-4 py-4 space-y-2">
            {(user ? authenticatedLinks : publicLinks).map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive(link.to)
                      ? "glass-card text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </Link>
              );
            })}

            {user && (
              <>
                <div className="h-px bg-white/10 my-2" />
                <div className="flex items-center justify-between px-4 py-2 text-sm text-muted-foreground">
                  <span className="capitalize">{subscriptionTier}</span>
                  <span className="flex items-center gap-1">
                    <Timer className="h-4 w-4" />
                    {remainingMinutes} min
                  </span>
                </div>
                <Link
                  to="/profile"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-5 w-5" />
                  Profile
                </Link>
                <Link
                  to="/account-settings"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings className="h-5 w-5" />
                  Settings
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Shield className="h-5 w-5" />
                    Admin Console
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 text-left w-full"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
              </>
            )}

            {!user && (
              <>
                <div className="h-px bg-white/10 my-2" />
                <Button
                  variant="outline"
                  className="glass-card w-full"
                  onClick={() => {
                    navigate("/auth");
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign In
                </Button>
                <Button
                  className="clay-button bg-gradient-to-r from-primary to-accent w-full"
                  onClick={() => {
                    navigate("/auth");
                    setMobileMenuOpen(false);
                  }}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
