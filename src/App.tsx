import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import MainLayout from "./components/layout/MainLayout";
const Landing = lazy(() => import("./pages/Landing"));
const Auth = lazy(() => import("./pages/Auth"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Chat = lazy(() => import("./pages/Chat"));
const PublicAssessments = lazy(() => import("./pages/PublicAssessments"));
const MemberAssessments = lazy(() => import("./pages/MemberAssessments"));
const CouplesChallenge = lazy(() => import("./pages/CouplesChallenge"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Profile = lazy(() => import("./pages/Profile"));
const WellnessLibrary = lazy(() => import("./pages/WellnessLibrary"));
const Community = lazy(() => import("./pages/Community"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const NarrativeIdentityExploration = lazy(() => import("./pages/NarrativeIdentityExploration"));
const FeatureTests = lazy(() => import("./pages/FeatureTests"));
const AIAssessments = lazy(() => import("./pages/AIAssessments"));
const Assessments = lazy(() => import("./pages/Assessments"));
const Assessment = lazy(() => import("./pages/Assessment"));
const AssessmentTest = lazy(() => import("./pages/AssessmentTest"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          <Route path="/privacy" element={<MainLayout><PrivacyPolicy /></MainLayout>} />
          <Route path="/terms" element={<MainLayout><TermsOfService /></MainLayout>} />
          <Route path="/assessments" element={<MainLayout><PublicAssessments /></MainLayout>} />
          <Route path="/assessments/:assessmentId" element={<MainLayout><PublicAssessments /></MainLayout>} />
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <MainLayout><Onboarding /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <MainLayout><Dashboard /></MainLayout>
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
          <Route path="/member-assessments" element={
            <ProtectedRoute>
              <MainLayout><MemberAssessments /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/member-assessments/:assessmentId" element={
            <ProtectedRoute>
              <MainLayout><MemberAssessments /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/couples-challenge/:challengeId?" element={
            <ProtectedRoute>
              <MainLayout><CouplesChallenge /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/*" element={
            <ProtectedRoute>
              <AdminRoute>
                <MainLayout><Admin /></MainLayout>
              </AdminRoute>
            </ProtectedRoute>
          } />
          <Route path="/narrative-exploration" element={
            <ProtectedRoute>
              <MainLayout><NarrativeIdentityExploration /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/ai-assessments" element={
            <ProtectedRoute>
              <MainLayout><AIAssessments /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/assessments-new" element={
            <ProtectedRoute>
              <MainLayout><Assessments /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/assessment/:id" element={
            <ProtectedRoute>
              <MainLayout><Assessment /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/assessment-test" element={
            <ProtectedRoute>
              <MainLayout><AssessmentTest /></MainLayout>
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
