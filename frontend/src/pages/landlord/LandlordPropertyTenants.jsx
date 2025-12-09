import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Users, Search, Mail, Phone, Calendar, Eye, Edit, Copy, Trash2, ArrowLeft, UserPlus } from 'lucide-react';
import { getCurrentUser } from '../../utils/auth';
import LandlordLayout from '../../components/layout/LandlordLayout';
import ViewTenantModal from '../../components/modals/ViewTenantModal';
import ConfirmModal from '../../components/modals/ConfirmModal';

export default function LandlordPropertyTenants() {
  const navigate = useNavigate();
  const { propertyId } = useParams();
  const [tenants, setTenants] = useState([]);
  const [propertyName, setPropertyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [tenantToRemove, setTenantToRemove] = useState(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      window.location.href = '/login';
      return;
    }
    fetchTenants();
  }, [propertyId]);

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/landlord/property-tenants.php?property_id=${propertyId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setTenants(data.data.tenants);
        setPropertyName(data.data.property_name);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInviteLink = (tenant) => {
    const inviteLink = `${window.location.origin}/signup/tenant?email=${encodeURIComponent(tenant.email)}&invited=true`;
    navigator.clipboard.writeText(inviteLink).then(() => {
      alert('✅ Invitation link copied to clipboard!');
    }).catch(() => {
      alert('❌ Failed to copy link');
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/landlord/remove-tenant.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tenant_id: tenantToRemove.tenant_id })
      });
      const data = await response.json();
      if (data.success) {
        alert('✅ Tenant removed successfully!');
        fetchTenants();
      } else {
        alert('❌ ' + (data.message || 'Failed to remove tenant'));
      }
    } catch (err) {
      alert('❌ An error occurred');
    }
  };

  const filteredTenants = tenants.filter(t =>
    t.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <LandlordLayout>
        <div className="flex items-center justify-center h-full">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </LandlordLayout>
    );
  }

  return (
    <LandlordLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/landlord/tenants')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Properties</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{propertyName}</h1>
          <p className="text-gray-600">Manage tenants for this property</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tenants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button 
            onClick={() => navigate('/landlord/add-tenant')}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <UserPlus className="w-5 h-5" />
            <span>Add Tenant</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
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
                <p className="text-sm text-gray-600 mb-1">Active Tenants</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tenants.filter(t => t.account_status === 'active').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Tenant</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Move-in</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Move-out</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTenants.length > 0 ? (
                  filteredTenants.map((tenant) => (
                    <tr key={tenant.tenant_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">{tenant.full_name.charAt(0)}</span>
                          </div>
                          <p className="font-semibold text-gray-900">{tenant.full_name}</p>
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
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(tenant.move_in_date)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {tenant.move_out_date ? (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(tenant.move_out_date)}</span>
                          </div>
                        ) : (
                          <span className="text-green-600 font-medium text-sm">Still Residing</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          tenant.account_status === 'active' ? 'bg-green-100 text-green-800' :
                          tenant.account_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {tenant.account_status === 'pending' ? 'Invitation Sent' :
                           tenant.account_status === 'active' ? 'Registered' :
                           tenant.account_status || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => { setSelectedTenantId(tenant.tenant_id); setShowViewModal(true); }}
                            className="flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => navigate(`/landlord/tenants/edit/${tenant.tenant_id}`)}
                            className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                          {tenant.account_status === 'pending' && (
                            <button
                              onClick={() => handleCopyInviteLink(tenant)}
                              className="flex items-center space-x-1 px-3 py-1 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-sm font-medium transition-colors"
                            >
                              <Copy className="w-4 h-4" />
                              <span>Invite</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveTenant(tenant)}
                            className="flex items-center space-x-1 px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No tenants found</h3>
                      <p className="text-gray-600">
                        {searchQuery ? 'Try adjusting your search' : 'Add your first tenant to this property'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ViewTenantModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        tenantId={selectedTenantId}
      />

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => { setShowConfirmModal(false); setTenantToRemove(null); }}
        onConfirm={confirmRemoveTenant}
        title="Remove Tenant"
        message={`Are you sure you want to remove ${tenantToRemove?.full_name}? This will delete their account and all associated data.`}
        confirmText="Remove Tenant"
        cancelText="Cancel"
        type="danger"
      />
    </LandlordLayout>
  );
}
