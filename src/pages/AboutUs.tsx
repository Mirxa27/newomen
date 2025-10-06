import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

        {/* Founder Section */}
        <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 rounded-3xl p-8 md:p-12 text-white">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Founder Image */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden">
                <img 
                  src="/founder_katerina.png" 
                  alt="Katrina Zhuk, Founder of Newomen"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute top-4 left-4 w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="absolute bottom-4 right-4 w-3 h-3 bg-pink-400 rounded-full"></div>
              </div>
            </div>

            {/* Founder Content */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-4xl md:text-5xl font-bold">
                  <span className="text-purple-200">Meet </span>
                  <span className="text-pink-300">Katrina Zhuk</span>
                  <Star className="inline-block w-6 h-6 ml-2 text-yellow-400" />
                </h2>
                <Badge className="bg-purple-600 text-white border-0">
                  <Star className="w-3 h-3 mr-1" />
                  Founder
                </Badge>
              </div>

              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="border-purple-300 text-white">
                  <Heart className="w-3 h-3 mr-1" />
                  Founder & Visionary
                </Badge>
                <Badge variant="outline" className="border-green-300 text-white">
                  <Globe className="w-3 h-3 mr-1" />
                  Global Impact
                </Badge>
              </div>

              <p className="text-lg leading-relaxed">
                At just <strong>25 years old</strong>, Katrina embarked on a transformative journey from <strong>Belarus to Saudi Arabia</strong>, where she was deeply inspired by the culture, warmth, and resilience she encountered, leading her to create a global community for women's empowerment.
              </p>

              <div className="space-y-4">
                <div className="bg-purple-800/50 rounded-xl p-6 relative">
                  <div className="absolute top-4 left-4 text-4xl text-purple-300 font-serif">"</div>
                  <p className="text-white italic text-lg leading-relaxed pl-8">
                    Traveling to Saudi Arabia opened my heart and mind in ways I never imagined. Inspired by the strength and spirit of the women I met, I created Newomen as a community where women worldwide can connect, learn, and grow together through technology.
                  </p>
                  <div className="absolute bottom-4 right-4 text-4xl text-purple-300 font-serif">"</div>
                </div>

                <div className="bg-purple-800/50 rounded-xl p-6">
                  <p className="text-white italic text-lg leading-relaxed">
                    "This is just the beginning of our shared community journey toward collective empowerment and self-discovery."
                  </p>
                </div>
              </div>

              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 w-full md:w-auto"
                onClick={() => navigate("/auth")}
              >
                <Heart className="w-4 h-4 mr-2" />
                Start Your Journey Today
                <Star className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Our Mission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-lg">
            <p>
              Newomen was created with a singular vision: to make personal growth accessible,
              personalized, and transformative for women everywhere. We believe that every woman
              deserves a safe, supportive space to explore her identity, overcome challenges,
              and unlock her full potential.
            </p>
            <p>
              Through our AI companion, NewMe, we provide emotionally intelligent guidance that
              adapts to your unique journey. Whether you're navigating relationships, career
              transitions, or personal challenges, NewMe is here to support you every step of
              the way.
            </p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="clay w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Our Approach</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We combine cutting-edge AI technology with proven psychological frameworks,
                including Narrative Identity Exploration, to help you understand your personal
                stories and create meaningful change in your life.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="clay w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Privacy First</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Your conversations and personal data are encrypted and private. We never share
                your information with third parties, and you have full control over your data
                at all times.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="clay w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Community Driven</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Connect with like-minded women on similar journeys. Share experiences,
                support each other, and grow together in a safe, moderated community
                environment.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="clay w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Get in Touch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-muted-foreground">
                Have questions or feedback? We'd love to hear from you.
              </p>
              <p className="font-medium">support@newomen.me</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Our Story</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-lg">
            <p>
              Newomen was founded by <strong>Katrina Zhuk</strong>, a passionate advocate for women's personal
              development and mental wellness. At just 25 years old, her transformative journey from Belarus to Saudi Arabia opened her eyes to the incredible strength and resilience of women across cultures.
            </p>
            <p>
              Inspired by the women she met in Saudi Arabia, Katrina recognized the need for accessible, personalized guidance that respects cultural nuances and individual experiences. What started as a vision to help women in the Middle East has grown into a global platform serving women worldwide.
            </p>
            <p>
              Our team combines expertise in AI, psychology, and user experience to create a truly transformative platform. Today, Newomen helps thousands of women discover their authentic selves, build confidence, and create the lives they truly desire.
            </p>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Ready to Begin Your Journey?</h2>
          <Button size="lg" onClick={() => navigate("/auth")} className="clay-button">
            Get Started Free
          </Button>
        </div>
      </div>
    </div>
  );
}
