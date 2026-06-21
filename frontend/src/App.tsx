import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Layouts
import AgentLayout from '@/components/layouts/AgentLayout';
import AdminLayout from '@/components/layouts/AdminLayout';
import SuperAgentLayout from '@/components/layouts/SuperAgentLayout';

// Route Guards
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';

// Public Pages
const MediaPage = lazy(() => import('@/pages/public/MediaPage'));
const VerifyAgentPage = lazy(() => import('@/pages/public/VerifyAgentPage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/public/PrivacyPolicyPage'));
const TermsConditionsPage = lazy(() => import('@/pages/public/TermsConditionsPage'));
const AboutPage = lazy(() => import('@/pages/public/AboutPage'));
const ContactPage = lazy(() => import('@/pages/public/ContactPage'));
const FaqPage = lazy(() => import('@/pages/public/FaqPage'));
const SchemeInfoPage = lazy(() => import('@/pages/public/SchemeInfoPage'));
const RefundPolicyPage = lazy(() => import('@/pages/public/RefundPolicyPage'));
const TrackStatusPage = lazy(() => import('@/pages/public/TrackStatusPage'));
const HomePage = lazy(() => import('@/pages/public/HomePage'));
const UserManualPage = lazy(() => import('@/pages/public/UserManualPage'));
const CalculatorPage = lazy(() => import('@/pages/public/CalculatorPage'));
const GuidePage = lazy(() => import('@/pages/public/GuidePage'));
const StateSubsidyPage = lazy(() => import('@/pages/public/StateSubsidyPage'));
const BenefitsPage = lazy(() => import('@/pages/public/BenefitsPage'));
const DirectApplyPage = lazy(() => import('@/pages/public/DirectApplyPage'));

// Auth Pages
const AgentLoginPage = lazy(() => import('@/pages/agent/AgentLoginPage'));
const AgentRegisterPage = lazy(() => import('@/pages/agent/AgentRegisterPage'));
const AgentSetPasswordPage = lazy(() => import('@/pages/agent/AgentSetPasswordPage'));
const AdminLoginPage = lazy(() => import('@/pages/admin/AdminLoginPage'));
const SuperAgentLoginPage = lazy(() => import('@/pages/super-agent/SuperAgentLoginPage'));
const LoginPage = lazy(() => import('@/pages/public/LoginPage'));

// Business Development Executive Pages
const AgentDashboardPage = lazy(() => import('@/pages/agent/AgentDashboardPage'));
const AgentCreateLeadPage = lazy(() => import('@/pages/agent/AgentCreateLeadPage'));
const AgentLeadsPage = lazy(() => import('@/pages/agent/AgentLeadsPage'));
const AgentProfilePage = lazy(() => import('@/pages/agent/AgentProfilePage'));

const AgentCommissionsPage = lazy(() => import('@/pages/agent/AgentCommissionsPage'));
const AgentNotificationsPage = lazy(() => import('@/pages/agent/AgentNotificationsPage'));
const AgentEnumeratorsPage = lazy(() => import('@/pages/agent/AgentEnumeratorsPage'));
const AgentOffersPage = lazy(() => import('@/pages/agent/AgentOffersPage').then(module => ({ default: module.AgentOffersPage })));
const AgentWithdrawalsPage = lazy(() => import('@/pages/agent/AgentWithdrawalsPage').then(module => ({ default: module.AgentWithdrawalsPage })));

