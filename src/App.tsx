import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Import components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import EnterMarks from './components/marks/EnterMarks';
import ViewResults from './components/results/ViewResults';
import Layout from './components/layout/Layout';
import Footer from './components/layout/Footer';
import AdminDashboard from './components/admin/AdminDashboard'; 

// Custom component to handle root path redirection based on role
const RootRedirect: React.FC = () => {
    const { isAuthenticated, user } = useAuth();
    
    if (!isAuthenticated) {
        return <Login />;
    }
    
    // CRITICAL REDIRECT LOGIC: Send Admin to /admin, Student to /dashboard
    if (user?.role === 'Admin') {
        return <Navigate to="/admin" replace />;
    }
    
    return <Navigate to="/dashboard" replace />;
};

// Custom Admin Guard component (for /admin route protection)
const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && user?.role === 'Admin';
  
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }
  
  if (!isAdmin) {
    // Navigate to dashboard if logged in but not admin
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
}


const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Layout>
        <Routes>
          <Route 
            path="/" 
            element={<RootRedirect />} // Redirects based on role immediately upon auth
          />
          <Route 
            path="/register" 
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} 
          />
          <Route 
            path="/dashboard" 
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />} 
          />
          <Route 
            path="/enter-marks" 
            element={isAuthenticated ? <EnterMarks /> : <Navigate to="/" />} 
          />
          <Route 
            path="/view-results" 
            element={isAuthenticated ? <ViewResults /> : <Navigate to="/" />} 
          />
          {/* Admin Route */}
          <Route 
            path="/admin" 
            element={
              <AdminGuard>
                <AdminDashboard />
              </AdminGuard>
            } 
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
      <Footer />
    </div>
  );
};

export default App;