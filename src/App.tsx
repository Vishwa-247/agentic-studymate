import Layout from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import SmoothScroll from "@/components/SmoothScroll";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { InterviewProvider } from "@/context/InterviewContext";
import Auth from "@/pages/Auth";
import CompanyProblems from "@/pages/CompanyProblems";
import CourseDetailNew from "@/pages/CourseDetailNew";
import CourseGenerator from "@/pages/CourseGenerator";
import Courses from "@/pages/Courses";
import Dashboard from "@/pages/Dashboard";
import DebugPage from "@/pages/DebugPage";
import DSASheet from "@/pages/DSASheet";
import DSATopic from "@/pages/DSATopic";
import FutureIntegrations from "@/pages/FutureIntegrations";
import Index from "@/pages/Index";
import InterviewResult from "@/pages/InterviewResult";

import MockInterview from "@/pages/MockInterview";
import VoiceInterview from "@/pages/VoiceInterview";
import NotFound from "@/pages/NotFound";
import Onboarding from "@/pages/Onboarding";
import ProfileBuilder from "@/pages/ProfileBuilder";
import ResumeAnalyzer from "@/pages/ResumeAnalyzer";
import Settings from "@/pages/Settings";
import EvaluateDemo from "@/pages/EvaluateDemo";
import ProjectStudio from "@/pages/ProjectStudio";
import ShowcasePage from "@/pages/Showcase";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SmoothScroll>
          <div className="min-h-screen bg-background">
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={
                <ProtectedRoute skipOnboarding>
                  <Onboarding />
                </ProtectedRoute>
              } />
              <Route path="/" element={<Layout noPadding={true}><Index /></Layout>} />
              
              {/* Course Routes */}
              <Route path="/courses" element={
                <Layout>
                  <ProtectedRoute>
                    <Courses />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="/course-generator" element={
                <Layout>
                  <ProtectedRoute>
                    <CourseGenerator />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="/course/:id" element={
                <Layout>
                  <ProtectedRoute>
                    <CourseDetailNew />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="/settings" element={
                <Layout>
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/dsa-sheet" element={
                <Layout>
                  <ProtectedRoute>
                    <DSASheet />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="dsa-sheet/topic/:topicId" element={
                <Layout>
                  <ProtectedRoute>
                    <DSATopic />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="dsa-sheet/company/:companyId" element={
                <Layout>
                  <ProtectedRoute>
                    <CompanyProblems />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route 
                path="mock-interview"
                element={
                  <Layout>
                    <ProtectedRoute>
                      <InterviewProvider>
                        <MockInterview />
                      </InterviewProvider>
                    </ProtectedRoute>
                  </Layout>
                } 
              />
              <Route path="interview-result/:id" element={
                <Layout>
                  <ProtectedRoute>
                    <InterviewResult />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="voice-interview" element={
                <Layout>
                  <ProtectedRoute>
                    <VoiceInterview />
                  </ProtectedRoute>
                </Layout>
              } />

              <Route path="dashboard" element={
                <Layout>
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="profile-builder" element={
                <Layout>
                  <ProtectedRoute>
                    <ProfileBuilder />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="resume-analyzer" element={
                <Layout>
                  <ProtectedRoute>
                    <ResumeAnalyzer />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="api/*" element={<div>API Proxy</div>} />
              <Route path="future-integrations" element={
                <Layout>
                  <ProtectedRoute>
                    <FutureIntegrations />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="debug" element={
                <Layout>
                  <ProtectedRoute>
                    <DebugPage />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="evaluate-demo" element={
                <Layout>
                  <EvaluateDemo />
                </Layout>
              } />
              <Route path="/project-studio" element={
                <Layout>
                  <ProtectedRoute>
                    <ProjectStudio />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="/showcase" element={
                <Layout>
                  <ProtectedRoute>
                    <ShowcasePage />
                  </ProtectedRoute>
                </Layout>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </div>
        </SmoothScroll>
      </TooltipProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
