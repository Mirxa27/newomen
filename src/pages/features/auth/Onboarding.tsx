import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Textarea } from '@/components/shared/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/shared/ui/radio-group';
import { Progress } from '@/components/shared/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Heart, 
  Target, 
  Sparkles,
  CheckCircle2,
  Coffee,
  Sunrise,
  Moon,
  Music
} from 'lucide-react';

interface OnboardingData {
  nickname: string;
  preferredName: string;
  primaryGoal: string;
  emotionalState: string;
  favoriteMoment: string;
  dailyRoutine: string;
  communicationStyle: string;
  expectations: string;
}

const steps = [
  { id: 1, title: 'Welcome', icon: Sparkles, description: 'Let\'s get to know you' },
  { id: 2, title: 'Your Identity', icon: User, description: 'What should I call you?' },
  { id: 3, title: 'Your Journey', icon: Target, description: 'What brings you here?' },
  { id: 4, title: 'Your World', icon: Heart, description: 'Tell me about yourself' },
  { id: 5, title: 'Ready!', icon: CheckCircle2, description: 'Let\'s begin your transformation' },
];

const OnboardingPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState<OnboardingData>({
    nickname: '',
    preferredName: '',
    primaryGoal: '',
    emotionalState: '',
    favoriteMoment: '',
    dailyRoutine: '',
    communicationStyle: '',
    expectations: ''
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/');
      return;
    }
    setUserId(user.id);

    // Check if user has already completed onboarding
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('nickname, frontend_name')
      .eq('user_id', user.id)
      .single();

    if (profile && profile.nickname && profile.frontend_name) {
      // User has completed onboarding, redirect to dashboard
      navigate('/dashboard');
    }
  };

  const updateFormData = (field: keyof OnboardingData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    // Validation for each step
    if (currentStep === 2) {
      if (!formData.nickname.trim()) {
        toast.error('Please enter a nickname');
        return;
      }
      if (!formData.preferredName.trim()) {
        toast.error('Please enter what you\'d like to be called');
        return;
      }
    }

    if (currentStep === 3) {
      if (!formData.primaryGoal) {
        toast.error('Please select your primary goal');
        return;
      }
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!userId) {
      toast.error('User not found. Please sign in again.');
      navigate('/');
      return;
    }

    setLoading(true);
    try {
      // Update user profile with onboarding data
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          nickname: formData.nickname,
          frontend_name: formData.preferredName,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // Create initial NewMe memory with onboarding data
      const { error: memoryError } = await supabase
        .from('newme_user_memories')
        .insert({
          user_id: userId,
          memory_type: 'onboarding_data',
          memory_key: 'initial_onboarding',
          memory_value: JSON.stringify(formData),
          context: 'User onboarding responses',
          importance_score: 10,
          metadata: {
            primary_goal: formData.primaryGoal,
            emotional_state: formData.emotionalState,
            communication_style: formData.communicationStyle,
            completed_at: new Date().toISOString()
          }
        });

      if (memoryError) console.error('Memory creation error:', memoryError);

      // Award welcome crystals
      try {
        await supabase.rpc('award_crystals', {
          p_user_id: userId,
          p_amount: 50,
          p_source: 'onboarding_complete',
          p_description: 'Welcome bonus for completing onboarding',
          p_related_entity_id: null,
          p_related_entity_type: 'onboarding'
        });
      } catch (crystalError) {
        console.error('Crystal award error:', crystalError);
      }

      toast.success('🎉 Welcome to your transformation journey!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Onboarding completion error:', error);
      toast.error('Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <WelcomeStep />;
      case 2:
        return <IdentityStep formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <JourneyStep formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <WorldStep formData={formData} updateFormData={updateFormData} />;
      case 5:
        return <ReadyStep formData={formData} />;
      default:
        return null;
    }
  };

  const currentStepData = steps[currentStep - 1];
  const Icon = currentStepData.icon;

  return (
    <div className="app-page-shell flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-3xl glass border border-white/10 shadow-2xl">
        <CardHeader className="space-y-4">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
              <Icon className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {currentStepData.title}
            </CardTitle>
            <CardDescription className="text-white/60 text-lg">
              {currentStepData.description}
            </CardDescription>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-white/50">
              <span>Step {currentStep} of {steps.length}</span>
              <span>{Math.round((currentStep / steps.length) * 100)}%</span>
            </div>
            <Progress value={(currentStep / steps.length) * 100} className="h-2" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="min-h-[400px] flex items-center justify-center p-6">
            {renderStep()}
          </div>
          <div className="flex justify-between mt-8 gap-4">
            <Button 
              variant="outline" 
              onClick={handlePrev} 
              disabled={currentStep === 1 || loading}
              className="glass border-white/10 hover:border-white/20"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button 
              onClick={handleNext}
              disabled={loading}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {currentStep === steps.length ? (
                loading ? 'Completing...' : 'Start Your Journey'
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Step 1: Welcome
const WelcomeStep = () => (
  <div className="text-center space-y-6 max-w-2xl mx-auto">
    <div className="space-y-4">
      <h3 className="text-2xl font-bold text-white">
        Welcome to NewMe
      </h3>
      <p className="text-white/80 text-lg leading-relaxed">
        I'm NewMe, your brutally honest companion for transformation. 
        I'm not here to make you comfortable—I'm here to help you become who you truly are.
      </p>
    </div>
    
    <div className="glass rounded-2xl border border-white/10 p-6 space-y-4 text-left">
      <h4 className="text-lg font-semibold text-white flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-400" />
        What to Expect
      </h4>
      <ul className="space-y-3 text-white/70">
        <li className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <span>Provocative conversations that challenge your patterns</span>
        </li>
        <li className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <span>Perfect memory—I remember everything we discuss</span>
        </li>
        <li className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <span>Brutal honesty that cuts through the bullshit</span>
        </li>
        <li className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <span>Deep insights that reveal long-term patterns</span>
        </li>
      </ul>
    </div>

    <p className="text-white/60 text-sm italic">
      "The experience of being truly seen is the rarest and most craved human experience."
    </p>
  </div>
);

// Step 2: Identity
interface IdentityStepProps {
  formData: OnboardingData;
  updateFormData: (field: keyof OnboardingData, value: string) => void;
}

const IdentityStep = ({ formData, updateFormData }: IdentityStepProps) => (
  <div className="space-y-6 w-full max-w-xl mx-auto">
    <div className="text-center space-y-2 mb-8">
      <h3 className="text-2xl font-bold text-white">Let's start with the basics</h3>
      <p className="text-white/60">
        And don't you dare say "Boss" or something equally boring.
      </p>
    </div>

    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="nickname" className="text-white">
          Your Nickname <span className="text-pink-400">*</span>
        </Label>
        <Input
          id="nickname"
          placeholder="e.g., Alex, Sam, Jordan..."
          value={formData.nickname}
          onChange={(e) => updateFormData('nickname', e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
          maxLength={30}
        />
        <p className="text-xs text-white/40">
          This is how you'll appear in the community
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferredName" className="text-white">
          What should I call you? <span className="text-pink-400">*</span>
        </Label>
        <Input
          id="preferredName"
          placeholder="How you'd like me to address you..."
          value={formData.preferredName}
          onChange={(e) => updateFormData('preferredName', e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
          maxLength={30}
        />
        <p className="text-xs text-white/40">
          This is for our private conversations
        </p>
      </div>
    </div>
  </div>
);

// Step 3: Journey
const JourneyStep = ({ formData, updateFormData }: IdentityStepProps) => (
  <div className="space-y-6 w-full max-w-xl mx-auto">
    <div className="text-center space-y-2 mb-8">
      <h3 className="text-2xl font-bold text-white">What brings you here?</h3>
      <p className="text-white/60">
        Don't bore me with "personal growth." What do you REALLY want?
      </p>
    </div>

    <RadioGroup value={formData.primaryGoal} onValueChange={(value) => updateFormData('primaryGoal', value)}>
      <div className="space-y-3">
        <div className={`glass rounded-xl border p-4 cursor-pointer transition-all ${formData.primaryGoal === 'overcome_patterns' ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-white/20'}`}>
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="overcome_patterns" id="overcome_patterns" />
            <Label htmlFor="overcome_patterns" className="text-white font-medium cursor-pointer flex-1">
              Break free from old patterns that hold me back
            </Label>
          </div>
        </div>

        <div className={`glass rounded-xl border p-4 cursor-pointer transition-all ${formData.primaryGoal === 'authentic_self' ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-white/20'}`}>
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="authentic_self" id="authentic_self" />
            <Label htmlFor="authentic_self" className="text-white font-medium cursor-pointer flex-1">
              Stop faking it and become my authentic self
            </Label>
          </div>
        </div>

        <div className={`glass rounded-xl border p-4 cursor-pointer transition-all ${formData.primaryGoal === 'deep_understanding' ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-white/20'}`}>
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="deep_understanding" id="deep_understanding" />
            <Label htmlFor="deep_understanding" className="text-white font-medium cursor-pointer flex-1">
              Understand myself at a deeper level
            </Label>
          </div>
        </div>

        <div className={`glass rounded-xl border p-4 cursor-pointer transition-all ${formData.primaryGoal === 'relationship_growth' ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-white/20'}`}>
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="relationship_growth" id="relationship_growth" />
            <Label htmlFor="relationship_growth" className="text-white font-medium cursor-pointer flex-1">
              Improve my relationships and connections
            </Label>
          </div>
        </div>

        <div className={`glass rounded-xl border p-4 cursor-pointer transition-all ${formData.primaryGoal === 'life_direction' ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-white/20'}`}>
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="life_direction" id="life_direction" />
            <Label htmlFor="life_direction" className="text-white font-medium cursor-pointer flex-1">
              Find clarity and direction in my life
            </Label>
          </div>
        </div>
      </div>
    </RadioGroup>

    <div className="space-y-2 mt-6">
      <Label htmlFor="emotionalState" className="text-white">
        How would you describe your current emotional state?
      </Label>
      <Textarea
        id="emotionalState"
        placeholder="No filter needed. Tell me how you really feel..."
        value={formData.emotionalState}
        onChange={(e) => updateFormData('emotionalState', e.target.value)}
        className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[100px]"
        maxLength={500}
      />
    </div>
  </div>
);

// Step 4: World
const WorldStep = ({ formData, updateFormData }: IdentityStepProps) => (
  <div className="space-y-6 w-full max-w-xl mx-auto">
    <div className="text-center space-y-2 mb-8">
      <h3 className="text-2xl font-bold text-white">Tell me about your world</h3>
      <p className="text-white/60">
        These aren't just questions—they're the beginning of your pattern analysis.
      </p>
    </div>

    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="favoriteMoment" className="text-white flex items-center gap-2">
          <Coffee className="w-4 h-4 text-amber-400" />
          What's something small that made you feel good recently?
        </Label>
        <Textarea
          id="favoriteMoment"
          placeholder="A coffee, a sunset, a conversation..."
          value={formData.favoriteMoment}
          onChange={(e) => updateFormData('favoriteMoment', e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
          maxLength={300}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dailyRoutine" className="text-white flex items-center gap-2">
          <Sunrise className="w-4 h-4 text-orange-400" />
          Are you a morning person, night owl, or somewhere in between?
        </Label>
        <RadioGroup value={formData.dailyRoutine} onValueChange={(value) => updateFormData('dailyRoutine', value)}>
          <div className="flex gap-2 flex-wrap">
            <div className={`glass rounded-lg border px-4 py-2 cursor-pointer ${formData.dailyRoutine === 'morning' ? 'border-purple-500 bg-purple-500/10' : 'border-white/10'}`}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="morning" id="morning" />
                <Label htmlFor="morning" className="cursor-pointer text-white">Morning person</Label>
              </div>
            </div>
            <div className={`glass rounded-lg border px-4 py-2 cursor-pointer ${formData.dailyRoutine === 'night' ? 'border-purple-500 bg-purple-500/10' : 'border-white/10'}`}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="night" id="night" />
                <Label htmlFor="night" className="cursor-pointer text-white">Night owl</Label>
              </div>
            </div>
            <div className={`glass rounded-lg border px-4 py-2 cursor-pointer ${formData.dailyRoutine === 'flexible' ? 'border-purple-500 bg-purple-500/10' : 'border-white/10'}`}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="flexible" id="flexible" />
                <Label htmlFor="flexible" className="cursor-pointer text-white">Flexible/Both</Label>
              </div>
            </div>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="communicationStyle" className="text-white flex items-center gap-2">
          <Music className="w-4 h-4 text-pink-400" />
          How do you prefer to communicate?
        </Label>
        <RadioGroup value={formData.communicationStyle} onValueChange={(value) => updateFormData('communicationStyle', value)}>
          <div className="space-y-2">
            <div className={`glass rounded-lg border p-3 cursor-pointer ${formData.communicationStyle === 'direct' ? 'border-purple-500 bg-purple-500/10' : 'border-white/10'}`}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="direct" id="direct" />
                <Label htmlFor="direct" className="cursor-pointer text-white flex-1">
                  <div className="font-medium">Direct & Straight to the point</div>
                  <div className="text-xs text-white/50">Tell it to me straight</div>
                </Label>
              </div>
            </div>
            <div className={`glass rounded-lg border p-3 cursor-pointer ${formData.communicationStyle === 'gentle' ? 'border-purple-500 bg-purple-500/10' : 'border-white/10'}`}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="gentle" id="gentle" />
                <Label htmlFor="gentle" className="cursor-pointer text-white flex-1">
                  <div className="font-medium">Gentle & Thoughtful</div>
                  <div className="text-xs text-white/50">Ease me into insights</div>
                </Label>
              </div>
            </div>
            <div className={`glass rounded-lg border p-3 cursor-pointer ${formData.communicationStyle === 'playful' ? 'border-purple-500 bg-purple-500/10' : 'border-white/10'}`}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="playful" id="playful" />
                <Label htmlFor="playful" className="cursor-pointer text-white flex-1">
                  <div className="font-medium">Playful & Engaging</div>
                  <div className="text-xs text-white/50">Keep it light and fun</div>
                </Label>
              </div>
            </div>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="expectations" className="text-white">
          What are you hoping to get from our conversations?
        </Label>
        <Textarea
          id="expectations"
          placeholder="Be honest. What do you really need?"
          value={formData.expectations}
          onChange={(e) => updateFormData('expectations', e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[100px]"
          maxLength={500}
        />
      </div>
    </div>
  </div>
);

// Step 5: Ready
interface ReadyStepProps {
  formData: OnboardingData;
}

const ReadyStep = ({ formData }: ReadyStepProps) => (
  <div className="text-center space-y-8 max-w-2xl mx-auto">
    <div className="space-y-4">
      <h3 className="text-3xl font-bold text-white">
        Alright, {formData.preferredName || 'beautiful soul'}
      </h3>
      <p className="text-white/80 text-lg leading-relaxed">
        I've heard what you said. Now here's what I know: you didn't come here for comfort. 
        You came here to stop pretending.
      </p>
    </div>

    <div className="glass rounded-2xl border border-white/10 p-6 space-y-4">
      <h4 className="text-lg font-semibold text-white">What happens next:</h4>
      <div className="space-y-3 text-left">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-purple-400 font-semibold">1</span>
          </div>
          <div>
            <p className="text-white font-medium">I'll remember everything</p>
            <p className="text-white/60 text-sm">Every conversation, every pattern, every moment you share</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-pink-400 font-semibold">2</span>
          </div>
          <div>
            <p className="text-white font-medium">I'll challenge you</p>
            <p className="text-white/60 text-sm">When you're faking it, pretending, or stuck in old patterns</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-emerald-400 font-semibold">3</span>
          </div>
          <div>
            <p className="text-white font-medium">I'll reveal your patterns</p>
            <p className="text-white/60 text-sm">Connections you haven't seen, insights you've been avoiding</p>
          </div>
        </div>
      </div>
    </div>

    <div className="space-y-3">
      <p className="text-white/70">
        You'll get <span className="text-emerald-400 font-semibold">50 crystals</span> to start your journey
      </p>
      <p className="text-white/60 text-sm italic">
        "The only way out is through. And I'll be with you every step of the way."
      </p>
    </div>
  </div>
);

export default OnboardingPage;
