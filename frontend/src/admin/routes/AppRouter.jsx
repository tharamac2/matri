import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { hasPermission } from '../utils/permissions.js'
import Sidebar from '../components/layout/Sidebar.jsx'
import TopBar from '../components/layout/TopBar.jsx'
import MaintenanceBanner from '../components/layout/MaintenanceBanner.jsx'
import '../index.css'

import Login from '../pages/auth/Login.jsx'
import Home from '../pages/dashboard/Home.jsx'
import MembersList from '../pages/members/MembersList.jsx'
import MemberDetail from '../pages/members/MemberDetail.jsx'
import ProfileVerification from '../pages/verification/ProfileVerification.jsx'
import ProfileVerificationView from '../pages/verification/ProfileVerificationView.jsx'
import PremiumMembership from '../pages/membership/PremiumMembership.jsx'
import SuccessStoriesList from '../pages/success-stories/SuccessStoriesList.jsx'
import PaymentsPage from '../pages/payments/PaymentsPage.jsx'
import ReportsPage from '../pages/reports/ReportsPage.jsx'
import NotificationCenter from '../pages/notifications/NotificationCenter.jsx'
import ComplianceView from '../pages/notifications/ComplianceView.jsx'
import MyAccount from '../pages/account/MyAccount.jsx'
import AdminsList from '../pages/admins/AdminsList.jsx'
import AuditLogsList from '../pages/audit/AuditLogsList.jsx'
import SettingsPage from '../pages/settings/SettingsPage.jsx'

function ProtectedRoute({ children, requiredPermission }) {
  const { isAuthenticated, role, isLoading } = useAuth()
  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />
  if (requiredPermission && !hasPermission(role, requiredPermission)) {
    return <Navigate to="/admin/" replace />
  }
  return children
}

function DashboardLayout({ children }) {
  return (
    <div className="admin-app">
      <div className="flex h-screen overflow-hidden bg-cream-100">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar />
          <MaintenanceBanner />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

function P({ path, element, perm }) {
  return (
    <Route
      path={path}
      element={
        <ProtectedRoute requiredPermission={perm}>
          <DashboardLayout>{element}</DashboardLayout>
        </ProtectedRoute>
      }
    />
  )
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="login" element={
        <div className="admin-app">
          <Login />
        </div>
      } />

      {P({ path: '/',                    element: <Home />,                   perm: 'analytics.read' })}
      {P({ path: 'members',             element: <MembersList />,            perm: 'users.read' })}
      {P({ path: 'members/:userId',     element: <MemberDetail />,           perm: 'users.read' })}
      {P({ path: 'verification',        element: <ProfileVerification />,    perm: 'moderation.read' })}
      {P({ path: 'verification/:id',    element: <ProfileVerificationView />, perm: 'moderation.read' })}
      {P({ path: 'membership',          element: <PremiumMembership />,      perm: 'subscriptions.read' })}
      {P({ path: 'success-stories',      element: <SuccessStoriesList />,     perm: 'moderation.read' })}
      {P({ path: 'payments',            element: <PaymentsPage />,           perm: 'subscriptions.read' })}
      {P({ path: 'reports',             element: <ReportsPage />,            perm: 'analytics.read' })}
      {P({ path: 'notifications',       element: <NotificationCenter />,     perm: 'reports.read' })}
      {P({ path: 'notifications/:id',   element: <ComplianceView />,         perm: 'reports.read' })}
      {P({ path: 'account',             element: <MyAccount /> })}
      {P({ path: 'admins',              element: <AdminsList />,             perm: 'admins.read' })}
      {P({ path: 'audit',               element: <AuditLogsList />,          perm: 'audit.read' })}
      {P({ path: 'settings',            element: <SettingsPage />,           perm: 'settings.read' })}

      {/* Legacy redirects */}
      <Route path="users" element={<Navigate to="/admin/members" replace />} />
      <Route path="users/:id" element={<Navigate to="/admin/members" replace />} />
      <Route path="analytics" element={<Navigate to="/admin/reports" replace />} />
      <Route path="subscriptions" element={<Navigate to="/admin/membership" replace />} />

      <Route path="*" element={<Navigate to="/admin/" replace />} />
    </Routes>
  )
}
