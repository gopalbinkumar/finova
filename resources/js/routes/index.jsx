import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AppLayout } from '@/layouts/AppLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { AccountsPage } from '@/pages/accounts/AccountsPage';
import { CategoriesPage } from '@/pages/categories/CategoriesPage';
import { TransactionsPage } from '@/pages/transactions/TransactionsPage';
import { BudgetPage } from '@/pages/budget/BudgetPage';
import { GoalsPage } from '@/pages/goals/GoalsPage';
import { InvestmentsPage } from '@/pages/investments/InvestmentsPage';
import { DebtsPage } from '@/pages/debts/DebtsPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { NotificationsPage } from '@/pages/notifications/NotificationsPage';
import { useAuthStore } from '@/store/authStore';
// ─── Route Guards ─────────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
    const { isAuthenticated } = useAuthStore();
    if (!isAuthenticated)
        return <Navigate to="/login" replace/>;
    return <>{children}</>;
}
function GuestRoute({ children }) {
    const { isAuthenticated } = useAuthStore();
    if (isAuthenticated)
        return <Navigate to="/dashboard" replace/>;
    return <>{children}</>;
}
// ─── App Router ───────────────────────────────────────────────────────────────
export function AppRouter() {
    return (<Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace/>}/>

      {/* Auth routes (guests only) */}
      <Route element={<GuestRoute><AuthLayout /></GuestRoute>}>
        <Route path="/login" element={<LoginPage />}/>
        <Route path="/register" element={<RegisterPage />}/>
        <Route path="/forgot-password" element={<ForgotPasswordPage />}/>
        <Route path="/reset-password" element={<ResetPasswordPage />}/>
      </Route>

      {/* App routes (protected) */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />}/>
        <Route path="/accounts" element={<AccountsPage />}/>
        <Route path="/categories" element={<CategoriesPage />}/>
        <Route path="/transactions" element={<TransactionsPage />}/>
        <Route path="/budget" element={<BudgetPage />}/>
        <Route path="/goals" element={<GoalsPage />}/>
        <Route path="/investments" element={<InvestmentsPage />}/>
        <Route path="/debts" element={<DebtsPage />}/>
        <Route path="/reports" element={<ReportsPage />}/>
        <Route path="/notifications" element={<NotificationsPage />}/>
        <Route path="/profile" element={<ProfilePage />}/>
      </Route>

      {/* 404 fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
    </Routes>);
}
