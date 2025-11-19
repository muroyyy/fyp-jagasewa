import { useState, useEffect } from 'react';
import { Users, Building, DollarSign, Activity, Eye, UserCheck, TrendingUp, TrendingDown } from 'lucide-react';
import AnalyticsCard from '../../components/admin/AnalyticsCard';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLandlords: 0,
    totalTenants: 0,
    totalProperties: 0,
    activeRentals: 0,
    monthlyRevenue: 0,
    pendingVerifications: 0,
    systemUptime: '99.9%',
    totalExpenses: 0,
    propertyStatus: { occupied: 0, vacant: 0, maintenance: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchDashboardStats();
    fetchRecentActivities();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/dashboard-stats.php`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/recent-activities.php`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setRecentActivities(data.data);
      }
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Monitor platform performance and user activities</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard
          title="Total Users"
          value={stats.totalUsers}
          change="+12%"
          changeType="increase"
          icon={Users}
          color="indigo"
        />
        <AnalyticsCard
          title="Total Properties"
          value={stats.totalProperties}
          change="+8%"
          changeType="increase"
          icon={Building}
          color="green"
        />
        <AnalyticsCard
          title="Active Rentals"
          value={stats.activeRentals}
          change="+15%"
          changeType="increase"
          icon={Activity}
          color="slate"
        />
        <AnalyticsCard
          title="Pending Verifications"
          value={stats.pendingVerifications}
          change="-5%"
          changeType="decrease"
          icon={Eye}
          color="yellow"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-lg">
              <Users className="text-indigo-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Landlords</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalLandlords}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <UserCheck className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tenants</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTenants}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <Activity className="text-slate-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">System Uptime</p>
              <p className="text-2xl font-bold text-gray-900">{stats.systemUptime}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Overview & Property Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Financial Overview</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">RM {stats.monthlyRevenue.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
                  <p className="text-2xl font-bold text-gray-900">RM {stats.totalExpenses.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
                  <p className="text-2xl font-bold text-gray-900">RM {(stats.monthlyRevenue - stats.totalExpenses).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Property Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Property Status Distribution</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Building className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Occupied</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.propertyStatus.occupied}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">{stats.totalProperties > 0 ? ((stats.propertyStatus.occupied / stats.totalProperties) * 100).toFixed(1) : 0}%</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Building className="text-yellow-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vacant</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.propertyStatus.vacant}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">{stats.totalProperties > 0 ? ((stats.propertyStatus.vacant / stats.totalProperties) * 100).toFixed(1) : 0}%</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Activity className="text-orange-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Maintenance</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.propertyStatus.maintenance}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">{stats.totalProperties > 0 ? ((stats.propertyStatus.maintenance / stats.totalProperties) * 100).toFixed(1) : 0}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
        </div>
        <div className="p-6">
          {recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No recent activities</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;