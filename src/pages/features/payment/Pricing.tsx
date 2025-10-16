import { Button } from "@/components/shared/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Zap } from "lucide-react";

const PricingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <Button variant="ghost" onClick={() => navigate("/")} className="h-9 sm:h-10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="text-sm sm:text-base">Back</span>
          </Button>
        </div>

        {/* Header - Mobile responsive */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-2 sm:mb-3 md:mb-4">
            Choose Your <span className="gradient-text">Growth Path</span>
          </h1>
          <p className="text-center text-muted-foreground text-xs sm:text-sm md:text-base lg:text-lg">
            Start free and upgrade as you grow
          </p>
        </div>

        {/* Pricing Grid - Mobile responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {pricingTiers.map((tier, index) => (
            <div
              key={index}
              className={`glass-card space-y-4 sm:space-y-5 md:space-y-6 p-4 sm:p-5 md:p-6 transition-all hover:shadow-lg ${
                tier.featured ? "ring-2 ring-primary glow-primary lg:scale-105" : ""
              }`}
            >
              {/* Tier Header */}
              <div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">{tier.name}</h3>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text mb-1 sm:mb-2">
                  {tier.price}
                </div>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground line-clamp-2">{tier.description}</p>
              </div>

              {/* Features List */}
              <ul className="space-y-2 sm:space-y-2.5 md:space-y-3">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Zap className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm md:text-base">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Link to="/" className="w-full block">
                <Button
                  className={`w-full h-10 sm:h-11 md:h-12 text-sm sm:text-base transition-all ${
                    tier.featured
                      ? "clay-button bg-gradient-to-r from-primary to-accent"
                      : "glass hover:shadow-md"
                  }`}
                >
                  {tier.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

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

export default PricingPage;