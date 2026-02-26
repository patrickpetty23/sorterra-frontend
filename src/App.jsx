import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { OrgProvider } from './contexts/OrgContext';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Recipes = lazy(() => import('./pages/Recipes'));
const Files = lazy(() => import('./pages/Files'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <OrgProvider>
          <ToastProvider>
            <Router>
              <Suspense fallback={<LoadingSpinner fullPage message="Loading..." />}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/recipes" element={<Recipes />} />
                    <Route path="/files" element={<Files />} />
                    <Route path="/settings" element={<Settings />} />
                  </Route>
                  <Route path="/" element={<Navigate to="/login" replace />} />
                </Routes>
              </Suspense>
            </Router>
          </ToastProvider>
        </OrgProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
