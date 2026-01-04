import { Route } from 'react-router-dom';
import LandlordDashboard from '../pages/landlord/LandlordDashboard';
import LandlordProperties from '../pages/landlord/LandlordProperties';
import LandlordEditProperty from '../pages/landlord/LandlordEditProperty';
import LandlordTenantsProperties from '../pages/landlord/LandlordTenantsProperties';
import LandlordPropertyTenants from '../pages/landlord/LandlordPropertyTenants';
import LandlordAddTenant from '../pages/landlord/LandlordAddTenant';
import LandlordEditTenant from '../pages/landlord/LandlordEditTenant';
import LandlordPayments from '../pages/landlord/LandlordPayments';
import LandlordMaintenance from '../pages/landlord/LandlordMaintenance';
import LandlordDocuments from '../pages/landlord/LandlordDocuments';
import LandlordPropertyDocuments from '../pages/landlord/LandlordPropertyDocuments';
import LandlordSettings from '../pages/landlord/LandlordSettings';
import LandlordNotifications from '../pages/landlord/LandlordNotifications';

export const landlordRoutes = (
  <>
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
    <Route path="/landlord/notifications" element={<LandlordNotifications />} />
  </>
);
