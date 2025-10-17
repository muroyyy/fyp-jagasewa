import React, { useState, useEffect } from 'react';
import { FileText, Search, Download, Eye, Calendar, File, Folder, AlertCircle, FileCheck } from 'lucide-react';
import { getCurrentUser } from '../../utils/auth';
import TenantLayout from '../../components/TenantLayout';

export default function TenantDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      fetchDocuments();
    } else {
      window.location.href = '/login';
    }
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('session_token');
      
      const response = await fetch('http://localhost:8000/api/tenant/documents.php', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setDocuments(data.data.documents || []);
      } else {
        setError(data.message || 'Failed to fetch documents');
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('An error occurred while loading documents');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
    return '📎';
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'lease':
        return 'bg-blue-100 text-blue-800';
      case 'invoice':
        return 'bg-green-100 text-green-800';
      case 'receipt':
        return 'bg-purple-100 text-purple-800';
      case 'notice':
        return 'bg-orange-100 text-orange-800';
      case 'agreement':
        return 'bg-indigo-100 text-indigo-800';
      case 'other':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownload = async (documentId, fileName) => {
    try {
      const token = localStorage.getItem('session_token');
      
      const response = await fetch(`http://localhost:8000/api/tenant/download-document.php?document_id=${documentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download document');
      }
    } catch (err) {
      console.error('Error downloading document:', err);
      alert('An error occurred while downloading the document');
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterCategory === 'all' || doc.category === filterCategory;
    
    return matchesSearch && matchesFilter;
  });

  const stats = [
    { label: 'Total Documents', value: documents.length, color: 'blue', icon: FileText },
    { label: 'Lease Documents', value: documents.filter(d => d.category === 'lease').length, color: 'indigo', icon: FileCheck },
    { label: 'Invoices', value: documents.filter(d => d.category === 'invoice').length, color: 'green', icon: File },
    { label: 'Receipts', value: documents.filter(d => d.category === 'receipt').length, color: 'purple', icon: File }
  ];

  if (loading) {
    return (
      <TenantLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading documents...</p>
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
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Documents</h1>
          <p className="text-gray-600">View and download documents shared by your landlord</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-8 h-8 ${
                  stat.color === 'blue' ? 'text-blue-600' :
                  stat.color === 'indigo' ? 'text-indigo-600' :
                  stat.color === 'green' ? 'text-green-600' :
                  'text-purple-600'
                }`} />
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="lease">Lease Documents</option>
            <option value="invoice">Invoices</option>
            <option value="receipt">Receipts</option>
            <option value="notice">Notices</option>
            <option value="agreement">Agreements</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Documents Grid */}
        {filteredDocuments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.document_id}
                className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all"
              >
                {/* File Icon and Name */}
                <div className="flex items-start space-x-3 mb-4">
                  <div className="text-4xl">{getFileIcon(doc.file_type)}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 truncate mb-1">
                      {doc.file_name}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">{doc.description || 'No description'}</p>
                  </div>
                </div>

                {/* Category Badge */}
                <div className="mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(doc.category)}`}>
                    {doc.category.toUpperCase()}
                  </span>
                </div>

                {/* File Info */}
                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Size:</span>
                    <span className="font-medium">{formatFileSize(doc.file_size)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Uploaded:</span>
                    <span className="font-medium">{formatDate(doc.uploaded_at)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(doc.document_id, doc.file_name)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => window.open(doc.file_url, '_blank')}
                    className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl shadow-lg border border-gray-100 text-center">
            <Folder className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchQuery || filterCategory !== 'all' ? 'No documents found' : 'No documents available'}
            </h3>
            <p className="text-gray-600">
              {searchQuery || filterCategory !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Your landlord hasn\'t shared any documents yet'}
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Document Information</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>All documents are securely stored and encrypted</li>
            <li>You can download documents anytime for your records</li>
            <li>New documents will appear here automatically</li>
            <li>Contact your landlord if you need a specific document</li>
          </ul>
        </div>
      </div>
    </TenantLayout>
  );
}