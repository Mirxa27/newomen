import { Link, useLocation } from "react-router-dom";
import { Home, MessageSquare, FileText, Heart, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function MobileFooter() {
  const location = useLocation();
  const { user } = useAuth();
  const isActive = (path: string) => location.pathname === path;

  if (!user) return null;

  const navItems = [
    { to: "/dashboard", icon: Home, label: "Home" },
    { to: "/chat", icon: MessageSquare, label: "Chat" },
    { to: "/member-assessments", icon: FileText, label: "Assess" },
    { to: "/couples-challenge", icon: Heart, label: "Couple" },
    { to: "/dashboard", icon: User, label: "Profile" },
  ];

  return (
    <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50">
      <div className="glass rounded-full px-4 py-3 shadow-lg border border-white/20">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center space-y-1 transition-all duration-300 ${
                  active 
                    ? "text-primary scale-110" 
                    : "text-muted-foreground hover:text-primary/80"
                }`}
              >
                <div className={`p-2 rounded-full transition-all duration-300 ${
                  active 
                    ? "bg-primary/20 glow-primary" 
                    : "hover:bg-white/5"
                }`}>
                  <Icon className={`h-5 w-5 ${active ? "fill-current" : ""}`} />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
