import React, { useState, useEffect } from 'react';
import { FileText, Upload, Search, Filter, Download, Trash2, Eye, File, FileImage, X, Plus } from 'lucide-react';
import LandlordLayout from '../../components/LandlordLayout';

export default function LandlordDocuments() {
  const [documents, setDocuments] = useState([]);
  const [properties, setProperties] = useState([]); // Initialize as empty array
  const [tenants, setTenants] = useState([]); // Initialize as empty array
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Add error state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    file: null,
    category: 'other',
    property_id: '',
    tenant_id: '',
    description: ''
  });
  const [uploading, setUploading] = useState(false);

  const categories = [
    { value: 'all', label: 'All Categories', icon: '📁' },
    { value: 'lease', label: 'Lease Documents', icon: '📄' },
    { value: 'invoice', label: 'Invoices', icon: '🧾' },
    { value: 'receipt', label: 'Receipts', icon: '🧾' },
    { value: 'notice', label: 'Notices', icon: '📢' },
    { value: 'agreement', label: 'Agreements', icon: '📝' },
    { value: 'other', label: 'Other', icon: '📦' }
  ];

  useEffect(() => {
    fetchDocuments();
    fetchProperties();
  }, [selectedCategory, selectedProperty]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      const token = localStorage.getItem('session_token');
      
      if (!token) {
        setError('No authentication token found');
        return;
      }

      let url = `${import.meta.env.VITE_API_URL}/api/landlord/documents.php`;
      const params = new URLSearchParams();
      
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (selectedProperty !== 'all') {
        params.append('property_id', selectedProperty);
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setDocuments(data.data?.documents || []);
        setStats(data.data?.stats);
      } else {
        setError(data.message || 'Failed to fetch documents');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('Error connecting to server. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const token = localStorage.getItem('session_token');
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/landlord/properties.php`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setProperties(data.data?.properties || []);
      } else {
        console.error('Failed to fetch properties:', data.message);
        setProperties([]); // Set to empty array on error
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties([]); // Set to empty array on error
    }
  };

  const fetchTenantsForProperty = async (propertyId) => {
    if (!propertyId) {
      setTenants([]);
      return;
    }

    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/landlord/tenants.php`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        // Filter tenants for selected property
        const propertyTenants = (data.data?.tenants || []).filter(t => t.property_id == propertyId);
        setTenants(propertyTenants);
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        e.target.value = ''; // Clear the input
        return;
      }
      setUploadForm({ ...uploadForm, file });
    }
  };

  const handleRemoveFile = () => {
    setUploadForm({ ...uploadForm, file: null });
    // Clear the file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  const handlePropertyChange = (propertyId) => {
    setUploadForm({ ...uploadForm, property_id: propertyId, tenant_id: '' });
    fetchTenantsForProperty(propertyId);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.file || !uploadForm.property_id) {
      alert('Please select a file and property');
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('session_token');
      
      const formData = new FormData();
      formData.append('document', uploadForm.file);
      formData.append('category', uploadForm.category);
      formData.append('property_id', uploadForm.property_id);
      if (uploadForm.tenant_id) {
        formData.append('tenant_id', uploadForm.tenant_id);
      }
      if (uploadForm.description) {
        formData.append('description', uploadForm.description);
      }
      
      // Debug logging
      console.log('Upload form data:', {
        file: uploadForm.file?.name,
        category: uploadForm.category,
        property_id: uploadForm.property_id,
        tenant_id: uploadForm.tenant_id,
        description: uploadForm.description
      });

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
          property_id: '',
          tenant_id: '',
          description: ''
        });
        fetchDocuments();
      } else {
        console.error('Upload error response:', data);
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
        fetchDocuments();
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
    if (fileType.includes('image')) return <FileImage className="w-8 h-8 text-blue-500" />;
    if (fileType.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    return <File className="w-8 h-8 text-gray-500" />;
  };

  const filteredDocuments = documents.filter(doc =>
    doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
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
              fetchDocuments();
              fetchProperties();
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
        <p className="text-gray-600">Manage and share documents with your tenants</p>
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
                <p className="text-sm text-gray-600">Lease Documents</p>
                <p className="text-2xl font-bold text-gray-900">{stats.lease_count || 0}</p>
              </div>
              <FileText className="w-10 h-10 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{stats.invoice_count || 0}</p>
              </div>
              <FileText className="w-10 h-10 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Storage</p>
                <p className="text-2xl font-bold text-gray-900">{formatFileSize(stats.total_size || 0)}</p>
              </div>
              <FileText className="w-10 h-10 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>

          {/* Property Filter */}
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Properties</option>
            {properties.map(prop => (
              <option key={prop.property_id} value={prop.property_id}>
                {prop.property_name}
              </option>
            ))}
          </select>

          {/* Upload Button */}
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md cursor-pointer"
          >
            <Upload className="w-5 h-5" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No documents found</p>
            <p className="text-gray-400 text-sm mt-2">Upload your first document to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.document_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(doc.file_type)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{doc.file_name}</p>
                          {doc.description && (
                            <p className="text-xs text-gray-500">{doc.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {doc.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {doc.property_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {doc.tenant_name || 'All Tenants'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(doc.file_size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <a
                          href={doc.file_path.startsWith('https://') ? doc.file_path : `http://localhost:8000/${doc.file_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900 cursor-pointer"
                          title="View"
                        >
                          <Eye className="w-5 h-5" />
                        </a>
                        <a
                          href={doc.file_path.startsWith('https://') ? doc.file_path : `http://localhost:8000/${doc.file_path}`}
                          download
                          className="text-green-600 hover:text-green-900 cursor-pointer"
                          title="Download"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                        <button
                          onClick={() => handleDelete(doc.document_id)}
                          className="text-red-600 hover:text-red-900 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
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

            {/* Modal Body */}
            <form onSubmit={handleUpload} className="p-6 space-y-6">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File <span className="text-red-500">*</span>
                </label>
                
                {!uploadForm.file ? (
                  // Upload area when no file selected
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
                  // File selected preview
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
                  {categories.filter(c => c.value !== 'all').map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Property Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property <span className="text-red-500">*</span>
                </label>
                <select
                  value={uploadForm.property_id}
                  onChange={(e) => handlePropertyChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a property</option>
                  {properties.map(prop => (
                    <option key={prop.property_id} value={prop.property_id}>
                      {prop.property_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tenant Selection (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tenant (Optional)
                </label>
                <select
                  value={uploadForm.tenant_id}
                  onChange={(e) => setUploadForm({ ...uploadForm, tenant_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!uploadForm.property_id}
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
                  disabled={uploading || !uploadForm.file || !uploadForm.property_id}
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