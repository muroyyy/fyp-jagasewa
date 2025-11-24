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
            <h2 className="text-xl font-bold text-gray-900 mb-6">Financial Overview</h2>
            
            {/* Bar Chart */}
            <div className="mb-6">
              {(() => {
                const revenue = stats?.monthly_revenue || 0;
                const expenses = stats?.total_expenses || 0;
                const maxValue = Math.max(revenue, expenses, 1);
                const revenueHeight = (revenue / maxValue) * 100;
                const expensesHeight = (expenses / maxValue) * 100;
                
                return (
                  <div className="flex items-end justify-center gap-12 h-80 px-4">
                    {/* Revenue Bar */}
                    <div className="flex flex-col items-center gap-3 w-32">
                      <div className="w-full flex flex-col justify-end h-full relative">
                        <div 
                          className="w-full bg-gradient-to-t from-green-600 via-green-500 to-green-400 rounded-t-xl transition-all duration-700 ease-out hover:shadow-2xl hover:scale-105 relative group shadow-lg"
                          style={{ 
                            height: `${Math.max(revenueHeight, 5)}%`,
                            minHeight: revenue > 0 ? '40px' : '0px'
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl"></div>
                          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-10">
                            RM {revenue.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                          </div>
                        </div>
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Revenue</p>
                        <p className="text-lg font-bold text-gray-900">RM {revenue.toLocaleString('en-MY', { maximumFractionDigits: 0 })}</p>
                      </div>
                    </div>

                    {/* Expenses Bar */}
                    <div className="flex flex-col items-center gap-3 w-32">
                      <div className="w-full flex flex-col justify-end h-full relative">
                        <div 
                          className="w-full bg-gradient-to-t from-red-600 via-red-500 to-red-400 rounded-t-xl transition-all duration-700 ease-out hover:shadow-2xl hover:scale-105 relative group shadow-lg"
                          style={{ 
                            height: `${Math.max(expensesHeight, 5)}%`,
                            minHeight: expenses > 0 ? '40px' : '0px'
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl"></div>
                          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-10">
                            RM {expenses.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                          </div>
                        </div>
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Expenses</p>
                        <p className="text-lg font-bold text-gray-900">RM {expenses.toLocaleString('en-MY', { maximumFractionDigits: 0 })}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Net Profit Summary */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 rounded-lg">
                    <DollarSign className="text-blue-600" size={22} />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Net Profit This Month</p>
                </div>
                <p className={`text-2xl font-bold ${
                  ((stats?.monthly_revenue || 0) - (stats?.total_expenses || 0)) >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  RM {((stats?.monthly_revenue || 0) - (stats?.total_expenses || 0)).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Property Status Distribution */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Property Status Distribution</h2>
            
            {/* Pie Chart */}
            <div className="flex flex-col items-center">
              <div className="relative w-48 h-48 mb-6">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  {(() => {
                    const occupied = stats?.property_status?.occupied || 0;
                    const vacant = stats?.property_status?.vacant || 0;
                    const maintenance = stats?.property_status?.maintenance || 0;
                    const total = occupied + vacant + maintenance;
                    
                    if (total === 0) {
                      return <circle cx="50" cy="50" r="40" fill="#e5e7eb" />;
                    }
                    
                    const occupiedPercent = (occupied / total) * 100;
                    const vacantPercent = (vacant / total) * 100;
                    const maintenancePercent = (maintenance / total) * 100;
                    
                    const circumference = 2 * Math.PI * 40;
                    const occupiedLength = (occupiedPercent / 100) * circumference;
                    const vacantLength = (vacantPercent / 100) * circumference;
                    const maintenanceLength = (maintenancePercent / 100) * circumference;
                    
                    return (
                      <>
                        {/* Occupied */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="20"
                          strokeDasharray={`${occupiedLength} ${circumference}`}
                          strokeDashoffset="0"
                          className="transition-all duration-500"
                        />
                        {/* Vacant */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#eab308"
                          strokeWidth="20"
                          strokeDasharray={`${vacantLength} ${circumference}`}
                          strokeDashoffset={-occupiedLength}
                          className="transition-all duration-500"
                        />
                        {/* Maintenance */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#f97316"
                          strokeWidth="20"
                          strokeDasharray={`${maintenanceLength} ${circumference}`}
                          strokeDashoffset={-(occupiedLength + vacantLength)}
                          className="transition-all duration-500"
                        />
                      </>
                    );
                  })()}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">{stats?.total_properties || 0}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                </div>
              </div>
              
              {/* Legend */}
              <div className="space-y-3 w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-700">Occupied</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{stats?.property_status?.occupied || 0}</span>
                    <span className="text-xs text-gray-500 ml-1">({stats?.total_properties > 0 ? (((stats?.property_status?.occupied || 0) / stats?.total_properties) * 100).toFixed(1) : 0}%)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                    <span className="text-sm text-gray-700">Vacant</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{stats?.property_status?.vacant || 0}</span>
                    <span className="text-xs text-gray-500 ml-1">({stats?.total_properties > 0 ? (((stats?.property_status?.vacant || 0) / stats?.total_properties) * 100).toFixed(1) : 0}%)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                    <span className="text-sm text-gray-700">Maintenance</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{stats?.property_status?.maintenance || 0}</span>
                    <span className="text-xs text-gray-500 ml-1">({stats?.total_properties > 0 ? (((stats?.property_status?.maintenance || 0) / stats?.total_properties) * 100).toFixed(1) : 0}%)</span>
                  </div>
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