import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
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
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/assessments" element={<PublicAssessments />} />
          <Route path="/assessments/:assessmentId" element={<PublicAssessments />} />
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/account-settings" element={
            <ProtectedRoute>
              <AccountSettings />
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } />
          <Route path="/wellness-library" element={
            <ProtectedRoute>
              <WellnessLibrary />
            </ProtectedRoute>
          } />
          <Route path="/community" element={
            <ProtectedRoute>
              <Community />
            </ProtectedRoute>
          } />
          <Route path="/member-assessments" element={
            <ProtectedRoute>
              <MemberAssessments />
            </ProtectedRoute>
          } />
          <Route path="/member-assessments/:assessmentId" element={
            <ProtectedRoute>
              <MemberAssessments />
            </ProtectedRoute>
          } />
          <Route path="/couples-challenge/:challengeId?" element={
            <ProtectedRoute>
              <CouplesChallenge />
            </ProtectedRoute>
          } />
          <Route path="/admin/*" element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          } />
          <Route path="/narrative-exploration" element={
            <ProtectedRoute>
              <NarrativeIdentityExploration />
            </ProtectedRoute>
          } />
          <Route path="/feature-tests" element={
            <ProtectedRoute>
              <FeatureTests />
            </ProtectedRoute>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
