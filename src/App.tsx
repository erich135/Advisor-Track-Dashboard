import { Navigate, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import AdvisorsPage from './pages/AdvisorsPage';
import AdvisorDetailPage from './pages/AdvisorDetailPage';
import ProductionPage from './pages/ProductionPage';
import TeamPipelinePage from './pages/TeamPipelinePage';
import TeamPipelineDemoPage from './pages/TeamPipelineDemoPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import CompaniesPage from './pages/CompaniesPage';
import InvoicesPage from './pages/InvoicesPage';
import SupportPage from './pages/SupportPage';
import PerformancePage from './pages/PerformancePage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/advisors" element={<AdvisorsPage />} />
        <Route path="/team-pipeline" element={<TeamPipelinePage />} />
        <Route path="/team-pipeline-demo" element={<TeamPipelineDemoPage />} />
        <Route path="/advisors/:id" element={<AdvisorDetailPage />} />
        <Route path="/production" element={<ProductionPage />} />
        <Route path="/subscriptions" element={<SubscriptionsPage />} />
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/performance" element={<PerformancePage />} />
        <Route path="/reports" element={<Navigate to="/performance" replace />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Layout>
  );
}
