import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { toast } from "sonner";
import { Loader2, Edit, Search, Users, Shield, Crown } from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  nickname: string | null;
  frontend_name: string | null;
  role: string;
  subscription_tier: string | null;
  remaining_minutes: number | null;
  current_level: number | null;
  crystal_balance: number | null;
  daily_streak: number | null;
  created_at: string;
  updated_at: string | null;
}

interface EditUserForm {
  role: string;
  subscription_tier: string;
  remaining_minutes: number;
  nickname: string;
  frontend_name: string;
}

// Type for RPC parameters to avoid TypeScript errors
interface RpcParams {
  [key: string]: unknown;
}

// Type for Supabase RPC function with proper typing
interface TypedSupabaseClient {
  rpc: (fn: string, params?: RpcParams) => Promise<{ data: unknown; error: unknown }>;
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<EditUserForm>({
    role: 'member',
    subscription_tier: 'discovery',
    remaining_minutes: 10,
    nickname: '',
    frontend_name: ''
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as unknown as TypedSupabaseClient).rpc('admin_get_user_profiles', {
        limit_count: 100,
        offset_count: 0,
        search_term: searchTerm || null
      });

      if (error) throw error;
      setUsers((data as UserProfile[]) || []);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load user profiles. Ensure you have admin privileges.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const openEditDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setFormData({
      role: user.role,
      subscription_tier: user.subscription_tier || 'discovery',
      remaining_minutes: user.remaining_minutes || 0,
      nickname: user.nickname || '',
      frontend_name: user.frontend_name || ''
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    setSaving(true);

    try {
      const { data, error } = await (supabase as unknown as TypedSupabaseClient).rpc('admin_update_user_profile', {
        target_user_id: selectedUser.user_id,
        new_role: formData.role,
        new_subscription_tier: formData.subscription_tier,
        new_remaining_minutes: formData.remaining_minutes,
        new_nickname: formData.nickname || null,
        new_frontend_name: formData.frontend_name || null
      });

      if (error) throw error;

      toast.success(`User ${selectedUser.email} updated successfully!`);
      setDialogOpen(false);
      void loadUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`Update failed: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
      case 'superadmin':
        return <Shield className="w-4 h-4 text-red-500" />;
      case 'premium':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      default:
        return <Users className="w-4 h-4 text-blue-500" />;
    }
  };

  const getTierBadgeColor = (tier: string | null) => {
    switch (tier) {
      case 'transformation':
        return 'bg-purple-100 text-purple-800';
      case 'growth':
        return 'bg-green-100 text-green-800';
      case 'discovery':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">User Management</h1>
          <p className="text-muted-foreground">
            Manage user profiles, roles, and subscriptions.
          </p>
        </div>
      </div>

      {/* Search */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Search Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Search by email or nickname..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="max-w-md"
            />
            <Button onClick={() => void loadUsers()}>
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            User Profiles ({users.length})
          </CardTitle>
          <CardDescription>
            Click on a user to edit their profile, role, or subscription.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Minutes</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Crystals</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.frontend_name || user.nickname || 'No display name'}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          {user.frontend_name && user.nickname && user.frontend_name !== user.nickname && (
                            <div className="text-xs text-gray-500">Original: {user.nickname}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(user.role)}
                          <span className="capitalize">{user.role}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierBadgeColor(user.subscription_tier)}`}>
                          {user.subscription_tier || 'None'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={user.remaining_minutes === 999999 ? 'text-green-600 font-medium' : ''}>
                          {user.remaining_minutes === 999999 ? 'Unlimited' : (user.remaining_minutes || 0)}
                        </span>
                      </TableCell>
                      <TableCell>{user.current_level || 1}</TableCell>
                      <TableCell>{user.crystal_balance || 0}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-card max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
            <DialogDescription>
              Update {selectedUser?.email}'s profile settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                placeholder="User's display name"
              />
            </div>

            <div>
              <Label htmlFor="frontend_name">Frontend Display Name</Label>
              <Input
                id="frontend_name"
                value={formData.frontend_name}
                onChange={(e) => setFormData({ ...formData, frontend_name: e.target.value })}
                placeholder="Custom display name for frontend (optional)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                If set, this will be shown instead of the nickname throughout the app
              </p>
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subscription_tier">Subscription Tier</Label>
              <Select value={formData.subscription_tier} onValueChange={(value) => setFormData({ ...formData, subscription_tier: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discovery">Discovery</SelectItem>
                  <SelectItem value="growth">Growth</SelectItem>
                  <SelectItem value="transformation">Transformation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="remaining_minutes">Remaining Minutes</Label>
              <div className="flex gap-2">
                <Input
                  id="remaining_minutes"
                  type="number"
                  value={formData.remaining_minutes}
                  onChange={(e) => setFormData({ ...formData, remaining_minutes: parseInt(e.target.value) || 0 })}
                  placeholder="Minutes remaining"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormData({ ...formData, remaining_minutes: 999999 })}
                >
                  Unlimited
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}