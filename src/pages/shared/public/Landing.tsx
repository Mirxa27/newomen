import { Button } from "@/components/shared/ui/button";
import { Link } from "react-router-dom";
import { Sparkles, Brain, Heart, Target, Users, Zap, ArrowRight, Star, Shield, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const Landing = () => {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section with Enhanced Animations */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-20">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
            animate={{
              x: [0, -80, 0],
              y: [0, -60, 0],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        <div className="max-w-6xl mx-auto text-center space-y-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 glass px-6 py-3 rounded-full mb-6"
          >
            <Sparkles className="w-5 h-5 text-accent animate-pulse" />
            <span className="text-sm font-medium">AI-Powered Personal Growth Platform</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hero-title gradient-text font-bold leading-tight"
          >
            Transform Your Life with{" "}
            <motion.span
              className="gradient-text inline-block"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 5, repeat: Infinity }}
            >
              Newomen
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto"
          >
            Your emotionally intelligent AI companion for personal growth,
            meaningful connections, and lasting transformation
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-8"
          >
            <Link to="/auth">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  className="clay-button text-lg px-12 py-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 group"
                >
                  Start Your Journey
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </Link>
            <Link to="/about">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="glass text-lg px-12 py-6 border-2 border-white/20 hover:bg-white/10"
                >
                  Learn More
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="flex flex-wrap items-center justify-center gap-8 pt-12 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              <span>100% Private & Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span>10,000+ Active Users</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>4.9/5 Rating</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section with Staggered Animation */}
      <section className="py-24 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl font-bold text-center mb-4">
              Why Choose <span className="gradient-text">Newomen</span>
            </h2>
            <p className="text-center text-muted-foreground text-xl mb-16">
              Powerful features designed for your transformation
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1
                }}
                whileHover={{
                  scale: 1.05,
                  transition: { duration: 0.2 }
                }}
                className="glass-card space-y-4 cursor-pointer group"
              >
                <motion.div
                  className="clay w-16 h-16 rounded-2xl flex items-center justify-center"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <feature.icon className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                </motion.div>
                <h3 className="text-2xl font-bold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                  type: "spring"
                }}
                className="glass-card"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1 + 0.3,
                    type: "spring",
                    bounce: 0.5
                  }}
                >
                  <div className="text-4xl font-bold gradient-text mb-2">{stat.value}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section with Enhanced Animation */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl font-bold text-center mb-4">
              Choose Your <span className="gradient-text">Growth Path</span>
            </h2>
            <p className="text-center text-muted-foreground text-xl mb-16">
              Start free and upgrade as you grow
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.15
                }}
                whileHover={{
                  scale: 1.05,
                  y: -10,
                  transition: { duration: 0.3 }
                }}
                className={`glass-card space-y-6 ${tier.featured ? 'ring-2 ring-primary glow-primary' : ''}`}
              >
                {tier.featured && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary to-accent px-4 py-1 rounded-full text-sm font-semibold"
                  >
                    Most Popular
                  </motion.div>
                )}
                <div>
                  <h3 className="text-3xl font-bold mb-2">{tier.name}</h3>
                  <motion.div
                    className="text-4xl font-bold gradient-text mb-2"
                    animate={{
                      scale: tier.featured ? [1, 1.05, 1] : 1
                    }}
                    transition={{
                      duration: 2,
                      repeat: tier.featured ? Infinity : 0
                    }}
                  >
                    {tier.price}
                  </motion.div>
                  <p className="text-muted-foreground">{tier.description}</p>
                </div>

                <ul className="space-y-3">
                  {tier.features.map((feature, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-2"
                    >
                      <Zap className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </motion.li>
                  ))}
                </ul>

                <Link to="/auth" className="w-full block">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      className={`w-full ${tier.featured ? 'clay-button bg-gradient-to-r from-primary to-accent' : 'glass'}`}
                      size="lg"
                    >
                      {tier.cta}
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with Parallax Effect */}
      <section className="py-24 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center glass-card space-y-8 relative overflow-hidden"
        >
          {/* Animated background gradient */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20"
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{ duration: 5, repeat: Infinity }}
            style={{ backgroundSize: "200% 200%" }}
          />

          <div className="relative z-10">
            <motion.h2
              className="text-5xl font-bold"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Ready to Begin Your <span className="gradient-text">Transformation</span>?
            </motion.h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of women who are already on their journey to personal growth
            </p>
            <Link to="/auth">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  y: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
              >
                <Button
                  size="lg"
                  className="clay-button text-lg px-12 py-6 bg-gradient-to-r from-primary to-accent group"
                >
                  Get Started Free
                  <TrendingUp className="ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </Button>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="font-bold text-lg mb-4 gradient-text">Newomen</h3>
              <p className="text-sm text-muted-foreground">
                AI-powered personal growth platform for women
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/assessments" className="hover:text-primary transition-colors">Free Assessments</Link></li>
                <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link to="/auth" className="hover:text-primary transition-colors">Get Started</Link></li>
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="mailto:support@newomen.me" className="hover:text-primary transition-colors">Contact Support</a></li>
                <li><a href="mailto:feedback@newomen.me" className="hover:text-primary transition-colors">Send Feedback</a></li>
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              </ul>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-muted-foreground"
          >
            <p>&copy; {new Date().getFullYear()} Newomen. All rights reserved.</p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
};

const features = [
  {
    icon: Brain,
    title: "AI Companion",
    description: "Real-time voice conversations with an emotionally intelligent AI that truly understands and remembers you"
  },
  {
    icon: Heart,
    title: "Persistent Memory",
    description: "Your AI companion remembers your journey, goals, and growth, adapting support as you evolve"
  },
  {
    icon: Target,
    title: "Personalized Growth",
    description: "Dynamic AI prompting that adjusts to your unique progress, needs, and subscription tier"
  },
  {
    icon: Users,
    title: "Community Connection",
    description: "Join a supportive community of like-minded women and try our unique Couple's Challenge"
  },
  {
    icon: Sparkles,
    title: "Gamification",
    description: "Earn crystals, unlock achievements, level up, and track your transformation journey"
  },
  {
    icon: Zap,
    title: "Wellness Resources",
    description: "Access curated audio library with meditation guides, affirmations, and transformative content"
  }
];

const stats = [
  { value: "10K+", label: "Active Users" },
  { value: "50K+", label: "AI Conversations" },
  { value: "4.9★", label: "User Rating" },
  { value: "95%", label: "Satisfaction Rate" }
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
      "Advanced AI prompting",
      "Couple's Challenge access",
      "Exclusive premium content"
    ],
    cta: "Transform Now",
    featured: false
  }
];

export default Landing;
