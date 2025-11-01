import { X, User, Mail, Phone, Calendar, Shield, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';

const UserDetailsModal = ({ isOpen, onClose, user, onUserUpdate }) => {
  const [loading, setLoading] = useState(false);

  const handleStatusToggle = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/user-status.php`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: user.user_id,
          is_active: !user.is_active
        })
      });

      const data = await response.json();
      if (data.success) {
        onUserUpdate({ ...user, is_active: !user.is_active });
        onClose();
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-slate-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">User Details</h2>
            <p className="text-indigo-100 text-sm mt-1">Manage user account</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User Profile */}
          <div className="bg-gradient-to-br from-indigo-50 to-slate-50 rounded-xl p-6 border border-indigo-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-slate-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800">{user.full_name || user.email}</h3>
                <p className="text-gray-600">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user.user_role === 'admin' ? 'bg-purple-100 text-purple-700' :
                    user.user_role === 'landlord' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    <Shield size={14} className="inline mr-1" />
                    {user.user_role?.charAt(0).toUpperCase() + user.user_role?.slice(1)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {user.is_active ? (
                      <><CheckCircle size={14} className="inline mr-1" />Active</>
                    ) : (
                      <><XCircle size={14} className="inline mr-1" />Inactive</>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <User size={18} className="text-indigo-600" />
                Account Information
              </h4>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Email Address</label>
                <p className="text-gray-800 font-medium flex items-center gap-2">
                  <Mail size={16} className="text-gray-400" />
                  {user.email}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">User Role</label>
                <p className="text-gray-800 font-medium">{user.user_role}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Account Status</label>
                <p className={`font-medium ${user.is_active ? 'text-green-600' : 'text-red-600'}`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Verification Status</label>
                <p className={`font-medium ${user.is_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                  {user.is_verified ? 'Verified' : 'Pending Verification'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Created Date</label>
                <p className="text-gray-800 font-medium flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400" />
                  {formatDate(user.created_at)}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Last Updated</label>
                <p className="text-gray-800 font-medium">{formatDate(user.updated_at)}</p>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          {user.phone && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <h4 className="font-semibold text-gray-800">Contact Information</h4>
              </div>
              <div className="p-6">
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Phone Number</label>
                  <p className="text-gray-800 font-medium flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    {user.phone}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleStatusToggle}
              disabled={loading}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                user.is_active
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {loading ? 'Updating...' : user.is_active ? 'Deactivate User' : 'Activate User'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;