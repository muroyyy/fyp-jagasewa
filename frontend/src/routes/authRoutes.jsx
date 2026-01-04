import { Route } from 'react-router-dom';
import Login from '../pages/auth/Login';
import Signup from '../pages/auth/Signup';
import SignupLandlord from '../pages/auth/SignupLandlord';
import SignupTenant from '../pages/auth/SignupTenant';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import TenantInvitation from '../pages/auth/TenantInvitation';

export const authRoutes = (
  <>
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
    <Route path="/signup/landlord" element={<SignupLandlord />} />
    <Route path="/signup/tenant" element={<SignupTenant />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/tenant-invitation" element={<TenantInvitation />} />
  </>
);