// Business Development Manager Pages
const SuperAgentDashboardPage = lazy(() => import('@/pages/super-agent/SuperAgentDashboardPage'));
const SuperAgentTeamPage = lazy(() => import('@/pages/super-agent/SuperAgentTeamPage'));
const SuperAgentAgentDetailPage = lazy(() => import('@/pages/super-agent/SuperAgentAgentDetailPage'));
const SuperAgentLeadsPage = lazy(() => import('@/pages/super-agent/SuperAgentLeadsPage'));
const SuperAgentCommissionsPage = lazy(() => import('@/pages/super-agent/SuperAgentCommissionsPage'));
const SuperAgentCreateLeadPage = lazy(() => import('@/pages/super-agent/SuperAgentCreateLeadPage'));
const SuperAgentEnumeratorsPage = lazy(() => import('@/pages/super-agent/SuperAgentEnumeratorsPage'));
const SuperAgentTeamOffersPage = lazy(() => import('@/pages/super-agent/SuperAgentTeamOffersPage').then(module => ({ default: module.SuperAgentTeamOffersPage })));
const SuperAgentLeadDetailPage = lazy(() => import('@/pages/super-agent/SuperAgentLeadDetailPage').then(module => ({ default: module.SuperAgentLeadDetailPage })));
const SuperAgentNotificationsPage = lazy(() => import('@/pages/super-agent/SuperAgentNotificationsPage').then(module => ({ default: module.SuperAgentNotificationsPage })));
const SuperAgentProfilePage = lazy(() => import('@/pages/super-agent/SuperAgentProfilePage').then(module => ({ default: module.SuperAgentProfilePage })));
const DocumentsPage = lazy(() => import('@/pages/shared/DocumentsPage'));
const BankingPage = lazy(() => import('@/pages/shared/BankingPage'));

// Admin Pages
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminBankingPage = lazy(() => import('@/pages/admin/AdminBankingPage'));
const AdminSuperAgentsPage = lazy(() => import('@/pages/admin/AdminSuperAgentsPage'));
const AdminSuperAgentDetailPage = lazy(() => import('@/pages/admin/AdminSuperAgentDetailPage'));
const AdminAgentsPage = lazy(() => import('@/pages/admin/AdminAgentsPage'));
const AdminAgentDetailPage = lazy(() => import('@/pages/admin/AdminAgentDetailPage'));
const AdminEnumeratorsPage = lazy(() => import('@/pages/admin/AdminEnumeratorsPage'));
const AdminLeadsPage = lazy(() => import('@/pages/admin/AdminLeadsPage'));
const AdminCommissionsPage = lazy(() => import('@/pages/admin/AdminCommissionsPage'));
const AdminReportsPage = lazy(() => import('@/pages/admin/AdminReportsPage'));
const AdminMediaPage = lazy(() => import('@/pages/admin/AdminMediaPage'));
const AdminDocumentsPage = lazy(() => import('@/pages/admin/AdminDocumentsPage'));
const AdminLeadDocumentsPage = lazy(() => import('@/pages/admin/AdminLeadDocumentsPage'));
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage'));
const AdminOffersPage = lazy(() => import('@/pages/admin/AdminOffersPage').then(module => ({ default: module.AdminOffersPage })));
const AdminRedemptionsPage = lazy(() => import('@/pages/admin/AdminRedemptionsPage').then(module => ({ default: module.AdminRedemptionsPage })));
const AdminAbsorptionsPage = lazy(() => import('@/pages/admin/AdminAbsorptionsPage'));
const AdminWithdrawalsPage = lazy(() => import('@/pages/admin/AdminWithdrawalsPage').then(module => ({ default: module.AdminWithdrawalsPage })));
const AdminOperatorsPage = lazy(() => import('@/pages/admin/AdminOperatorsPage'));
const AdminTechnicalTeamPage = lazy(() => import('@/pages/admin/AdminTechnicalTeamPage'));
const AdminMasterPointsPage = lazy(() => import('@/pages/admin/AdminMasterPointsPage'));
const AdminLedgerPage = lazy(() => import('@/pages/admin/AdminLedgerPage'));
const AdminNotificationsPage = lazy(() => import('@/pages/admin/AdminNotificationsPage'));
const RegistrationQueuePage = lazy(() => import('@/pages/admin/RegistrationQueuePage'));
const DisbursementQueuePage = lazy(() => import('@/pages/admin/DisbursementQueuePage'));
const InstallationQueuePage = lazy(() => import('@/pages/admin/InstallationQueuePage'));
const PodQueuePage = lazy(() => import('@/pages/admin/PodQueuePage'));
const DispatchPage = lazy(() => import('@/pages/admin/DispatchPage'));
const InventoryManagementPage = lazy(() => import('@/pages/admin/InventoryManagementPage'));
const AdminInventoryLedgerPage = lazy(() => import('@/pages/admin/AdminInventoryLedgerPage'));

