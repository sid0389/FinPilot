import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';

import LandingPage      from './pages/LandingPage';
import LoginPage        from './pages/LoginPage';
import RegisterPage     from './pages/RegisterPage';
import AppLayout        from './pages/AppLayout';
import Dashboard        from './pages/Dashboard';
import ExpenseTracker   from './pages/ExpenseTracker';
import RiskAssessment   from './pages/RiskAssessment';
import Recommendation   from './pages/Recommendation';
import MarketComparison from './pages/MarketComparison';
import Profile          from './pages/Profile';
import RiskForecast     from './pages/RiskForecast';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-lime-400/15 border border-lime-400/25 flex items-center justify-center animate-pulse">
          <span className="text-lime-400 font-bold font-display">F</span>
        </div>
        <span className="text-sm text-slate-500">Loading FinPilot…</span>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

export default function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{
            style: { background:'#18181b', border:'1px solid rgba(163,230,53,0.2)', color:'#e2e8f0', fontSize:13 },
            success: { iconTheme: { primary:'#a3e635', secondary:'#09090b' } },
            error:   { iconTheme: { primary:'#fb7185', secondary:'#09090b' } },
          }} />
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

            {/* Protected */}
            <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
              <Route path="dashboard"         element={<Dashboard />} />
              <Route path="expenses"          element={<ExpenseTracker />} />
              <Route path="risk-assessment"   element={<RiskAssessment />} />
              <Route path="recommendation"    element={<Recommendation />} />
              <Route path="market-comparison" element={<MarketComparison />} />
              <Route path="risk-forecast"     element={<RiskForecast />} />
              <Route path="profile"           element={<Profile />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </FinanceProvider>
    </AuthProvider>
  );
}
