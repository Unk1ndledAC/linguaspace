import { Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "./layouts/AdminLayout";
import { RootLayout } from "./layouts/RootLayout";
import { TourismLayout } from "./layouts/TourismLayout";
import { OverviewPage } from "./pages/intro/OverviewPage";
import { TouristChatPage } from "./pages/tourist/TouristChatPage";
import { TouristHomePage } from "./pages/tourist/TouristHomePage";
import {
  KnowledgeChunksPage,
  KnowledgeDocumentsPage,
  KnowledgeGraphPage,
  KnowledgeRagTestPage,
  KnowledgeReviewPage,
  KnowledgeStatisticsPage,
  KnowledgeTermsPage,
} from "./pages/knowledge/KnowledgePages";
import {
  GuideCasesPage,
  GuideCorrectionsPage,
  GuideDashboardPage,
  GuideProfilePage,
  GuideSessionDetailPage,
  GuideSessionsPage,
  GuideTakeoverPage,
} from "./pages/guide/GuidePages";
import {
  SystemDashboardPage,
  SystemHealthPage,
  SystemLogsPage,
  SystemMetricsPage,
  SystemPermissionsPage,
  SystemRolesPage,
  SystemSettingsPage,
  SystemUsersPage,
} from "./pages/system/SystemPages";
import { IntroArchitecturePage, IntroFeaturesPage, IntroRoadmapPage, IntroScenariosPage } from "./pages/intro/IntroPages";
import { TouristCultureTipsPage, TouristRoutesPage } from "./pages/tourist/TouristExtraPages";

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<Navigate replace to="/intro/overview" />} />
        <Route path="intro" element={<TourismLayout module="intro" />}>
          <Route index element={<Navigate replace to="overview" />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="architecture" element={<IntroArchitecturePage />} />
          <Route path="features" element={<IntroFeaturesPage />} />
          <Route path="scenarios" element={<IntroScenariosPage />} />
          <Route path="roadmap" element={<IntroRoadmapPage />} />
        </Route>
        <Route path="tourist" element={<TourismLayout module="tourist" />}>
          <Route index element={<Navigate replace to="home" />} />
          <Route path="home" element={<TouristHomePage />} />
          <Route path="chat" element={<TouristChatPage />} />
          <Route path="voice" element={<Navigate replace to="/tourist/chat" />} />
          <Route path="image" element={<Navigate replace to="/tourist/chat" />} />
          <Route path="routes" element={<TouristRoutesPage />} />
          <Route path="culture-tips" element={<TouristCultureTipsPage />} />
          <Route path="history" element={<Navigate replace to="/tourist/chat" />} />
        </Route>
        <Route path="guide" element={<TourismLayout module="guide" />}>
          <Route index element={<Navigate replace to="dashboard" />} />
          <Route path="dashboard" element={<GuideDashboardPage />} />
          <Route path="sessions" element={<GuideSessionsPage />} />
          <Route path="sessions/:id" element={<GuideSessionDetailPage />} />
          <Route path="takeover" element={<GuideTakeoverPage />} />
          <Route path="corrections" element={<GuideCorrectionsPage />} />
          <Route path="cases" element={<GuideCasesPage />} />
          <Route path="profile" element={<GuideProfilePage />} />
        </Route>
        <Route path="knowledge" element={<AdminLayout module="knowledge" />}>
          <Route index element={<Navigate replace to="documents" />} />
          <Route path="documents" element={<KnowledgeDocumentsPage />} />
          <Route path="chunks" element={<KnowledgeChunksPage />} />
          <Route path="graph" element={<KnowledgeGraphPage />} />
          <Route path="review" element={<KnowledgeReviewPage />} />
          <Route path="terms" element={<KnowledgeTermsPage />} />
          <Route path="rag-test" element={<KnowledgeRagTestPage />} />
          <Route path="statistics" element={<KnowledgeStatisticsPage />} />
        </Route>
        <Route path="system" element={<AdminLayout module="system" />}>
          <Route index element={<Navigate replace to="dashboard" />} />
          <Route path="dashboard" element={<SystemDashboardPage />} />
          <Route path="users" element={<SystemUsersPage />} />
          <Route path="roles" element={<SystemRolesPage />} />
          <Route path="permissions" element={<SystemPermissionsPage />} />
          <Route path="health" element={<SystemHealthPage />} />
          <Route path="logs" element={<SystemLogsPage />} />
          <Route path="metrics" element={<SystemMetricsPage />} />
          <Route path="settings" element={<SystemSettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate replace to="/intro/overview" />} />
      </Route>
    </Routes>
  );
}
