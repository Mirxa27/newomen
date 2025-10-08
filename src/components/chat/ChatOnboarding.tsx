import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Mic, Bot, Heart, Shield, MessageSquare } from "lucide-react";
import { Loader2 } from "lucide-react";

interface ChatOnboardingProps {
  startConversation: () => void;
  isConnecting: boolean;
}

export const ChatOnboarding = ({ startConversation, isConnecting }: ChatOnboardingProps) => {
  const navigate = useNavigate();

  return (
    <div className="app-page-shell min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-4 gap-2 hover:gap-3 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm sm:text-base">Back to Dashboard</span>
        </Button>

        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-lg clay">
            <Bot className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text">
            Talk with NewMe
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto">
            Your empathetic AI companion for personal growth and transformation
          </p>
        </div>

        <Card className="glass-card p-6 sm:p-8 space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg sm:text-xl flex items-center gap-2">
              <span className="text-2xl">✨</span>
              What to expect:
            </h3>
            <div className="grid gap-3 sm:gap-4">
              {[
                { icon: Mic, text: 'Real-time voice conversation' },
                { icon: Heart, text: 'Empathetic and supportive guidance' },
                { icon: MessageSquare, text: 'Switch between voice and text anytime' },
                { icon: Shield, text: 'Private and secure conversations' },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 sm:p-4 rounded-lg glass hover:bg-white/10 transition-colors"
                >
                  <item.icon className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <span className="text-sm sm:text-base text-muted-foreground pt-1">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={startConversation}
            disabled={isConnecting}
            className="w-full h-14 sm:h-16 text-base sm:text-lg font-semibold clay-button bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
            size="lg"
          >
            {isConnecting ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                Connecting...
              </>
            ) : (
              <>
                <Mic className="w-6 h-6 mr-2" />
                Start Conversation
              </>
            )}
          </Button>
        </Card>

        <p className="text-center text-xs sm:text-sm text-muted-foreground">
          By starting, you agree to our terms and privacy policy
        </p>
      </div>
    </div>
  );
};