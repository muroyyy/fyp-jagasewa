import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Mail, Phone, Calendar, UserPlus, Eye, Edit, Link as LinkIcon, Copy, Trash2 } from 'lucide-react';
import { getCurrentUser } from '../../utils/auth';
import LandlordLayout from '../../components/layout/LandlordLayout';
import ViewTenantModal from '../../components/modals/ViewTenantModal';
import ConfirmModal from '../../components/modals/ConfirmModal';

export default function LandlordTenants() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [tenantToRemove, setTenantToRemove] = useState(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      fetchTenants();
    } else {
      window.location.href = '/login';
    }
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('session_token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/landlord/tenants.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTenants(data.data.tenants);
      } else {
        setError(data.message || 'Failed to fetch tenants data');
      }
    } catch (err) {
      console.error('Error fetching tenants:', err);
      setError('An error occurred while loading tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTenant = (tenantId) => {
    setSelectedTenantId(tenantId);
    setShowViewModal(true);
  };

  const handleEditTenant = (tenantId) => {
    // TODO: Navigate to edit page or open edit modal
    navigate(`/landlord/tenants/edit/${tenantId}`);
  };

  const handleCopyInviteLink = (tenant) => {
    const inviteLink = `${window.location.origin}/signup/tenant?email=${encodeURIComponent(tenant.email)}&invited=true`;
    navigator.clipboard.writeText(inviteLink).then(() => {
      alert('✅ Invitation link copied to clipboard!');
      // Mock email log for demonstration
      console.log('📧 MOCK EMAIL INVITATION:');
      console.log('To:', tenant.email);
      console.log('Subject: Complete Your JagaSewa Tenant Registration');
      console.log('Link:', inviteLink);
      console.log('Message: Your landlord has added you to their property. Click the link to complete your registration.');
    }).catch(() => {
      alert('❌ Failed to copy link. Please try again.');
    });
  };

  const handleRemoveTenant = (tenant) => {
    setTenantToRemove(tenant);
    setShowConfirmModal(true);
  };

  const confirmRemoveTenant = async () => {
    if (!tenantToRemove) return;

    try {
      const token = localStorage.getItem('session_token');
      console.log('Removing tenant:', tenantToRemove.tenant_id);
      console.log('Token:', token);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/landlord/remove-tenant.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tenant_id: tenantToRemove.tenant_id
        })
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        alert('✅ Tenant removed successfully!');
        fetchTenants();
      } else {
        alert('❌ ' + (data.message || 'Failed to remove tenant'));
      }
    } catch (err) {
      console.error('Error removing tenant:', err);
      alert('❌ An error occurred while removing tenant');
    }
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.property_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <LandlordLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading tenants...</p>
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

        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tenants</h1>
          <p className="text-gray-600">Manage and view all your tenants</p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tenants by name, email, or property..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button 
            onClick={() => navigate('/landlord/add-tenant')}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <UserPlus className="w-5 h-5" />
            <span>Add Tenant</span>
          </button>

        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Tenants</p>
                <p className="text-2xl font-bold text-gray-900">{tenants.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Registered Tenants</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tenants.filter(t => t.account_status === 'active').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Invites</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tenants.filter(t => t.account_status === 'pending').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tenants Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tenant</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Property</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Move-in Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Move-out Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Account Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTenants.length > 0 ? (
                  filteredTenants.map((tenant) => {
                    console.log('Tenant data:', tenant); // Debug log
                    return (
                    <tr key={tenant.tenant_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {tenant.profile_image ? (
                            <img
                              src={tenant.profile_image.startsWith('https://') ? tenant.profile_image : `${import.meta.env.VITE_API_URL}/../${tenant.profile_image}`}
                              alt={tenant.full_name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {tenant.full_name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{tenant.full_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span>{tenant.email}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            <span>{tenant.phone || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{tenant.property_name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(tenant.move_in_date)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{tenant.move_out_date ? formatDate(tenant.move_out_date) : <span className="text-green-600 font-medium">Still residing</span>}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          tenant.account_status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : tenant.account_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {tenant.account_status === 'pending' ? 'Invitation Sent' : 
                           tenant.account_status === 'active' ? 'Registered' : 
                           tenant.account_status || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewTenant(tenant.tenant_id)}
                            className="flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => handleEditTenant(tenant.tenant_id)}
                            className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                          {tenant.account_status === 'pending' && (
                            <button
                              onClick={() => handleCopyInviteLink(tenant)}
                              className="flex items-center space-x-1 px-3 py-1 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-sm font-medium transition-colors cursor-pointer"
                              title="Copy invitation link"
                            >
                              <Copy className="w-4 h-4" />
                              <span>Invite</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveTenant(tenant)}
                            className="flex items-center space-x-1 px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium transition-colors cursor-pointer"
                            title="Remove tenant from property"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No tenants found</h3>
                      <p className="text-gray-600">
                        {searchQuery ? 'Try adjusting your search' : 'Add your first tenant to get started'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View Tenant Modal */}
      <ViewTenantModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        tenantId={selectedTenantId}
      />

      {/* Confirm Remove Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setTenantToRemove(null);
        }}
        onConfirm={confirmRemoveTenant}
        title="Remove Tenant"
        message={`Are you sure you want to remove ${tenantToRemove?.full_name} from the property? This will delete their account and all associated data. This action cannot be undone.`}
        confirmText="Remove Tenant"
        cancelText="Cancel"
        type="danger"
      />
    </LandlordLayout>
  );
}