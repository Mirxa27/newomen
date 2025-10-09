import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAdmin } from "@/hooks/useAdmin";
import {
  Menu,
  LogOut,
  Settings,
  User,
  Shield,
  Home,
  Info,
  DollarSign,
  MessageCircle,
  ClipboardList,
} from 'lucide-react';

interface NavLink {
  name: string;
  path: string;
  icon?: React.ElementType;
}

const visitorLinks: NavLink[] = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'About', path: '/about', icon: Info },
  { name: 'Pricing', path: '/pricing', icon: DollarSign },
];

const memberLinks: NavLink[] = [
  { name: 'Dashboard', path: '/dashboard', icon: Home },
  { name: 'Chat', path: '/chat', icon: MessageCircle },
  { name: 'Assessments', path: '/assessments', icon: ClipboardList },
];

const Header: React.FC = () => {
  const { profile, loading: profileLoading } = useUserProfile();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = profile ? memberLinks : visitorLinks;

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const DesktopLinks = () => (
    <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
      {navLinks.map((l) => (
        <Link
          key={l.path}
          to={l.path}
          className={`transition-colors hover:text-primary ${location.pathname === l.path ? 'text-primary' : ''}`}
        >
          {l.name}
        </Link>
      ))}
      {profile && isAdmin && (
        <Link
          to="/admin"
          className={`transition-colors hover:text-primary ${location.pathname.startsWith('/admin') ? 'text-primary' : ''}`}
        >
          Admin
        </Link>
      )}
    </nav>
  );

  const MobileMenu = () => (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pt-10 pr-0">
        <div className="pl-6 space-y-4">
          {navLinks.map((l) => {
            const Icon = l.icon ?? Home;
            return (
              <Link
                key={l.path}
                to={l.path}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 text-sm font-medium hover:text-primary"
              >
                <Icon className="h-4 w-4" /> {l.name}
              </Link>
            );
          })}
          {profile && isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 text-sm font-medium hover:text-primary"
            >
              <Shield className="h-4 w-4" /> Admin
            </Link>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center space-x-2 text-lg font-bold">
            <img src="/Newomen%20logo.svg" alt="Logo" className="h-6 w-auto" />
            <span className="hidden sm:inline-block">NewMe</span>
          </Link>
          <DesktopLinks />
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4">
          <MobileMenu />

          {profileLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : profile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatar_url || ''} alt={profile.nickname || 'User'} />
                    <AvatarFallback>{getInitials(profile.nickname)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile.nickname || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">{profile.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/account-settings')}>
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    <Shield className="mr-2 h-4 w-4" /> Admin Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;