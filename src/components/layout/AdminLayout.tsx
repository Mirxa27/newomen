import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Card } from '@/components/ui/card';

const adminNavItems = [
  { name: 'Analytics', path: '/admin/analytics' },
  { name: 'AI Providers', path: '/admin/ai-providers' },
  { name: 'AI Prompts', path: '/admin/ai-prompts' },
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
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-2xl font-bold mb-4">Admin Panel</h2>
        <nav>
          <ul>
            {adminNavItems.map((item) => (
              <li key={item.name} className="mb-2">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `block p-2 rounded hover:bg-gray-700 ${isActive ? 'bg-gray-900' : ''}`
                  }
                >
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-6 bg-gray-100">
        <Card className="p-6">
          <Outlet />
        </Card>
      </main>
    </div>
  );
};

export default AdminLayout;
