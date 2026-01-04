import { Route } from 'react-router-dom';
import TenantDashboard from '../pages/tenant/TenantDashboard';
import TenantMyProperty from '../pages/tenant/TenantMyProperty';
import TenantPayments from '../pages/tenant/TenantPayments';
import TenantMaintenance from '../pages/tenant/TenantMaintenance';
import TenantDocuments from '../pages/tenant/TenantDocuments';
import TenantSettings from '../pages/tenant/TenantSettings';
import TenantNotifications from '../pages/tenant/TenantNotifications';

export const tenantRoutes = (
  <>
    <Route path="/tenant-dashboard" element={<TenantDashboard />} />
    <Route path="/tenant/my-property" element={<TenantMyProperty />} />
    <Route path="/tenant/payments" element={<TenantPayments />} />
    <Route path="/tenant/maintenance" element={<TenantMaintenance />} />
    <Route path="/tenant/documents" element={<TenantDocuments />} />
    <Route path="/tenant/settings" element={<TenantSettings />} />
    <Route path="/tenant/notifications" element={<TenantNotifications />} />
  </>
);
