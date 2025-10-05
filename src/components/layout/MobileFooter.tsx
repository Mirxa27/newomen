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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "fill-current" : ""}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
