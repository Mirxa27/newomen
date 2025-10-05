import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Shield, Users, Mail } from "lucide-react";

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
              Newomen was founded by Katrina, a passionate advocate for women's personal
              development and mental wellness. Having experienced her own transformative
              journey, she recognized the need for accessible, personalized guidance that
              respects cultural nuances and individual experiences.
            </p>
            <p>
              What started as a vision to help women in the Middle East has grown into a
              platform serving women worldwide. Our team combines expertise in AI, psychology,
              and user experience to create a truly transformative platform.
            </p>
            <p>
              Today, Newomen helps thousands of women discover their authentic selves, build
              confidence, and create the lives they truly desire.
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
