import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, MessageSquare, AlertCircle } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';

const ProjectChat = ({ projectId, projectName }) => {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'announcements'
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const filteredMessages = filterType === 'announcements'
    ? messages.filter((m) =>
        m.message.includes('[Announcement]') ||
        m.message.includes('[Decision]') ||
        m.message.includes('[Update]')
      )
    : messages;

  // Fetch initial message history
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/chat/${projectId}/messages`);
        if (res.data.success) {
          setMessages(res.data.data);
        }
      } catch (err) {
        console.error('[Chat] Failed to load messages', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [projectId]);

  // Handle Socket.IO room joining and message listening
  useEffect(() => {
    if (!socket || !connected) return;

    socket.emit('join_project', { projectId }, (res) => {
      if (res?.success) {
        console.log(`[Chat] Successfully joined chat room for project ${projectId}`);
      }
    });

    const handleReceiveMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    const handleUserTyping = ({ userId, name }) => {
      if (userId !== user._id) {
        setTypingUsers((prev) => Array.from(new Set([...prev, name])));
      }
    };

    const handleUserStopTyping = ({ userId }) => {
      setTypingUsers((prev) => prev.filter((n) => n !== user.name));
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    return () => {
      socket.emit('leave_project', { projectId });
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
    };
  }, [socket, connected, projectId, user?._id]);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket) return;

    socket.emit('send_message', { projectId, message: inputText }, (res) => {
      if (res?.success) {
        setInputText('');
        socket.emit('typing_stop', { projectId });
      }
    });
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!socket) return;

    socket.emit('typing_start', { projectId });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { projectId });
    }, 1500);
  };

  if (loading) {
    return <LoadingSpinner text="Connecting to project chat..." />;
  }

  return (
    <div className="flex flex-col h-[600px] rounded-2xl glass border border-surface-800 bg-surface-950/60 overflow-hidden shadow-xl">
      {/* Chat Header */}
      <div className="px-5 py-3.5 border-b border-surface-800 bg-surface-900/60 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-surface-100">{projectName} Team Channel</h3>
            <p className="text-[10px] text-surface-400 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              {connected ? 'Live Sync Active' : 'Connecting to chat...'}
            </p>
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-1 bg-surface-950/80 p-1 rounded-xl border border-surface-800 text-[11px]">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-surface-400 hover:text-white'
            }`}
          >
            All Chat ({messages.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('announcements')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              filterType === 'announcements'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-surface-400 hover:text-white'
            }`}
          >
            Decisions & Updates
          </button>
        </div>
      </div>

      {/* Messages Scroll View */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-surface-500 text-xs">
            <MessageSquare className="w-8 h-8 mb-2 text-surface-600" />
            <p>
              {filterType === 'announcements'
                ? 'No announcements or decisions tagged yet.'
                : 'No messages yet in this project channel.'}
            </p>
            <p className="text-[11px] text-surface-600">
              {filterType === 'announcements'
                ? 'Tag key updates with [Announcement] or [Decision] below.'
                : 'Say hello and coordinate with your teammates!'}
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isMe = msg.sender?._id === user._id;
            const isAnnouncement =
              msg.message.includes('[Announcement]') ||
              msg.message.includes('[Decision]') ||
              msg.message.includes('[Update]');

            return (
              <div
                key={msg._id}
                className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <img
                  src={
                    msg.sender?.profileImage ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(msg.sender?.name || 'Dev')}`
                  }
                  alt={msg.sender?.name}
                  className="w-7 h-7 rounded-lg object-cover border border-surface-700/80 mt-0.5"
                />

                <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-semibold text-surface-200">
                      {isMe ? 'You' : msg.sender?.name}
                    </span>
                    {msg.sender?.title && (
                      <span className="text-[9px] text-surface-400 hidden sm:inline">
                        • {msg.sender.title}
                      </span>
                    )}
                    <span className="text-[9px] text-surface-500">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div
                    className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed break-words shadow-xs ${
                      isAnnouncement
                        ? 'bg-amber-950/40 border border-amber-500/40 text-amber-100 rounded-tl-xs'
                        : isMe
                        ? 'bg-brand-600 text-white rounded-tr-xs'
                        : 'bg-surface-800 text-surface-100 rounded-tl-xs border border-surface-700/60'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="text-[11px] text-brand-400 italic animate-pulse">
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Discussion quick tags */}
      <div className="px-4 py-1.5 bg-surface-900/90 border-t border-surface-800 flex items-center gap-1.5 overflow-x-auto text-[10px]">
        <span className="text-surface-500">Tag message:</span>
        {['[Announcement]', '[Decision]', '[Update]', '[Question]'].map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setInputText((prev) => (prev.startsWith(tag) ? prev : `${tag} ${prev}`))}
            className="px-2 py-0.5 rounded-md bg-surface-800 hover:bg-surface-700 text-brand-300 border border-surface-700 transition-colors"
          >
            + {tag}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t border-surface-800 bg-surface-900/80 flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Type a message or announcement to your team..."
          value={inputText}
          onChange={handleInputChange}
          className="flex-1 px-4 py-2.5 rounded-xl bg-surface-950 border border-surface-700 text-surface-100 text-xs placeholder-surface-500 focus:outline-hidden focus:border-brand-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-brand-600/25"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};

export default ProjectChat;
