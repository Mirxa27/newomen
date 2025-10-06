import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BalanceWheel from '@/components/onboarding/BalanceWheel';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Languages, TestTube, Target, ClipboardList } from 'lucide-react';

const steps = [
  { id: 1, title: 'Language & Culture', icon: Languages },
  { id: 2, title: 'Personality Test', icon: TestTube },
  { id: 3, title: 'Balance Wheel', icon: Target },
  { id: 4, title: 'Diagnostic Assessment', icon: ClipboardList },
];

const LanguageCultureStep = () => (
  <div className="text-center">
    <h3 className="text-2xl font-bold mb-2">Language & Culture</h3>
    <p className="text-muted-foreground">Select your preferred language and cultural context to personalize your experience.</p>
    <div className="mt-6 p-8 bg-white/5 rounded-lg">
      <p className="text-lg">Content for this step will be provided soon.</p>
    </div>
  </div>
);

const PersonalityTestStep = () => (
  <div className="text-center">
    <h3 className="text-2xl font-bold mb-2">Personality Test</h3>
    <p className="text-muted-foreground">Discover your unique personality traits.</p>
    <div className="mt-6 p-8 bg-white/5 rounded-lg">
      <p className="text-lg">The personality test component will be integrated here.</p>
    </div>
  </div>
);

const BalanceWheelStep = () => (
  <div className="flex flex-col items-center text-center">
    <h3 className="text-2xl font-bold mb-2">Balance Wheel</h3>
    <p className="text-muted-foreground mb-6">Select your current life-focus areas to help us understand your priorities.</p>
    <BalanceWheel />
  </div>
);

const DiagnosticAssessmentStep = () => (
  <div className="text-center">
    <h3 className="text-2xl font-bold mb-2">Diagnostic Assessment</h3>
    <p className="text-muted-foreground">This initial assessment helps us tailor your growth plan.</p>
    <div className="mt-6 p-8 bg-white/5 rounded-lg">
      <p className="text-lg">The diagnostic assessment will be available here shortly.</p>
    </div>
  </div>
);

const OnboardingPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/dashboard');
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <LanguageCultureStep />;
      case 2:
        return <PersonalityTestStep />;
      case 3:
        return <BalanceWheelStep />;
      case 4:
        return <DiagnosticAssessmentStep />;
      default:
        return null;
    }
  };

  const currentStepData = steps[currentStep - 1];
  const Icon = currentStepData.icon;

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-3xl glass-card">
        <CardHeader>
          <div className="text-center space-y-2 mb-8">
            <div className="inline-flex items-center gap-3">
              <Icon className="w-8 h-8 text-accent" />
              <CardTitle className="text-3xl gradient-text">{currentStepData.title}</CardTitle>
            </div>
            <CardDescription>Step {currentStep} of {steps.length}</CardDescription>
          </div>
          <Progress value={(currentStep / steps.length) * 100} className="w-full" />
        </CardHeader>
        <CardContent>
          <div className="min-h-[300px] flex items-center justify-center p-6">
            {renderStep()}
          </div>
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={handlePrev} disabled={currentStep === 1} className="glass">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button onClick={handleNext} className="clay-button">
              {currentStep === steps.length ? 'Finish & Go to Dashboard' : 'Next'}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingPage;