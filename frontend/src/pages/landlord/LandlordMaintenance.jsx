import React, { useState, useEffect } from 'react';
import { Search, Filter, AlertCircle, Wrench, Clock, CheckCircle, XCircle, Eye, MessageSquare, Calendar, User, Building2, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, getUserRole } from '../../utils/auth';
import LandlordLayout from '../../components/LandlordLayout';

const API_BASE_URL = 'http://localhost:8000/api';

export default function LandlordMaintenance() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [estimatedCompletion, setEstimatedCompletion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    urgent: 0
  });

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated() || getUserRole() !== 'landlord') {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch maintenance requests
  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const sessionToken = localStorage.getItem('session_token');
      
      const response = await fetch(`${API_BASE_URL}/landlord/maintenance.php`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        setRequests(result.data.requests || []);
        setFilteredRequests(result.data.requests || []);
        calculateStats(result.data.requests || []);
      } else {
        setError(result.message || 'Failed to fetch maintenance requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (requestsData) => {
    setStats({
      total: requestsData.length,
      pending: requestsData.filter(r => r.status === 'pending').length,
      inProgress: requestsData.filter(r => r.status === 'in_progress').length,
      completed: requestsData.filter(r => r.status === 'completed').length,
      urgent: requestsData.filter(r => r.priority === 'urgent').length
    });
  };

  // Search and filter logic
  useEffect(() => {
    let filtered = [...requests];

    if (searchTerm) {
      filtered = filtered.filter(request => 
        request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.tenant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.property_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(request => request.status === filterStatus);
    }

    if (filterPriority !== 'all') {
      filtered = filtered.filter(request => request.priority === filterPriority);
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(request => request.category === filterCategory);
    }

    setFilteredRequests(filtered);
  }, [searchTerm, filterStatus, filterPriority, filterCategory, requests]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'in_progress':
        return <Wrench className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'plumbing': '🚰',
      'electrical': '⚡',
      'appliances': '🔧',
      'hvac': '❄️',
      'carpentry': '🪚',
      'painting': '🎨',
      'pest_control': '🐛',
      'cleaning': '🧹',
      'other': '🔨'
    };
    return icons[category] || '🔧';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const handleRespond = (request) => {
    setSelectedRequest(request);
    setNewStatus(request.status);
    setResponseText('');
    setEstimatedCompletion('');
    setShowResponseModal(true);
  };

  const handleSubmitResponse = async () => {
    if (!responseText.trim()) {
      alert('Please enter a response message');
      return;
    }

    setIsSubmitting(true);

    try {
      const sessionToken = localStorage.getItem('session_token');
      
      const response = await fetch(`${API_BASE_URL}/landlord/update-maintenance.php`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request_id: selectedRequest.request_id,
          status: newStatus,
          response: responseText,
          estimated_completion: estimatedCompletion || null
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Response submitted successfully!');
        setShowResponseModal(false);
        fetchRequests(); // Refresh the list
      } else {
        alert('❌ ' + (result.message || 'Failed to submit response'));
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('❌ Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading maintenance requests...</p>
        </div>
      </div>
    );
  }

  return (
    <LandlordLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Maintenance Requests</h1>
          <p className="text-gray-600">Manage and respond to tenant maintenance requests</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          {/* Total Requests */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <Wrench className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.total}</h3>
            <p className="text-sm text-gray-600">Total Requests</p>
          </div>

          {/* Pending */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.pending}</h3>
            <p className="text-sm text-gray-600">Pending</p>
          </div>

          {/* In Progress */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Wrench className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.inProgress}</h3>
            <p className="text-sm text-gray-600">In Progress</p>
          </div>

          {/* Completed */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.completed}</h3>
            <p className="text-sm text-gray-600">Completed</p>
          </div>

          {/* Urgent */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.urgent}</h3>
            <p className="text-sm text-gray-600">Urgent</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, tenant, property, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center space-x-3">
              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Priority Filter */}
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              >
                <option value="all">All Categories</option>
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="appliances">Appliances</option>
                <option value="hvac">HVAC</option>
                <option value="carpentry">Carpentry</option>
                <option value="painting">Painting</option>
                <option value="pest_control">Pest Control</option>
                <option value="cleaning">Cleaning</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800 font-medium">Error Loading Requests</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Requests Grid */}
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-16 text-center">
            <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Maintenance Requests</h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || filterCategory !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Maintenance requests from tenants will appear here'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRequests.map((request) => (
              <div key={request.request_id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-3xl">{getCategoryIcon(request.category)}</div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{request.title}</h3>
                      <p className="text-sm text-gray-600 capitalize">{request.category.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full border flex items-center space-x-1 ${getPriorityColor(request.priority)}`}>
                    <AlertCircle className="w-3 h-3" />
                    <span>{request.priority.toUpperCase()}</span>
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-700 text-sm mb-4 line-clamp-2">{request.description}</p>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Tenant</p>
                      <p className="text-sm font-medium text-gray-900">{request.tenant_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Property</p>
                      <p className="text-sm font-medium text-gray-900">{request.property_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Submitted</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(request.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(request.status)}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(request.status)}`}>
                        {request.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Preferred Date */}
                {request.preferred_date && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-600 font-medium mb-1">Preferred Date</p>
                    <p className="text-sm text-blue-900">{formatDate(request.preferred_date)}</p>
                  </div>
                )}

                {/* Estimated Completion */}
                {request.estimated_completion && (
                  <div className="mb-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-600 font-medium mb-1">Estimated Completion</p>
                    <p className="text-sm text-green-900">{formatDate(request.estimated_completion)}</p>
                  </div>
                )}

                {/* Photos Count */}
                {request.photos && request.photos.length > 0 && (
                  <div className="mb-4 flex items-center space-x-2 text-sm text-gray-600">
                    <ImageIcon className="w-4 h-4" />
                    <span>{request.photos.length} photo(s) attached</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleViewDetails(request)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="font-medium">View Details</span>
                  </button>
                  <button
                    onClick={() => handleRespond(request)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="font-medium">Respond</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results Summary */}
        {filteredRequests.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600">
            Showing {filteredRequests.length} of {requests.length} request{requests.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Request Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Title and Category */}
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="text-4xl">{getCategoryIcon(selectedRequest.category)}</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedRequest.title}</h3>
                    <p className="text-sm text-gray-600 capitalize">{selectedRequest.category.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 mt-3">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(selectedRequest.status)}`}>
                    {selectedRequest.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(selectedRequest.priority)}`}>
                    {selectedRequest.priority.toUpperCase()} PRIORITY
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedRequest.description}</p>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Tenant</p>
                  <p className="font-semibold text-gray-900">{selectedRequest.tenant_name}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Property</p>
                  <p className="font-semibold text-gray-900">{selectedRequest.property_name}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Submitted</p>
                  <p className="font-semibold text-gray-900">{formatDate(selectedRequest.created_at)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Request ID</p>
                  <p className="font-mono text-sm text-gray-900">#{selectedRequest.request_id}</p>
                </div>
              </div>

              {/* Preferred Date */}
              {selectedRequest.preferred_date && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium mb-1">Preferred Service Date</p>
                  <p className="font-semibold text-blue-900">{formatDate(selectedRequest.preferred_date)}</p>
                </div>
              )}

              {/* Estimated Completion */}
              {selectedRequest.estimated_completion && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-green-600 font-medium mb-1">Estimated Completion</p>
                  <p className="font-semibold text-green-900">{formatDate(selectedRequest.estimated_completion)}</p>
                </div>
              )}

              {/* Photos */}
              {selectedRequest.photos && selectedRequest.photos.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Attached Photos ({selectedRequest.photos.length})</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedRequest.photos.map((photo, index) => (
                      <div key={index} className="relative rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
                        <img 
                          src={`${API_BASE_URL}/../uploads/maintenance/${photo}`} 
                          alt={`Photo ${index + 1}`}
                          className="w-full h-48 object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Landlord Response */}
              {selectedRequest.landlord_response && (
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <p className="text-xs text-indigo-600 font-medium mb-2">Your Response</p>
                  <p className="text-gray-900">{selectedRequest.landlord_response}</p>
                  {selectedRequest.response_date && (
                    <p className="text-xs text-gray-500 mt-2">Responded on {formatDate(selectedRequest.response_date)}</p>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  handleRespond(selectedRequest);
                }}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
              >
                Respond to Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Respond to Request</h2>
                <button
                  onClick={() => setShowResponseModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isSubmitting}
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">Request: {selectedRequest.title}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Update Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Update Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Response Message */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Response Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  disabled={isSubmitting}
                  rows="6"
                  placeholder="Enter your response to the tenant..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none disabled:bg-gray-100"
                ></textarea>
                <p className="text-xs text-gray-500 mt-1">Be clear and professional in your response</p>
              </div>

              {/* Estimated Completion Date */}
              {newStatus === 'in_progress' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Estimated Completion Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={estimatedCompletion}
                    onChange={(e) => setEstimatedCompletion(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
                  />
                </div>
              )}

              {/* Previous Response (if exists) */}
              {selectedRequest.landlord_response && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 font-medium mb-2">Previous Response</p>
                  <p className="text-sm text-gray-700">{selectedRequest.landlord_response}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center space-x-3">
              <button
                onClick={() => setShowResponseModal(false)}
                disabled={isSubmitting}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitResponse}
                disabled={isSubmitting || !responseText.trim()}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Response'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </LandlordLayout>
  );
}