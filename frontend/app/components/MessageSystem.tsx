'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { IoSend } from 'react-icons/io5';
import { FiMessageSquare } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

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
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export default function MessageSystem({ reservationId, initialMessages }: MessageSystemProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea when typing
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newMessage]);

  // Scroll to bottom when typing starts
  useEffect(() => {
    if (isTyping) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isTyping]);

  // Poll for new messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/reservations/${reservationId}/messages`);
        if (!response.ok) throw new Error('Failed to fetch messages');
        const data = await response.json();
        if (JSON.stringify(data) !== JSON.stringify(messages)) {
          setMessages(data);
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };

    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [reservationId, messages]);

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

  return (
    <div className="bg-white rounded-lg shadow-lg border h-[500px] flex flex-col">
      {/* Messages Area - Always visible */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <FiMessageSquare className="text-4xl mb-2" />
            <p>No messages yet</p>
            <p className="text-sm">Click below to start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.user.email === session?.user?.email;
            const messageColor = isCurrentUser ? 'bg-blue-500' : generateUserColor(message.user.email);
            
            return (
              <div
                key={message.id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-[75%] flex flex-col">
                  <div className={`rounded-lg px-4 py-2 ${messageColor} text-white break-words`}>
                    {!isCurrentUser && (
                      <p className="text-xs font-medium mb-1">
                        {message.user.name || message.user.email}
                      </p>
                    )}
                    <p>{message.content}</p>
                  </div>
                  <span className="text-xs text-gray-500 mt-1">
                    {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Click to expand */}
      <div className="border-t p-4">
        {isTyping ? (
          <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              className="w-full p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={1}
            />
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setIsTyping(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
                disabled={!newMessage.trim()}
              >
                <span>Send</span>
                <IoSend />
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsTyping(true)}
            className="w-full py-2 text-gray-500 hover:text-gray-700 flex items-center justify-center gap-2 border rounded-lg hover:bg-gray-50"
          >
            <FiMessageSquare />
            <span>Click to type a message</span>
          </button>
        )}
      </div>
    </div>
  );
} 