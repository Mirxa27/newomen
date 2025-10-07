import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-lg">
            <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            Talk with NewMe
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto">
            Your empathetic AI companion for personal growth and transformation
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg sm:text-xl flex items-center gap-2">
              <span className="text-2xl">✨</span>
              What to expect:
            </h3>
            <div className="grid gap-3 sm:gap-4">
              {[
                { icon: '🎙️', text: 'Real-time voice conversation' },
                { icon: '💚', text: 'Empathetic and supportive guidance' },
                { icon: '🔄', text: 'Switch between voice and text anytime' },
                { icon: '🔒', text: 'Private and secure conversations' },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="text-2xl flex-shrink-0">{item.icon}</span>
                  <span className="text-sm sm:text-base text-muted-foreground pt-1">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={startConversation}
            disabled={isConnecting}
            className="w-full h-14 sm:h-16 text-base sm:text-lg font-semibold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
            size="lg"
          >
            {isConnecting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </>
            ) : (
              <>
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                Start Conversation
              </>
            )}
          </Button>
        </div>

        <p className="text-center text-xs sm:text-sm text-muted-foreground">
          By starting, you agree to our terms and privacy policy
        </p>
      </div>
    </div>
  );
};