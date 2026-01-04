import { Route } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import UserManagement from '../pages/admin/UserManagement';
import PropertyManagement from '../pages/admin/PropertyManagement';
import SystemSettings from '../pages/admin/SystemSettings';
import AdminProfile from '../pages/admin/AdminProfile';

export const adminRoutes = (
  <Route path="/admin" element={<AdminLayout />}>
    <Route path="dashboard" element={<AdminDashboard />} />
    <Route path="users" element={<UserManagement />} />
    <Route path="properties" element={<PropertyManagement />} />
    <Route path="settings" element={<SystemSettings />} />
    <Route path="profile" element={<AdminProfile />} />
  </Route>
);
