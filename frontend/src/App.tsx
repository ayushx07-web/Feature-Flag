import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/AuthContext';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjectPage from './pages/ProjectPage';
import FlagDetailPage from './pages/FlagDetailPage';
import AuditLogPage from './pages/AuditLogPage';

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-textMain font-sans flex flex-col">
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route path="/dashboard" element={<AuthGuard><DashboardPage /></AuthGuard>} />
        
        <Route path="/projects/:projectId" element={<AuthGuard><ProjectPage /></AuthGuard>} />
        <Route path="/projects/:projectId/flags/:flagId" element={<AuthGuard><FlagDetailPage /></AuthGuard>} />
        <Route path="/projects/:projectId/audit" element={<AuthGuard><AuditLogPage /></AuthGuard>} />
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
};

export default App;
