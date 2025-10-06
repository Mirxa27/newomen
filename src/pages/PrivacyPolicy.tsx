import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
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

        <div>
          <h1 className="text-5xl font-bold gradient-text mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: October 6, 2025</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Introduction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              At Newomen, we take your privacy seriously. This Privacy Policy explains how we collect,
              use, disclose, and safeguard your information when you use our platform and AI companion, NewMe.
            </p>
            <p>
              Please read this privacy policy carefully. If you do not agree with the terms of this privacy
              policy, please do not access the platform.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Information We Collect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="font-semibold text-lg">Personal Information</h3>
            <p>
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Email address and password for account creation</li>
              <li>Profile information (nickname, avatar, preferences)</li>
              <li>Payment information processed through PayPal</li>
            </ul>

            <h3 className="font-semibold text-lg mt-6">Conversation Data</h3>
            <p>
              Your conversations with NewMe are stored securely to provide personalized guidance and
              maintain continuity. This includes:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Text transcripts of conversations</li>
              <li>Voice recordings (if you use voice features)</li>
              <li>Assessment responses and results</li>
              <li>Progress tracking data</li>
            </ul>

            <h3 className="font-semibold text-lg mt-6">Usage Information</h3>
            <p>
              We automatically collect certain information about your device and how you interact with
              our platform, including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Device information and browser type</li>
              <li>IP address and location data</li>
              <li>Usage patterns and feature interactions</li>
              <li>Session duration and frequency</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How We Use Your Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Personalize your experience with NewMe</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send you important updates and notifications</li>
              <li>Improve AI responses and platform features</li>
              <li>Ensure platform security and prevent fraud</li>
              <li>Comply with legal obligations</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              We implement appropriate technical and organizational security measures to protect your
              personal information, including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication</li>
              <li>Secure data storage with reputable providers</li>
            </ul>
            <p>
              However, no method of transmission over the Internet or electronic storage is 100% secure.
              While we strive to use commercially acceptable means to protect your information, we cannot
              guarantee absolute security.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Rights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Access your personal data</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Delete your account and associated data</li>
              <li>Export your data in a portable format</li>
              <li>Opt-out of marketing communications</li>
              <li>Withdraw consent for data processing</li>
            </ul>
            <p>
              To exercise these rights, please contact us at privacy@newomen.me
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Third-Party Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              We use third-party services for specific functionality:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>OpenAI:</strong> Powers our AI conversations with appropriate privacy controls</li>
              <li><strong>PayPal:</strong> Processes payments securely</li>
              <li><strong>Supabase:</strong> Provides secure data storage and authentication</li>
            </ul>
            <p>
              These third parties have their own privacy policies. We encourage you to review them.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Changes to This Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              We may update this privacy policy from time to time. We will notify you of any changes
              by posting the new privacy policy on this page and updating the "Last updated" date.
              You are advised to review this privacy policy periodically for any changes.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="mt-4">
              <strong>Email:</strong> privacy@newomen.me<br />
              <strong>Support:</strong> support@newomen.me
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}