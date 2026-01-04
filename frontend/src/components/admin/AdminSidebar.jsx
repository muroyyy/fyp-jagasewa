import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building, 
  Settings, 
  User, 
  LogOut,
  X
} from 'lucide-react';
import jagasewaLogo from '../../assets/jagasewa-logo-2.svg';

const AdminSidebar = ({ isOpen, onClose }) => {
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
    { path: '/admin/profile', icon: User, label: 'Admin Profile' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg flex flex-col transform transition-all duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={jagasewaLogo} 
              alt="JagaSewa" 
              className="h-10 w-auto"
            />
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
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
                      ? 'bg-purple-50 text-purple-600 border-r-2 border-purple-600'
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
          className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
    </>
  );
};

export default AdminSidebar;