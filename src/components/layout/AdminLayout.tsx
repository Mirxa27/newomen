import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Card } from '@/components/ui/card';

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
  { name: 'Content Management', path: '/admin/content-management' },
  { name: 'Gamification', path: '/admin/gamification-settings' },
  { name: 'Branding', path: '/admin/branding' },
  { name: 'API Settings', path: '/admin/api-settings' },
];

const AdminLayout: React.FC = () => {
  return (
    <div className="app-page-shell flex min-h-screen">
      <aside className="w-64 bg-black/70 backdrop-blur-xl text-white/90 p-4 border-r border-white/10">
        <h2 className="text-2xl font-bold mb-4">Admin Panel</h2>
        <nav>
          <ul>
            {adminNavItems.map((item) => (
              <li key={item.name} className="mb-2">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `block p-2 rounded-lg transition-colors hover:bg-white/10 ${isActive ? 'bg-white/15 text-white' : ''}`
                  }
                >
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <Card className="p-6 backdrop-blur-xl bg-white/5 border-white/10 text-foreground">
          <Outlet />
        </Card>
      </main>
    </div>
  );
};

export default AdminLayout;