// Enumerator Pages
import EnumeratorLayout from '@/components/layouts/EnumeratorLayout';
const EnumeratorDashboardPage = lazy(() => import('@/pages/enumerator/EnumeratorDashboardPage'));
const EnumeratorLeadsPage = lazy(() => import('@/pages/enumerator/EnumeratorLeadsPage'));
const EnumeratorCreateLeadPage = lazy(() => import('@/pages/enumerator/EnumeratorCreateLeadPage'));
const EnumeratorProfilePage = lazy(() => import('@/pages/enumerator/EnumeratorProfilePage'));
const EnumeratorCommissionsPage = lazy(() => import('@/pages/enumerator/EnumeratorCommissionsPage'));
const EnumeratorNotificationsPage = lazy(() => import('@/pages/enumerator/EnumeratorNotificationsPage'));
const EnumeratorLoginPage = lazy(() => import('@/pages/enumerator/EnumeratorLoginPage'));
const EnumeratorRegisterPage = lazy(() => import('@/pages/enumerator/EnumeratorRegisterPage'));
const EnumeratorWithdrawalsPage = lazy(() => import('@/pages/enumerator/EnumeratorWithdrawalsPage').then(module => ({ default: module.EnumeratorWithdrawalsPage })));

// Field Technical Team Pages
import TechnicalLayout from '@/components/layouts/TechnicalLayout';
const TechnicalLeadsPage = lazy(() => import('@/pages/technical/TechnicalLeadsPage'));
const TechnicalDashboardPage = lazy(() => import('@/pages/technical/TechnicalDashboardPage'));
const TechnicalProfilePage = lazy(() => import('@/pages/technical/TechnicalProfilePage'));
const TechnicalCommissionsPage = lazy(() => import('@/pages/technical/TechnicalCommissionsPage'));
const TechnicalChecklistPage = lazy(() => import('@/pages/technical/TechnicalChecklistPage'));
const SurveyorFormPage = lazy(() => import('@/pages/technical/SurveyorFormPage'));
const InstallationFormPage = lazy(() => import('@/pages/technical/InstallationFormPage'));

// Consumer Portal Pages
import ConsumerLayout from '@/components/layouts/ConsumerLayout';
const ConsumerLoginPage = lazy(() => import('@/pages/consumer/ConsumerLoginPage'));
const ConsumerDashboardPage = lazy(() => import('@/pages/consumer/ConsumerDashboardPage'));
const ConsumerProfilePage = lazy(() => import('@/pages/consumer/ConsumerProfilePage'));
const ConsumerMaterialPage = lazy(() => import('@/pages/consumer/ConsumerMaterialPage'));
const ConsumerServicePage = lazy(() => import('@/pages/consumer/ConsumerServicePage'));
const ConsumerFeedbackPage = lazy(() => import('@/pages/consumer/ConsumerFeedbackPage'));

