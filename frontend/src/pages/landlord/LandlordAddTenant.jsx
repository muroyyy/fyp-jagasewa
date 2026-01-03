import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, CreditCard, Calendar, Home, Save, X } from 'lucide-react';
import { getCurrentUser } from '../../utils/auth';
import LandlordLayout from '../../components/layout/LandlordLayout';

export default function LandlordAddTenant() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [properties, setProperties] = useState([]);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    property_id: '',
    unit_id: ''
  });
  const [invitationLink, setInvitationLink] = useState(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      window.location.href = '/login';
    } else {
      fetchProperties();
    }
  }, []);

  const fetchProperties = async () => {
    try {
      setLoadingProperties(true);
      const token = localStorage.getItem('session_token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/landlord/properties.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Filter only active properties
        const activeProperties = data.data.properties.filter(p => p.status === 'Active');
        setProperties(activeProperties);
      }
    } catch (err) {
      console.error('Error fetching properties:', err);
    } finally {
      setLoadingProperties(false);
    }
  };

  const fetchAvailableUnits = async (propertyId) => {
    if (!propertyId) {
      setAvailableUnits([]);
      return;
    }

    try {
      setLoadingUnits(true);
      const token = localStorage.getItem('session_token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/landlord/property-units.php?property_id=${propertyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        // Filter only available units (no tenant assigned)
        const availableUnits = data.data.units.filter(unit => !unit.tenant_id && unit.status === 'available');
        setAvailableUnits(availableUnits);
      }
    } catch (err) {
      console.error('Error fetching units:', err);
      setAvailableUnits([]);
    } finally {
      setLoadingUnits(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Fetch units when property is selected
    if (name === 'property_id') {
      setFormData(prev => ({ ...prev, property_id: value, unit_id: '' })); // Reset unit selection
      fetchAvailableUnits(value);
    }
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.property_id) {
      setError('Please select a property');
      return false;
    }
    if (!formData.unit_id) {
      setError('Please select a unit');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('session_token');

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/landlord/add-tenant.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message);
        setInvitationLink(data.invitation_link);
      } else {
        setError(data.message || 'Failed to add tenant');
      }
    } catch (err) {
      console.error('Error adding tenant:', err);
      setError('An error occurred while adding the tenant');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/landlord/tenants');
  };

  return (
    <LandlordLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/landlord/tenants')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Tenants</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Tenant</h1>
          <p className="text-gray-600">Fill in the details to add a new tenant to your property</p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <X className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <div className="flex items-center mb-2">
              <Save className="w-5 h-5 mr-2" />
              <span className="font-semibold">{success}</span>
            </div>
            {invitationLink && (
              <div className="mt-3 p-3 bg-white rounded border border-green-300">
                <p className="text-sm font-medium text-gray-700 mb-2">Invitation Link:</p>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={invitationLink}
                    readOnly
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(invitationLink);
                      alert('Link copied to clipboard!');
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-2">Share this link with the tenant to complete registration</p>
              </div>
            )}
            <button
              onClick={() => navigate('/landlord/tenants')}
              className="mt-3 text-sm text-green-700 hover:underline cursor-pointer"
            >
              Go to Tenants List
            </button>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <Mail className="w-4 h-4" />
                <span>Tenant Email Address *</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="tenant@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">An invitation will be sent to this email</p>
            </div>

            {/* Property Selection */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <Home className="w-4 h-4" />
                <span>Assign to Property *</span>
              </label>
              {loadingProperties ? (
                <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50">
                  <span className="text-gray-500">Loading properties...</span>
                </div>
              ) : properties.length === 0 ? (
                <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50">
                  <span className="text-gray-500">No active properties available</span>
                </div>
              ) : (
                <select
                  name="property_id"
                  value={formData.property_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                >
                  <option value="">Select a property</option>
                  {properties.map((property) => (
                    <option key={property.property_id} value={property.property_id}>
                      {property.property_name} - RM {property.monthly_rent}/month
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Unit Selection */}
            {formData.property_id && (
              <div>
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                  <Home className="w-4 h-4" />
                  <span>Select Unit *</span>
                </label>
                {loadingUnits ? (
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50">
                    <span className="text-gray-500">Loading available units...</span>
                  </div>
                ) : availableUnits.length === 0 ? (
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50">
                    <span className="text-gray-500">No available units in this property</span>
                  </div>
                ) : (
                  <select
                    name="unit_id"
                    value={formData.unit_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                  >
                    <option value="">Select a unit</option>
                    {availableUnits.map((unit) => (
                      <option key={unit.unit_id} value={unit.unit_id}>
                        Unit {unit.unit_number} - RM {parseFloat(unit.monthly_rent).toLocaleString()}/month
                        {unit.unit_type && ` (${unit.unit_type})`}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button
              onClick={handleSubmit}
              disabled={loading || properties.length === 0}
              className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold text-white transition-all ${
                loading || properties.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:shadow-lg cursor-pointer'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Adding Tenant...</span>
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  <span>Send Invitation</span>
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
              <span>Cancel</span>
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-2">How It Works:</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Enter the tenant's email address, select a property, and choose an available unit</li>
            <li>An invitation link will be generated (email may not be delivered without SMTP)</li>
            <li>Share the invitation link with your tenant via WhatsApp, SMS, or email</li>
            <li>Tenant clicks the link and completes their registration</li>
            <li>Once registered, the tenant will be assigned to the selected property</li>
            <li>Invitation links expire after 7 days</li>
          </ul>
        </div>
      </div>
    </LandlordLayout>
  );
}