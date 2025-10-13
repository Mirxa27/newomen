import React, { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import MainLayout from "./components/layout/MainLayout";
import MobileOptimizedLayout from "./components/mobile/MobileOptimizedLayout";
import AdminLayout from "./components/layout/AdminLayout";
import { MobileUtils } from "./utils/MobileUtils";
import { CapacitorUtils } from "./utils/CapacitorUtils";

const Landing = lazy(() => import("./pages/Landing"));
const Auth = lazy(() => import("./pages/Auth"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MobileDashboard = lazy(() => import("./pages/mobile/MobileDashboard"));
const Chat = lazy(() => import("./pages/Chat"));
const CouplesChallenge = lazy(() => import("./pages/CouplesChallenge"));
const CouplesChallengeChat = lazy(() => import("./pages/CouplesChallengeChat"));
const CouplesChallengeJoin = lazy(() => import("./pages/CouplesChallengeJoin"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Profile = lazy(() => import("./pages/Profile"));
const WellnessLibrary = lazy(() => import("./pages/WellnessLibrary"));
const Community = lazy(() => import("./pages/Community"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const Pricing = lazy(() => import("./pages/Pricing"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const NarrativeIdentityExploration = lazy(() => import("./pages/NarrativeIdentityExploration"));
const FeatureTests = lazy(() => import("./pages/FeatureTests"));
const PublicAssessments = lazy(() => import("./pages/PublicAssessments"));
const MemberAssessments = lazy(() => import("./pages/MemberAssessments"));
const Assessment = lazy(() => import("./pages/Assessment"));

// Admin Pages
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const Agents = lazy(() => import("./pages/admin/Agents"));
const AIProviderManagement = lazy(() => import("./pages/admin/AIProviderManagement"));
const AIConfigurationManager = lazy(() => import("./pages/admin/AIConfigurationManager"));
const AIPrompting = lazy(() => import("./pages/admin/AIPrompting"));
const AIAssessmentManagement = lazy(() => import("./pages/admin/AIAssessmentManagement"));
const VoiceTraining = lazy(() => import("./pages/admin/VoiceTraining"));
const SessionsLive = lazy(() => import("./pages/admin/SessionsLive"));
const SessionsHistory = lazy(() => import("./pages/admin/SessionsHistory"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const WellnessLibraryManagement = lazy(() => import("./pages/admin/WellnessLibraryManagement"));
const ContentManagement = lazy(() => import("./pages/admin/ContentManagement"));
const GamificationSettings = lazy(() => import("./pages/admin/GamificationSettings"));
const BrandingAssetManagement = lazy(() => import("./pages/admin/BrandingAssetManagement"));
const APISettings = lazy(() => import("./pages/admin/APISettings"));
const AdminAnnouncements = lazy(() => import("./pages/admin/AdminAnnouncements"));

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
            <Route path="ai-config" element={<AIConfigurationManager />} />
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
