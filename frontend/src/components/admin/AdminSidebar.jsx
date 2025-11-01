import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building, 
  Settings, 
  User, 
  LogOut,
  Shield
} from 'lucide-react';

const AdminSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('session_token');
    localStorage.removeItem('user_role');
    navigate('/login');
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/users', icon: Users, label: 'User Management' },
    { path: '/admin/properties', icon: Building, label: 'Properties' },
    { path: '/admin/settings', icon: Settings, label: 'System Settings' },
    { path: '/admin/profile', icon: User, label: 'Admin Profile' },
  ];

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Shield className="text-indigo-600" size={32} />
          <div>
            <h1 className="text-xl font-bold text-gray-800">JagaSewa</h1>
            <p className="text-sm text-gray-500">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 border-r-2 border-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  }`
                }
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;