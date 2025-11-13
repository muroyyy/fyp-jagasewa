import React, { useState, useEffect } from 'react';
import { MessageCircle, User, Plus } from 'lucide-react';
import { getUserRole } from '../../utils/auth';
import LandlordLayout from '../../components/LandlordLayout';
import TenantLayout from '../../components/TenantLayout';
import MessagesList from '../../components/messaging/MessagesList';
import NewMessageModal from '../../components/messaging/NewMessageModal';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const userRole = getUserRole();

  useEffect(() => {
    loadCurrentUser();
    loadConversations();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const endpoint = userRole === 'landlord' 
        ? `${import.meta.env.VITE_API_URL}/api/landlord/profile.php`
        : `${import.meta.env.VITE_API_URL}/api/tenant/profile.php`;
      
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('session_token')}` }
      });
      const data = await response.json();
      
      if (data.success) {
        // Handle both possible response structures
        const userId = data.data?.profile?.user_id || data.data?.user_id;
        if (userId) {
          setCurrentUser({ user_id: userId });
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadConversations = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/messages.php`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('session_token')}` }
      });
      
      if (!response.ok) {
        console.error('Messages API error:', response.status, response.statusText);
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      setConversations(data.conversations || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  const MessagesContent = () => (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="flex h-[600px]">
          <div className="w-1/3 border-r border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Messages
                </h2>
                {userRole === 'landlord' && (
                  <button
                    onClick={() => setShowNewMessageModal(true)}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center cursor-pointer"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    New
                  </button>
                )}
              </div>
            </div>
            
            <div className="overflow-y-auto h-full">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No conversations yet</p>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={`${conversation.property_id}-${conversation.other_user_id}`}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      selectedConversation?.property_id === conversation.property_id &&
                      selectedConversation?.other_user_id === conversation.other_user_id
                        ? 'bg-blue-50 border-blue-200'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {conversation.other_user_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {conversation.property_name}
                          </p>
                        </div>
                      </div>
                      {conversation.unread_count > 0 && (
                        <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-2 truncate">
                      {conversation.last_message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex-1">
            {selectedConversation ? (
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedConversation.other_user_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedConversation.property_name}
                      </p>
                    </div>
                  </div>
                </div>

                <MessagesList
                  propertyId={selectedConversation.property_id}
                  currentUser={currentUser}
                  otherUser={{ user_id: selectedConversation.other_user_id }}
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {showNewMessageModal && (
          <NewMessageModal
            onClose={() => setShowNewMessageModal(false)}
            onMessageSent={(conversation) => {
              setSelectedConversation(conversation);
              setShowNewMessageModal(false);
              loadConversations();
            }}
          />
        )}
      </div>
    </div>
  );

  if (userRole === 'landlord') {
    return (
      <LandlordLayout>
        <MessagesContent />
      </LandlordLayout>
    );
  }

  if (userRole === 'tenant') {
    return (
      <TenantLayout>
        <MessagesContent />
      </TenantLayout>
    );
  }

  return <div>Unauthorized</div>;
};

export default Messages;