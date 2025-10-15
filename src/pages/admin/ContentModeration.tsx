import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminPanelService } from '@/services/admin/AdminPanelService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import { Textarea } from '@/components/shared/ui/textarea';
import { AlertCircle, Check, X } from 'lucide-react';

export default function ContentModeration() {
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [notes, setNotes] = useState('');

  // Fetch moderation queue
  const { data: queue = [] } = useQuery({
    queryKey: ['moderation-queue-full'],
    queryFn: () => adminPanelService.getModerationQueue(),
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Approve content mutation
  const { mutate: approveContent } = useMutation({
    mutationFn: (itemId: string) =>
      adminPanelService.moderateContent(itemId, 'approved', notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-queue-full'] });
      setSelectedItem(null);
      setNotes('');
    },
  });

  // Reject content mutation
  const { mutate: rejectContent } = useMutation({
    mutationFn: (itemId: string) =>
      adminPanelService.moderateContent(itemId, 'rejected', notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-queue-full'] });
      setSelectedItem(null);
      setNotes('');
    },
  });

  // Flag content mutation
  const { mutate: flagContent } = useMutation({
    mutationFn: (itemId: string) =>
      adminPanelService.moderateContent(itemId, 'flagged', notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-queue-full'] });
      setSelectedItem(null);
      setNotes('');
    },
  });

  const pendingItems = queue.filter(item => item.status === 'pending');
  const approvedItems = queue.filter(item => item.status === 'approved');
  const rejectedItems = queue.filter(item => item.status === 'rejected');
  const flaggedItems = queue.filter(item => item.status === 'flagged');

  const renderItem = (item: any) => (
    <div
      key={item.id}
      onClick={() => setSelectedItem(item)}
      className={`p-4 border rounded-lg cursor-pointer transition ${
        selectedItem?.id === item.id ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-semibold text-sm capitalize">{item.content_type}</h4>
          <p className="text-xs text-gray-600 mt-1">{item.reason}</p>
          <p className="text-xs text-gray-500 mt-2">
            Reported: {new Date(item.created_at).toLocaleDateString()}
          </p>
        </div>
        <Badge variant="outline" className="capitalize">{item.status}</Badge>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      {/* Queue List */}
      <div className="lg:col-span-2">
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">
              Pending ({pendingItems.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({approvedItems.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({rejectedItems.length})
            </TabsTrigger>
            <TabsTrigger value="flagged">
              Flagged ({flaggedItems.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-2 mt-4">
            {pendingItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No pending items</p>
              </div>
            ) : (
              pendingItems.map(renderItem)
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-2 mt-4">
            {approvedItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No approved items</p>
              </div>
            ) : (
              approvedItems.map(renderItem)
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-2 mt-4">
            {rejectedItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No rejected items</p>
              </div>
            ) : (
              rejectedItems.map(renderItem)
            )}
          </TabsContent>

          <TabsContent value="flagged" className="space-y-2 mt-4">
            {flaggedItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No flagged items</p>
              </div>
            ) : (
              flaggedItems.map(renderItem)
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Review Panel */}
      <div>
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedItem ? 'Review Content' : 'Select Item'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedItem ? (
              <>
                {/* Item Details */}
                <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600">Type</p>
                    <p className="font-semibold capitalize text-sm">{selectedItem.content_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Reason Reported</p>
                    <p className="text-sm">{selectedItem.reason}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Status</p>
                    <Badge variant="outline" className="capitalize mt-1">
                      {selectedItem.status}
                    </Badge>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm font-semibold">Admin Notes</label>
                  <Textarea
                    placeholder="Add notes about this content..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-2 resize-none"
                    rows={4}
                  />
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Button
                    onClick={() => approveContent(selectedItem.id)}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => rejectContent(selectedItem.id)}
                    variant="destructive"
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => flagContent(selectedItem.id)}
                    variant="outline"
                    className="w-full"
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Flag for Review
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <AlertCircle className="w-8 h-8 mx-auto opacity-50 mb-2" />
                <p>Select an item from the queue to review</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
