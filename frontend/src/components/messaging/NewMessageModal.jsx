import React, { useState, useEffect } from 'react';
import { X, User, MessageCircle } from 'lucide-react';

const NewMessageModal = ({ onClose, onMessageSent }) => {
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/landlord/tenants.php`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('session_token')}` }
      });
      const data = await response.json();
      setTenants(data.tenants || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading tenants:', error);
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedTenant || !message.trim()) return;

    setSending(true);
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/messages.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`
        },
        body: JSON.stringify({
          property_id: selectedTenant.property_id,
          receiver_id: selectedTenant.user_id,
          message: message,
          message_type: 'text'
        })
      });

      onMessageSent({
        property_id: selectedTenant.property_id,
        other_user_id: selectedTenant.user_id,
        other_user_name: selectedTenant.full_name,
        property_name: selectedTenant.property_name
      });
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            New Message
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading tenants...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Tenant
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg">
                {tenants.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No tenants found
                  </div>
                ) : (
                  tenants.map((tenant) => (
                    <div
                      key={tenant.tenant_id}
                      onClick={() => setSelectedTenant(tenant)}
                      className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                        selectedTenant?.tenant_id === tenant.tenant_id
                          ? 'bg-blue-50 border-blue-200'
                          : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{tenant.full_name}</p>
                          <p className="text-sm text-gray-600">{tenant.property_name}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={sendMessage}
                disabled={!selectedTenant || !message.trim() || sending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewMessageModal;