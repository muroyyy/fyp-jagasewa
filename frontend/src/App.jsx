import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SignupLandlord from './pages/SignupLandlord';
import SignupTenant from './pages/SignupTenant';

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
        
        {/* Add more routes here as you create more pages */}
        {/* <Route path="/forgot-password" element={<ForgotPassword />} /> */}
        {/* <Route path="/reset-password" element={<ResetPassword />} /> */}
        
        {/* Landlord Dashboard Routes */}
        {/* <Route path="/landlord/dashboard" element={<LandlordDashboard />} /> */}
        {/* <Route path="/landlord/properties" element={<Properties />} /> */}
        {/* <Route path="/landlord/tenants" element={<Tenants />} /> */}
        
        {/* Tenant Dashboard Routes */}
        {/* <Route path="/tenant/dashboard" element={<TenantDashboard />} /> */}
        {/* <Route path="/tenant/payments" element={<Payments />} /> */}
      </Routes>
    </Router>
  );
}

export default App;