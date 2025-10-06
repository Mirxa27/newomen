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
    <nav className="nav-responsive">
      <div className="flex items-center justify-around gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1 px-1 py-2 rounded-xl transition-all duration-300 min-w-0 flex-1 max-w-[60px] touch-target-comfort ${
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
                className={`text-responsive-xs font-medium transition-all text-center leading-tight truncate w-full ${
                  active ? "opacity-100" : "opacity-70"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
