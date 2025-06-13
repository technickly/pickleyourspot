'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { IoSend } from 'react-icons/io5';
import { FiMessageSquare } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { IconType } from 'react-icons';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  };
}

interface MessageSystemProps {
  reservationId: string;
  initialMessages: Message[];
}

// Function to generate a consistent color based on email
function generateUserColor(email: string) {
  const colors = [
    'bg-blue-500',   // Blue
    'bg-green-500',  // Green
    'bg-purple-500', // Purple
    'bg-pink-500',   // Pink
    'bg-yellow-500', // Yellow
    'bg-red-500',    // Red
    'bg-indigo-500', // Indigo
    'bg-teal-500',   // Teal
  ];
  
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 5) - hash) + email.charCodeAt(i);
    hash = hash & hash;
  }
  
  // Make sure hash is positive and map it to the colors array
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export default function MessageSystem({ reservationId, initialMessages }: MessageSystemProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newMessage]);

  // Scroll to bottom when messages change or component expands
  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);

  // Poll for new messages when expanded
  useEffect(() => {
    if (!isExpanded) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/reservations/${reservationId}/messages`);
        if (!response.ok) throw new Error('Failed to fetch messages');
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [isExpanded, reservationId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await fetch(`/api/reservations/${reservationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();
      setMessages([...messages, data]);
      setNewMessage('');
      setIsTyping(false);
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const getMessagePreview = () => {
    if (messages.length === 0) return 'No messages yet';
    const lastMessage = messages[messages.length - 1];
    const sender = lastMessage.user.name || lastMessage.user.email;
    const preview = lastMessage.content.length > 50 
      ? `${lastMessage.content.substring(0, 50)}...` 
      : lastMessage.content;
    return `${sender}: ${preview}`;
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Header */}
      <div 
        className={`p-4 border-b flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-gray-50' : ''}`}
        onClick={() => !isExpanded && setIsExpanded(true)}
      >
        <div className="flex items-center gap-3">
          <FiMessageSquare className="text-blue-500 text-xl" />
          <div>
            <h3 className="font-medium text-gray-900">Messages</h3>
            {!isExpanded && (
              <p className="text-sm text-gray-500 mt-1">{getMessagePreview()}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {messages.length}
            </span>
          )}
        </div>
      </div>

      {/* Messages Area */}
      {isExpanded && (
        <div className="flex flex-col h-[500px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <FiMessageSquare className="text-4xl mb-2" />
                <p>No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isCurrentUser = message.user.email === session?.user?.email;
                const messageColor = isCurrentUser ? 'bg-blue-500' : generateUserColor(message.user.email);
                
                return (
                  <div
                    key={message.id}
                    className={`flex flex-col ${
                      isCurrentUser ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${messageColor} ${
                        isCurrentUser ? 'text-white' : 'text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {message.user.name || message.user.email}
                        </span>
                        <span className="text-xs opacity-75">
                          {format(new Date(message.createdAt), 'h:mm a')}
                        </span>
                      </div>
                      <p className="break-words whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form 
            onSubmit={handleSendMessage}
            className="border-t p-4 bg-white sticky bottom-0"
          >
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  setIsTyping(e.target.value.length > 0);
                }}
                onKeyDown={handleKeyPress}
                placeholder="Type a message.."
                className="w-full p-3 pr-12 border rounded-lg resize-none max-h-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={1}
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className={`absolute right-2 bottom-2 p-2 rounded-full transition-all ${
                  isTyping
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                <IoSend className={`text-lg ${isTyping ? 'scale-100' : 'scale-90'}`} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 