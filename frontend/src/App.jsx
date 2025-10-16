import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// 🌐 General
import Landing from './pages/general/Landing';

// 🔐 Auth
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import SignupLandlord from './pages/auth/SignupLandlord';
import SignupTenant from './pages/auth/SignupTenant';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// 🏠 Landlord
import LandlordDashboard from './pages/landlord/LandlordDashboard';
import LandlordProperties from './pages/landlord/LandlordProperties';
import LandlordTenants from './pages/landlord/LandlordTenants';
import LandlordAddTenant from './pages/landlord/LandlordAddTenant';
import LandlordPayments from './pages/landlord/LandlordPayments';
import LandlordMaintenance from './pages/landlord/LandlordMaintenance';
import LandlordSettings from './pages/landlord/LandlordSettings';

// 🧍‍♂️ Tenant
import TenantDashboard from './pages/tenant/TenantDashboard';
import TenantPayments from './pages/tenant/TenantPayments';

function App() {
  return (
    <Router>
      <Routes>
        {/* 🌐 Landing */}
        <Route path="/" element={<Landing />} />

        {/* 🔐 Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signup/landlord" element={<SignupLandlord />} />
        <Route path="/signup/tenant" element={<SignupTenant />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* 🏠 Landlord */}
        <Route path="/landlord-dashboard" element={<LandlordDashboard />} />
        <Route path="/landlord/properties" element={<LandlordProperties />} />
        <Route path="/landlord/tenants" element={<LandlordTenants />} />
        <Route path="/landlord/add-tenant" element={<LandlordAddTenant />} />
        <Route path="/landlord/payments" element={<LandlordPayments />} />
        <Route path="/landlord/maintenance" element={<LandlordMaintenance />} />
        <Route path="/landlord/settings" element={<LandlordSettings />} />

        {/* 🧍‍♂️ Tenant */}
        <Route path="/tenant-dashboard" element={<TenantDashboard />} />
        <Route path="/tenant/payments" element={<TenantPayments />} />
      </Routes>
    </Router>
  );
}

export default App;