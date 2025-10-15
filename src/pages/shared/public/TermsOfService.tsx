import { useNavigate } from "react-router-dom";
import { Button } from "@/components/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/ui/card";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
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
          <h1 className="text-5xl font-bold gradient-text mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: October 6, 2025</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Agreement to Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              By accessing or using Newomen, you agree to be bound by these Terms of Service
              and all applicable laws and regulations. If you do not agree with any of these terms,
              you are prohibited from using or accessing this platform.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Use License</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Permission is granted to temporarily access Newomen for personal, non-commercial use only.
              This license shall automatically terminate if you violate any of these restrictions.
            </p>
            <p>Under this license you may not:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Modify or copy the platform materials</li>
              <li>Use the materials for commercial purposes</li>
              <li>Attempt to reverse engineer any software</li>
              <li>Remove any copyright or proprietary notations</li>
              <li>Transfer the materials to another person</li>
              <li>Use the platform in any way that violates applicable laws</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Accounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              When you create an account with us, you must provide accurate, complete, and current
              information. You are responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Maintaining the confidentiality of your account and password</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
              <li>Ensuring you are at least 18 years of age</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription and Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="font-semibold text-lg">Subscription Tiers</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Discovery (Free):</strong> 10 minutes of AI conversation</li>
              <li><strong>Growth ($22):</strong> 100 minutes of AI conversation</li>
              <li><strong>Transformation ($222):</strong> 1000 minutes of AI conversation</li>
            </ul>

            <h3 className="font-semibold text-lg mt-6">Payment Terms</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>All payments are processed securely through PayPal</li>
              <li>Subscriptions auto-renew unless cancelled</li>
              <li>Refunds are provided at our discretion</li>
              <li>Unused minutes do not roll over to the next period</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Companion Disclaimer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-semibold text-amber-600">
              Important: NewMe is an AI-powered personal growth companion, NOT a replacement for
              professional mental health services.
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>NewMe does not provide medical or therapeutic diagnosis</li>
              <li>In case of emergency or crisis, contact emergency services immediately</li>
              <li>For serious mental health concerns, consult a licensed professional</li>
              <li>AI responses are generated and may not always be accurate</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prohibited Uses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>You agree not to use Newomen for:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Any unlawful purpose or to solicit unlawful activity</li>
              <li>Harassment, abuse, or harm of others</li>
              <li>Impersonating others or providing false information</li>
              <li>Uploading viruses or malicious code</li>
              <li>Collecting or tracking personal information of others</li>
              <li>Spamming or sending unsolicited messages</li>
              <li>Interfering with security features of the platform</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Intellectual Property</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              The platform and its original content, features, and functionality are owned by
              Newomen and are protected by international copyright, trademark, patent, trade
              secret, and other intellectual property laws.
            </p>
            <p>
              Your conversations and personal data remain your property, but you grant us a
              license to use this data to provide and improve our services as described in
              our Privacy Policy.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Termination</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              We may terminate or suspend your account immediately, without prior notice, for any
              reason, including if you breach these Terms of Service.
            </p>
            <p>
              Upon termination, your right to use the platform will immediately cease. If you wish
              to terminate your account, you may do so through your account settings.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Newomen and its affiliates will not be liable for any indirect, incidental, special,
              consequential, or punitive damages resulting from your use or inability to use the
              platform.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Changes to Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              We reserve the right to modify these terms at any time. We will notify users of any
              material changes. Your continued use of the platform after changes constitutes
              acceptance of the new terms.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              For questions about these Terms of Service, please contact us at:
            </p>
            <p className="mt-4">
              <strong>Email:</strong> legal@newomen.me<br />
              <strong>Support:</strong> support@newomen.me
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}