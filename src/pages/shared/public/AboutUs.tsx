import { useNavigate } from "react-router-dom";
import { Button } from "@/components/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shared/ui/card";
import { Badge } from "@/components/shared/ui/badge";
import { ArrowLeft, BookOpen, Shield, Users, Mail, Heart, Globe, Star } from "lucide-react";

export default function AboutUs() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold gradient-text">About Newomen</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Empowering women on their journey of self-discovery and personal transformation
            through AI-powered guidance
          </p>
        </div>

        {/* Founder Section - Glass Morphism Design */}
        <div className="glass-card rounded-3xl p-6 md:p-12 overflow-hidden relative">
          {/* Gradient overlay for visual appeal */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-purple-800/20 to-pink-800/30 pointer-events-none"></div>

          <div className="relative z-10">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              {/* Founder Image */}
              <div className="relative order-2 md:order-1">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-purple-500/20">
                  <img
                    src="/founder_katerina.png"
                    alt="Katrina Zhuk, Founder of Newomen"
                    className="w-full h-auto object-cover"
                  />
                  {/* Decorative elements */}
                  <div className="absolute top-4 left-4 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                  <div className="absolute bottom-4 right-4 w-3 h-3 bg-pink-400 rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* Founder Content */}
              <div className="space-y-6 order-1 md:order-2">
                <div className="space-y-4">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                      <span className="text-purple-200">Meet </span>
                      <span className="gradient-text">Katrina Zhuk</span>
                      <Star className="inline-block w-5 h-5 md:w-6 md:h-6 ml-2 text-yellow-400" />
                    </h2>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-purple-600/80 text-white border-0 backdrop-blur-sm">
                      <Star className="w-3 h-3 mr-1" />
                      Founder
                    </Badge>
                    <Badge variant="outline" className="border-purple-300/50 text-purple-200 backdrop-blur-sm">
                      <Heart className="w-3 h-3 mr-1" />
                      Visionary
                    </Badge>
                    <Badge variant="outline" className="border-green-300/50 text-green-200 backdrop-blur-sm">
                      <Globe className="w-3 h-3 mr-1" />
                      Global Impact
                    </Badge>
                  </div>
                </div>

                <p className="text-base md:text-lg leading-relaxed text-muted-foreground">
                  At just <strong className="text-purple-300">25 years old</strong>, Katrina embarked on a transformative journey from <strong className="text-pink-300">Belarus to Saudi Arabia</strong>, where she was deeply inspired by the culture, warmth, and resilience she encountered, leading her to create a global community for women's empowerment.
                </p>

                <div className="space-y-4">
                  {/* Primary Quote */}
                  <div className="glass rounded-xl p-5 md:p-6 relative border border-purple-500/20 shadow-lg">
                    <div className="absolute top-3 left-3 text-3xl md:text-4xl text-purple-300/60 font-serif">"</div>
                    <p className="text-sm md:text-base italic leading-relaxed pl-6 md:pl-8 pr-6 md:pr-8 text-foreground/90">
                      Traveling to Saudi Arabia opened my heart and mind in ways I never imagined. Inspired by the strength and spirit of the women I met, I created Newomen as a community where women worldwide can connect, learn, and grow together through technology.
                    </p>
                    <div className="absolute bottom-3 right-3 text-3xl md:text-4xl text-purple-300/60 font-serif">"</div>
                  </div>

                  {/* Secondary Quote */}
                  <div className="glass rounded-xl p-4 md:p-6 border border-pink-500/20 shadow-md">
                    <p className="text-sm md:text-base italic leading-relaxed text-foreground/80 text-center">
                      "This is just the beginning of our shared community journey toward collective empowerment and self-discovery."
                    </p>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 w-full md:w-auto shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => navigate("/")}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Start Your Journey Today
                  <Star className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mission Section */}
        <Card className="glass-card border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl gradient-text">Our Mission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-base md:text-lg">
            <p className="text-muted-foreground leading-relaxed">
              Newomen was created with a singular vision: to make personal growth accessible,
              personalized, and transformative for women everywhere. We believe that every woman
              deserves a safe, supportive space to explore her identity, overcome challenges,
              and unlock her full potential.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Through our AI companion, NewMe, we provide emotionally intelligent guidance that
              adapts to your unique journey. Whether you're navigating relationships, career
              transitions, or personal challenges, NewMe is here to support you every step of
              the way.
            </p>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
          <Card className="glass-card border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
            <CardHeader>
              <div className="clay w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl md:text-2xl">Our Approach</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                We combine cutting-edge AI technology with proven psychological frameworks,
                including Narrative Identity Exploration, to help you understand your personal
                stories and create meaningful change in your life.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-pink-500/20 hover:border-pink-500/40 transition-all duration-300">
            <CardHeader>
              <div className="clay w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl md:text-2xl">Privacy First</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                Your conversations and personal data are encrypted and private. We never share
                your information with third parties, and you have full control over your data
                at all times.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-green-500/20 hover:border-green-500/40 transition-all duration-300">
            <CardHeader>
              <div className="clay w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl md:text-2xl">Community Driven</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                Connect with like-minded women on similar journeys. Share experiences,
                support each other, and grow together in a safe, moderated community
                environment.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-blue-500/20 hover:border-blue-500/40 transition-all duration-300">
            <CardHeader>
              <div className="clay w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl md:text-2xl">Get in Touch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                Have questions or feedback? We'd love to hear from you.
              </p>
              <p className="font-medium text-purple-300">support@newomen.me</p>
            </CardContent>
          </Card>
        </div>

        {/* Story Section */}
        <Card className="glass-card border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl gradient-text">Our Story</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-base md:text-lg">
            <p className="text-muted-foreground leading-relaxed">
              Newomen was founded by <strong className="text-purple-300">Katrina Zhuk</strong>, a passionate advocate for women's personal
              development and mental wellness. At just 25 years old, her transformative journey from Belarus to Saudi Arabia opened her eyes to the incredible strength and resilience of women across cultures.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Inspired by the women she met in Saudi Arabia, Katrina recognized the need for accessible, personalized guidance that respects cultural nuances and individual experiences. What started as a vision to help women in the Middle East has grown into a global platform serving women worldwide.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our team combines expertise in AI, psychology, and user experience to create a truly transformative platform. Today, Newomen helps thousands of women discover their authentic selves, build confidence, and create the lives they truly desire.
            </p>
          </CardContent>
        </Card>

        {/* Final CTA */}
        <div className="glass-card rounded-3xl p-8 md:p-12 text-center space-y-6 border-purple-500/20 relative overflow-hidden">
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 pointer-events-none"></div>

          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-4">
              Ready to Begin Your Journey?
            </h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-6">
              Join thousands of women discovering their authentic selves and creating the lives they truly desire.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/")}
              className="clay-button shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-6 text-lg"
            >
              <Heart className="w-5 h-5 mr-2" />
              Get Started Free
              <Star className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
