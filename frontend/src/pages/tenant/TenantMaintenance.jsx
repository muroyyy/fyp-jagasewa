import React, { useState, useEffect } from 'react';
import { Wrench, Plus, Search, Calendar, AlertCircle, CheckCircle, Clock, X, Image as ImageIcon, Droplets, Zap, Hammer, Wind, Paintbrush, Bug, Sparkles, Sparkle, Loader, Info, TrendingUp, Shield } from 'lucide-react';
import { getCurrentUser } from '../../utils/auth';
import TenantLayout from '../../components/layout/TenantLayout';

export default function TenantMaintenance() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      fetchMaintenanceRequests();
    } else {
      window.location.href = '/login';
    }
  }, []);

  const fetchMaintenanceRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('session_token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tenant/maintenance.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setRequests(data.data.requests || []);
      } else {
        setError(data.message || 'Failed to fetch maintenance requests');
      }
    } catch (err) {
      console.error('Error fetching maintenance requests:', err);
      setError('An error occurred while loading maintenance requests');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category) => {
    const iconMap = {
      plumbing: <Droplets className="w-6 h-6 text-green-600" />,
      electrical: <Zap className="w-6 h-6 text-yellow-600" />,
      appliances: <Wrench className="w-6 h-6 text-gray-600" />,
      hvac: <Wind className="w-6 h-6 text-cyan-600" />,
      carpentry: <Hammer className="w-6 h-6 text-amber-600" />,
      painting: <Paintbrush className="w-6 h-6 text-purple-600" />,
      pest_control: <Bug className="w-6 h-6 text-red-600" />,
      cleaning: <Sparkles className="w-6 h-6 text-green-600" />,
      other: <Wrench className="w-6 h-6 text-gray-600" />
    };
    return iconMap[category] || <Wrench className="w-6 h-6 text-gray-600" />;
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || request.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const stats = [
    { label: 'Total Requests', value: requests.length, color: 'blue' },
    { label: 'Pending', value: requests.filter(r => r.status === 'pending').length, color: 'yellow' },
    { label: 'In Progress', value: requests.filter(r => r.status === 'in_progress').length, color: 'blue' },
    { label: 'Completed', value: requests.filter(r => r.status === 'completed').length, color: 'green' }
  ];

  if (loading) {
    return (
      <TenantLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading maintenance requests...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Maintenance Requests</h1>
          <p className="text-gray-600">Submit and track your maintenance requests</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            onClick={() => setShowNewRequestModal(true)}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>New Request</span>
          </button>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.length > 0 ? (
            filteredRequests.map((request) => (
              <div
                key={request.request_id}
                onClick={() => setSelectedRequest(request)}
                className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 bg-gray-100 rounded-lg">{getCategoryIcon(request.category)}</div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{request.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{request.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                        {request.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(request.priority)}`}>
                        {request.priority.toUpperCase()} Priority
                      </span>
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                        {request.category.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-start lg:items-end gap-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Submitted: {formatDate(request.created_at)}</span>
                    </div>
                    {request.estimated_completion && (
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>Est. Completion: {formatDate(request.estimated_completion)}</span>
                      </div>
                    )}
                    {request.landlord_response && (
                      <div className="flex items-center space-x-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>Landlord Responded</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-12 rounded-2xl shadow-lg border border-gray-100 text-center">
              <Wrench className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No maintenance requests found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Submit your first maintenance request to get started'}
              </p>
              <button
                onClick={() => setShowNewRequestModal(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 hover:shadow-lg transition-all cursor-pointer"
              >
                Submit New Request
              </button>
            </div>
          )}
        </div>

        {/* New Request Modal */}
        {showNewRequestModal && (
          <NewRequestModal
            onClose={() => setShowNewRequestModal(false)}
            onSuccess={() => {
              setShowNewRequestModal(false);
              fetchMaintenanceRequests();
            }}
          />
        )}

        {/* Request Details Modal */}
        {selectedRequest && (
          <RequestDetailsModal
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
          />
        )}
      </div>
    </TenantLayout>
  );
}

// New Request Modal Component
function NewRequestModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    preferred_date: ''
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const categories = [
    { value: 'plumbing', label: 'Plumbing', icon: Droplets },
    { value: 'electrical', label: 'Electrical', icon: Zap },
    { value: 'appliances', label: 'Appliances', icon: Wrench },
    { value: 'hvac', label: 'HVAC', icon: Wind },
    { value: 'carpentry', label: 'Carpentry', icon: Hammer },
    { value: 'painting', label: 'Painting', icon: Paintbrush },
    { value: 'pest_control', label: 'Pest Control', icon: Bug },
    { value: 'cleaning', label: 'Cleaning', icon: Sparkles },
    { value: 'other', label: 'Other', icon: Wrench }
  ];

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedImages.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }
    
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError('Each image must be less than 5MB');
        return;
      }
    });
    
    setSelectedImages([...selectedImages, ...files]);
    // Don't auto-analyze - wait for user to click analyze button
  };

  const analyzePhoto = async () => {
    if (selectedImages.length === 0) {
      setError('Please upload at least one image first');
      return;
    }
    
    setAnalyzing(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('session_token');
      const submitData = new FormData();
      submitData.append('photo', selectedImages[0]);
      
      // Include description for better context
      if (formData.description && formData.description.trim()) {
        submitData.append('description', formData.description);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tenant/analyze-maintenance-photo.php`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: submitData
      });

      const data = await response.json();
      
      if (data.success) {
        setAiAnalysis(data.data);
        // Auto-fill suggestions
        setFormData(prev => ({
          ...prev,
          category: prev.category || data.data.suggested_category,
          priority: prev.priority === 'medium' ? data.data.suggested_priority : prev.priority
        }));
      }
    } catch (err) {
      console.error('AI analysis failed:', err);
      setError('AI analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    
    // Reset AI analysis if all images are removed or first image changed
    if (newImages.length === 0 || index === 0) {
      setAiAnalysis(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim() || !formData.description.trim() || !formData.category) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('session_token');

      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });
      
      selectedImages.forEach((image) => {
        submitData.append('photos[]', image);
      });
      
      if (aiAnalysis) {
        submitData.append('ai_analysis', JSON.stringify(aiAnalysis));
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tenant/submit-maintenance.php`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submitData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onSuccess();
      } else {
        setError(data.message || 'Failed to submit request');
      }
    } catch (err) {
      console.error('Error submitting request:', err);
      setError('An error occurred while submitting the request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">New Maintenance Request</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* AI Flow Info */}
            {!aiAnalysis && selectedImages.length === 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Sparkle className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-900 mb-1">🤖 AI-Powered Analysis Available</h4>
                    <p className="text-sm text-purple-700 mb-2">Get smart suggestions for your maintenance request:</p>
                    <ol className="text-xs text-purple-600 space-y-1 ml-4 list-decimal">
                      <li>Upload photo(s) of the issue</li>
                      <li>Add a description (helps AI understand context)</li>
                      <li>Click "Analyze with AI" button</li>
                      <li>Review AI suggestions and submit</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Request Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Leaking kitchen sink"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent cursor-pointer"
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Priority *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent cursor-pointer"
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the issue in detail..."
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                required
              />
            </div>

            {/* Preferred Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Preferred Date (Optional)
              </label>
              <input
                type="date"
                value={formData.preferred_date}
                onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent cursor-pointer"
              />
            </div>

            {/* AI Analysis Badge */}
            {analyzing && (
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-5 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <Loader className="w-8 h-8 text-green-600 animate-spin" />
                    <div className="absolute inset-0 w-8 h-8 bg-blue-400 rounded-full animate-ping opacity-20"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold text-blue-900 mb-1">🤖 AI Analysis in Progress...</p>
                    <p className="text-sm text-blue-700 mb-3">Our AI is examining your photo to identify the issue</p>
                    <div className="flex items-center gap-2 text-xs text-green-600">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                        <span>Detecting damage</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <span>Categorizing issue</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                        <span>Assessing severity</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {aiAnalysis && (
              <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-2 border-purple-300 rounded-2xl p-5 shadow-lg">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                      <Sparkle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-purple-900">AI-Powered Analysis Complete</h4>
                      <p className="text-xs text-purple-700">Powered by AWS Rekognition</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1 bg-white/60 rounded-full">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-semibold text-green-700">{aiAnalysis.confidence}% Confident</span>
                  </div>
                </div>

                {/* Main Insights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-purple-100 rounded-lg">
                        <Info className="w-4 h-4 text-purple-600" />
                      </div>
                      <p className="text-xs font-medium text-gray-600">Suggested Category</p>
                    </div>
                    <p className="text-lg font-bold text-gray-900 capitalize">{aiAnalysis.suggested_category.replace('_', ' ')}</p>
                    <p className="text-xs text-gray-500 mt-1">Based on visual analysis</p>
                  </div>

                  <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-orange-100 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-orange-600" />
                      </div>
                      <p className="text-xs font-medium text-gray-600">Severity Level</p>
                    </div>
                    <p className={`text-lg font-bold capitalize ${
                      aiAnalysis.severity === 'urgent' ? 'text-red-600' :
                      aiAnalysis.severity === 'high' ? 'text-orange-600' :
                      aiAnalysis.severity === 'medium' ? 'text-yellow-600' : 'text-green-600'
                    }`}>{aiAnalysis.severity}</p>
                    <p className="text-xs text-gray-500 mt-1">Priority: {aiAnalysis.suggested_priority}</p>
                  </div>
                </div>

                {/* Detected Issues */}
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-purple-200">
                  <p className="text-xs font-medium text-gray-600 mb-2">🔍 Detected Issues</p>
                  <div className="flex flex-wrap gap-2">
                    {aiAnalysis.detected_issues.slice(0, 5).map((issue, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 rounded-full text-xs font-medium capitalize">
                        {issue}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Info Message */}
                <div className="mt-4 flex items-start gap-2 p-3 bg-blue-100/50 rounded-lg border border-blue-200">
                  <Info className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-800">
                    <span className="font-semibold">Smart Suggestion:</span> We've auto-filled the category and priority based on {aiAnalysis.context_used ? 'your description and image analysis' : 'image analysis'}. You can modify these if needed.
                  </p>
                </div>
              </div>
            )}

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Images (Optional) - Max 5 images, 5MB each
                <span className="ml-2 text-xs text-purple-600">✨ AI-powered analysis</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 text-center">
                    Click to upload images or drag and drop
                  </p>
                  <p className="text-xs text-purple-600 mt-1">Upload images, add description, then analyze with AI</p>
                </label>
              </div>
              
              {selectedImages.length > 0 && (
                <div className="mt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-3">
                    {selectedImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* AI Analyze Button */}
                  {!aiAnalysis && !analyzing && (
                    <button
                      type="button"
                      onClick={analyzePhoto}
                      className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkle className="w-5 h-5" />
                      Analyze with AI
                      {formData.description && <span className="text-xs opacity-90">(with description context)</span>}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full py-3 rounded-xl text-white font-semibold transition-all ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 hover:shadow-lg cursor-pointer'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Submitting...
                </span>
              ) : (
                'Submit Request'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Request Details Modal Component
function RequestDetailsModal({ request, onClose }) {
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleNextImage = (e) => {
    e.stopPropagation();
    if (request.photos && currentImageIndex < request.photos.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
      setEnlargedImage(request.photos[currentImageIndex + 1]);
    }
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
      setEnlargedImage(request.photos[currentImageIndex - 1]);
    }
  };
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Request Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Title & Status */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{request.title}</h3>
            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                {request.status.replace('_', ' ').toUpperCase()}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                {request.priority.toUpperCase()} PRIORITY
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                {request.category.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
            <p className="text-gray-700 leading-relaxed">{request.description}</p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Submitted On</p>
              <p className="font-medium text-gray-900">{formatDate(request.created_at)}</p>
            </div>
            {request.estimated_completion && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Estimated Completion</p>
                <p className="font-medium text-gray-900">{formatDate(request.estimated_completion)}</p>
              </div>
            )}
          </div>

          {/* Photos */}
          {request.photos && request.photos.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Attached Photos</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {request.photos.map((photo, index) => (
                  <div
                    key={index}
                    className="relative rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow group cursor-pointer"
                    onClick={() => {
                      setCurrentImageIndex(index);
                      setEnlargedImage(photo);
                    }}
                  >
                    <img
                      src={photo}
                      alt={`Maintenance photo ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center pointer-events-none">
                      <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Landlord Response */}
          {request.landlord_response && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Landlord Response
              </h4>
              <p className="text-blue-800">{request.landlord_response}</p>
              {request.response_date && (
                <p className="text-sm text-green-600 mt-2">Responded on {formatDate(request.response_date)}</p>
              )}
            </div>
          )}
        </div>

        {/* Image Enlargement Modal */}
        {enlargedImage && request.photos && (
          <div 
            className="fixed inset-0 bg-white/30 backdrop-blur-xl flex items-center justify-center z-[60] p-4"
            onClick={() => setEnlargedImage(null)}
          >
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute top-4 right-4 text-gray-800 hover:text-gray-600 transition-colors cursor-pointer bg-white/80 rounded-full p-2"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Previous Button */}
            {currentImageIndex > 0 && (
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-3 transition-all cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            
            {/* Next Button */}
            {currentImageIndex < request.photos.length - 1 && (
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-3 transition-all cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            
            <div className="flex flex-col items-center">
              <img 
                src={enlargedImage} 
                alt="Enlarged view"
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="mt-4 bg-white/80 px-4 py-2 rounded-full text-sm text-gray-800 font-medium">
                {currentImageIndex + 1} / {request.photos.length}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}