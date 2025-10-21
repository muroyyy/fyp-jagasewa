import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, CreditCard, Calendar, Home, Save, X } from 'lucide-react';
import { getCurrentUser } from '../../utils/auth';
import LandlordLayout from '../../components/LandlordLayout';

export default function LandlordAddTenant() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    ic_number: '',
    date_of_birth: '',
    property_id: '',
    move_in_date: ''
  });

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
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/landlord/properties.php', {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Format IC number automatically (xxxxxx-xx-xxxx)
    if (name === 'ic_number') {
      let formatted = value.replace(/\D/g, ''); // Remove non-digits
      if (formatted.length > 6) {
        formatted = formatted.slice(0, 6) + '-' + formatted.slice(6);
      }
      if (formatted.length > 9) {
        formatted = formatted.slice(0, 9) + '-' + formatted.slice(9, 13);
      }
      setFormData(prev => ({ ...prev, [name]: formatted }));
      return;
    }

    // Format phone number automatically (+60xxxxxxxxxx)
    if (name === 'phone') {
      let formatted = value.replace(/\D/g, ''); // Remove non-digits
      if (formatted.length > 0 && !formatted.startsWith('60')) {
        formatted = '60' + formatted;
      }
      if (formatted.length > 0) {
        formatted = '+' + formatted.slice(0, 12);
      }
      setFormData(prev => ({ ...prev, [name]: formatted }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    // Check required fields
    if (!formData.full_name.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!formData.ic_number.trim()) {
      setError('IC number is required');
      return false;
    }
    if (!formData.date_of_birth) {
      setError('Date of birth is required');
      return false;
    }
    if (!formData.property_id) {
      setError('Please select a property');
      return false;
    }
    if (!formData.move_in_date) {
      setError('Move-in date is required');
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Validate IC number format (xxxxxx-xx-xxxx)
    const icRegex = /^\d{6}-\d{2}-\d{4}$/;
    if (!icRegex.test(formData.ic_number)) {
      setError('IC number must be in format: xxxxxx-xx-xxxx');
      return false;
    }

    // Validate phone number format (+60xxxxxxxxxx)
    const phoneRegex = /^\+60\d{9,10}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('Phone number must be in format: +60xxxxxxxxxx');
      return false;
    }

    // Validate age (must be at least 18 years old)
    const dob = new Date(formData.date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    if (age < 18) {
      setError('Tenant must be at least 18 years old');
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

      const response = await fetch(`${import.meta.env.VITE_API_URL}/landlord/add-tenant.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Tenant added successfully!');
        setTimeout(() => {
          navigate('/landlord/tenants');
        }, 2000);
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
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <Save className="w-5 h-5 mr-2" />
            {success}
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <User className="w-4 h-4" />
                <span>Full Name *</span>
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="Enter tenant's full name"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <Mail className="w-4 h-4" />
                <span>Email Address *</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="tenant@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <Phone className="w-4 h-4" />
                <span>Phone Number *</span>
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+60123456789"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Format: +60xxxxxxxxxx</p>
            </div>

            {/* IC Number */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <CreditCard className="w-4 h-4" />
                <span>IC Number *</span>
              </label>
              <input
                type="text"
                name="ic_number"
                value={formData.ic_number}
                onChange={handleInputChange}
                placeholder="123456-12-1234"
                maxLength={14}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Format: xxxxxx-xx-xxxx</p>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4" />
                <span>Date of Birth *</span>
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Must be at least 18 years old</p>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

            {/* Move-in Date */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4" />
                <span>Move-in Date *</span>
              </label>
              <input
                type="date"
                name="move_in_date"
                value={formData.move_in_date}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button
              onClick={handleSubmit}
              disabled={loading || properties.length === 0}
              className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold text-white transition-all ${
                loading || properties.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg cursor-pointer'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Adding Tenant...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Add Tenant</span>
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
          <h3 className="font-semibold text-blue-900 mb-2">Important Notes:</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>All fields marked with * are required</li>
            <li>Tenant must be at least 18 years old</li>
            <li>IC number must be valid Malaysian IC format</li>
            <li>Phone number must include country code (+60)</li>
            <li>An email invitation will be sent to the tenant to set up their account</li>
            <li>You can only assign tenants to active properties</li>
          </ul>
        </div>
      </div>
    </LandlordLayout>
  );
}