import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/shared/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shared/ui/avatar";
import { Badge } from "@/components/shared/ui/badge";
import { useAuth } from "@/hooks/features/auth/useAuth";
import { useAdmin } from "@/hooks/features/admin/useAdmin";
import { useUserProfile } from "@/hooks/features/auth/useUserProfile";
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
  Bell,
  Search,
  Zap
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shared/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/shared/ui/use-toast";
import { cn } from "@/lib/shared/utils/utils";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { profile, loading: profileLoading, getDisplayName } = useUserProfile({ redirectToAuth: false });
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Set initial scroll state
    setIsScrolled(window.scrollY > 20);
    
    const handleScroll = () => {
      const scrolled = window.scrollY > 20;
      if (scrolled !== isScrolled) {
        setIsScrolled(scrolled);
      }
    };

    // Add throttling to improve performance
    const throttledHandleScroll = () => {
      let isThrottled = false;
      return () => {
        if (!isThrottled) {
          handleScroll();
          isThrottled = true;
          setTimeout(() => {
            isThrottled = false;
          }, 100);
        }
      };
    };

    const throttled = throttledHandleScroll();
    window.addEventListener("scroll", throttled, { passive: true });
    
    // Force a check in case page loads already scrolled
    handleScroll();
    
    return () => window.removeEventListener("scroll", throttled);
  }, [isScrolled]);

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
  const displayName = getDisplayName();

  return (
    <header
      className={cn(
        "relative z-50 w-full transition-all duration-300",
        isScrolled
          ? "glass-card shadow-lg backdrop-blur-xl bg-background/95 border-b border-white/20"
          : "glass border-b border-white/10"
      )}
    >
      <div className="container-responsive">
        <div className="flex h-20 sm:h-24 items-center justify-between">
          {/* Enhanced Logo Section */}
          <div className="flex items-center">
            <Link 
              to={user ? "/dashboard" : "/"} 
              className="flex items-center group transition-all duration-200 hover:scale-105"
            >
              {isScrolled ? (
                <img 
                  src="/dist/Newomen icon.svg" 
                  alt="Newomen"
                  className="w-14 h-14 object-contain max-h-full"
                />
              ) : (
                <img 
                  src="/public/newomen-logo.png" 
                  alt="Newomen"
                  className="w-26 h-26 object-contain max-h-full"
                />
              )}
            </Link>
          </div>

          {/* Enhanced Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {(user ? authenticatedLinks : publicLinks).map((link) => {
              const Icon = link.icon;
              const active = isActive(link.to);
              
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 touch-target",
                    active
                      ? "bg-primary/20 text-primary border border-primary/30 shadow-glow"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                  {active && (
                    <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Enhanced Right Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                {/* Enhanced User Stats - Desktop */}
                <div className="hidden md:flex items-center gap-3">
                  {/* Subscription Badge */}
                  <Badge 
                    variant="secondary" 
                    className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-200 border-purple-400/30 hover:scale-105 transition-all duration-200"
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    {subscriptionTier}
                  </Badge>
                  
                  {/* Minutes Remaining */}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Timer className="w-4 h-4" />
                    <span className="font-mono">{remainingMinutes}m</span>
                  </div>
                </div>

                {/* Enhanced User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-full hover:scale-105 transition-all duration-200 touch-target"
                    >
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-white/20 shadow-lg">
                        <AvatarImage 
                          src={profile?.avatar_url || undefined} 
                          alt={displayName}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold">
                          {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {/* Online indicator */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-background rounded-full animate-pulse" />
                    </Button>
                  </DropdownMenuTrigger>
                  
                  <DropdownMenuContent 
                    className="w-64 glass-card border-white/20 shadow-xl backdrop-blur-xl" 
                    align="end"
                  >
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-2">
                        <p className="text-sm font-medium leading-none">{displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <Badge 
                            variant="secondary" 
                            className="text-xs bg-primary/20 text-primary border-primary/30"
                          >
                            {subscriptionTier}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            {remainingMinutes}m left
                          </span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    
                    <DropdownMenuSeparator className="bg-white/10" />
                    
                    <DropdownMenuItem 
                      onClick={() => navigate("/profile")}
                      className="hover:bg-white/10 cursor-pointer"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => navigate("/account-settings")}
                      className="hover:bg-white/10 cursor-pointer"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>

                    {isAdmin && (
                      <DropdownMenuItem 
                        onClick={() => navigate("/admin")}
                        className="hover:bg-white/10 cursor-pointer"
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuSeparator className="bg-white/10" />
                    
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      className="hover:bg-red-500/20 text-red-400 cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              /* Enhanced Auth Buttons */
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate("/auth")}
                  className="hidden sm:flex hover:bg-white/10 hover:scale-105 transition-all duration-200"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => navigate("/auth")}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-glow hover:scale-105 transition-all duration-200"
                >
                  <span className="hidden sm:inline">Get Started</span>
                  <span className="sm:hidden">Join</span>
                </Button>
              </div>
            )}

            {/* Enhanced Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden hover:bg-white/10 hover:scale-105 transition-all duration-200 touch-target"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Enhanced Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden animate-slide-up">
            <div className="px-2 pt-2 pb-3 space-y-1 glass-card mt-2 rounded-2xl border border-white/20 shadow-xl backdrop-blur-xl">
              {(user ? authenticatedLinks : publicLinks).map((link) => {
                const Icon = link.icon;
                const active = isActive(link.to);
                
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 touch-target",
                      active
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{link.label}</span>
                    {active && (
                      <div className="ml-auto w-2 h-2 bg-primary rounded-full animate-pulse" />
                    )}
                  </Link>
                );
              })}
              
              {/* Mobile User Stats */}
              {user && (
                <div className="px-4 py-3 border-t border-white/10 mt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-200 border-purple-400/30"
                      >
                        <Zap className="w-3 h-3 mr-1" />
                        {subscriptionTier}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Timer className="w-4 h-4" />
                      <span className="font-mono">{remainingMinutes}m</span>
                    </div>
                  </div>
                </div>
              )}
              
              {!user && (
                <div className="px-4 py-3 border-t border-white/10 mt-2">
                  <Button 
                    onClick={() => {
                      navigate("/auth");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
                  >
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}