import { Link, useLocation } from "react-router-dom";
import { Home, Sparkles, Users, User, MessageCircle, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";

export default function MobileFooter() {
  const location = useLocation();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();

  if (!user || location.pathname === "/auth") {
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

  if (isAdmin) {
    navItems.push({ to: "/admin", label: "Admin", icon: Shield });
  }

  return (
    // Mobile footer navigation bar
    <nav className="nav-responsive md:hidden">
      <div className="flex items-center justify-around h-full px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-1.5 py-2 px-3 rounded-2xl transition-all duration-300 min-w-[60px] touch-optimized ${
                active
                  ? "text-primary scale-105"
                  : "text-muted-foreground/70 hover:text-foreground/90 active:scale-95"
              }`}
            >
              <div className={`relative ${active ? 'animate-pulse-glow' : ''}`}>
                <Icon
                  className={`h-6 w-6 transition-all ${
                    active ? "stroke-[2.5] drop-shadow-[0_0_8px_rgba(155,135,245,0.6)]" : "stroke-[2]"
                  }`}
                />
              </div>
              <span
                className={`text-[10px] font-medium transition-all text-center leading-tight ${
                  active ? "opacity-100 font-semibold" : "opacity-70"
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
