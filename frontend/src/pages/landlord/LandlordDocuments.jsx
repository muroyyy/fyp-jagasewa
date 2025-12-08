import React, { useState, useEffect } from 'react';
import { FileText, Upload, Search, Building2, Users, FolderOpen, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LandlordLayout from '../../components/layout/LandlordLayout';

export default function LandlordDocuments() {
  const [properties, setProperties] = useState([]);
  const [propertyDocuments, setPropertyDocuments] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();


  useEffect(() => {
    fetchPropertiesAndDocuments();
  }, []);

  const fetchPropertiesAndDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('session_token');
      
      if (!token) {
        setError('No authentication token found');
        return;
      }

      // Fetch properties and documents in parallel
      const [propertiesResponse, documentsResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/landlord/properties.php`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/api/landlord/documents.php`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [propertiesData, documentsData] = await Promise.all([
        propertiesResponse.json(),
        documentsResponse.json()
      ]);
      
      if (propertiesData.success) {
        setProperties(propertiesData.data?.properties || []);
      }
      
      if (documentsData.success) {
        const documents = documentsData.data?.documents || [];
        setStats(documentsData.data?.stats);
        
        // Group documents by property
        const grouped = documents.reduce((acc, doc) => {
          const propertyId = doc.property_id || 'unassigned';
          if (!acc[propertyId]) {
            acc[propertyId] = [];
          }
          acc[propertyId].push(doc);
          return acc;
        }, {});
        
        setPropertyDocuments(grouped);
      } else {
        setError(documentsData.message || 'Failed to fetch documents');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error connecting to server. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const getDocumentCount = (propertyId) => {
    return propertyDocuments[propertyId]?.length || 0;
  };

  const getTenantCount = async (propertyId) => {
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/landlord/tenants.php`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        return (data.data?.tenants || []).filter(t => t.property_id == propertyId).length;
      }
    } catch (error) {
      console.error('Error fetching tenant count:', error);
    }
    return 0;
  };

  const filteredProperties = properties.filter(property =>
    property.property_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-bold text-lg mb-2">Error Loading Documents</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchPropertiesAndDocuments();
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <LandlordLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Documents</h1>
          <p className="text-gray-600">Manage documents organized by property</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Documents</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_documents || 0}</p>
                </div>
                <FileText className="w-10 h-10 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Properties</p>
                  <p className="text-2xl font-bold text-gray-900">{properties.length}</p>
                </div>
                <Building2 className="w-10 h-10 text-purple-500" />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Lease Documents</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.lease_count || 0}</p>
                </div>
                <FileText className="w-10 h-10 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Invoices</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.invoice_count || 0}</p>
                </div>
                <FileText className="w-10 h-10 text-orange-500" />
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Property Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No properties found</p>
              <p className="text-gray-400 text-sm mt-2">Add properties to start managing documents</p>
            </div>
          ) : (
            filteredProperties.map((property) => {
              const documentCount = getDocumentCount(property.property_id);
              return (
                <div
                  key={property.property_id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
                  onClick={() => navigate(`/landlord/documents/property/${property.property_id}`)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-3 rounded-lg">
                          <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {property.property_name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {property.address}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center mb-1">
                          <FolderOpen className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{documentCount}</p>
                        <p className="text-xs text-gray-600">Documents</p>
                      </div>
                      
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center mb-1">
                          <Users className="w-5 h-5 text-green-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{property.tenant_count || 0}</p>
                        <p className="text-xs text-gray-600">Tenants</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Property Type: {property.property_type}</span>
                      <span className="text-blue-600 font-medium">View Documents →</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </LandlordLayout>
  );
}