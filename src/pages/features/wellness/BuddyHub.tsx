'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Heart, Target, MessageCircle } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Card } from '@/components/shared/ui/card';
import { buddyService } from '@/services/features/wellness/BuddyService';
import { useAuth } from '@/hooks/features/auth/useAuth';
import { toast } from 'sonner';

type BuddyHubTab = 'find' | 'my-buddies' | 'requests' | 'challenges';

export default function BuddyHub() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<BuddyHubTab>('find');

  // Fetch buddy recommendations
  const { data: recommendations = [] } = useQuery({
    queryKey: ['buddy-recommendations', user?.id],
    queryFn: () => user?.id ? buddyService.getBuddyRecommendations(user.id) : Promise.resolve([]),
    enabled: !!user?.id
  });

  // Fetch user's buddy pairs
  const { data: buddyPairs = [] } = useQuery({
    queryKey: ['buddy-pairs', user?.id],
    queryFn: () => user?.id ? buddyService.getBuddyPairs(user.id) : Promise.resolve([]),
    enabled: !!user?.id
  });

  // Fetch pending requests
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['buddy-requests', user?.id],
    queryFn: () => user?.id ? buddyService.getPendingRequests(user.id) : Promise.resolve([]),
    enabled: !!user?.id
  });

  const handleSendRequest = async (toUserId: string) => {
    if (!user?.id) {
      toast.error('Please sign in first');
      return;
    }
    try {
      await buddyService.sendBuddyRequest(user.id, toUserId);
      toast.success('Buddy request sent!');
    } catch (error) {
      toast.error('Failed to send request');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    if (!user?.id) return;
    try {
      await buddyService.acceptBuddyRequest(requestId, user.id);
      toast.success('Buddy request accepted!');
    } catch (error) {
      toast.error('Failed to accept request');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Accountability Buddies</h1>
          <p className="text-gray-600 dark:text-gray-400">Find your perfect wellness buddy for mutual support and accountability</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'find', label: 'Find Buddies', icon: Users },
            { id: 'my-buddies', label: 'My Buddies', icon: Heart },
            { id: 'requests', label: 'Requests', icon: MessageCircle, count: pendingRequests.length },
            { id: 'challenges', label: 'Challenges', icon: Target }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as BuddyHubTab)}
              className={`px-4 py-2 font-medium flex items-center gap-2 border-b-2 transition-colors ${
                selectedTab === tab.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {React.createElement(tab.icon, { className: 'w-5 h-5' })}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Find Buddies Tab */}
        {selectedTab === 'find' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map(buddy => (
              <Card key={buddy.user_id} className="p-6 hover:shadow-lg transition-all">
                <div className="text-center mb-4">
                  {buddy.avatar_url && (
                    <img
                      src={buddy.avatar_url}
                      alt={buddy.first_name}
                      className="w-16 h-16 rounded-full mx-auto mb-3 object-cover"
                    />
                  )}
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    {buddy.first_name} {buddy.last_name}
                  </h3>
                </div>
                
                {buddy.goals && buddy.goals.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-semibold">Shared Goals:</p>
                    <div className="flex flex-wrap gap-2">
                      {buddy.goals.slice(0, 3).map(goal => (
                        <span key={goal} className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-200 text-xs px-2 py-1 rounded-full">
                          {goal}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => handleSendRequest(buddy.user_id)}
                  className="w-full"
                >
                  Send Buddy Request
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* My Buddies Tab */}
        {selectedTab === 'my-buddies' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buddyPairs.length > 0 ? (
              buddyPairs.map(pair => (
                <Card key={pair.id} className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Accountability Partner</h3>
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200 text-xs px-2 py-1 rounded-full">
                      Active
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold mb-1">Check-in Frequency:</p>
                      <p className="text-gray-900 dark:text-white capitalize">{pair.check_in_frequency}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Challenge
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-600 dark:text-gray-400 mb-4">No buddies yet</p>
                <Button onClick={() => setSelectedTab('find')}>Find Buddies</Button>
              </div>
            )}
          </div>
        )}

        {/* Requests Tab */}
        {selectedTab === 'requests' && (
          <div className="space-y-4">
            {pendingRequests.length > 0 ? (
              pendingRequests.map(request => (
                <Card key={request.id} className="p-6 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white mb-1">New Buddy Request</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{new Date(request.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAcceptRequest(request.id)}
                      size="sm"
                    >
                      Accept
                    </Button>
                    <Button variant="outline" size="sm">
                      Decline
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">No pending requests</p>
              </div>
            )}
          </div>
        )}

        {/* Challenges Tab */}
        {selectedTab === 'challenges' && (
          <div className="text-center py-12">
            <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Create or join challenges with your buddy</p>
          </div>
        )}
      </div>
    </div>
  );
}
