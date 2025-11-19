import React, { useState, useEffect } from 'react';
import { Building2, Users, DollarSign, Wrench, Bell, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../utils/auth';
import LandlordLayout from '../../components/layout/LandlordLayout';

export default function LandlordDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      fetchDashboardData();
    } else {
      setLoading(false);
      window.location.href = '/login';
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('session_token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/landlord/dashboard.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setProfile(data.data.profile);
        setStats(data.data.stats);
      } else {
        setError(data.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('An error occurred while loading your dashboard');
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    { icon: Building2, label: 'Total Properties', value: stats?.total_properties || 0, color: 'blue' },
    { icon: Users, label: 'Total Tenants', value: stats?.total_tenants || 0, color: 'green' },
    { icon: DollarSign, label: 'Monthly Revenue', value: `RM ${stats?.monthly_revenue || 0}`, color: 'purple' },
    { icon: Wrench, label: 'Pending Requests', value: stats?.pending_requests || 0, color: 'orange' }
  ];

  if (loading) {
    return (
      <LandlordLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </LandlordLayout>
    );
  }

  return (
    <LandlordLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.full_name || 'Landlord'}!
          </h1>
          <p className="text-gray-600">Here's what's happening with your properties today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  stat.color === 'blue' ? 'bg-blue-100' :
                  stat.color === 'green' ? 'bg-green-100' :
                  stat.color === 'purple' ? 'bg-purple-100' :
                  'bg-orange-100'
                }`}>
                  <stat.icon className={`w-6 h-6 ${
                    stat.color === 'blue' ? 'text-blue-600' :
                    stat.color === 'green' ? 'text-green-600' :
                    stat.color === 'purple' ? 'text-purple-600' :
                    'text-orange-600'
                  }`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Financial Overview & Property Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Financial Overview */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Financial Overview</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="text-green-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">RM {(stats?.monthly_revenue || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <TrendingDown className="text-red-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Expenses</p>
                    <p className="text-2xl font-bold text-gray-900">RM {(stats?.total_expenses || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <DollarSign className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Net Profit</p>
                    <p className="text-2xl font-bold text-gray-900">RM {((stats?.monthly_revenue || 0) - (stats?.total_expenses || 0)).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Property Status Distribution */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Property Status Distribution</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Building2 className="text-green-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Occupied</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.property_status?.occupied || 0}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{stats?.total_properties > 0 ? (((stats?.property_status?.occupied || 0) / stats?.total_properties) * 100).toFixed(1) : 0}%</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Building2 className="text-yellow-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Vacant</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.property_status?.vacant || 0}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{stats?.total_properties > 0 ? (((stats?.property_status?.vacant || 0) / stats?.total_properties) * 100).toFixed(1) : 0}%</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Activity className="text-orange-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Maintenance</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.property_status?.maintenance || 0}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{stats?.total_properties > 0 ? (((stats?.property_status?.maintenance || 0) / stats?.total_properties) * 100).toFixed(1) : 0}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Properties */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Properties</h2>
            <div className="text-center py-8 text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No properties added yet</p>
              <button 
                onClick={() => navigate('/landlord/properties')}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Add Property
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No recent activity</p>
            </div>
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
              <p className="text-gray-900 font-medium">{profile?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Phone</p>
              <p className="text-gray-900 font-medium">{profile?.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Company</p>
              <p className="text-gray-900 font-medium">{profile?.company_name || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </LandlordLayout>
  );
}