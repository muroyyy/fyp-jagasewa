import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, MapPin, DollarSign, User as UserIcon, Phone, Mail, Calendar, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { getCurrentUser } from '../../utils/auth';
import TenantLayout from '../../components/layout/TenantLayout';

export default function TenantMyProperty() {
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      fetchPropertyData();
    } else {
      window.location.href = '/login';
    }
  }, []);

  const fetchPropertyData = async () => {
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

      const data = await response.json();

      if (response.ok && data.success) {
        setProperty(data.data.property);
      } else {
        setError(data.message || 'Failed to fetch property data');
      }
    } catch (err) {
      console.error('Error fetching property data:', err);
      setError('An error occurred while loading property details');
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

  if (loading) {
    return (
      <TenantLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading property details...</p>
          </div>
        </div>
      </TenantLayout>
    );
  }

  if (!property) {
    return (
      <TenantLayout>
        <div className="p-4 sm:p-6 lg:p-8">
          <button
            onClick={() => navigate('/tenant-dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <Home className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Property Assigned</h2>
            <p className="text-gray-600">Contact your landlord to get assigned to a property</p>
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

        {/* Back Button */}
        <button
          onClick={() => navigate('/tenant-dashboard')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Property</h1>
          <p className="text-gray-600">View your rental property details</p>
        </div>

        {/* Property Images Gallery */}
        {property.images && property.images.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Property Images</h2>
            
            {/* Main Image */}
            <div className="mb-4 rounded-xl overflow-hidden bg-gray-100 relative group">
              <img
                src={property.images[selectedImage]}
                alt={`${property.property_name} - Image ${selectedImage + 1}`}
                className="w-full h-auto"
              />
              {property.images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage(prev => prev === 0 ? property.images.length - 1 : prev - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setSelectedImage(prev => prev === property.images.length - 1 ? 0 : prev + 1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    {selectedImage + 1} / {property.images.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {property.images.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {property.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      selectedImage === index
                        ? 'border-green-600 ring-2 ring-green-200'
                        : 'border-gray-200 hover:border-green-400'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-16 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Property Details */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Property Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Property Name */}
            <div className="md:col-span-2">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Home className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{property.property_name}</h3>
                  <p className="text-gray-600 mt-1">{property.property_type}</p>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Address</label>
              <div className="flex items-start space-x-2">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="text-gray-900">
                  <p>{property.address}</p>
                  <p>{property.city}, {property.state} {property.postal_code}</p>
                </div>
              </div>
            </div>

            {/* Monthly Rent */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Monthly Rent</label>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <p className="text-2xl font-bold text-gray-900">
                  {formatAmount(property.monthly_rent)}
                </p>
              </div>
            </div>

            {/* Move-in Date */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Move-in Date</label>
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <p className="text-gray-900 font-medium">{formatDate(property.move_in_date)}</p>
              </div>
            </div>

            {/* Move-out Date */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Move-out Date</label>
              {property.move_out_date ? (
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <p className="text-gray-900 font-medium">{formatDate(property.move_out_date)}</p>
                </div>
              ) : (
                <span className="text-green-600 font-semibold">Still Residing</span>
              )}
            </div>

            {/* Property Status */}
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Property Status</label>
              <span className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold ${
                property.status === 'Active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {property.status}
              </span>
            </div>
          </div>
        </div>

        {/* Landlord Contact */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Landlord Contact</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Name</label>
              <div className="flex items-center space-x-2">
                <UserIcon className="w-5 h-5 text-gray-400" />
                <p className="text-gray-900 font-medium">{property.landlord.name}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Email</label>
              <a 
                href={`mailto:${property.landlord.email}`}
                className="flex items-center space-x-2 text-green-600 hover:text-green-700 font-medium"
              >
                <Mail className="w-5 h-5" />
                <span>{property.landlord.email}</span>
              </a>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Phone</label>
              <a 
                href={`tel:${property.landlord.phone}`}
                className="flex items-center space-x-2 text-green-600 hover:text-green-700 font-medium"
              >
                <Phone className="w-5 h-5" />
                <span>{property.landlord.phone}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </TenantLayout>
  );
}
