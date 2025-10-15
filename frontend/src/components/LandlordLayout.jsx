import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Building2, Users, DollarSign, Wrench, Settings, LogOut, Bell } from 'lucide-react';
import { isAuthenticated, getUserRole } from '../utils/auth';

export default function LandlordLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState(null);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated() || getUserRole() !== 'landlord') {
      navigate('/login');
      return;
    }

    // Get user data from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUserData(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('session_token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/landlord-dashboard', icon: Home, label: 'Dashboard' },
    { path: '/landlord/properties', icon: Building2, label: 'Properties' },
    { path: '/landlord/tenants', icon: Users, label: 'Tenants' },
    { path: '/landlord/payments', icon: DollarSign, label: 'Payments' },
    { path: '/landlord/maintenance', icon: Wrench, label: 'Maintenance' },
    { path: '/landlord/settings', icon: Settings, label: 'Settings' },
  ];

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!userData?.full_name) return 'L';
    const names = userData.full_name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return userData.full_name[0].toUpperCase();
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Left Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200">
          <Link to="/landlord-dashboard" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Home className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              JagaSewa
            </span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-medium shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl text-red-600 hover:bg-red-50 transition-all cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Page Title - Can be overridden by children */}
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {/* This will be filled by the page content */}
              </h1>
            </div>

            {/* User Profile Section */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Info */}
              <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {userData?.full_name || 'Landlord'}
                  </p>
                  <p className="text-xs text-gray-500">Landlord Account</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                  {getUserInitials()}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}