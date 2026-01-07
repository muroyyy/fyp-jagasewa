import React, { useState, useEffect } from 'react';
import { Download, Calendar, DollarSign, Users, TrendingUp, AlertCircle, Filter, FileText, ExternalLink, Bell, Send } from 'lucide-react';
import LandlordLayout from '../../components/layout/LandlordLayout';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;

export default function LandlordPayments() {
  const [payments, setPayments] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterTenant, setFilterTenant] = useState('all');
  const [filterProperty, setFilterProperty] = useState('all');
  const [filterPaymentType, setFilterPaymentType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  
  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    tenants: [],
    properties: [],
    paymentTypes: []
  });
  
  // Stats
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    completedPayments: 0
  });
  
  // Reminder states
  const [sendingReminder, setSendingReminder] = useState({});
  const [reminderSuccess, setReminderSuccess] = useState({});

  // Fetch payments data and filter options
  useEffect(() => {
    fetchPayments();
    fetchPendingPayments();
    fetchFilterOptions();
  }, []);

  const fetchPayments = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const sessionToken = localStorage.getItem('session_token');
      
      const response = await fetch(`${API_BASE_URL}/api/landlord/payments.php`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        setPayments(result.data.payments || []);
        setFilteredPayments(result.data.payments || []);
        
        // Calculate stats
        calculateStats(result.data.payments || []);
      } else {
        setError(result.message || 'Failed to fetch payments');
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const sessionToken = localStorage.getItem('session_token');
      
      const response = await fetch(`${API_BASE_URL}/api/landlord/payment-filters.php`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        setFilterOptions(result.data);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const fetchPendingPayments = async () => {
    try {
      const sessionToken = localStorage.getItem('session_token');
      
      const response = await fetch(`${API_BASE_URL}/api/landlord/pending-payments.php`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        setPendingPayments(result.data.pending_payments || []);
      }
    } catch (error) {
      console.error('Error fetching pending payments:', error);
    }
  };

  // Combine payments and pending payments
  useEffect(() => {
    const combined = [...payments, ...pendingPayments];
    setAllPayments(combined);
    setFilteredPayments(combined);
    calculateStats(combined);
  }, [payments, pendingPayments]);

  const calculateStats = (paymentsData) => {
    const total = paymentsData.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    
    // Get current month payments
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyTotal = paymentsData
      .filter(p => {
        const paymentDate = new Date(p.payment_date);
        return paymentDate.getMonth() === currentMonth && 
               paymentDate.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);
    
    const pending = paymentsData.filter(p => p.status === 'pending').length;
    const completed = paymentsData.filter(p => p.status === 'completed').length;
    
    setStats({
      totalRevenue: total,
      monthlyRevenue: monthlyTotal,
      pendingPayments: pending,
      completedPayments: completed
    });
  };

  const clearAllFilters = () => {
    setFilterTenant('all');
    setFilterProperty('all');
    setFilterPaymentType('all');
    setFilterStatus('all');
    setFilterMonth('all');
    setFilterYear('all');
  };

  // Filter logic
  useEffect(() => {
    let filtered = [...allPayments];

    // Tenant filter
    if (filterTenant !== 'all') {
      filtered = filtered.filter(payment => payment.tenant_id === parseInt(filterTenant));
    }

    // Property filter
    if (filterProperty !== 'all') {
      filtered = filtered.filter(payment => payment.property_id === parseInt(filterProperty));
    }

    // Payment type filter
    if (filterPaymentType !== 'all') {
      filtered = filtered.filter(payment => payment.payment_type === filterPaymentType);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(payment => payment.status === filterStatus);
    }

    // Month filter
    if (filterMonth !== 'all') {
      filtered = filtered.filter(payment => {
        const paymentMonth = payment.payment_date ? 
          new Date(payment.payment_date).getMonth() : 
          new Date(payment.due_date).getMonth();
        return paymentMonth === parseInt(filterMonth);
      });
    }

    // Year filter
    if (filterYear !== 'all') {
      filtered = filtered.filter(payment => {
        const paymentYear = payment.payment_date ? 
          new Date(payment.payment_date).getFullYear() : 
          new Date(payment.due_date).getFullYear();
        return paymentYear === parseInt(filterYear);
      });
    }

    setFilteredPayments(filtered);
  }, [filterTenant, filterProperty, filterPaymentType, filterStatus, filterMonth, filterYear, allPayments]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'ewallet':
        return '📱';
      case 'fpx':
        return '🏦';
      case 'card':
        return '💳';
      default:
        return '💰';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `RM ${parseFloat(amount).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Tenant', 'Property', 'Amount', 'Method', 'Status', 'Transaction ID', 'Receipt'];
    const rows = filteredPayments.map(p => [
      formatDate(p.payment_date),
      p.tenant_name,
      p.property_name,
      formatCurrency(p.amount),
      p.payment_method.toUpperCase(),
      p.status.toUpperCase(),
      p.transaction_id,
      p.receipt_url || 'No receipt'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const sendPaymentReminder = async (payment) => {
    const paymentKey = `${payment.tenant_id}_${payment.payment_period || new Date().toISOString().slice(0, 7)}`;
    setSendingReminder(prev => ({ ...prev, [paymentKey]: true }));
    
    try {
      const sessionToken = localStorage.getItem('session_token');
      
      const response = await fetch(`${API_BASE_URL}/api/landlord/send-payment-reminder.php`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tenant_id: payment.tenant_id,
          payment_period: payment.payment_period || new Date().toISOString().slice(0, 7),
          message: null // Use default message
        })
      });

      const result = await response.json();

      if (result.success) {
        setReminderSuccess(prev => ({ ...prev, [paymentKey]: true }));
        // Clear success message after 3 seconds
        setTimeout(() => {
          setReminderSuccess(prev => ({ ...prev, [paymentKey]: false }));
        }, 3000);
      } else {
        alert(result.error || 'Failed to send reminder');
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('Network error. Please try again.');
    } finally {
      setSendingReminder(prev => ({ ...prev, [paymentKey]: false }));
    }
  };

  const canSendReminder = (payment) => {
    return payment.status === 'pending' || payment.status === 'overdue';
  };

  if (isLoading) {
    return (
      <LandlordLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading payment history...</p>
          </div>
        </div>
      </LandlordLayout>
    );
  }

  return (
    <LandlordLayout>
      <div className="p-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment History</h1>
          <p className="text-gray-600">Track and manage all tenant payments</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Revenue */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <span className="text-green-600 text-sm font-semibold">All Time</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(stats.totalRevenue)}</h3>
            <p className="text-sm text-gray-600">Total Revenue</p>
          </div>

          {/* Monthly Revenue */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-blue-600 text-sm font-semibold">This Month</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(stats.monthlyRevenue)}</h3>
            <p className="text-sm text-gray-600">Monthly Revenue</p>
          </div>

          {/* Completed Payments */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="text-green-600 text-sm font-semibold">Completed</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.completedPayments}</h3>
            <p className="text-sm text-gray-600">Successful Payments</p>
          </div>

          {/* Pending Payments */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-yellow-600 text-sm font-semibold">Pending</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.pendingPayments}</h3>
            <p className="text-sm text-gray-600">Awaiting Payment</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Filter className="w-5 h-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Filter Payments</h3>
            </div>
            <button
              onClick={clearAllFilters}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            >
              Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
            {/* Tenant Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tenant</label>
              <select
                value={filterTenant}
                onChange={(e) => setFilterTenant(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white cursor-pointer"
              >
                <option value="all">All Tenants</option>
                {filterOptions.tenants && filterOptions.tenants.map(tenant => (
                  <option key={tenant.tenant_id} value={tenant.tenant_id}>
                    {tenant.tenant_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Property Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Property</label>
              <select
                value={filterProperty}
                onChange={(e) => setFilterProperty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white cursor-pointer"
              >
                <option value="all">All Properties</option>
                {filterOptions.properties && filterOptions.properties.map(property => (
                  <option key={property.property_id} value={property.property_id}>
                    {property.property_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
              <select
                value={filterPaymentType}
                onChange={(e) => setFilterPaymentType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white cursor-pointer"
              >
                <option value="all">All Types</option>
                {filterOptions.paymentTypes && filterOptions.paymentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Month Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white cursor-pointer"
              >
                <option value="all">All Months</option>
                <option value="0">January</option>
                <option value="1">February</option>
                <option value="2">March</option>
                <option value="3">April</option>
                <option value="4">May</option>
                <option value="5">June</option>
                <option value="6">July</option>
                <option value="7">August</option>
                <option value="8">September</option>
                <option value="9">October</option>
                <option value="10">November</option>
                <option value="11">December</option>
              </select>
            </div>

            {/* Year Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white cursor-pointer"
              >
                <option value="all">All Years</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>

            {/* Export Button */}
            <div className="flex items-end">
              <button
                onClick={exportToCSV}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span className="font-medium">Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800 font-medium">Error Loading Payments</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Payments Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Payments Found</h3>
              <p className="text-gray-600">
                {filterTenant !== 'all' || filterProperty !== 'all' || filterPaymentType !== 'all' || filterStatus !== 'all' || filterMonth !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Payment history will appear here once tenants make payments'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Transaction ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Receipt
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.payment_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {payment.payment_date ? formatDate(payment.payment_date) : 
                             payment.due_date ? `Due: ${formatDate(payment.due_date)}` : 'N/A'}
                          </span>
                          {payment.days_overdue > 0 && (
                            <span className="ml-2 text-xs text-red-600 font-medium">
                              ({payment.days_overdue} days overdue)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{payment.tenant_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{payment.property_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-green-600">
                          {formatCurrency(payment.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {payment.payment_method ? (
                            <>
                              <span className="text-lg">{getPaymentMethodIcon(payment.payment_method)}</span>
                              <span className="text-sm text-gray-700 capitalize">
                                {payment.payment_method} • {payment.payment_provider}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-500">Awaiting Payment</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(payment.status)}`}>
                          {payment.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-500 font-mono">
                          {payment.transaction_id || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {payment.receipt_url ? (
                          <a
                            href={payment.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                          >
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">View</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">No receipt</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {canSendReminder(payment) && (
                          <div className="flex items-center space-x-2">
                            {(() => {
                              const paymentKey = `${payment.tenant_id}_${payment.payment_period || new Date().toISOString().slice(0, 7)}`;
                              const isLoading = sendingReminder[paymentKey];
                              const isSuccess = reminderSuccess[paymentKey];
                              
                              if (isSuccess) {
                                return (
                                  <div className="flex items-center space-x-1 text-green-600">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-xs font-medium">Sent!</span>
                                  </div>
                                );
                              }
                              
                              return (
                                <button
                                  onClick={() => sendPaymentReminder(payment)}
                                  disabled={isLoading}
                                  className={`flex items-center space-x-1 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                                    isLoading
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 cursor-pointer'
                                  }`}
                                >
                                  {isLoading ? (
                                    <>
                                      <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                      <span>Sending...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Bell className="w-3 h-3" />
                                      <span>Remind</span>
                                    </>
                                  )}
                                </button>
                              );
                            })()
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Results Summary */}
        {filteredPayments.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-600">
            Showing {filteredPayments.length} of {allPayments.length} payment{allPayments.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </LandlordLayout>
  );
}