import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { FullPageLoader } from './components/Loading/FullPageLoader.component';
import { DashboardLayout, DashboardView, BudgetView } from './routes/Dashboard';
const TransactionsRoute = React.lazy(() => import('./routes/Transactions.route'));
const SubscriptionsRoute = React.lazy(() => import('./routes/Subscriptions.route'));
const PaymentMethodsRoute = React.lazy(() => import('./routes/PaymentMethods.route'));
const CategoriesRoute = React.lazy(() => import('./routes/Categories.route'));
const NotFoundPage = React.lazy(() => import('./routes/NotFound.route'));
const SignInRoute = React.lazy(() => import('./routes/SignIn.route'));
const SignUpRoute = React.lazy(() => import('./routes/SignUp.route'));
const VerifyMailRoute = React.lazy(() => import('./routes/VerifyMail.route'));
const RequestPasswordResetRoute = React.lazy(() => import('./routes/RequestPasswordReset.route'));
const ResetPasswordRoute = React.lazy(() => import('./routes/ResetPassword.route'));
const SettingsRoute = React.lazy(() => import('./routes/Settings.route'));

const App = () => {
  return (
    <React.Suspense fallback={<FullPageLoader />}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<DashboardLayout useOutletInsteadOfChildren />}>
            <Route index element={<DashboardView />} />
            <Route path="budget" element={<BudgetView />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Route>
          <Route path="/transactions" element={<TransactionsRoute />} />
          <Route path="/subscriptions" element={<SubscriptionsRoute />} />
          <Route path="/payment-methods" element={<PaymentMethodsRoute />} />
          <Route path="/categories" element={<CategoriesRoute />} />
          <Route path="/settings/profile" element={<SettingsRoute />} />
          <Route path="/sign-in" element={<SignInRoute />} />
          <Route path="/sign-up" element={<SignUpRoute />} />
          <Route path="/verify-email" element={<VerifyMailRoute />} />
          <Route path="/request-password-reset" element={<RequestPasswordResetRoute />} />
          <Route path="/reset-password" element={<ResetPasswordRoute />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </React.Suspense>
  );
};

export default App;
