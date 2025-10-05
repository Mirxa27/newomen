import { Link, useLocation } from "react-router-dom";
import { Home, Sparkles, Users, User, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function MobileFooter() {
  const location = useLocation();
  const { user } = useAuth();

  // Don't show on auth pages or landing
  if (!user || location.pathname === "/" || location.pathname === "/auth") {
    return null;
  }

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { to: "/dashboard", label: "Home", icon: Home },
    { to: "/narrative-exploration", label: "Explore", icon: Sparkles },
    { to: "/chat", label: "Chat", icon: MessageCircle },
    { to: "/community", label: "Connect", icon: Users },
    { to: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-4 left-4 right-4 z-40">
      {/* Claymorphism Floating Capsule */}
      <div className="clay-card rounded-full px-4 py-3 shadow-2xl backdrop-blur-xl bg-background/95 border border-white/20">
        <div className="flex items-center justify-around gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-300 ${
                  active
                    ? "clay-button bg-gradient-to-br from-primary/20 to-accent/20 text-primary scale-110"
                    : "text-muted-foreground hover:text-foreground hover:scale-105"
                }`}
              >
                <Icon 
                  className={`h-5 w-5 transition-all ${
                    active ? "stroke-[2.5]" : "stroke-[2]"
                  }`} 
                />
                <span 
                  className={`text-[10px] font-medium transition-all ${
                    active ? "opacity-100" : "opacity-0 max-h-0"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* Bottom Safe Area Spacer */}
      <div className="h-4" />
    </nav>
  );
}
