import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, CheckCircle, Clock, Users } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { enhancedConflictResolutionService, type RealTimeConflictAlert, type ConflictExercise } from '@/services/features/ai/EnhancedConflictResolutionService';

interface ConflictDetectionAlertProps {
  challengeId: string;
  onExerciseStart: (exercise: ConflictExercise) => void;
  onAlertDismiss: (alertId: string) => void;
}

export default function ConflictDetectionAlert({ 
  challengeId, 
  onExerciseStart, 
  onAlertDismiss 
}: ConflictDetectionAlertProps) {
  const [alerts, setAlerts] = useState<RealTimeConflictAlert[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Get initial alerts
    const initialAlerts = enhancedConflictResolutionService.getRealTimeAlerts();
    setAlerts(initialAlerts);

    // Set up real-time monitoring
    const checkForNewAlerts = () => {
      const newAlerts = enhancedConflictResolutionService.getRealTimeAlerts();
      if (newAlerts.length > alerts.length) {
        setAlerts(newAlerts);
        setIsVisible(true);
      }
    };

    const interval = setInterval(checkForNewAlerts, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [alerts.length]);

  const getSeverityColor = (severity: number) => {
    if (severity >= 4) return 'destructive';
    if (severity >= 3) return 'default';
    return 'secondary';
  };

  const getSeverityIcon = (severity: number) => {
    if (severity >= 4) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (severity >= 3) return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  };

  const handleStartExercise = (exercise: ConflictExercise) => {
    onExerciseStart(exercise);
    setIsVisible(false);
  };

  const handleDismissAlert = (alertIndex: number) => {
    const alert = alerts[alertIndex];
    onAlertDismiss(alert.timestamp);
    setAlerts(prev => prev.filter((_, index) => index !== alertIndex));
    if (alerts.length === 1) {
      setIsVisible(false);
    }
  };

  if (!isVisible || alerts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      {alerts.map((alert, index) => (
        <Card key={`${alert.timestamp}-${index}`} className="mb-2 border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getSeverityIcon(alert.severity)}
                <CardTitle className="text-sm">
                  Conflict Pattern Detected
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDismissAlert(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant={getSeverityColor(alert.severity)}>
                  {alert.patternType}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Severity: {alert.severity}/5
                </span>
              </div>
              
              <p className="text-sm text-muted-foreground">
                {alert.message}
              </p>
              
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Suggested Action:
                </p>
                <p className="text-sm text-blue-800">
                  {alert.suggestedAction}
                </p>
              </div>

              {alert.immediateExercise && (
                <div className="bg-green-50 p-3 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">
                      Immediate Exercise Available
                    </span>
                  </div>
                  <p className="text-sm text-green-800 mb-2">
                    {alert.immediateExercise.exerciseData.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-green-700">
                    <Clock className="w-3 h-3" />
                    <span>{alert.immediateExercise.exerciseData.timeRequired} minutes</span>
                  </div>
                  <Button
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => handleStartExercise(alert.immediateExercise!)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Start Exercise
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
