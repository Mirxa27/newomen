import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Loader2, 
  LogOut, 
  Settings, 
  User, 
  Menu,
  Home,
  MessageCircle,
  Heart,
  BookOpen,
  Users,
  Trophy,
  Brain,
  TestTube,
  CreditCard,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/useAdmin";
import { useUserProfile } from "@/hooks/useUserProfile";

// Navigation items configuration
const navigationItems = [
  {
    title: "Explore",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: Home, description: "Your personal growth dashboard" },
      { name: "AI Chat", href: "/chat", icon: MessageCircle, description: "Connect with your AI companion" },
      { name: "Wellness Library", href: "/wellness-library", icon: BookOpen, description: "Guided meditations and resources" },
      { name: "Assessments", href: "/assessments", icon: TestTube, description: "Personal growth assessments" },
    ]
  },
  {
    title: "Connect",
    items: [
      { name: "Community", href: "/community", icon: Users, description: "Connect with others on similar journeys" },
      { name: "Couples Challenge", href: "/couples-challenge", icon: Heart, description: "Strengthen your relationship" },
      { name: "Narrative Exploration", href: "/narrative-identity", icon: Brain, description: "Explore your story" },
    ]
  }
];

export default function Header() {
  const { isAdmin } = useAdmin();
  const { profile, loading: profileLoading, getDisplayName } = useUserProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/auth");
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Logout Failed",
        description: "There was an error logging you out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const subscriptionTier = profile?.subscription_tier?.replace(/\b\w/g, (char) => char.toUpperCase()) ?? "Discovery";
  const remainingMinutes = profile?.remaining_minutes ?? 0;
  const displayName = getDisplayName();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center space-x-3 mr-6">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent">
            <img 
              src="/Newomen logo.svg" 
              alt="NewMe Logo" 
              className="w-6 h-6"
              onError={(e) => {
                // Fallback to icon if SVG fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <Zap className="h-5 w-5 text-white hidden" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg">NewMe</span>
            <span className="text-xs text-muted-foreground hidden sm:block">Personal Growth Journey</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {navigationItems.map((section) => (
              <NavigationMenuItem key={section.title}>
                <NavigationMenuTrigger className="font-medium">
                  {section.title}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={`group grid h-auto w-full items-center justify-start gap-1 rounded-md bg-background p-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 ${
                            isActive ? 'bg-accent text-accent-foreground' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <div className="text-sm font-medium">{item.name}</div>
                          </div>
                          <div className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                            {item.description}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Mobile Menu Button */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <Link
              to="/dashboard"
              className="flex items-center space-x-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Zap className="h-6 w-6 text-primary" />
              <span className="font-bold">NewMe</span>
            </Link>
            <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
              <div className="flex flex-col space-y-3">
                {navigationItems.map((section) => (
                  <div key={section.title}>
                    <h4 className="mb-2 text-sm font-semibold text-muted-foreground">
                      {section.title}
                    </h4>
                    <div className="grid flow-row auto-rows-max text-sm">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            className={`flex items-center gap-2 rounded-md p-2 text-sm hover:bg-accent hover:text-accent-foreground ${
                              isActive ? 'bg-accent text-accent-foreground' : ''
                            }`}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Icon className="h-4 w-4" />
                            {item.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 items-center justify-end space-x-4">
          {/* Quick Actions */}
          <div className="hidden lg:flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/pricing")}
              className="text-sm"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Upgrade
            </Button>
          </div>

          {/* User Menu */}
          {profileLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                      {displayName?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {profile?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <div className="flex items-center justify-between w-full text-xs">
                    <span>Plan:</span>
                    <span className="font-semibold capitalize">{subscriptionTier}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <div className="flex items-center justify-between w-full text-xs">
                    <span>Minutes:</span>
                    <span className="font-semibold">{remainingMinutes} min</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/pricing")}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Upgrade Plan</span>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                  {isLoggingOut ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 h-4 w-4" />
                  )}
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}