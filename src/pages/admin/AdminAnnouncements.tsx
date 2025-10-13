import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { format } from '@/lib/date-utils';
import { useToast } from '@/hooks/use-toast';

// Allow intentional use of `any` in this admin utility file to work around generated Supabase typing gaps.
// This file contains a small number of controlled `any` casts that are safe and will be replaced
// once the Supabase types are fully regenerated to include community tables.
 /* eslint-disable @typescript-eslint/no-explicit-any */

type AnnouncementRow = {
  id: string;
  title: string;
  content: string;
  announcement_type: 'general' | 'challenge' | 'assessment' | 'quiz' | 'maintenance' | 'feature';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  target_audience: 'all' | 'discovery' | 'growth' | 'transformation' | 'premium';
  is_active: boolean;
  scheduled_at: string | null;
  expires_at: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type AnnouncementForm = {
  title: string;
  content: string;
  announcement_type: AnnouncementRow['announcement_type'];
  priority: AnnouncementRow['priority'];
  target_audience: AnnouncementRow['target_audience'];
  is_active: boolean;
  scheduled_at: string;
  expires_at: string;
};

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<AnnouncementRow | null>(null);
  const [form, setForm] = useState<AnnouncementForm>({
    title: '',
    content: '',
    announcement_type: 'general',
    priority: 'normal',
    target_audience: 'all',
    is_active: true,
    scheduled_at: '',
    expires_at: ''
  });
  const { toast } = useToast();

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('community_announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements((data as AnnouncementRow[]) || []);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to load announcements', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
    void loadAnnouncements();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setForm({
      title: '',
      content: '',
      announcement_type: 'general',
      priority: 'normal',
      target_audience: 'all',
      is_active: true,
      scheduled_at: '',
      expires_at: ''
    });
  };

  const handleEdit = (row: AnnouncementRow) => {
    setEditing(row);
    setForm({
      title: row.title,
      content: row.content,
      announcement_type: row.announcement_type,
      priority: row.priority,
      target_audience: row.target_audience,
      is_active: !!row.is_active,
      scheduled_at: row.scheduled_at ?? '',
      expires_at: row.expires_at ?? ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete announcement? This action cannot be undone.')) return;
    try {
      const { error } = await supabase
        .from('community_announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Deleted', description: 'Announcement deleted' });
      await loadAnnouncements();
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast({ title: 'Validation', description: 'Title and content are required', variant: 'destructive' });
      return;
    }

    try {
      if (editing) {
        // Use a strongly-typed partial payload to avoid using `any`
        const payload = {
          title: form.title,
          content: form.content,
          announcement_type: form.announcement_type,
          priority: form.priority,
          target_audience: form.target_audience,
          is_active: form.is_active,
          scheduled_at: form.scheduled_at || null,
          expires_at: form.expires_at || null
        } as Partial<AnnouncementRow>;

        const { error } = await supabase
          .from('community_announcements')
          .update(payload as any)
          .eq('id', editing.id);

        if (error) throw error;
        toast({ title: 'Updated', description: 'Announcement updated' });
      } else {
        const payload = {
          title: form.title,
          content: form.content,
          announcement_type: form.announcement_type,
          priority: form.priority,
          target_audience: form.target_audience,
          is_active: form.is_active,
          scheduled_at: form.scheduled_at || null,
          expires_at: form.expires_at || null
        } as Partial<AnnouncementRow>;

        const { error } = await supabase
          .from('community_announcements')
          .insert(payload as any);

        if (error) throw error;
        toast({ title: 'Created', description: 'Announcement created' });
      }

      resetForm();
      await loadAnnouncements();
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to save announcement', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Admin — Community Announcements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Input
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <select
                className="input glass"
                value={form.announcement_type}
                onChange={(e) =>
                  setForm({ ...form, announcement_type: e.target.value as AnnouncementForm['announcement_type'] })
                }
              >
                <option value="general">General</option>
                <option value="challenge">Challenge</option>
                <option value="assessment">Assessment</option>
                <option value="quiz">Quiz</option>
                <option value="maintenance">Maintenance</option>
                <option value="feature">Feature</option>
              </select>
            </div>

            <Textarea
              placeholder="HTML content (will be rendered as-is in the Community feed)"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="min-h-[120px]"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <select
                className="input glass"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as AnnouncementForm['priority'] })}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>

              <select
                className="input glass"
                value={form.target_audience}
                onChange={(e) => setForm({ ...form, target_audience: e.target.value as AnnouncementForm['target_audience'] })}
              >
                <option value="all">All</option>
                <option value="discovery">Discovery</option>
                <option value="growth">Growth</option>
                <option value="transformation">Transformation</option>
                <option value="premium">Premium</option>
              </select>

              <div className="flex items-center gap-2">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                <label htmlFor="is_active" className="text-sm text-white/80">Active</label>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-2">
              <Input
                type="datetime-local"
                value={form.scheduled_at || ''}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
              />
              <Input
                type="datetime-local"
                value={form.expires_at || ''}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="bg-gradient-to-r from-purple-500 to-pink-500">
                {editing ? 'Update Announcement' : 'Create Announcement'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {loading ? (
          <div className="p-6 text-center">Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div className="p-6 text-center">No announcements yet</div>
        ) : (
          announcements.map(a => (
            <Card key={a.id} className="glass-card">
              <CardContent className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">{a.title}</h3>
                    <Badge className="text-xs">{a.priority}</Badge>
                    <Badge className="text-xs">{a.announcement_type}</Badge>
                  </div>
                  <div className="text-sm text-white/70 mb-1">
                    {a.content.slice(0, 120)}{a.content.length > 120 ? '...' : ''}
                  </div>
                  <div className="text-xs text-white/60">
                    {a.created_at ? format(new Date(a.created_at), 'MMM d, yyyy h:mm a') : '—'}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleEdit(a)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(a.id)}>Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
