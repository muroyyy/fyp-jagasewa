import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, DollarSign, Wrench, FileText } from 'lucide-react';
import { getCurrentUser } from '../../utils/auth';
import TenantLayout from '../../components/TenantLayout';

export default function TenantDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setProfile(currentUser.profile);
      setLoading(false);
    } else {
      window.location.href = '/login';
    }
  }, []);

  const stats = [
    { icon: DollarSign, label: 'Next Payment', value: 'RM 0', color: 'green', subtext: 'No payment due' },
    { icon: Wrench, label: 'Maintenance Requests', value: '0', color: 'orange', subtext: 'Active requests' },
    { icon: FileText, label: 'Documents', value: '0', color: 'blue', subtext: 'Available' }
  ];

  if (loading) {
    return (
      <TenantLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.full_name || 'Tenant'}!
          </h1>
          <p className="text-gray-600">Manage your rental and payments here.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  stat.color === 'green' ? 'bg-green-100' :
                  stat.color === 'orange' ? 'bg-orange-100' :
                  'bg-blue-100'
                }`}>
                  <stat.icon className={`w-6 h-6 ${
                    stat.color === 'green' ? 'text-green-600' :
                    stat.color === 'orange' ? 'text-orange-600' :
                    'text-blue-600'
                  }`} />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.subtext}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Payment Section */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Payment History</h2>
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No payment history yet</p>
              <button 
                onClick={() => navigate('/tenant/payments')}
                className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
              >
                Make Payment
              </button>
            </div>
          </div>

          {/* Maintenance Requests */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Maintenance Requests</h2>
            <div className="text-center py-8 text-gray-500">
              <Wrench className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No maintenance requests</p>
              <button 
                onClick={() => navigate('/tenant/maintenance')}
                className="mt-4 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors cursor-pointer"
              >
                New Request
              </button>
            </div>
          </div>
        </div>

        {/* Property Information */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">My Property</h2>
          <div className="text-center py-8 text-gray-500">
            <Home className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No property assigned yet</p>
            <p className="text-sm mt-2">Contact your landlord to get assigned to a property</p>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Full Name</p>
              <p className="text-gray-900 font-medium">{profile?.full_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Email</p>
              <p className="text-gray-900 font-medium">{profile?.email || user?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Phone</p>
              <p className="text-gray-900 font-medium">{profile?.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">IC Number</p>
              <p className="text-gray-900 font-medium">{profile?.ic_number || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </TenantLayout>
  );
}