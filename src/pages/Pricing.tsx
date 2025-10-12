import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Zap } from "lucide-react";

const PricingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-center mb-4">
            Choose Your <span className="gradient-text">Growth Path</span>
          </h1>
          <p className="text-center text-muted-foreground text-xl">
            Start free and upgrade as you grow
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {pricingTiers.map((tier, index) => (
            <div
              key={index}
              className={`glass-card space-y-6 ${
                tier.featured ? "ring-2 ring-primary glow-primary" : ""
              }`}
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

              <Link to="/" className="w-full">
                <Button
                  className={`w-full ${
                    tier.featured
                      ? "clay-button bg-gradient-to-r from-primary to-accent"
                      : "glass"
                  }`}
                  size="lg"
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