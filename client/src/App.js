import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import PropertyExplorer from './pages/PropertyExplorer';
import ValuationWorkspace from './pages/ValuationWorkspace';
import Reports from './pages/Reports';
import Subscription from './pages/Subscription';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import SubmitProperty from './pages/SubmitProperty';
import AdminLogin from './pages/AdminLogin';
import AdminRegister from './pages/AdminRegister';
import PropertyDetails from './pages/PropertyDetails';
import DataBank from './pages/DataBank';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin-register" element={<AdminRegister />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/properties" element={<PrivateRoute><PropertyExplorer /></PrivateRoute>} />
            <Route path="/properties/:id" element={<PrivateRoute><PropertyDetails /></PrivateRoute>} />
            <Route path="/map" element={<PrivateRoute><PropertyExplorer defaultView="map" /></PrivateRoute>} />
            <Route path="/valuation" element={<PrivateRoute><ValuationWorkspace /></PrivateRoute>} />
            <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
            <Route path="/subscription" element={<PrivateRoute><Subscription /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
            <Route path="/databank" element={<PrivateRoute><DataBank /></PrivateRoute>} />

            <Route path="/submit-property" element={<PrivateRoute><SubmitProperty /></PrivateRoute>} />
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
