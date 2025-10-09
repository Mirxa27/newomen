import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type UserProfile = Tables<'user_profiles'>;

export default function AdminUserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const fetchUsers = useCallback(async (search = '') => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_get_user_profiles', {
        limit_count: 100,
        offset_count: 0,
        search_term: search,
      });

      if (error) throw error;
      setUsers(data || []);
    } catch (e) {
      toast.error('Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void fetchUsers(searchTerm);
  };

  const handleUpdateUser = async (updatedProfile: Partial<UserProfile>) => {
    if (!selectedUser) return;
    try {
      const { data, error } = await supabase.rpc('admin_update_user_profile', {
        target_user_id: selectedUser.user_id,
        new_role: updatedProfile.role || selectedUser.role,
        new_subscription_tier: updatedProfile.subscription_tier || selectedUser.subscription_tier,
        new_remaining_minutes: updatedProfile.remaining_minutes || selectedUser.remaining_minutes,
        new_nickname: updatedProfile.nickname || selectedUser.nickname,
      });

      if (error) throw error;
      toast.success('User updated successfully!');
      await fetchUsers(searchTerm);
      setSelectedUser(data[0]);
    } catch (e) {
      toast.error('Failed to update user.');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Search, view, and edit user profiles.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <Input
              placeholder="Search by email or nickname..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button type="submit" disabled={loading}>
              <Search className="w-4 h-4 mr-2" /> Search
            </Button>
          </form>
          {/* User list and edit form would go here */}
        </CardContent>
      </Card>
    </div>
  );
}