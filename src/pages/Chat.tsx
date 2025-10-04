import { Button } from "@/components/ui/button";
import { ArrowLeft, Mic, Type } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Chat = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass-card m-6 flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/dashboard")}
          className="hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <div className="text-center flex-1">
          <h1 className="text-2xl font-bold gradient-text">NewMe AI</h1>
          <p className="text-sm text-muted-foreground">Your compassionate companion</p>
        </div>
        <div className="w-24" /> {/* Spacer for centering */}
      </header>

      {/* Chat Area */}
      <div className="flex-1 px-6 pb-6 flex flex-col gap-6 overflow-y-auto">
        <div className="glass-card p-8 text-center space-y-4">
          <div className="w-24 h-24 mx-auto rounded-full glass flex items-center justify-center animate-pulse-glow">
            <Mic className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-3xl font-bold">Ready to Connect</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Start a voice conversation with NewMe, your AI companion who's here to support your growth journey.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="glass-card m-6 p-6 space-y-4">
        <div className="flex gap-4 justify-center">
          <Button 
            size="lg" 
            className="clay-button bg-gradient-to-r from-primary to-accent px-12 py-6"
          >
            <Mic className="w-6 h-6 mr-2" />
            Start Voice Chat
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="glass-card px-6"
          >
            <Type className="w-6 h-6" />
          </Button>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Click to start a voice conversation or switch to text mode
        </p>
      </div>
    </div>
  );
};

export default Chat;