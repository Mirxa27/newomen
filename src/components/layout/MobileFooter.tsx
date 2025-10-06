import { Link, useLocation } from "react-router-dom";
import { Home, Sparkles, Users, User, MessageCircle, Shield, Brain } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";

export default function MobileFooter() {
  const location = useLocation();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();

  if (!user || location.pathname === "/" || location.pathname === "/auth") {
    return null;
  }

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { to: "/dashboard", label: "Home", icon: Home },
    { to: "/ai-assessments", label: "AI Tests", icon: Brain },
    { to: "/narrative-exploration", label: "Explore", icon: Sparkles },
    { to: "/chat", label: "Chat", icon: MessageCircle },
    { to: "/community", label: "Connect", icon: Users },
    { to: "/profile", label: "Profile", icon: User },
  ];

  if (isAdmin) {
    navItems.splice(4, 0, { to: "/admin", label: "Admin", icon: Shield });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-white/10 md:hidden">
      <div className="px-2 py-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all duration-300 min-w-0 flex-1 max-w-[60px] ${
                  active
                    ? "clay-button bg-gradient-to-br from-primary/20 to-accent/20 text-primary scale-105"
                    : "text-muted-foreground hover:text-foreground hover:scale-102"
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-all flex-shrink-0 ${
                    active ? "stroke-[2.5]" : "stroke-[2]"
                  }`}
                />
                <span
                  className={`text-[9px] font-medium transition-all text-center leading-tight truncate w-full ${
                    active ? "opacity-100" : "opacity-70"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
      {/* Safe area padding for devices with home indicator */}
      <div className="h-safe-area-inset-bottom bg-background/95" />
    </nav>
  );
}
