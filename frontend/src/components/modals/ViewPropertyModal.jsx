import { X, Building2, MapPin, Home, DollarSign, Users, Calendar, FileText, CheckCircle, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import ImageSlider from '../shared/ImageSlider';

const ViewPropertyModal = ({ isOpen, onClose, propertyId }) => {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  useEffect(() => {
    if (isOpen && propertyId) {
      fetchPropertyDetails();
    }
  }, [isOpen, propertyId]);

  const fetchPropertyDetails = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/landlord/property-details.php?property_id=${propertyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setProperty(data.data.property);

      } else {
        setError(data.message || 'Failed to load property details');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error fetching property:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0
    }).format(amount);
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



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-blue-600 text-white p-6 rounded-t-2xl flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold">Property Details</h2>
            <p className="text-blue-100 text-sm mt-1">Complete property information</p>
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
              <p className="text-gray-600">Loading property details...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <XCircle className="text-red-500 flex-shrink-0" size={20} />
              <p className="text-red-700">{error}</p>
            </div>
          ) : property ? (
            <div className="space-y-6">
              {/* Image Gallery */}
              <div className="bg-gray-100 rounded-xl overflow-hidden">
                <ImageSlider 
                  images={property.images} 
                  propertyName={property.property_name}
                  className="h-96"
                />
              </div>

              {/* Property Header */}
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-3xl font-bold text-gray-800 mb-2">{property.property_name}</h3>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin size={18} className="text-blue-600" />
                      <span className="text-lg">{property.address}, {property.city}, {property.state} {property.postal_code}</span>
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                    property.status === 'Active' 
                      ? 'bg-green-100 text-green-700' 
                      : property.status === 'Inactive'
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {property.status === 'Active' ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle size={16} />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <XCircle size={16} />
                        {property.status}
                      </span>
                    )}
                  </span>
                </div>

                {/* Key Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Property Type</p>
                    <p className="text-lg font-bold text-gray-800">{property.property_type}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Total Units</p>
                    <p className="text-lg font-bold text-gray-800">{property.total_units}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Monthly Rent</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(property.monthly_rent)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Country</p>
                    <p className="text-lg font-bold text-gray-800">{property.country}</p>
                  </div>
                </div>
              </div>

              {/* Property Information */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Building2 size={18} className="text-blue-600" />
                    Property Information
                  </h4>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Property Name</label>
                    <p className="text-gray-800 font-medium">{property.property_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Property Type</label>
                    <p className="text-gray-800 font-medium flex items-center gap-2">
                      <Home size={16} className="text-gray-400" />
                      {property.property_type}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Total Units</label>
                    <p className="text-gray-800 font-medium flex items-center gap-2">
                      <Users size={16} className="text-gray-400" />
                      {property.total_units} units
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Monthly Rent</label>
                    <p className="text-gray-800 font-bold text-lg flex items-center gap-2">
                      <DollarSign size={18} className="text-green-600" />
                      {formatCurrency(property.monthly_rent)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location Details */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <MapPin size={18} className="text-blue-600" />
                    Location Details
                  </h4>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-500 mb-1 block">Full Address</label>
                    <p className="text-gray-800 font-medium">{property.address}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">City</label>
                    <p className="text-gray-800 font-medium">{property.city}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">State</label>
                    <p className="text-gray-800 font-medium">{property.state}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Postal Code</label>
                    <p className="text-gray-800 font-medium">{property.postal_code}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Country</label>
                    <p className="text-gray-800 font-medium">{property.country}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {property.description && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                      <FileText size={18} className="text-blue-600" />
                      Description
                    </h4>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-700 leading-relaxed">{property.description}</p>
                  </div>
                </div>
              )}

              {/* Additional Information */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Calendar size={18} className="text-blue-600" />
                    Additional Information
                  </h4>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Status</label>
                    <p className="text-gray-800 font-medium">
                      {property.status === 'Active' ? (
                        <span className="text-green-600 flex items-center gap-2">
                          <CheckCircle size={16} />
                          Active
                        </span>
                      ) : property.status === 'Inactive' ? (
                        <span className="text-gray-600 flex items-center gap-2">
                          <XCircle size={16} />
                          Inactive
                        </span>
                      ) : (
                        <span className="text-yellow-600 flex items-center gap-2">
                          <XCircle size={16} />
                          Maintenance
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Images</label>
                    <p className="text-gray-800 font-medium">
                      {property.images ? property.images.length : 0} photo{property.images && property.images.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Created At</label>
                    <p className="text-gray-800 font-medium">{formatDate(property.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Last Updated</label>
                    <p className="text-gray-800 font-medium">{formatDate(property.updated_at)}</p>
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

export default ViewPropertyModal;