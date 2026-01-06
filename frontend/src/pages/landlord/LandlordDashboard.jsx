import React, { useState, useEffect } from 'react';
import { Building2, Users, DollarSign, Wrench, Bell, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../utils/auth';
import { fetchWithAuth } from '../../utils/sessionHandler';
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
      
      const response = await fetchWithAuth(
        `${import.meta.env.VITE_API_URL}/api/landlord/dashboard.php`,
        { method: 'GET' },
        navigate
      );

      if (!response) return; // Session expired, user redirected

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
      <div className="p-4 sm:p-6 lg:p-8 h-screen overflow-hidden">
        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Welcome back, {profile?.full_name || 'Landlord'}!
          </h1>
          <p className="text-gray-600 text-sm">Here's what's happening with your properties today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          {statsCards.map((stat, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  stat.color === 'blue' ? 'bg-blue-100' :
                  stat.color === 'green' ? 'bg-green-100' :
                  stat.color === 'purple' ? 'bg-purple-100' :
                  'bg-orange-100'
                }`}>
                  <stat.icon className={`w-4 h-4 ${
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-3 gap-4 h-[calc(100vh-280px)]">
          {/* Financial Overview */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Financial Overview</h2>
            
            {/* Compact Bar Chart */}
            <div className="mb-4">
              {(() => {
                const revenue = stats?.monthly_revenue || 0;
                const expenses = stats?.total_expenses || 0;
                const maxValue = Math.max(revenue, expenses, 1);
                const revenueHeight = (revenue / maxValue) * 100;
                const expensesHeight = (expenses / maxValue) * 100;
                
                return (
                  <div className="flex items-end justify-center gap-8 h-32">
                    {/* Revenue Bar */}
                    <div className="flex flex-col items-center gap-2 w-16">
                      <div className="w-full flex flex-col justify-end h-full relative">
                        <div 
                          className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg transition-all duration-500"
                          style={{ 
                            height: `${Math.max(revenueHeight, 5)}%`,
                            minHeight: revenue > 0 ? '20px' : '0px'
                          }}
                        ></div>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium text-green-600">Revenue</p>
                        <p className="text-sm font-bold text-gray-900">RM {revenue.toLocaleString('en-MY', { maximumFractionDigits: 0 })}</p>
                      </div>
                    </div>

                    {/* Expenses Bar */}
                    <div className="flex flex-col items-center gap-2 w-16">
                      <div className="w-full flex flex-col justify-end h-full relative">
                        <div 
                          className="w-full bg-gradient-to-t from-red-600 to-red-400 rounded-t-lg transition-all duration-500"
                          style={{ 
                            height: `${Math.max(expensesHeight, 5)}%`,
                            minHeight: expenses > 0 ? '20px' : '0px'
                          }}
                        ></div>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium text-red-600">Expenses</p>
                        <p className="text-sm font-bold text-gray-900">RM {expenses.toLocaleString('en-MY', { maximumFractionDigits: 0 })}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Net Profit */}
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded-md">
                    <DollarSign className="text-blue-600" size={16} />
                  </div>
                  <p className="text-xs font-medium text-gray-700">Net Profit</p>
                </div>
                <p className={`text-lg font-bold ${
                  ((stats?.monthly_revenue || 0) - (stats?.total_expenses || 0)) >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  RM {((stats?.monthly_revenue || 0) - (stats?.total_expenses || 0)).toLocaleString('en-MY', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>

          {/* Property Status */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Property Status</h2>
            
            {/* Compact Pie Chart */}
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 mb-3">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  {(() => {
                    const occupied = stats?.property_status?.occupied || 0;
                    const vacant = stats?.property_status?.vacant || 0;
                    const maintenance = stats?.property_status?.maintenance || 0;
                    const total = occupied + vacant + maintenance;
                    
                    if (total === 0) {
                      return <circle cx="50" cy="50" r="35" fill="#e5e7eb" />;
                    }
                    
                    const occupiedPercent = (occupied / total) * 100;
                    const vacantPercent = (vacant / total) * 100;
                    const maintenancePercent = (maintenance / total) * 100;
                    
                    const circumference = 2 * Math.PI * 35;
                    const occupiedLength = (occupiedPercent / 100) * circumference;
                    const vacantLength = (vacantPercent / 100) * circumference;
                    const maintenanceLength = (maintenancePercent / 100) * circumference;
                    
                    return (
                      <>
                        <circle cx="50" cy="50" r="35" fill="none" stroke="#10b981" strokeWidth="15" strokeDasharray={`${occupiedLength} ${circumference}`} strokeDashoffset="0" />
                        <circle cx="50" cy="50" r="35" fill="none" stroke="#eab308" strokeWidth="15" strokeDasharray={`${vacantLength} ${circumference}`} strokeDashoffset={-occupiedLength} />
                        <circle cx="50" cy="50" r="35" fill="none" stroke="#f97316" strokeWidth="15" strokeDasharray={`${maintenanceLength} ${circumference}`} strokeDashoffset={-(occupiedLength + vacantLength)} />
                      </>
                    );
                  })()}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{stats?.total_properties || 0}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                </div>
              </div>
              
              {/* Compact Legend */}
              <div className="space-y-1 w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs text-gray-700">Occupied</span>
                  </div>
                  <span className="text-xs font-bold text-gray-900">{stats?.property_status?.occupied || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span className="text-xs text-gray-700">Vacant</span>
                  </div>
                  <span className="text-xs font-bold text-gray-900">{stats?.property_status?.vacant || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span className="text-xs text-gray-700">Maintenance</span>
                  </div>
                  <span className="text-xs font-bold text-gray-900">{stats?.property_status?.maintenance || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity & Quick Actions */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Quick Actions</h2>
            
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/landlord/properties')}
                className="w-full p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Manage Properties</p>
                    <p className="text-xs text-gray-600">Add or edit properties</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => navigate('/landlord/tenants')}
                className="w-full p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Tenant Management</p>
                    <p className="text-xs text-gray-600">View tenant details</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => navigate('/landlord/payments')}
                className="w-full p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Payment Records</p>
                    <p className="text-xs text-gray-600">Track payments</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => navigate('/landlord/maintenance')}
                className="w-full p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Wrench className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Maintenance</p>
                    <p className="text-xs text-gray-600">Handle requests</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </LandlordLayout>
  );
}