import { Bell, Search, User } from 'lucide-react';
import { useState, useEffect } from 'react';

const AdminHeader = () => {
  const [adminName, setAdminName] = useState('Admin User');

  useEffect(() => {
    // TODO: Fetch admin profile data
    const fetchAdminProfile = async () => {
      try {
        const token = localStorage.getItem('session_token');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/profile.php`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setAdminName(data.data.full_name || 'Admin User');
        }
      } catch (error) {
        console.error('Error fetching admin profile:', error);
      }
    };

    fetchAdminProfile();
  }, []);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold text-gray-800">Admin Dashboard</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search users, properties..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <button className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              3
            </span>
          </button>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
              <User className="text-white" size={16} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{adminName}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;