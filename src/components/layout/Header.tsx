import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { Loader2, LogOut, Settings, User, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/useAdmin";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function Header() {
  const { isAdmin } = useAdmin();
  const { profile, loading: profileLoading, getDisplayName } = useUserProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <Zap className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">NewMe</span>
        </Link>

        <nav className="flex items-center space-x-4">
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
                    <span>Subscription:</span>
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
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Admin Dashboard</span>
                  </DropdownMenuItem>
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
        </nav>
      </div>
    </header>
  );
}