import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import HomePage from './pages/HomePage';
import PricingPage from './pages/PricingPage';
import TestimonialsPage from './pages/TestimonialsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CoachDashboard from './pages/CoachDashboard';
import AthleteDashboard from './pages/AthleteDashboard';
import AthletesManagementPage from './pages/AthletesManagementPage';
import AthleteProfilePage from './pages/AthleteProfilePage';
import InvitationsPage from './pages/InvitationsPage';
import SessionBuilderPage from './pages/SessionBuilderPage';
import ConnectedDevicesPage from './pages/ConnectedDevicesPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import './App.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function CoachOnlyRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (user.role !== 'coach') {
    return <Navigate to="/dashboard" />;
  }
  
  return <>{children}</>;
}

function App() {
  const user = useAuthStore((state) => state.user);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/testimonials" element={<TestimonialsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {user?.role === 'coach' ? <CoachDashboard /> : <AthleteDashboard />}
            </ProtectedRoute>
          }
        />
        <Route
          path="/athletes"
          element={
            <CoachOnlyRoute>
              <AthletesManagementPage />
            </CoachOnlyRoute>
          }
        />
        <Route
          path="/athletes/:id"
          element={
            <CoachOnlyRoute>
              <AthleteProfilePage />
            </CoachOnlyRoute>
          }
        />
        <Route
          path="/invitations"
          element={
            <CoachOnlyRoute>
              <InvitationsPage />
            </CoachOnlyRoute>
          }
        />
        <Route
          path="/sessions/new"
          element={
            <CoachOnlyRoute>
              <SessionBuilderPage />
            </CoachOnlyRoute>
          }
        />
        <Route
          path="/sessions/edit/:id"
          element={
            <CoachOnlyRoute>
              <SessionBuilderPage />
            </CoachOnlyRoute>
          }
        />
        <Route
          path="/devices"
          element={
            <ProtectedRoute>
              <ConnectedDevicesPage />
            </ProtectedRoute>
          }
        />
        <Route path="/oauth/:platform/callback" element={<OAuthCallbackPage />} />
        <Route
          path="/coach/*"
          element={
            <CoachOnlyRoute>
              <CoachDashboard />
            </CoachOnlyRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
