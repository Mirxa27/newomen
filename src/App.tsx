import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import PublicAssessments from "./pages/PublicAssessments";
import MemberAssessments from "./pages/MemberAssessments";
import CouplesChallenge from "./pages/CouplesChallenge";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import WellnessLibrary from "./pages/WellnessLibrary";
import Community from "./pages/Community";
import AccountSettings from "./pages/AccountSettings";
import AboutUs from "./pages/AboutUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NarrativeIdentityExploration from "./pages/NarrativeIdentityExploration";
import FeatureTests from "./pages/FeatureTests";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
              <MainLayout><Admin /></MainLayout>
            </ProtectedRoute>
          } />
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
