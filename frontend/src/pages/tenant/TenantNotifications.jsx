import React, { useState, useEffect } from 'react';
import { Bell, Search, Filter, Clock, CheckCircle, Eye, EyeOff, Wrench, DollarSign, AlertCircle, FileText, Calendar, Building2, ChevronLeft, ChevronRight, RefreshCw, MessageSquare, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, getUserRole } from '../../utils/auth';
import TenantLayout from '../../components/layout/TenantLayout';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;

export default function TenantNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated() || getUserRole() !== 'tenant') {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch notifications
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    setError('');

    try {
      const sessionToken = localStorage.getItem('session_token');

      const response = await fetch(`${API_BASE_URL}/api/tenant/notifications.php?all=true`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        // Add read status from localStorage
        const readNotifications = JSON.parse(localStorage.getItem('tenant_read_notifications') || '[]');
        const notificationsWithReadStatus = (result.data.notifications || []).map(n => ({
          ...n,
          is_read: readNotifications.includes(n.id)
        }));
        setNotifications(notificationsWithReadStatus);
        setFilteredNotifications(notificationsWithReadStatus);
      } else {
        setError(result.message || 'Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and search logic
  useEffect(() => {
    let filtered = [...notifications];

    if (searchTerm) {
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (notification.property_name && notification.property_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(notification => notification.type === filterType);
    }

    if (filterStatus !== 'all') {
      if (filterStatus === 'read') {
        filtered = filtered.filter(notification => notification.is_read);
      } else if (filterStatus === 'unread') {
        filtered = filtered.filter(notification => !notification.is_read);
      }
    }

    setFilteredNotifications(filtered);
    setCurrentPage(1);
  }, [searchTerm, filterType, filterStatus, notifications]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'maintenance_update':
        return <Wrench className="w-6 h-6 text-orange-500" />;
      case 'payment_reminder':
        return <DollarSign className="w-6 h-6 text-green-500" />;
      case 'payment_confirmed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'lease_reminder':
        return <Calendar className="w-6 h-6 text-yellow-500" />;
      case 'document_shared':
        return <FileText className="w-6 h-6 text-blue-500" />;
      case 'message':
        return <MessageSquare className="w-6 h-6 text-purple-500" />;
      default:
        return <Bell className="w-6 h-6 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleNotificationClick = (notification) => {
    // Mark as read
    markAsRead(notification.id);

    // Navigate to the link
    if (notification.link_url) {
      navigate(notification.link_url);
    }
  };

  const markAsRead = (notificationId) => {
    const readNotifications = JSON.parse(localStorage.getItem('tenant_read_notifications') || '[]');
    if (!readNotifications.includes(notificationId)) {
      readNotifications.push(notificationId);
      localStorage.setItem('tenant_read_notifications', JSON.stringify(readNotifications));

      setNotifications(prev => prev.map(n =>
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
    }
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    localStorage.setItem('tenant_read_notifications', JSON.stringify(allIds));

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'maintenance_update':
        return 'Maintenance';
      case 'payment_reminder':
        return 'Payment';
      case 'payment_confirmed':
        return 'Payment';
      case 'lease_reminder':
        return 'Lease';
      case 'document_shared':
        return 'Document';
      case 'message':
        return 'Message';
      default:
        return 'Notification';
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Stats
  const stats = {
    total: notifications.length,
    unread: unreadCount,
    maintenance: notifications.filter(n => n.type === 'maintenance_update').length,
    payments: notifications.filter(n => n.type === 'payment_reminder' || n.type === 'payment_confirmed').length
  };

  return (
    <TenantLayout>
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate('/tenant-dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Dashboard</span>
          </button>

          {/* Page Title */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
              <p className="text-gray-600">View and manage all your notifications</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchNotifications}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Mark all as read</span>
                </button>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <Bell className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.total}</h3>
              <p className="text-sm text-gray-600">Total Notifications</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <EyeOff className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.unread}</h3>
              <p className="text-sm text-gray-600">Unread</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.maintenance}</h3>
              <p className="text-sm text-gray-600">Maintenance</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.payments}</h3>
              <p className="text-sm text-gray-600">Payments</p>
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
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Filter Dropdowns */}
              <div className="flex items-center space-x-3">
                {/* Type Filter */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white cursor-pointer"
                >
                  <option value="all">All Types</option>
                  <option value="maintenance_update">Maintenance</option>
                  <option value="payment_reminder">Payment Reminder</option>
                  <option value="payment_confirmed">Payment Confirmed</option>
                  <option value="document_shared">Documents</option>
                </select>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                </select>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">Error Loading Notifications</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-16 text-center">
              <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Notifications</h3>
              <p className="text-gray-600">
                {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'You have no notifications at the moment'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              {/* Notifications */}
              <div className="divide-y divide-gray-100">
                {paginatedNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-6 border-l-4 hover:bg-gray-50 transition-colors cursor-pointer ${getPriorityColor(notification.priority)} ${!notification.is_read ? 'bg-green-50/50' : ''}`}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 p-3 bg-white rounded-xl shadow-sm">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <h4 className={`text-lg font-semibold ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </h4>
                            {!notification.is_read && (
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityBadgeColor(notification.priority)}`}>
                              {notification.priority?.toUpperCase()}
                            </span>
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                              {getTypeLabel(notification.type)}
                            </span>
                          </div>
                        </div>

                        <p className="text-gray-600 mb-3">{notification.message}</p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            {notification.property_name && (
                              <div className="flex items-center space-x-1">
                                <Building2 className="w-4 h-4" />
                                <span>{notification.property_name}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatTimeAgo(notification.created_at)}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {notification.is_read ? (
                              <span className="flex items-center text-xs text-gray-400">
                                <Eye className="w-4 h-4 mr-1" />
                                Read
                              </span>
                            ) : (
                              <span className="flex items-center text-xs text-green-600 font-medium">
                                <EyeOff className="w-4 h-4 mr-1" />
                                Unread
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredNotifications.length)} of {filteredNotifications.length} notifications
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${currentPage === page
                            ? 'bg-green-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-100'
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Results Summary */}
          {filteredNotifications.length > 0 && totalPages <= 1 && (
            <div className="mt-6 text-center text-sm text-gray-600">
              Showing {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </TenantLayout>
  );
}
