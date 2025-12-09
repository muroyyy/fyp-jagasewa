import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// General
import Landing from './pages/general/Landing';

// Auth
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import SignupLandlord from './pages/auth/SignupLandlord';
import SignupTenant from './pages/auth/SignupTenant';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import TenantInvitation from './pages/auth/TenantInvitation';

// Landlord
import LandlordDashboard from './pages/landlord/LandlordDashboard';
import LandlordProperties from './pages/landlord/LandlordProperties';
import LandlordEditProperty from './pages/landlord/LandlordEditProperty';
import LandlordTenantsProperties from './pages/landlord/LandlordTenantsProperties';
import LandlordPropertyTenants from './pages/landlord/LandlordPropertyTenants';
import LandlordAddTenant from './pages/landlord/LandlordAddTenant';
import LandlordEditTenant from './pages/landlord/LandlordEditTenant'; 
import LandlordPayments from './pages/landlord/LandlordPayments';
import LandlordMaintenance from './pages/landlord/LandlordMaintenance';
import LandlordDocuments from './pages/landlord/LandlordDocuments';
import LandlordPropertyDocuments from './pages/landlord/LandlordPropertyDocuments';
import LandlordSettings from './pages/landlord/LandlordSettings';

// Tenant
import TenantDashboard from './pages/tenant/TenantDashboard';
import TenantMyProperty from './pages/tenant/TenantMyProperty';
import TenantPayments from './pages/tenant/TenantPayments';
import TenantMaintenance from './pages/tenant/TenantMaintenance';
import TenantDocuments from './pages/tenant/TenantDocuments';
import TenantSettings from './pages/tenant/TenantSettings';

// Messages
import Messages from './pages/general/Messages';

// Admin
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import PropertyManagement from './pages/admin/PropertyManagement';
import SystemSettings from './pages/admin/SystemSettings';
import AdminProfile from './pages/admin/AdminProfile';

function App() {
  return (
    <Router>
      <Routes>
      {/* Landing */}
      <Route path="/" element={<Landing />} />

      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/signup/landlord" element={<SignupLandlord />} />
      <Route path="/signup/tenant" element={<SignupTenant />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/tenant-invitation" element={<TenantInvitation />} />

      {/* Landlord */}
      <Route path="/landlord-dashboard" element={<LandlordDashboard />} />
      <Route path="/landlord/properties" element={<LandlordProperties />} />
      <Route path="/landlord/properties/edit/:id" element={<LandlordEditProperty />} />
      <Route path="/landlord/tenants" element={<LandlordTenantsProperties />} />
      <Route path="/landlord/tenants/property/:propertyId" element={<LandlordPropertyTenants />} />
      <Route path="/landlord/add-tenant" element={<LandlordAddTenant />} />
      <Route path="/landlord/tenants/edit/:id" element={<LandlordEditTenant />} /> 
      <Route path="/landlord/payments" element={<LandlordPayments />} />
      <Route path="/landlord/maintenance" element={<LandlordMaintenance />} />
      <Route path="/landlord/documents" element={<LandlordDocuments />} />
      <Route path="/landlord/documents/property/:propertyId" element={<LandlordPropertyDocuments />} />
      <Route path="/landlord/settings" element={<LandlordSettings />} />

      {/* Messages - Shared by Landlord and Tenant */}
      <Route path="/messages" element={<Messages />} />

      {/* Tenant */}
      <Route path="/tenant-dashboard" element={<TenantDashboard />} />
      <Route path="/tenant/my-property" element={<TenantMyProperty />} />
      <Route path="/tenant/payments" element={<TenantPayments />} />
      <Route path="/tenant/maintenance" element={<TenantMaintenance />} />
      <Route path="/tenant/documents" element={<TenantDocuments />} />
      <Route path="/tenant/settings" element={<TenantSettings />} />

      {/* Admin */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="properties" element={<PropertyManagement />} />
        <Route path="settings" element={<SystemSettings />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>
      </Routes>
    </Router>
  );
}

export default App;