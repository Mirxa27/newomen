import React, { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/shared/ui/toaster";
import { Toaster as Sonner } from "@/components/shared/ui/sonner";
import { TooltipProvider } from "@/components/shared/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/features/auth/useAuth";
import { ProtectedRoute } from "./components/features/auth/ProtectedRoute";
import { AdminRoute } from "./components/features/admin/AdminRoute";
import MainLayout from "./components/shared/layout/MainLayout";
import MobileOptimizedLayout from "./components/shared/layout/MobileOptimizedLayout";
import AdminLayout from "./components/shared/layout/AdminLayout";
import { MobileUtils } from "./utils/features/mobile/MobileUtils";
import { CapacitorUtils } from "./utils/features/mobile/CapacitorUtils";

const Landing = lazy(() => import("./pages/shared/public/Landing"));
const Auth = lazy(() => import("./pages/features/auth/Auth"));
const Onboarding = lazy(() => import("./pages/features/auth/Onboarding"));
const Dashboard = lazy(() => import("./pages/features/dashboard/Dashboard"));
const MobileDashboard = lazy(() => import("./pages/shared/mobile/MobileDashboard"));
const Chat = lazy(() => import("./pages/features/ai/Chat"));
const CouplesChallenge = lazy(() => import("./pages/features/community/CouplesChallenge"));
const CouplesChallengeChat = lazy(() => import("./pages/features/community/CouplesChallengeChat"));
const CouplesChallengeJoin = lazy(() => import("./pages/features/community/CouplesChallengeJoin"));
const NotFound = lazy(() => import("./pages/shared/public/NotFound"));
const Profile = lazy(() => import("./pages/features/dashboard/Profile"));
const WellnessLibrary = lazy(() => import("./pages/features/dashboard/WellnessLibrary"));
const Community = lazy(() => import("./pages/features/community/Community"));
const AccountSettings = lazy(() => import("./pages/features/dashboard/AccountSettings"));
const AboutUs = lazy(() => import("./pages/shared/public/AboutUs"));
const Pricing = lazy(() => import("./pages/features/payment/Pricing"));
const PrivacyPolicy = lazy(() => import("./pages/shared/public/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/shared/public/TermsOfService"));
const NarrativeIdentityExploration = lazy(() => import("./pages/features/ai/NarrativeIdentityExploration"));
const FeatureTests = lazy(() => import("./pages/features/ai/FeatureTests"));
const PublicAssessments = lazy(() => import("./pages/features/assessment/PublicAssessments"));
const MemberAssessments = lazy(() => import("./pages/features/assessment/MemberAssessments"));
const Assessment = lazy(() => import("./pages/features/assessment/Assessment"));
const AIAgentBrowserPage = lazy(() => import("./pages/features/ai/AIAgentBrowserPage"));
const WellnessHub = lazy(() => import("./pages/features/wellness/WellnessHub"));
const PodcastHub = lazy(() => import("./pages/features/wellness/PodcastHub"));
const SubscriptionManager = lazy(() => import("./pages/features/payment/SubscriptionManager"));
const BuddyHub = lazy(() => import("./pages/features/wellness/BuddyHub"));
const NotificationsCenter = lazy(() => import("./pages/features/wellness/NotificationsCenter"));

// Admin Pages
const AdminAnalytics = lazy(() => import("./pages/features/admin/Analytics"));
const Agents = lazy(() => import("./pages/features/admin/Agents"));
const AIProviderManagement = lazy(() => import("./pages/features/admin/AIProviderManagement"));
const UnifiedAIManagement = lazy(() => import("./pages/features/admin/UnifiedAIManagement"));
const AIPrompting = lazy(() => import("./pages/features/admin/AIPrompting"));
const AIAssessmentManagement = lazy(() => import("./pages/features/admin/AIAssessmentManagement"));
const VoiceTraining = lazy(() => import("./pages/features/admin/VoiceTraining"));
const SessionsLive = lazy(() => import("./pages/features/admin/SessionsLive"));
const SessionsHistory = lazy(() => import("./pages/features/admin/SessionsHistory"));
const UserManagement = lazy(() => import("./pages/features/admin/UserManagement"));
const WellnessLibraryManagement = lazy(() => import("./pages/features/admin/WellnessLibraryManagement"));
const ContentManagement = lazy(() => import("./pages/features/admin/ContentManagement"));
const GamificationSettings = lazy(() => import("./pages/features/admin/GamificationSettings"));
const BrandingAssetManagement = lazy(() => import("./pages/features/admin/BrandingAssetManagement"));
const APISettings = lazy(() => import("./pages/features/admin/APISettings"));
const AdminAnnouncements = lazy(() => import("./pages/features/admin/AdminAnnouncements"));

const queryClient = new QueryClient();

const App = () => {
  // Initialize mobile optimizations
  useEffect(() => {
    MobileUtils.initialize();
    CapacitorUtils.initialize();
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}>
        <AuthProvider>
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="glass-card p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p>Loading...</p>
            </div>
          </div>
        }>
          <Routes>
          <Route path="/" element={<MainLayout><Landing /></MainLayout>} />
          <Route path="/auth" element={<MainLayout><Auth /></MainLayout>} />
          <Route path="/about" element={<MainLayout><AboutUs /></MainLayout>} />
          <Route path="/about-us" element={<Navigate to="/about" replace />} />
          <Route path="/pricing" element={<MainLayout><Pricing /></MainLayout>} />
          <Route path="/privacy" element={<MainLayout><PrivacyPolicy /></MainLayout>} />
          <Route path="/privacy-policy" element={<MainLayout><PrivacyPolicy /></MainLayout>} />
          <Route path="/terms" element={<MainLayout><TermsOfService /></MainLayout>} />
          <Route path="/terms-of-service" element={<MainLayout><TermsOfService /></MainLayout>} />
          <Route path="/assessments" element={<MainLayout><PublicAssessments /></MainLayout>} />
          <Route path="/assessments/:assessmentId" element={<MainLayout><PublicAssessments /></MainLayout>} />
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <MainLayout><Onboarding /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              {MobileUtils.isMobile() ? (
                <MobileOptimizedLayout><MobileDashboard /></MobileOptimizedLayout>
              ) : (
                <MainLayout><Dashboard /></MainLayout>
              )}
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <MainLayout><Profile /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/account-settings" element={
            <ProtectedRoute>
              <MainLayout><AccountSettings /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute>
              <MainLayout><Chat /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/wellness-library" element={
            <ProtectedRoute>
              <MainLayout><WellnessLibrary /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/community" element={
            <ProtectedRoute>
              <MainLayout><Community /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/couples-challenge" element={
            <ProtectedRoute>
              <MainLayout><CouplesChallenge /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/couples-challenge/chat/:id" element={
            <CouplesChallengeChat />
          } />
          <Route path="/couples-challenge/join/:id" element={
            <CouplesChallengeJoin />
          } />
          <Route path="/member-assessments" element={
            <ProtectedRoute>
              <MainLayout><MemberAssessments /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/assessment/:id" element={
            <ProtectedRoute>
              <MainLayout><Assessment /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/wellness-hub" element={
            <ProtectedRoute>
              <MainLayout><WellnessHub /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/podcasts" element={
            <ProtectedRoute>
              <MainLayout><PodcastHub /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/subscription" element={
            <ProtectedRoute>
              <MainLayout><SubscriptionManager /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/buddy" element={
            <ProtectedRoute>
              <MainLayout><BuddyHub /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <MainLayout><NotificationsCenter /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            </ProtectedRoute>
          }>
            <Route index element={<AdminAnalytics />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="agents" element={<Agents />} />
            <Route path="ai-providers" element={<AIProviderManagement />} />
            <Route path="ai-config" element={<UnifiedAIManagement />} />
            <Route path="ai-prompts" element={<AIPrompting />} />
            <Route path="ai-assessments" element={<AIAssessmentManagement />} />
            <Route path="voice-training" element={<VoiceTraining />} />
            <Route path="sessions-live" element={<SessionsLive />} />
            <Route path="sessions-history" element={<SessionsHistory />} />
            <Route path="user-management" element={<UserManagement />} />
            <Route path="wellness-library" element={<WellnessLibraryManagement />} />
            <Route path="content-management" element={<ContentManagement />} />
            <Route path="gamification-settings" element={<GamificationSettings />} />
            <Route path="branding" element={<BrandingAssetManagement />} />
            <Route path="api-settings" element={<APISettings />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
          </Route>
          <Route path="/narrative-exploration" element={
            <ProtectedRoute>
              <MainLayout><NarrativeIdentityExploration /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/feature-tests" element={
            <ProtectedRoute>
              <MainLayout><FeatureTests /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/ai-browser" element={
            <ProtectedRoute>
              <MainLayout><AIAgentBrowserPage /></MainLayout>
            </ProtectedRoute>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
          </Routes>
        </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
