import React, { useState, useEffect, useRef } from 'react';
import { Send, Wrench, CreditCard, Paperclip, Image, FileText, Download } from 'lucide-react';

const MessagesList = ({ propertyId, currentUser, otherUser, onNewMessage }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const eventSourceRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadMessages();
    
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [propertyId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/messages-hybrid.php?property_id=${propertyId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('session_token')}` }
      });
      const data = await response.json();
      const loadedMessages = data.messages || [];
      setMessages(loadedMessages);
      setLoading(false);
      
      // Mark messages as read
      markMessagesAsRead();
      
      // Setup SSE after messages are loaded
      setupSSE(loadedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/messages-hybrid.php`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`
        },
        body: JSON.stringify({ 
          property_id: propertyId,
          other_user_id: otherUser.user_id 
        })
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const setupSSE = (currentMessages = messages) => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    const lastMessageId = currentMessages.length > 0 ? Math.max(...currentMessages.map(m => m.message_id)) : 0;
    const token = localStorage.getItem('session_token');
    const eventSource = new EventSource(
      `${import.meta.env.VITE_API_URL}/api/messages-sse.php?property_id=${propertyId}&last_message_id=${lastMessageId}&token=${token}`
    );

    eventSource.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages(prev => {
        // Prevent duplicate messages
        if (prev.some(m => m.message_id === message.message_id)) {
          return prev;
        }
        return [...prev, message];
      });
      
      // Refresh conversations to update last message and unread counts
      if (onNewMessage) {
        onNewMessage();
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
      // Reconnect after 3 seconds
      setTimeout(() => setupSSE(), 3000);
    };

    eventSourceRef.current = eventSource;
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/messages-hybrid.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`
        },
        body: JSON.stringify({
          property_id: propertyId,
          receiver_id: otherUser.user_id,
          message: newMessage,
          message_type: 'text'
        })
      });
      
      const result = await response.json();
      console.log('Message response:', result);
      
      if (result.success) {
        setNewMessage('');
        // Don't reload messages - SSE will handle the new message
      } else {
        console.error('Failed to send message:', result.message);
        alert('Failed to send message: ' + result.message);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again.');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('property_id', propertyId);
    formData.append('receiver_id', otherUser.user_id);
    formData.append('message', file.name);

    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/messages-upload.php`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`
        },
        body: formData
      });
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
      fileInputRef.current.value = '';
    }
  };

  const handleSystemMessageClick = (message) => {
    if (message.reference_type === 'maintenance_request') {
      window.location.href = `/maintenance/${message.reference_id}`;
    } else if (message.reference_type === 'payment') {
      window.location.href = `/payments/${message.reference_id}`;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const renderMessage = (message) => {
    const isOwn = currentUser && message.sender_id === currentUser.user_id;
    const isSystem = message.message_type.startsWith('system_');

    if (isSystem) {
      return (
        <div 
          key={message.message_id}
          className="flex justify-center my-4 cursor-pointer"
          onClick={() => handleSystemMessageClick(message)}
        >
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 max-w-md hover:bg-blue-100 transition-colors">
            <div className="flex items-center text-blue-700 text-sm">
              {message.message_type === 'system_maintenance' ? (
                <Wrench className="w-4 h-4 mr-2" />
              ) : (
                <CreditCard className="w-4 h-4 mr-2" />
              )}
              {message.message}
            </div>
            <div className="text-xs text-blue-500 mt-1">
              Click to view details
            </div>
          </div>
        </div>
      );
    }

    const renderAttachment = () => {
      if (!message.attachment_path) return null;

      if (message.message_type === 'image') {
        const imageUrl = `https://jagasewa-assets-prod.s3.ap-southeast-1.amazonaws.com/${message.attachment_path}`;
        return (
          <div className="mt-2">
            <img 
              src={imageUrl}
              alt="Shared image"
              className="max-w-xs rounded-lg cursor-pointer"
              onClick={() => window.open(imageUrl, '_blank')}
            />
          </div>
        );
      }

      if (message.message_type === 'document') {
        const documentUrl = `https://jagasewa-assets-prod.s3.ap-southeast-1.amazonaws.com/${message.attachment_path}`;
        return (
          <div className="mt-2 flex items-center space-x-2 p-2 bg-white bg-opacity-20 rounded">
            <FileText className="w-4 h-4" />
            <span className="text-sm truncate flex-1">{message.message}</span>
            <a 
              href={documentUrl}
              download
              className="text-xs underline hover:no-underline"
            >
              <Download className="w-3 h-3" />
            </a>
          </div>
        );
      }
    };

    return (
      <div key={message.message_id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isOwn 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 text-gray-800'
        }`}>
          {message.message_type === 'text' && (
            <p className="text-sm">{message.message}</p>
          )}
          {renderAttachment()}
          <p className="text-xs mt-1 opacity-70">
            {new Date(message.created_at).toLocaleTimeString()}
          </p>
        </div>
      </div>
    );
  };

  if (loading || !currentUser) {
    return (
      <div className="flex justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map(renderMessage)}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="border-t p-4">
        <div className="flex space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,.pdf,.doc,.docx"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={uploading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        {uploading && (
          <div className="mt-2 text-sm text-gray-500 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Uploading file...
          </div>
        )}
      </form>
    </div>
  );
};

export default MessagesList;