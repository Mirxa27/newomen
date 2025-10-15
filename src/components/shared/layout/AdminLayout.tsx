import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Card } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Menu, X } from 'lucide-react';

const adminNavItems = [
  { name: 'Analytics', path: '/admin/analytics' },
  { name: 'Agents', path: '/admin/agents' },
  { name: 'AI Providers', path: '/admin/ai-providers' },
  { name: 'AI Config', path: '/admin/ai-config' },
  { name: 'AI Prompts', path: '/admin/ai-prompts' },
  { name: 'AI Assessments', path: '/admin/ai-assessments' },
  { name: 'Voice Training', path: '/admin/voice-training' },
  { name: 'Live Sessions', path: '/admin/sessions-live' },
  { name: 'Session History', path: '/admin/sessions-history' },
  { name: 'User Management', path: '/admin/user-management' },
  { name: 'Wellness Library', path: '/admin/wellness-library' },
  { name: 'Content Management', path: '/admin/content-management' },
  { name: 'Gamification', path: '/admin/gamification-settings' },
  { name: 'Branding', path: '/admin/branding' },
  { name: 'API Settings', path: '/admin/api-settings' },
];

const AdminLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="app-page-shell flex min-h-screen flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 bg-black/40 backdrop-blur-md text-white/90 flex-col border-r border-white/10 glass">
        <div className="p-4 md:p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold gradient-text">Admin Panel</h2>
        </div>
        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-1 p-4">
            {adminNavItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                      isActive
                        ? 'bg-gradient-primary text-white shadow-lg'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Mobile Menu Button */}
      <div className="md:hidden flex items-center justify-between p-4 glass border-b border-white/10">
        <h2 className="text-xl font-bold gradient-text">Admin</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-white/90 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 glass border-b border-white/10 z-40">
          <nav className="p-4">
            <ul className="space-y-2">
              {adminNavItems.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `block px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                        isActive
                          ? 'bg-gradient-primary text-white'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`
                    }
                  >
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 min-h-screen">
          <Card className="glass-card border-white/10 text-foreground backdrop-blur-xl">
            <Outlet />
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