// Super Admin Pages
import SuperAdminLayout from '@/components/layouts/SuperAdminLayout';
const SuperAdminDashboardPage = lazy(() => import('@/pages/super-admin/SuperAdminDashboardPage'));
const SuperAdminAdminsPage = lazy(() => import('@/pages/super-admin/SuperAdminAdminsPage'));
const SuperAdminMonitorSuperAgentsPage = lazy(() => import('@/pages/super-admin/SuperAdminMonitorSuperAgentsPage'));
const SuperAdminMonitorAgentsPage = lazy(() => import('@/pages/super-admin/SuperAdminMonitorAgentsPage'));
const SuperAdminMonitorEnumeratorsPage = lazy(() => import('@/pages/super-admin/SuperAdminMonitorEnumeratorsPage'));
const SuperAdminMonitorLeadsPage = lazy(() => import('@/pages/super-admin/SuperAdminMonitorLeadsPage'));
const SuperAdminStockDispatchPage = lazy(() => import('@/pages/super-admin/SuperAdminStockDispatchPage'));
const SuperAdminLoginPage = lazy(() => import('@/pages/super-admin/SuperAdminLoginPage'));
const SuperAdminCommissionsPage = lazy(() => import('@/pages/super-admin/SuperAdminCommissionsPage'));
const SuperAdminCommissionRatesPage = lazy(() => import('@/pages/super-admin/SuperAdminCommissionRatesPage'));
const SuperAdminProfilePage = lazy(() => import('@/pages/super-admin/SuperAdminProfilePage'));
const SuperAdminGlobalSettingsPage = lazy(() => import('@/pages/super-admin/SuperAdminGlobalSettingsPage'));
const SuperAdminSystemSupportPage = lazy(() => import('@/pages/super-admin/SuperAdminSystemSupportPage'));
const SuperAdminLedgerWorkflowPage = lazy(() => import('@/pages/super-admin/SuperAdminLedgerWorkflowPage'));


