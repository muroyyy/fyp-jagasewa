import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Upload, Search, Download, Trash2, Eye, File, FileImage, X, ArrowLeft, Users, User } from 'lucide-react';
import LandlordLayout from '../../components/layout/LandlordLayout';

export default function LandlordPropertyDocuments() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [tenantDocuments, setTenantDocuments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    file: null,
    category: 'other',
    tenant_id: '',
    description: ''
  });
  const [uploading, setUploading] = useState(false);

  const categories = [
    { value: 'lease', label: 'Lease Documents', icon: '📄' },
    { value: 'invoice', label: 'Invoices', icon: '🧾' },
    { value: 'receipt', label: 'Receipts', icon: '🧾' },
    { value: 'notice', label: 'Notices', icon: '📢' },
    { value: 'agreement', label: 'Agreements', icon: '📝' },
    { value: 'other', label: 'Other', icon: '📦' }
  ];

  useEffect(() => {
    fetchPropertyData();
  }, [propertyId]);

  const fetchPropertyData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('session_token');
      
      if (!token) {
        setError('No authentication token found');
        return;
      }

      // Fetch property, tenants, and documents in parallel
      const [propertyResponse, tenantsResponse, documentsResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/landlord/properties.php`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/api/landlord/tenants.php`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/api/landlord/documents.php?property_id=${propertyId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [propertyData, tenantsData, documentsData] = await Promise.all([
        propertyResponse.json(),
        tenantsResponse.json(),
        documentsResponse.json()
      ]);
      
      if (propertyData.success) {
        const currentProperty = propertyData.data?.properties?.find(p => p.property_id == propertyId);
        setProperty(currentProperty);
      }
      
      if (tenantsData.success) {
        const propertyTenants = (tenantsData.data?.tenants || []).filter(t => t.property_id == propertyId);
        setTenants(propertyTenants);
      }
      
      if (documentsData.success) {
        const docs = documentsData.data?.documents || [];
        setDocuments(docs);
        
        // Group documents by tenant
        const grouped = docs.reduce((acc, doc) => {
          const tenantId = doc.tenant_id || 'all';
          if (!acc[tenantId]) {
            acc[tenantId] = [];
          }
          acc[tenantId].push(doc);
          return acc;
        }, {});
        
        setTenantDocuments(grouped);
      } else {
        setError(documentsData.message || 'Failed to fetch documents');
      }
    } catch (error) {
      console.error('Error fetching property data:', error);
      setError('Error connecting to server. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        e.target.value = '';
        return;
      }
      setUploadForm({ ...uploadForm, file });
    }
  };

  const handleRemoveFile = () => {
    setUploadForm({ ...uploadForm, file: null });
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.file) {
      alert('Please select a file');
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('session_token');
      
      const formData = new FormData();
      formData.append('document', uploadForm.file);
      formData.append('category', uploadForm.category);
      formData.append('property_id', propertyId);
      if (uploadForm.tenant_id) {
        formData.append('tenant_id', uploadForm.tenant_id);
      }
      if (uploadForm.description) {
        formData.append('description', uploadForm.description);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/landlord/upload-document.php`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Document uploaded successfully!');
        setShowUploadModal(false);
        setUploadForm({
          file: null,
          category: 'other',
          tenant_id: '',
          description: ''
        });
        fetchPropertyData();
      } else {
        alert(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Error uploading document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/landlord/delete-document.php?document_id=${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Document deleted successfully');
        fetchPropertyData();
      } else {
        alert(data.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error deleting document');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('image')) return <FileImage className="w-6 h-6 text-blue-500" />;
    if (fileType.includes('pdf')) return <FileText className="w-6 h-6 text-red-500" />;
    return <File className="w-6 h-6 text-gray-500" />;
  };

  const getDocumentCount = (tenantId) => {
    return tenantDocuments[tenantId]?.length || 0;
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property documents...</p>
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
              fetchPropertyData();
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
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => navigate('/landlord/documents')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Documents</span>
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {property?.property_name || 'Property Documents'}
              </h1>
              <p className="text-gray-600">{property?.address}</p>
            </div>
            
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md cursor-pointer"
            >
              <Upload className="w-5 h-5" />
              <span>Upload Document</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
              </div>
              <FileText className="w-10 h-10 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Tenants</p>
                <p className="text-2xl font-bold text-gray-900">{tenants.length}</p>
              </div>
              <Users className="w-10 h-10 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Shared Documents</p>
                <p className="text-2xl font-bold text-gray-900">{getDocumentCount('all')}</p>
              </div>
              <FileText className="w-10 h-10 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search tenants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Shared Documents Card */}
        {getDocumentCount('all') > 0 && (
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Shared Documents</h3>
                  <p className="text-sm text-gray-500">Documents shared with all tenants</p>
                </div>
                <div className="ml-auto">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                    {getDocumentCount('all')} documents
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid gap-3">
                {tenantDocuments['all']?.map((doc) => (
                  <div key={doc.document_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(doc.file_type)}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.file_name}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">{doc.category}</span>
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <a
                        href={doc.file_path.startsWith('https://') ? doc.file_path : `http://localhost:8000/${doc.file_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-900 cursor-pointer"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      <a
                        href={doc.file_path.startsWith('https://') ? doc.file_path : `http://localhost:8000/${doc.file_path}`}
                        download
                        className="text-green-600 hover:text-green-900 cursor-pointer"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDelete(doc.document_id)}
                        className="text-red-600 hover:text-red-900 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tenant Documents Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTenants.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No tenants found</p>
              <p className="text-gray-400 text-sm mt-2">Add tenants to this property to manage their documents</p>
            </div>
          ) : (
            filteredTenants.map((tenant) => {
              const documentCount = getDocumentCount(tenant.tenant_id);
              return (
                <div key={tenant.tenant_id} className="bg-white rounded-lg shadow-md">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 p-3 rounded-lg">
                        <User className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{tenant.full_name}</h3>
                        <p className="text-sm text-gray-500">{tenant.email}</p>
                      </div>
                      <div className="ml-auto">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          {documentCount} documents
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {documentCount === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">No documents yet</p>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {tenantDocuments[tenant.tenant_id]?.map((doc) => (
                          <div key={doc.document_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              {getFileIcon(doc.file_type)}
                              <div>
                                <p className="text-sm font-medium text-gray-900">{doc.file_name}</p>
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">{doc.category}</span>
                                  <span>{formatFileSize(doc.file_size)}</span>
                                  <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <a
                                href={doc.file_path.startsWith('https://') ? doc.file_path : `http://localhost:8000/${doc.file_path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-900 cursor-pointer"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </a>
                              <a
                                href={doc.file_path.startsWith('https://') ? doc.file_path : `http://localhost:8000/${doc.file_path}`}
                                download
                                className="text-green-600 hover:text-green-900 cursor-pointer"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() => handleDelete(doc.document_id)}
                                className="text-red-600 hover:text-red-900 cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Upload Document</h2>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-6 h-6 text-gray-600" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleUpload} className="p-6 space-y-6">
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select File <span className="text-red-500">*</span>
                  </label>
                  
                  {!uploadForm.file ? (
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-10 h-10 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600 font-medium">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Max 10MB)
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFileSelect}
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="border-2 border-green-300 bg-green-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-green-100 p-2 rounded-lg">
                            <FileText className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {uploadForm.file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(uploadForm.file.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="text-red-600 hover:text-red-800 hover:bg-red-100 p-2 rounded-lg transition-colors cursor-pointer"
                          title="Remove file"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tenant Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tenant (Optional)
                  </label>
                  <select
                    value={uploadForm.tenant_id}
                    onChange={(e) => setUploadForm({ ...uploadForm, tenant_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All tenants in this property</option>
                    {tenants.map(tenant => (
                      <option key={tenant.tenant_id} value={tenant.tenant_id}>
                        {tenant.full_name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to share with all tenants in the property
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    rows="3"
                    placeholder="Add a description or notes about this document..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !uploadForm.file}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {uploading ? 'Uploading...' : 'Upload Document'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </LandlordLayout>
  );
}