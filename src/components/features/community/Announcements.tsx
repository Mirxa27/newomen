import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import { Separator } from '@/components/shared/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/shared/ui/avatar';
import { 
  Bell, 
  Clock, 
  Gift, 
  Target, 
  AlertCircle,
  Award,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { useCommunityAnnouncements } from '@/hooks/features/community/useCommunityAnnouncements';
import { format } from 'date-fns';
import { useToast } from '@/hooks/shared/ui/use-toast';

interface AnnouncementsProps {
  className?: string;
  showHeader?: boolean;
  maxItems?: number;
}

export function Announcements({ className, showHeader = true, maxItems }: AnnouncementsProps) {
  const { announcements, challenges, loading, error, unreadCount, markAsRead } = useCommunityAnnouncements();
  const [expandedAnnouncement, setExpandedAnnouncement] = useState<string | null>(null);
  const { toast } = useToast();

  // Priority badge styles
  const priorityStyles = {
    low: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    normal: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    high: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    urgent: 'bg-red-500/20 text-red-300 border-red-500/30 animate-pulse'
  };

  // Type badge styles
  const typeStyles = {
    general: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    challenge: 'bg-green-500/20 text-green-300 border-green-500/30',
    assessment: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    quiz: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    maintenance: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    feature: 'bg-pink-500/20 text-pink-300 border-pink-500/30'
  };

  const handleAnnouncementClick = (announcementId: string) => {
    setExpandedAnnouncement(expandedAnnouncement === announcementId ? null : announcementId);
    
    // Mark as read immediately for better UX
    if (expandedAnnouncement !== announcementId) {
      markAsRead(announcementId);
    }
  };

  const handleParticipateInChallenge = async (challengeId: string) => {
    try {
      // This would be implemented in the Edge Function
      toast({
        title: 'Challenge Participation',
        description: 'Redirecting to challenge page...',
      });
    } catch (err) {
      console.error('Error participating in challenge:', err);
      toast({
        title: 'Error',
        description: 'Could not participate in challenge',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card className={`glass-card border-white/10 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="animate-pulse">
              <Bell className="w-5 h-5 text-purple-400" />
            </div>
            <div className="animate-pulse">
              <div className="h-2 bg-purple-400/30 rounded w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`glass-card border-white/10 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (announcements.length === 0 && challenges.length === 0) {
    return (
      <Card className={`glass-card border-white/10 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-white/60">
            <Bell className="w-5 h-5" />
            <span className="text-sm">No announcements at this time</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayAnnouncements = maxItems ? announcements.slice(0, maxItems) : announcements;

  return (
    <div className={`space-y-4 ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-400" />
            Community Announcements
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2 animate-pulse">
                {unreadCount} new
              </Badge>
            )}
          </h3>
        </div>
      )}

      {/* Regular Announcements */}
      {displayAnnouncements.map((announcement) => (
        <Card 
          key={announcement.id} 
          className={`glass-card border-white/10 overflow-hidden transition-all duration-300 ${
            announcement.priority === 'urgent' ? 'border-red-500/30 animate-pulse' : ''
          }`}
        >
          <CardHeader className={`pb-0 ${announcement.priority === 'urgent' ? 'bg-red-500/10' : ''}`}>
            <div className="flex items-start gap-3">
              {/* Priority Indicator */}
              <div className={`mt-1 ${announcement.priority === 'urgent' ? 'animate-pulse' : ''}`}>
                <div 
                  className={`w-2 h-6 rounded-full ${
                    announcement.priority === 'urgent' 
                      ? 'bg-red-400 shadow-lg shadow-red-500/30' 
                      : announcement.priority === 'high'
                      ? 'bg-orange-400'
                      : announcement.priority === 'normal'
                      ? 'bg-blue-400'
                      : 'bg-gray-400'
                  }`}
                />
              </div>

              <div className="flex-1 space-y-3">
                {/* Title and Meta */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-xs ${typeStyles[announcement.announcement_type]}`}>
                      {announcement.announcement_type}
                    </Badge>
                    <Badge className={`text-xs ${priorityStyles[announcement.priority]}`}>
                      {announcement.priority}
                    </Badge>
                    {announcement.target_audience !== 'all' && (
                      <Badge variant="outline" className="text-xs">
                        <Target className="w-3 h-3 mr-1" />
                        {announcement.target_audience}
                      </Badge>
                    )}
                  </div>
                  
                  <CardTitle className="text-base text-white leading-tight">
                    {announcement.title}
                  </CardTitle>
                </div>

                {/* Author Info */}
                {announcement.author_info && (
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={announcement.author_info.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {(() => {
                          const nick = announcement.author_info?.nickname ?? '';
                          return nick ? String(nick).charAt(0).toUpperCase() : '?';
                        })()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{announcement.author_info?.nickname ?? 'Unknown'}</span>
                    <span>•</span>
                    <Clock className="w-3 h-3" />
                    <span>{format(new Date(announcement.created_at), 'MMM d, h:mm a')}</span>
                  </div>
                )}
              </div>

              {/* Expand/Collapse */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleAnnouncementClick(announcement.id)}
                className="text-white/60 hover:text-white transition-colors"
              >
                {expandedAnnouncement === announcement.id ? (
                  <div className="i-lucide-minus text-sm" />
                ) : (
                  <div className="i-lucide-plus text-sm" />
                )}
              </Button>
            </div>
          </CardHeader>

          {/* Content - Expandable */}
          {expandedAnnouncement === announcement.id && (
            <>
              <Separator className="bg-white/10 my-4" />
              <CardContent className="pt-0">
                <div 
                  className="prose prose-invert prose-sm max-w-none text-white/90 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: announcement.content }}
                />
                
                {/* Expiration Info */}
                {announcement.expires_at && (
                  <div className="flex items-center gap-2 mt-4 text-xs text-white/60">
                    <Calendar className="w-3 h-3" />
                    <span>Expires {format(new Date(announcement.expires_at), 'MMM d, yyyy')}</span>
                  </div>
                )}
                
                {announcement.scheduled_at && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-white/60">
                    <Calendar className="w-3 h-3" />
                    <span>Scheduled for {format(new Date(announcement.scheduled_at), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                )}
              </CardContent>
            </>
          )}
        </Card>
      ))}

      {/* Challenge Announcements */}
      {challenges.map((challenge) => (
        <Card key={challenge.id} className="glass-card border-white/10 overflow-hidden">
          <CardHeader>
            <div className="flex items-start gap-3">
              {/* Challenge Icon */}
              <div className="mt-1">
                <Award className="w-6 h-6 text-green-400" />
              </div>

              <div className="flex-1 space-y-3">
                {/* Title and Meta */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-green-500/20 text-green-300 text-xs">
                      <Gift className="w-3 h-3 mr-1" />
                      Challenge
                    </Badge>
                    <Badge className="bg-purple-500/20 text-purple-300 text-xs">
                      {challenge.challenge_type}
                    </Badge>
                    {challenge.reward_crystals > 0 && (
                      <Badge variant="outline" className="text-xs bg-yellow-500/10 border-yellow-500/30">
                        <Gift className="w-3 h-3 mr-1" />
                        {challenge.reward_crystals} crystals
                      </Badge>
                    )}
                  </div>
                  
                  <CardTitle className="text-base text-white leading-tight">
                    {challenge.title}
                  </CardTitle>
                </div>

                <div className="text-sm text-white/80 space-y-1">
                  {challenge.description && (
                    <p>{challenge.description}</p>
                  )}
                  {challenge.instructions && (
                    <p className="italic">{challenge.instructions}</p>
                  )}
                </div>

                {/* Challenge Dates */}
                <div className="flex items-center gap-4 text-xs text-white/60">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Starts {format(new Date(challenge.start_date), 'MMM d, yyyy')}</span>
                  </div>
                  {challenge.end_date && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Ends {format(new Date(challenge.end_date), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Participate Button */}
              <Button
                size="sm"
                onClick={() => handleParticipateInChallenge(challenge.id)}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white whitespace-nowrap"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Participate
              </Button>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
