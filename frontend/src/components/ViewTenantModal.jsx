import { X, User, Mail, Phone, CreditCard, Calendar, Home, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

const ViewTenantModal = ({ isOpen, onClose, tenantId }) => {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && tenantId) {
      fetchTenantDetails();
    }
  }, [isOpen, tenantId]);

  const fetchTenantDetails = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`http://localhost:8000/api/landlord/tenant-details.php?tenant_id=${tenantId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setTenant(data.data);
      } else {
        setError(data.message || 'Failed to load tenant details');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error fetching tenant:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const calculateTenancyDuration = (moveInDate) => {
    if (!moveInDate) return 'N/A';
    const start = new Date(moveInDate);
    const today = new Date();
    const months = Math.floor((today - start) / (1000 * 60 * 60 * 24 * 30));
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    }
    return `${months} month${months !== 1 ? 's' : ''}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold">Tenant Details</h2>
            <p className="text-blue-100 text-sm mt-1">Complete tenant information</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading tenant details...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <XCircle className="text-red-500 flex-shrink-0" size={20} />
              <p className="text-red-700">{error}</p>
            </div>
          ) : tenant ? (
            <div className="space-y-6">
              {/* Profile Section */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <div className="flex-shrink-0">
                    {tenant.profile_image ? (
                      <img
                        src={`http://localhost:8000/${tenant.profile_image}`}
                        alt={tenant.full_name}
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-lg">
                        {tenant.full_name?.charAt(0).toUpperCase() || 'T'}
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{tenant.full_name}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        tenant.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {tenant.status === 'active' ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle size={14} />
                            Active Tenant
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <XCircle size={14} />
                            Inactive
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={16} className="text-blue-600" />
                        <span>Tenant since: <strong>{formatDate(tenant.move_in_date)}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={16} className="text-indigo-600" />
                        <span>Duration: <strong>{calculateTenancyDuration(tenant.move_in_date)}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <User size={18} className="text-blue-600" />
                    Personal Information
                  </h4>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Full Name</label>
                    <p className="text-gray-800 font-medium">{tenant.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">IC Number</label>
                    <p className="text-gray-800 font-medium flex items-center gap-2">
                      <CreditCard size={16} className="text-gray-400" />
                      {tenant.ic_number || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Date of Birth</label>
                    <p className="text-gray-800 font-medium">{formatDate(tenant.date_of_birth)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Age</label>
                    <p className="text-gray-800 font-medium">
                      {tenant.date_of_birth 
                        ? new Date().getFullYear() - new Date(tenant.date_of_birth).getFullYear() + ' years'
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Mail size={18} className="text-blue-600" />
                    Contact Information
                  </h4>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Email Address</label>
                    <a 
                      href={`mailto:${tenant.email}`}
                      className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                    >
                      <Mail size={16} />
                      {tenant.email || 'N/A'}
                    </a>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Phone Number</label>
                    <a 
                      href={`tel:${tenant.phone}`}
                      className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                    >
                      <Phone size={16} />
                      {tenant.phone || 'N/A'}
                    </a>
                  </div>
                </div>
              </div>

              {/* Property Information */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Home size={18} className="text-blue-600" />
                    Property Details
                  </h4>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Property Name</label>
                    <p className="text-gray-800 font-medium">{tenant.property_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Property Type</label>
                    <p className="text-gray-800 font-medium">{tenant.property_type || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-500 mb-1 block">Address</label>
                    <p className="text-gray-800 font-medium">{tenant.property_address || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Monthly Rent</label>
                    <p className="text-gray-800 font-bold text-lg flex items-center gap-2">
                      <DollarSign size={18} className="text-green-600" />
                      {tenant.monthly_rent ? formatCurrency(tenant.monthly_rent) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Move-in Date</label>
                    <p className="text-gray-800 font-medium">{formatDate(tenant.move_in_date)}</p>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <CheckCircle size={18} className="text-blue-600" />
                    Account Information
                  </h4>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Account Status</label>
                    <p className="text-gray-800 font-medium">
                      {tenant.is_active === 1 ? (
                        <span className="text-green-600 flex items-center gap-2">
                          <CheckCircle size={16} />
                          Active
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center gap-2">
                          <XCircle size={16} />
                          Inactive
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Email Verified</label>
                    <p className="text-gray-800 font-medium">
                      {tenant.is_verified === 1 ? (
                        <span className="text-green-600 flex items-center gap-2">
                          <CheckCircle size={16} />
                          Verified
                        </span>
                      ) : (
                        <span className="text-yellow-600 flex items-center gap-2">
                          <XCircle size={16} />
                          Not Verified
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Member Since</label>
                    <p className="text-gray-800 font-medium">{formatDate(tenant.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Last Updated</label>
                    <p className="text-gray-800 font-medium">{formatDate(tenant.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-2xl flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewTenantModal;