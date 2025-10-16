import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Card } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Menu, X } from 'lucide-react';
import { useUserRole } from '@/hooks/features/auth/useUserRole';

const allAdminNavItems = [
  { name: 'Analytics', path: '/admin/analytics', permission: 'canViewAnalytics' },
  { name: 'Agents', path: '/admin/agents', permission: 'canManageAIProviders' },
  { name: 'AI Providers', path: '/admin/ai-providers', permission: 'canManageAIProviders' },
  { name: 'AI Config', path: '/admin/ai-config', permission: 'canManageSettings' },
  { name: 'AI Prompts', path: '/admin/ai-prompts', permission: 'canManageSettings' },
  { name: 'AI Assessments', path: '/admin/ai-assessments', permission: 'canManageAssessments' },
  { name: 'Voice Training', path: '/admin/voice-training', permission: 'canManageAIProviders' },
  { name: 'Live Sessions', path: '/admin/sessions-live', permission: 'canViewLiveSessions' },
  { name: 'Session History', path: '/admin/sessions-history', permission: 'canViewHistory' },
  { name: 'User Management', path: '/admin/user-management', permission: 'canManageUsers' },
  { name: 'Wellness Library', path: '/admin/wellness-library', permission: 'canManageContent' },
  { name: 'Content Management', path: '/admin/content-management', permission: 'canManageContent' },
  { name: 'Gamification', path: '/admin/gamification-settings', permission: 'canManageCommunity' },
  { name: 'Branding', path: '/admin/branding', permission: 'canManageSettings' },
  { name: 'API Settings', path: '/admin/api-settings', permission: 'canManageAPIs' },
];

const AdminLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { permissions } = useUserRole();

  // Filter navigation items based on user permissions
  const adminNavItems = allAdminNavItems.filter(item => {
    if (!permissions) return false;
    return permissions[item.permission as keyof typeof permissions] === true;
  });

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