/** Redirect admin to dashboard; operators straight to leads */
function AdminIndexRedirect() {
    const { role } = useAuthStore();
    return <Navigate to={role === 'operator' ? '/admin/leads' : '/admin/dashboard'} replace />;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 30,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              fontFamily: '"Noto Sans", sans-serif',
              fontSize: '14px',
              borderRadius: '12px',
              boxShadow: '0 4px 24px rgba(10,61,122,0.12)',
            },
          }}
        />
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/media" element={<MediaPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify/:token" element={<VerifyAgentPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-conditions" element={<TermsConditionsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/scheme" element={<SchemeInfoPage />} />
          <Route path="/pm-surya-ghar" element={<SchemeInfoPage />} />
          <Route path="/refund-policy" element={<RefundPolicyPage />} />
          <Route path="/track-status" element={<TrackStatusPage />} />
          <Route path="/user-manual" element={<UserManualPage />} />
          <Route path="/solar-subsidy-calculator" element={<CalculatorPage />} />
          <Route path="/pm-surya-ghar-guide" element={<GuidePage />} />
          <Route path="/state-wise-subsidy" element={<StateSubsidyPage />} />
          <Route path="/benefits-of-solar" element={<BenefitsPage />} />
          <Route path="/apply" element={<DirectApplyPage />} />

          {/* Business Development Executive Auth */}
          <Route path="/agent/login" element={<AgentLoginPage />} />
          <Route path="/agent/register" element={<AgentRegisterPage />} />
          <Route path="/agent/set-password" element={<AgentSetPasswordPage />} />

          {/* Business Development Executive Protected Routes */}
          <Route
            path="/agent"
            element={
              <ProtectedRoute requiredRole="agent" loginPath="/agent/login">
                <AgentLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AgentDashboardPage />} />
            <Route path="banking" element={<BankingPage />} />
            <Route path="enumerators" element={<AgentEnumeratorsPage />} />
            <Route path="leads" element={<AgentLeadsPage />} />
            <Route path="leads/new" element={<AgentCreateLeadPage />} />
            <Route path="leads/:ulid" element={<div className="p-8 text-center text-slate-500">This module is currently disabled for maintenance.</div>} />
            <Route path="commissions" element={<AgentCommissionsPage />} />
            <Route path="offers" element={<AgentOffersPage />} />
            <Route path="withdrawals" element={<AgentWithdrawalsPage />} />
            <Route path="notifications" element={<AgentNotificationsPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="profile" element={<AgentProfilePage />} />
            <Route index element={<Navigate to="/agent/dashboard" replace />} />
          </Route>

          {/* Business Development Manager Auth */}
          <Route path="/super-agent/login" element={<SuperAgentLoginPage />} />
          <Route path="/super-agent/set-password" element={<AgentSetPasswordPage />} />

          {/* Business Development Manager Protected Routes */}
          <Route
            path="/super-agent"
            element={
              <ProtectedRoute requiredRole="super_agent" loginPath="/super-agent/login">
                <SuperAgentLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<SuperAgentDashboardPage />} />
            <Route path="banking" element={<BankingPage />} />
            <Route path="team" element={<SuperAgentTeamPage />} />
            <Route path="team/:agentId" element={<SuperAgentAgentDetailPage />} />
            <Route path="enumerators" element={<SuperAgentEnumeratorsPage />} />
            <Route path="leads" element={<SuperAgentLeadsPage />} />
            <Route path="leads/new" element={<SuperAgentCreateLeadPage />} />
            <Route path="leads/:ulid" element={<SuperAgentLeadDetailPage />} />
            <Route path="commissions" element={<SuperAgentCommissionsPage />} />
            <Route path="offers" element={<SuperAgentTeamOffersPage />} />
            <Route path="notifications" element={<SuperAgentNotificationsPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="profile" element={<SuperAgentProfilePage />} />
            <Route index element={<Navigate to="/super-agent/dashboard" replace />} />
          </Route>

          {/* Admin Auth */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
          <ProtectedRoute requiredRole={['admin', 'operator']} loginPath="/admin/login">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="banking" element={<AdminBankingPage />} />
            <Route path="super-agents" element={<AdminSuperAgentsPage />} />
            <Route path="super-agents/:id" element={<AdminSuperAgentDetailPage />} />
            <Route path="leads" element={<AdminLeadsPage />} />
            <Route path="leads/:ulid" element={<AdminLeadsPage />} />
            <Route path="monitor-leads" element={<SuperAdminMonitorLeadsPage />} />
            <Route path="agents" element={<AdminAgentsPage />} />
            <Route path="enumerators" element={<AdminEnumeratorsPage />} />
            <Route path="agents/:id" element={<AdminAgentDetailPage />} />
            <Route path="commissions" element={<AdminCommissionsPage />} />
            <Route path="ledger" element={<AdminLedgerPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="media" element={<AdminMediaPage />} />
            <Route path="documents" element={<AdminDocumentsPage />} />
            <Route path="lead-documents" element={<AdminLeadDocumentsPage />} />
            <Route path="redemptions" element={<AdminRedemptionsPage />} />
            <Route path="offers" element={<AdminOffersPage />} />
            <Route path="absorptions" element={<AdminAbsorptionsPage />} />
            <Route path="points-master" element={<AdminMasterPointsPage />} />
            <Route path="notifications" element={<AdminNotificationsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="withdrawals" element={<AdminWithdrawalsPage />} />
            <Route path="operators" element={<AdminOperatorsPage />} />
            <Route path="technical-team" element={<AdminTechnicalTeamPage />} />
            {/* Pipeline Queue Routes */}
            <Route path="queue/registration" element={<RegistrationQueuePage />} />
            <Route path="queue/disbursement" element={<DisbursementQueuePage />} />
            <Route path="queue/installation" element={<InstallationQueuePage />} />
            <Route path="queue/pod" element={<PodQueuePage />} />
            <Route path="dispatch" element={<DispatchPage />} />
            <Route path="inventory" element={<AdminInventoryLedgerPage />} />
            <Route index element={<AdminIndexRedirect />} />
          </Route>

          {/* Enumerator Auth */}
          <Route path="/enumerator/login" element={<EnumeratorLoginPage />} />
          <Route path="/enumerator/register" element={<EnumeratorRegisterPage />} />

          {/* Super Admin Auth */}
          <Route path="/super-admin/login" element={<SuperAdminLoginPage />} />

          {/* Enumerator Protected Routes */}
          <Route
            path="/enumerator"
            element={
              <ProtectedRoute requiredRole="enumerator" loginPath="/enumerator/login">
                <EnumeratorLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<EnumeratorDashboardPage />} />
            <Route path="banking" element={<BankingPage />} />
            <Route path="leads" element={<EnumeratorLeadsPage />} />
            <Route path="leads/new" element={<EnumeratorCreateLeadPage />} />
            <Route path="commissions" element={<EnumeratorCommissionsPage />} />
            <Route path="notifications" element={<EnumeratorNotificationsPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="profile" element={<EnumeratorProfilePage />} />
            <Route path="withdrawals" element={<EnumeratorWithdrawalsPage />} />
            <Route index element={<Navigate to="/enumerator/dashboard" replace />} />
          </Route>

          {/* Technical Team Protected Routes */}
          <Route
            path="/technical"
            element={
              <ProtectedRoute requiredRole="field_technical_team" loginPath="/login">
                <TechnicalLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<TechnicalDashboardPage />} />
            <Route path="leads" element={<TechnicalLeadsPage />} />
            <Route path="leads/:ulid/survey" element={<SurveyorFormPage />} />
            <Route path="leads/:ulid/checklist" element={<TechnicalChecklistPage />} />
            <Route path="leads/:ulid/installation-form" element={<InstallationFormPage />} />
            <Route path="commissions" element={<TechnicalCommissionsPage />} />
            <Route path="profile" element={<TechnicalProfilePage />} />
            <Route index element={<Navigate to="/technical/dashboard" replace />} />
          </Route>

          {/* Consumer Portal Routes */}
          <Route path="/consumer/login" element={<ConsumerLoginPage />} />
          <Route
            path="/consumer"
            element={
              <ProtectedRoute requiredRole="consumer" loginPath="/consumer/login">
                <ConsumerLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<ConsumerDashboardPage />} />
            <Route path="profile" element={<ConsumerProfilePage />} />
            <Route path="material" element={<ConsumerMaterialPage />} />
            <Route path="service" element={<ConsumerServicePage />} />
            <Route path="feedback" element={<ConsumerFeedbackPage />} />
            <Route index element={<Navigate to="/consumer/dashboard" replace />} />
          </Route>


          {/* Super Admin Protected Routes */}
          <Route
            path="/super-admin"
            element={
              <ProtectedRoute requiredRole="super_admin" loginPath="/super-admin/login">
                <SuperAdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<SuperAdminDashboardPage />} />
            <Route path="banking" element={<AdminBankingPage />} />
            <Route path="admins" element={<SuperAdminAdminsPage />} />
            <Route path="commissions" element={<SuperAdminCommissionsPage />} />
            <Route path="commission-rates" element={<SuperAdminCommissionRatesPage />} />
            <Route path="ledger-workflow" element={<SuperAdminLedgerWorkflowPage />} />
            <Route path="monitor/super-agents" element={<SuperAdminMonitorSuperAgentsPage />} />
            <Route path="monitor/agents" element={<SuperAdminMonitorAgentsPage />} />
            <Route path="monitor/enumerators" element={<SuperAdminMonitorEnumeratorsPage />} />
            <Route path="monitor/leads" element={<SuperAdminMonitorLeadsPage />} />
            <Route path="global-settings" element={<SuperAdminGlobalSettingsPage />} />
            <Route path="system-support" element={<SuperAdminSystemSupportPage />} />
             <Route path="inventory" element={<InventoryManagementPage />} />
             <Route path="stock-logistics" element={<SuperAdminStockDispatchPage />} />
             <Route path="profile" element={<SuperAdminProfilePage />} />
            <Route path="settings" element={<SuperAdminProfilePage />} />
            <Route index element={<Navigate to="/super-admin/dashboard" replace />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
