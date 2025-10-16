import React, { useState, useEffect } from 'react';
import { Clock, Users, CheckCircle, ArrowRight, ArrowLeft, RotateCcw } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Progress } from '@/components/shared/ui/progress';
import { Badge } from '@/components/shared/ui/badge';
import { Textarea } from '@/components/shared/ui/textarea';
import { enhancedConflictResolutionService, type ConflictExercise } from '@/services/features/ai/EnhancedConflictResolutionService';

interface ConflictResolutionExerciseProps {
  exercise: ConflictExercise;
  challengeId: string;
  onComplete: (exerciseId: string, effectivenessScore: number) => void;
  onClose: () => void;
}

export default function ConflictResolutionExercise({
  exercise,
  challengeId,
  onComplete,
  onClose
}: ConflictResolutionExerciseProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [userResponse, setUserResponse] = useState('');
  const [partnerResponse, setPartnerResponse] = useState('');
  const [effectivenessScore, setEffectivenessScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(exercise.exerciseData.timeRequired * 60);

  const totalSteps = exercise.exerciseData.instructions.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  useEffect(() => {
    if (timeRemaining > 0 && !isCompleted) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining, isCompleted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleCompleteExercise = async () => {
    try {
      await enhancedConflictResolutionService.completeConflictExercise(
        exercise.id,
        userResponse,
        partnerResponse,
        effectivenessScore
      );
      
      setIsCompleted(true);
      onComplete(exercise.id, effectivenessScore);
    } catch (error) {
      console.error('Error completing exercise:', error);
    }
  };

  const handleSkipExercise = () => {
    onClose();
  };

  const getExerciseIcon = (exerciseType: string) => {
    switch (exerciseType) {
      case 'active_listening':
        return <Users className="w-6 h-6 text-blue-500" />;
      case 'i_feel_statements':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'perspective_taking':
        return <RotateCcw className="w-6 h-6 text-purple-500" />;
      case 'de_escalation':
        return <Clock className="w-6 h-6 text-orange-500" />;
      case 'repair_attempt':
        return <ArrowRight className="w-6 h-6 text-pink-500" />;
      default:
        return <Users className="w-6 h-6 text-gray-500" />;
    }
  };

  if (isCompleted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <CardTitle className="text-xl text-green-700">
              Exercise Completed!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Great job completing the {exercise.exerciseData.title}!
            </p>
            <p className="text-sm text-muted-foreground">
              Expected outcome: {exercise.exerciseData.expectedOutcome}
            </p>
            <Button onClick={onClose} className="w-full">
              Continue Challenge
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getExerciseIcon(exercise.exerciseType)}
              <div>
                <CardTitle className="text-lg">
                  {exercise.exerciseData.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {exercise.exerciseData.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(timeRemaining)}
              </Badge>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            </div>
          </div>
          <Progress value={progress} className="mt-2" />
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Current Step Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">
              Step {currentStep + 1} of {totalSteps}
            </h3>
            <p className="text-blue-800">
              {exercise.exerciseData.instructions[currentStep]}
            </p>
          </div>

          {/* Response Areas */}
          {currentStep >= totalSteps - 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Your Response:
                </label>
                <Textarea
                  value={userResponse}
                  onChange={(e) => setUserResponse(e.target.value)}
                  placeholder="Share your thoughts and feelings..."
                  className="min-h-[100px]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Partner's Response:
                </label>
                <Textarea
                  value={partnerResponse}
                  onChange={(e) => setPartnerResponse(e.target.value)}
                  placeholder="Your partner's response..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}

          {/* Effectiveness Rating */}
          {currentStep === totalSteps - 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  How effective was this exercise? (1-5)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button
                      key={rating}
                      variant={effectivenessScore === rating ? "default" : "outline"}
                      size="sm"
                      onClick={() => setEffectivenessScore(rating)}
                      className="w-10 h-10"
                    >
                      {rating}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  1 = Not helpful, 5 = Very helpful
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePreviousStep}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleSkipExercise}>
                Skip Exercise
              </Button>
              
              {currentStep < totalSteps - 1 ? (
                <Button onClick={handleNextStep}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={handleCompleteExercise}
                  disabled={effectivenessScore === 0}
                >
                  Complete Exercise
                  <CheckCircle className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
