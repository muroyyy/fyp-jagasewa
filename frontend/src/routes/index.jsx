import { Routes, Route } from 'react-router-dom';
import { generalRoutes } from './generalRoutes';
import { authRoutes } from './authRoutes';
import { landlordRoutes } from './landlordRoutes';
import { tenantRoutes } from './tenantRoutes';
import { adminRoutes } from './adminRoutes';

export default function AppRoutes() {
  return (
    <Routes>
      {generalRoutes}
      {authRoutes}
      {landlordRoutes}
      {tenantRoutes}
      {adminRoutes}
    </Routes>
  );
}
