import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, DollarSign, Wrench, FileText, MapPin, User as UserIcon, Phone, Mail } from 'lucide-react';
import { getCurrentUser, handleApiResponse } from '../../utils/auth';
import TenantLayout from '../../components/layout/TenantLayout';

export default function TenantDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [property, setProperty] = useState(null);
  const [nextPayment, setNextPayment] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      fetchDashboardData();
    } else {
      window.location.href = '/login';
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('session_token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tenant/dashboard.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      // Handle 401 responses (auto-logout)
      const validResponse = await handleApiResponse(response);
      if (!validResponse) return; // User was logged out

      const data = await response.json();

      if (response.ok && data.success) {
        setProfile(data.data.profile);
        setProperty(data.data.property);
        setNextPayment(data.data.next_payment);
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

  const formatAmount = (amount) => {
    return `RM ${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const statCards = [
    { 
      icon: DollarSign, 
      label: 'Next Payment', 
      value: nextPayment ? formatAmount(nextPayment.amount) : 'RM 0', 
      color: 'green', 
      subtext: nextPayment ? `Due: ${formatDate(nextPayment.due_date)}` : 'No payment due' 
    },
    { 
      icon: Wrench, 
      label: 'Maintenance Requests', 
      value: stats?.maintenance_total || '0', 
      color: 'orange', 
      subtext: `${stats?.maintenance_pending || 0} pending` 
    },
    { 
      icon: FileText, 
      label: 'Documents', 
      value: '0', 
      color: 'blue', 
      subtext: 'Available' 
    }
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
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.full_name || 'Tenant'}!
          </h1>
          <p className="text-gray-600">Manage your rental and payments here.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, idx) => (
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
              {stats?.total_payments > 0 ? (
                <>
                  <p className="text-lg font-semibold text-gray-900 mb-1">
                    {stats.total_payments} payment{stats.total_payments > 1 ? 's' : ''} made
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Total: {formatAmount(stats.total_paid)}
                  </p>
                </>
              ) : (
                <p className="mb-4">No payment history yet</p>
              )}
              <button 
                onClick={() => navigate('/tenant/payments')}
                className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
              >
                {nextPayment ? 'Make Payment' : 'View Payments'}
              </button>
            </div>
          </div>

          {/* Maintenance Requests */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Maintenance Requests</h2>
            <div className="text-center py-8 text-gray-500">
              <Wrench className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              {stats?.maintenance_total > 0 ? (
                <>
                  <p className="text-lg font-semibold text-gray-900 mb-1">
                    {stats.maintenance_total} request{stats.maintenance_total > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    {stats.maintenance_pending} pending, {stats.maintenance_completed} completed
                  </p>
                </>
              ) : (
                <p className="mb-4">No maintenance requests</p>
              )}
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
        <div 
          className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-8 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => property && navigate('/tenant/my-property')}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-between">
            <span>My Property</span>
            {property && (
              <span className="text-sm text-green-600 font-normal">Click to view details →</span>
            )}
          </h2>
          {property ? (
            <div className="space-y-6">
              {/* Property Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Home className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{property.property_name}</h3>
                      <p className="text-sm text-gray-600">{property.property_type}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                      <div className="text-sm text-gray-600">
                        <p>{property.address}</p>
                        <p>{property.city}, {property.state} {property.postal_code}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-900 font-semibold">
                        {formatAmount(property.monthly_rent)}/month
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Home className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        Move-in date: {formatDate(property.move_in_date)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Landlord Information */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Landlord Contact</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <UserIcon className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-900">{property.landlord.name}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-600">{property.landlord.email}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-600">{property.landlord.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Property Status */}
              <div className="pt-4 border-t border-gray-200">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  property.status === 'Active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  Property Status: {property.status}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Home className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No property assigned yet</p>
              <p className="text-sm mt-2">Contact your landlord to get assigned to a property</p>
            </div>
          )}
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
              <p className="text-sm text-gray-600 mb-1">IC Number</p>
              <p className="text-gray-900 font-medium">{profile?.ic_number || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </TenantLayout>
  );
}