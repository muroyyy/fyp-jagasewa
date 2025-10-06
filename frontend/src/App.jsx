import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SignupLandlord from './pages/SignupLandlord';
import SignupTenant from './pages/SignupTenant';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import LandlordDashboard from './pages/LandlordDashboard';
import TenantDashboard from './pages/TenantDashboard';
import LandlordProperties from './pages/LandlordProperties';

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<Landing />} />
        
        {/* Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signup/landlord" element={<SignupLandlord />} />
        <Route path="/signup/tenant" element={<SignupTenant />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Landlord Dashboard Routes */}
        <Route path="/landlord-dashboard" element={<LandlordDashboard />} />
        <Route path="/landlord/properties" element={<LandlordProperties />} />
        {/* Future landlord routes */}
        {/* <Route path="/landlord/tenants" element={<Tenants />} /> */}
        {/* <Route path="/landlord/payments" element={<Payments />} /> */}
        
        {/* Tenant Dashboard Routes */}
        <Route path="/tenant-dashboard" element={<TenantDashboard />} />
        {/* Future tenant routes */}
        {/* <Route path="/tenant/payments" element={<Payments />} /> */}
        {/* <Route path="/tenant/maintenance" element={<Maintenance />} /> */}
        {/* <Route path="/tenant/documents" element={<Documents />} /> */}
      </Routes>
    </Router>
  );
}

export default App;