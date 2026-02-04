import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CoachDashboard from './pages/CoachDashboard';
import AthleteDashboard from './pages/AthleteDashboard';
import './App.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  const user = useAuthStore((state) => state.user);

  return (
    <Router>
      <Routes>
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
        <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
      </Routes>
    </Router>
  );
}

export default App;
