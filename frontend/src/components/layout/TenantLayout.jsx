import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, CreditCard, Wrench, FileText, Settings, LogOut, Menu, X, Bell, MessageCircle } from 'lucide-react';
import { getCurrentUser, logout } from '../../utils/auth';
import NotificationDropdown from '../shared/NotificationDropdown';
import jagasewaLogo from '../../assets/jagasewa-logo-2.svg';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;

export default function TenantLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [fullName, setFullName] = useState('');
  const user = getCurrentUser();

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      const sessionToken = localStorage.getItem('session_token');
      const response = await fetch(`${API_BASE_URL}/api/tenant/profile.php`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      console.log('Profile API response:', result); // Debug log
      
      if (result.success && result.data.profile) {
        if (result.data.profile.profile_image) {
          // Handle S3 URLs vs local paths correctly
          let imageUrl;
          if (result.data.profile.profile_image.startsWith('https://')) {
            imageUrl = result.data.profile.profile_image;
          } else {
            imageUrl = `${API_BASE_URL}/../${result.data.profile.profile_image}`;
          }
          setProfileImage(imageUrl);
        }
        if (result.data.profile.full_name) {
          setFullName(result.data.profile.full_name);
        }
      } else {
        console.error('Profile API failed:', result);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/tenant-dashboard' },
    { icon: MessageCircle, label: 'Messages', path: '/messages' },
    { icon: CreditCard, label: 'Payments', path: '/tenant/payments' },
    { icon: Wrench, label: 'Maintenance', path: '/tenant/maintenance' },
    { icon: FileText, label: 'Documents', path: '/tenant/documents' },
    { icon: Settings, label: 'Settings', path: '/tenant/settings' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-teal-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 fixed w-full z-30 top-0">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Hamburger Menu */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
              >
                <Menu className="h-6 w-6" />
              </button>
              
              {/* JagaSewa Logo - Desktop Only */}
              <div className="hidden lg:flex items-center">
                <img 
                  src={jagasewaLogo} 
                  alt="JagaSewa" 
                  className="h-10 w-auto"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationDropdown userType="tenant" />
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-gray-900">{fullName || 'Tenant'}</p>
                  <p className="text-xs text-gray-500">Tenant Account</p>
                </div>
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover shadow-lg border-2 border-white"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {fullName?.charAt(0) || 'T'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header with Logo */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <img 
                src={jagasewaLogo} 
                alt="JagaSewa" 
                className="h-10 w-auto"
              />
            </div>
            
            {/* Close button for mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 space-y-2 mt-4">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive(item.path)
                    ? 'text-green-600 bg-green-50'
                    : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Sidebar overlay with blur */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <main className={`pt-16 transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
      }`}>
        {children}
      </main>
    </div>
  );
}