import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Building2, Users, DollarSign, Wrench, FileText, Settings, LogOut, Bell, Menu, X, MessageCircle } from 'lucide-react';
import { isAuthenticated, getUserRole } from '../../utils/auth';
import NotificationDropdown from '../shared/NotificationDropdown';
import jagasewaLogo from '../../assets/jagasewa-logo-2.svg';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;

export default function LandlordLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
        fetchProfileImage();
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, [navigate]);

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('session_token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const navItems = [
    { path: '/landlord-dashboard', icon: Home, label: 'Dashboard' },
    { path: '/landlord/properties', icon: Building2, label: 'Properties' },
    { path: '/landlord/tenants', icon: Users, label: 'Tenants' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
    { path: '/landlord/payments', icon: DollarSign, label: 'Payments' },
    { path: '/landlord/maintenance', icon: Wrench, label: 'Maintenance' },
    { path: '/landlord/documents', icon: FileText, label: 'Documents' }, 
    { path: '/landlord/settings', icon: Settings, label: 'Settings' },
  ];

  // Get user initials for avatar
  const fetchProfileImage = async () => {
    try {
      const sessionToken = localStorage.getItem('session_token');
      const response = await fetch(`${API_BASE_URL}/api/landlord/profile.php`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (result.success && result.data.profile_image) {
        const imageUrl = result.data.profile_image.startsWith('https://') 
          ? result.data.profile_image 
          : `${API_BASE_URL}/../${result.data.profile_image}`;
        setProfileImage(imageUrl);
      }
    } catch (error) {
      console.error('Error fetching profile image:', error);
    }
  };

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
      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Left Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          w-64 bg-white border-r border-gray-200 flex flex-col
          transform transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <Link to="/landlord-dashboard" className="flex items-center">
            <img 
              src={jagasewaLogo} 
              alt="JagaSewa" 
              className="h-10 w-auto"
            />
          </Link>
          
          {/* Close button for mobile */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden text-gray-500 hover:text-gray-700 p-2 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
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
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
        isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
      }`}>
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left side: Burger menu */}
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleSidebar}
                className="text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {/* This will be filled by the page content */}
              </h1>
            </div>

            {/* User Profile Section */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Notifications */}
              <NotificationDropdown userType="landlord" />

              {/* User Info */}
              <div className="flex items-center space-x-2 sm:space-x-3 pl-2 sm:pl-4 border-l border-gray-200">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {userData?.full_name || 'Landlord'}
                  </p>
                  <p className="text-xs text-gray-500">Landlord Account</p>
                </div>
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shadow-lg border-2 border-white"
                  />
                ) : (
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg text-sm sm:text-base">
                    {getUserInitials()}
                  </div>
                )}
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