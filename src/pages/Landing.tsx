import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sparkles, Brain, Heart, Target, Users, Zap } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-20">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 glass px-6 py-3 rounded-full mb-6 animate-float">
            <Sparkles className="w-5 h-5 text-accent" />
            <span className="text-sm font-medium">AI-Powered Personal Growth</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold leading-tight">
            Transform Your Life with{" "}
            <span className="gradient-text">NewWomen</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            Your emotionally intelligent AI companion for personal growth, 
            meaningful connections, and lasting transformation
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link to="/auth">
              <Button 
                size="lg" 
                className="clay-button text-lg px-12 py-6 animate-pulse-glow bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                Start Your Journey
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="glass-card text-lg px-12 py-6 border-2 hover:bg-white/10"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-bold text-center mb-16">
            Why Choose <span className="gradient-text">NewWomen</span>
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="glass-card space-y-4 hover:scale-105 transition-all duration-300"
              >
                <div className="clay w-16 h-16 rounded-2xl flex items-center justify-center">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-bold text-center mb-4">
            Choose Your <span className="gradient-text">Growth Path</span>
          </h2>
          <p className="text-center text-muted-foreground text-xl mb-16">
            Start free and upgrade as you grow
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <div 
                key={index}
                className={`glass-card space-y-6 ${tier.featured ? 'ring-2 ring-primary glow-primary' : ''}`}
              >
                <div>
                  <h3 className="text-3xl font-bold mb-2">{tier.name}</h3>
                  <div className="text-4xl font-bold gradient-text mb-2">
                    {tier.price}
                  </div>
                  <p className="text-muted-foreground">{tier.description}</p>
                </div>
                
                <ul className="space-y-3">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Zap className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${tier.featured ? 'clay-button bg-gradient-to-r from-primary to-accent' : 'glass'}`}
                  size="lg"
                >
                  {tier.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center glass-card space-y-8">
          <h2 className="text-5xl font-bold">
            Ready to Begin Your <span className="gradient-text">Transformation</span>?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join thousands of people who are already on their journey to personal growth
          </p>
          <Link to="/auth">
            <Button 
              size="lg" 
              className="clay-button text-lg px-12 py-6 animate-pulse-glow bg-gradient-to-r from-primary to-accent"
            >
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

const features = [
  {
    icon: Brain,
    title: "AI Companion",
    description: "Real-time voice conversations with an emotionally intelligent AI that understands you"
  },
  {
    icon: Heart,
    title: "Persistent Memory",
    description: "Your AI remembers your journey, adapting support as you grow and evolve"
  },
  {
    icon: Target,
    title: "Personalized Growth",
    description: "Dynamic prompting that adjusts to your progress and subscription tier"
  },
  {
    icon: Users,
    title: "Community Connection",
    description: "Join a supportive community and try our unique Couple's Challenge"
  },
  {
    icon: Sparkles,
    title: "Gamification",
    description: "Earn crystals, unlock achievements, and level up as you make progress"
  },
  {
    icon: Zap,
    title: "Wellness Resources",
    description: "Access curated audio library for meditation, affirmations, and more"
  }
];

const pricingTiers = [
  {
    name: "Discovery",
    price: "Free",
    description: "Perfect to get started",
    features: [
      "10 free minutes with AI",
      "Basic personality test",
      "Daily affirmations",
      "Community access",
      "Limited assessments"
    ],
    cta: "Start Free",
    featured: false
  },
  {
    name: "Growth",
    price: "$22",
    description: "100 minutes of AI conversation",
    features: [
      "Everything in Discovery",
      "100 AI conversation minutes",
      "Full assessment library",
      "Wellness audio library",
      "Progress tracking",
      "Advanced analytics"
    ],
    cta: "Choose Growth",
    featured: true
  },
  {
    name: "Transformation",
    price: "$222",
    description: "1000 minutes + premium features",
    features: [
      "Everything in Growth",
      "1000 AI conversation minutes",
      "Priority support",
      "Advanced prompting",
      "Couple's Challenge",
      "Exclusive content"
    ],
    cta: "Transform Now",
    featured: false
  }
];

export default Landing;