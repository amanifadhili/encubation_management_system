import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Layout";
import { ErrorHandler } from "../utils/errorHandler";
import clsx from "clsx";
import Modal from "../components/Modal";
import Button from "../components/Button";
import { ButtonLoader, PageSkeleton } from "../components/loading";
import {
  getConversations,
  createConversation,
  getConversationMessages,
  sendMessage,
  sendFileMessage,
  getUsers
} from "../services/api";
import socketService from "../services/socket";

// Role-based color map
const roleColors: { [key: string]: string } = {
  director: "bg-purple-600 text-white",
  manager: "bg-blue-600 text-white",
  mentor: "bg-green-600 text-white",
  incubator: "bg-yellow-500 text-white",
  default: "bg-gray-400 text-white"
};

// Role display names
const roleDisplayNames: { [key: string]: string } = {
  director: "Director",
  manager: "Manager",
  mentor: "Mentor",
  incubator: "Incubator",
  default: "User"
};

const Messaging = () => {
  const { user } = useAuth();
  const showToast = useToast();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [showNewDM, setShowNewDM] = useState(false);
  const [dmTarget, setDMTarget] = useState("");
  const [sending, setSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [messageStatus, setMessageStatus] = useState<{[key: string]: 'sending' | 'sent' | 'delivered' | 'error'}>({});
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load conversations and users on mount
  useEffect(() => {
    if (user) {
      loadConversations();
      loadUsers();
    }
  }, [user]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Connect to socket when user is available (only once)
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      if (token) {
        socketService.connect(token);

        // Listen for new messages
        const handleNewMessage = (event: any) => {
          const { data } = event.detail;
          console.log('Received new message:', data);
          console.log('Current selectedId:', selectedId);
          console.log('Message conversation_id:', data.conversation_id || data.conversationId);

          // Add message to current conversation if it's the selected one
          if (selectedId === data.conversation_id || selectedId === data.conversationId) {
            console.log('Adding message to current conversation');
            setMessages(prev => {
              // Avoid duplicates by checking if message already exists
              const messageExists = prev.some(msg => msg.id === data.id);
              if (!messageExists) {
                console.log('Message added to UI');
                return [...prev, data];
              } else {
                console.log('Message already exists, skipping');
              }
              return prev;
            });
          } else {
            console.log('Message not for current conversation');
          }

          // Update conversation list to show latest message
          loadConversations();
        };

        // Listen for message notifications (for other conversations)
        const handleMessageNotification = (event: any) => {
          const { data } = event.detail;
          console.log('Received message notification:', data);

          // If this notification is for the currently selected conversation, treat it as a new message
          if (selectedId === data.conversationId) {
            console.log('Notification is for current conversation, adding as message');
            setMessages(prev => {
              // Avoid duplicates by checking if message already exists
              const messageExists = prev.some(msg => msg.id === data.id);
              if (!messageExists) {
                console.log('Message notification added to UI');
                return [...prev, {
                  id: data.id,
                  conversation_id: data.conversationId,
                  sender_id: data.sender?.id,
                  sender: data.sender,
                  content: data.content,
                  message_type: data.messageType,
                  sent_at: data.sentAt || new Date().toISOString()
                }];
              } else {
                console.log('Message notification already exists, skipping');
              }
              return prev;
            });
          }

          // Update conversation list to show notification indicator
          loadConversations();
        };

        // Listen for typing indicators
        const handleTypingStart = (event: any) => {
          const { data } = event.detail;
          console.log('User started typing:', data);
          if (data.conversationId === selectedId && data.userId !== user.id) {
            setTypingUsers(prev => {
              if (!prev.includes(data.userName || data.userId)) {
                return [...prev, data.userName || `User ${data.userId}`];
              }
              return prev;
            });
          }
        };

        const handleTypingStop = (event: any) => {
          const { data } = event.detail;
          console.log('User stopped typing:', data);
          if (data.conversationId === selectedId) {
            setTypingUsers(prev => prev.filter(name => name !== (data.userName || `User ${data.userId}`)));
          }
        };

        // Listen for user presence (online/offline status)
        const handleUserOnline = (event: any) => {
          const { data } = event.detail;
          console.log('User came online:', data);
          setOnlineUsers(prev => new Set([...prev, data.userId]));
        };

        const handleUserOffline = (event: any) => {
          const { data } = event.detail;
          console.log('User went offline:', data);
          setOnlineUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.userId);
            return newSet;
          });
        };

        window.addEventListener('socket:message_received', handleNewMessage);
        window.addEventListener('socket:message_notification', handleMessageNotification);
        window.addEventListener('socket:user_typing', handleTypingStart);
        window.addEventListener('socket:user_stopped_typing', handleTypingStop);
        window.addEventListener('socket:user_online', handleUserOnline);
        window.addEventListener('socket:user_offline', handleUserOffline);

        // Only remove event listeners on cleanup, don't disconnect socket
        return () => {
          window.removeEventListener('socket:message_received', handleNewMessage);
          window.removeEventListener('socket:message_notification', handleMessageNotification);
          window.removeEventListener('socket:user_typing', handleTypingStart);
          window.removeEventListener('socket:user_stopped_typing', handleTypingStop);
          window.removeEventListener('socket:user_online', handleUserOnline);
          window.removeEventListener('socket:user_offline', handleUserOffline);
        };
      }
    }
  }, [user, selectedId]); // Added selectedId back to update when conversation changes

  // Cleanup socket on unmount only
  useEffect(() => {
    return () => {
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socketService.disconnect();
    };
  }, []);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedId) {
      loadMessages(selectedId);
      setCurrentPage(1); // Reset pagination
      setHasMoreMessages(true); // Reset pagination flag

      // Join the conversation room when selected
      socketService.getSocket()?.emit('join_conversation', selectedId);
    }
  }, [selectedId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const loadConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'loading conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string, page: number = 1, append: boolean = false) => {
    if (page === 1) setMessagesLoading(true);
    if (append) setLoadingMore(true);

    try {
      // For now, load all messages since backend doesn't support pagination yet
      const data = await getConversationMessages(conversationId);
      if (append) {
        setMessages(prev => [...data, ...prev]); // Prepend older messages
      } else {
        setMessages(data);
      }

      // Simulate pagination for now - assume more messages if we have many
      setHasMoreMessages(data.length >= 50);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'loading messages');
    } finally {
      setMessagesLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreMessages = async () => {
    if (selectedId && hasMoreMessages && !loadingMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      await loadMessages(selectedId, nextPage, true);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      // Filter out current user from the list
      setUsers(data.filter((u: any) => u.id !== user?.id));
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'loading users');
      setUsers([]);
    }
  };

  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && !file) || !selectedId || sending) return;

    const messageContent = message.trim();
    const fileToSend = file;
    const tempMessageId = Date.now().toString();

    setSending(true);
    setUploadError(null);
    setUploadProgress(0);

    // Stop typing indicator when sending message
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    socketService.getSocket()?.emit('stop_typing', { conversationId: selectedId });

    // Set initial status to 'sending'
    setMessageStatus(prev => ({ ...prev, [tempMessageId]: 'sending' }));

    try {
      let response;
      if (fileToSend) {
        const formData = new FormData();
        formData.append('file', fileToSend);
        formData.append('conversationId', selectedId);
        formData.append('content', messageContent || 'File shared');

        // Include reply information if replying
        if (replyingTo) {
          formData.append('replyTo', replyingTo.id);
        }

        response = await sendFileMessage(selectedId, formData, (progress) => {
          setUploadProgress(progress);
        });
      } else {
        // Use HTTP API for reliable message sending
        response = await sendMessage(selectedId, {
          content: messageContent,
          replyTo: replyingTo?.id
        });
      }

      // Update status to 'sent'
      setMessageStatus(prev => ({ ...prev, [tempMessageId]: 'sent' }));

      // Add the sent message to the local state immediately for instant UI feedback
      const newMessage = {
        id: response.id || tempMessageId,
        conversation_id: selectedId,
        sender_id: user!.id,
        sender: {
          id: user!.id,
          name: user!.name,
          email: user!.email,
          role: user!.role
        },
        content: fileToSend ? (messageContent || 'File shared') : messageContent,
        message_type: fileToSend ? 'file' : 'text',
        file_path: fileToSend ? response.file_path : null,
        file_name: fileToSend ? fileToSend.name : null,
        file_size: fileToSend ? fileToSend.size : null,
        sent_at: new Date().toISOString(),
        status: 'sent',
        reply_to: replyingTo
      };

      // Add message to local state immediately
      setMessages(prev => [...prev, newMessage]);

      // Clear input fields
      setMessage("");
      setFile(null);
      setFilePreview(null);
      setUploadProgress(0);

      // Clear reply state
      setReplyingTo(null);

      // Simulate delivered status after a short delay
      setTimeout(() => {
        setMessageStatus(prev => ({ ...prev, [tempMessageId]: 'delivered' }));
      }, 1000);

    } catch (error: any) {
      console.error('Failed to send message:', error);
      // Update status to 'error'
      setMessageStatus(prev => ({ ...prev, [tempMessageId]: 'error' }));

      const errorDetails = ErrorHandler.parse(error);

      if (ErrorHandler.isPayloadTooLarge(error)) {
        const sizeError = ErrorHandler.parseFileSizeError(errorDetails);
        setUploadError(sizeError.message);
      } else {
        setUploadError(errorDetails.userMessage || 'Failed to send message');
      }
    } finally {
      setSending(false);
    }
  }, [message, file, selectedId, sending, user, replyingTo]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    if (selectedFile) {
      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = ev => setFilePreview(ev.target?.result as string);
        reader.readAsDataURL(selectedFile);
      } else {
        // For non-image files, show file type icon
        setFilePreview(null);
      }
    } else {
      setFilePreview(null);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'xls':
      case 'xlsx': return '📊';
      case 'ppt':
      case 'pptx': return '📽️';
      case 'txt': return '📄';
      case 'zip':
      case 'rar': return '📦';
      default: return '📎';
    }
  };

  const handleStartDM = async () => {
    if (!dmTarget) return;

    setCreating(true);
    try {
      const result = await createConversation({
        participants: [user!.id, dmTarget] // Both are string user IDs
      });

      // Reload conversations to get the properly formatted data with user objects
      await loadConversations();

      // Select the new conversation
      setSelectedId(result.id);

      // Load messages for the new conversation
      await loadMessages(result.id);

      // Close modal and reset form
      setShowNewDM(false);
      setDMTarget("");

      showToast('Conversation started successfully!', 'success');
    } catch (error: any) {
      console.error('Conversation creation error:', error);
      ErrorHandler.handleError(error, showToast, 'creating conversation');
    } finally {
      setCreating(false);
    }
  };



  const handleReply = (message: any) => {
    setReplyingTo(message);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const handleSearch = async (query: string) => {
    if (!query.trim() || !selectedId) {
      setSearchResults([]);
      return;
    }

    try {
      // For now, filter local messages. In production, this would call an API
      const filtered = messages.filter(msg =>
        msg.content.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    } catch (error: any) {
      console.error('Search error:', error);
      ErrorHandler.handleError(error, showToast, 'searching messages');
    }
  };

  const scrollToMessage = (messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.classList.add('bg-yellow-100');
      setTimeout(() => {
        messageElement.classList.remove('bg-yellow-100');
      }, 2000);
    }
    setShowSearch(false);
    setSearchResults([]);
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const Avatar = ({ name, role }: { name: string; role: string }) => {
    const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    return (
      <span
        className={clsx("inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shadow", roleColors[role] || roleColors.default)}
        title={`${name} (${roleDisplayNames[role] || role})`}
      >
        {initials || '?'}
      </span>
    );
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center max-w-5xl mx-auto mt-8">
        <div className="w-full">
          <PageSkeleton count={5} layout="list" />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isMobile ? 'flex-col h-screen' : 'h-[80vh]'} bg-white rounded-lg shadow-lg overflow-hidden ${isMobile ? 'max-w-full mx-0' : 'max-w-5xl mx-auto'} mt-8`} role="main" aria-label="Messaging interface">
      {/* Sidebar */}
      <aside className={`${isMobile ? 'w-full h-32' : 'w-64'} bg-gray-50 border-r flex flex-col`} role="complementary" aria-label="Conversations list">
        <div className="p-4 border-b text-xl font-extrabold text-blue-900 flex items-center justify-between">
          Inbox
          <div className="flex gap-2">
            <ButtonLoader
              onClick={() => setShowSearch(!showSearch)}
              loading={false}
              label="🔍"
              variant="secondary"
              size="sm"
              className="text-xs px-2"
              aria-label="Search messages"
            />
            <ButtonLoader
              onClick={() => setShowNewDM(true)}
              loading={false}
              label="+ New"
              variant="primary"
              size="sm"
              className="text-xs"
              aria-label="Start new conversation"
            />
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="p-3 border-b bg-blue-50">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              placeholder="Search messages..."
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
              autoFocus
            />
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-32 overflow-y-auto">
                {searchResults.map((msg, index) => (
                  <button
                    key={msg.id || index}
                    onClick={() => scrollToMessage(msg.id)}
                    className="w-full text-left p-2 hover:bg-blue-100 rounded text-sm truncate"
                  >
                    {msg.content}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className={`flex-1 overflow-y-auto ${isMobile ? 'flex overflow-x-auto space-x-4 pb-2' : ''}`}>
          {conversations.length === 0 ? (
            <div className="p-8 text-gray-400 text-center">No conversations yet.</div>
          ) : (
            conversations.map(c => {
              // Show conversation name (other participant)
              const participants = c.participants || c.other_participants || [];

              // Handle both old format (string IDs) and new format (user objects)
              let otherParticipant: any = null;
              let displayName = '';
              let participantRole = 'default';

              if (participants.length > 0) {
                // Find the other participant (not current user)
                otherParticipant = participants.find((p: any) =>
                  typeof p === 'string' ? p !== user.id : p.id !== user.id
                );

                if (otherParticipant) {
                  if (typeof otherParticipant === 'string') {
                    // Old format: just user ID string
                    displayName = `User ${otherParticipant}`;
                    participantRole = 'default';
                  } else {
                    // New format: user object with name, email, role
                    displayName = otherParticipant.name ||
                      otherParticipant.email?.split('@')[0] ||
                      `User ${otherParticipant.id}`;
                    participantRole = otherParticipant.role || 'default';
                  }
                }
              }

              // Fallback if no other participant found
              if (!displayName) {
                displayName = 'Unknown User';
                participantRole = 'default';
              }

              const lastMsg = c.latest_message || c.messages?.[c.messages.length - 1];
              return (
                <button
                  key={c.id}
                  className={clsx(
                    `${isMobile ? 'flex-shrink-0 w-48' : 'w-full'} flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-100 transition border-b focus:outline-none focus:ring-2 focus:ring-blue-500`,
                    selectedId === c.id && "bg-blue-50 border-l-4 border-blue-600"
                  )}
                  onClick={() => setSelectedId(c.id)}
                  aria-label={`Open conversation with ${displayName}`}
                  aria-pressed={selectedId === c.id}
                >
                  <div className="flex items-center gap-2">
                    <Avatar name={displayName} role={participantRole} />
                    {otherParticipant && typeof otherParticipant === 'object' && otherParticipant.id && onlineUsers.has(otherParticipant.id) && (
                      <span className="w-2 h-2 bg-green-500 rounded-full -ml-1" title="Online"></span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-blue-900 truncate">
                      {displayName}
                      {participantRole && participantRole !== 'default' && (
                        <span className="ml-2 text-xs font-normal text-gray-500">
                          ({roleDisplayNames[participantRole] || participantRole})
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {lastMsg ? lastMsg.content.slice(0, 30) : "No messages yet."}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
        {/* New DM Modal */}
        <Modal
          title="Start New Message"
          open={showNewDM}
          onClose={() => { setShowNewDM(false); setDMTarget(""); }}
          actions={null}
          role="dialog"
          aria-modal="true"
        >
          <div className="mb-4">
            <label className="block mb-1 font-semibold text-blue-800">Select user to message</label>
            <select
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
              value={dmTarget}
              onChange={e => setDMTarget(e.target.value)}
            >
              <option value="">Select...</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email?.split('@')[0] || `User ${u.id}`}
                  {u.role && (
                    <span className="text-gray-500 ml-1">
                      ({roleDisplayNames[u.role] || u.role})
                    </span>
                  )} - {u.email}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <ButtonLoader
              variant="secondary"
              type="button"
              onClick={() => { setShowNewDM(false); setDMTarget(""); }}
              loading={false}
              label="Cancel"
            />
            <ButtonLoader
              type="button"
              onClick={handleStartDM}
              loading={creating}
              label="Start"
              loadingText="Creating..."
              variant="primary"
              disabled={!dmTarget}
            />
          </div>
        </Modal>
      </aside>
      {/* Main Chat Area */}
      <main className={`${isMobile ? 'flex-1' : 'flex-1'} flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b flex items-center gap-3 bg-white">
          {selectedId ? (
            <>
              {(() => {
                const conversation = conversations.find(c => c.id === selectedId);
                const participants = conversation?.participants || conversation?.other_participants || [];

                // Find the other participant (not current user)
                const otherParticipant = participants.find((p: any) =>
                  typeof p === 'string' ? p !== user.id : p.id !== user.id
                );

                let displayName = 'Chat';
                let participantRole = 'default';

                if (otherParticipant) {
                  if (typeof otherParticipant === 'string') {
                    displayName = `User ${otherParticipant}`;
                  } else {
                    displayName = otherParticipant.name ||
                      otherParticipant.email?.split('@')[0] ||
                      `User ${otherParticipant.id}`;
                    participantRole = otherParticipant.role || 'default';
                  }
                }

                return (
                  <>
                    <Avatar name={displayName} role={participantRole} />
                    <div>
                      <div className="font-bold text-blue-900">
                        {displayName}
                        {participantRole && participantRole !== 'default' && (
                          <span className="ml-2 text-sm font-normal text-gray-500">
                            ({roleDisplayNames[participantRole] || participantRole})
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <span>Direct message</span>
                        {(() => {
                          const conversation = conversations.find(c => c.id === selectedId);
                          const participants = conversation?.participants || conversation?.other_participants || [];
                          const otherParticipant = participants.find((p: any) =>
                            typeof p === 'string' ? p !== user.id : p.id !== user.id
                          );
                          const otherUserId = typeof otherParticipant === 'string' ? otherParticipant : otherParticipant?.id;

                          if (otherUserId && onlineUsers.has(otherUserId)) {
                            return <span className="w-2 h-2 bg-green-500 rounded-full" title="Online"></span>;
                          }
                          return <span className="w-2 h-2 bg-gray-400 rounded-full" title="Offline"></span>;
                        })()}
                      </div>
                    </div>
                  </>
                );
              })()}
            </>
          ) : (
            <div className="text-gray-400">Select a conversation</div>
          )}
        </div>
        {/* Messages */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 py-6 bg-gradient-to-br from-blue-50 to-white"
          role="log"
          aria-label="Chat messages"
          aria-live="polite"
          onScroll={(e) => {
            const target = e.target as HTMLDivElement;
            // Load more messages when scrolled to top
            if (target.scrollTop === 0 && hasMoreMessages && !loadingMore) {
              loadMoreMessages();
            }
          }}
        >
          {selectedId ? (
            messagesLoading ? (
              <PageSkeleton count={4} layout="list" />
            ) : (
              <div className="flex flex-col gap-4">
                {/* Load More Indicator */}
                {loadingMore && (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                )}

                {messages.map((msg, i) => {
                  const senderId = msg.sender?.id || msg.sender_id;
                  const isMe = senderId === user.id;

                  return (
                    <div key={msg.id || i} id={`message-${msg.id}`} className={clsx("flex items-end gap-2 group", isMe ? "justify-end" : "justify-start")}>
                      {!isMe && <Avatar name={msg.sender?.name || msg.sender?.email?.split('@')[0] || `User ${senderId}`} role={msg.sender?.role || "default"} />}
                      <div className="flex-1 max-w-xs">
                        <div className={clsx(
                          "px-4 py-2 rounded-lg shadow text-sm break-words relative",
                          isMe
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-white text-gray-900 rounded-bl-none"
                        )}>
                          {/* Reply indicator */}
                          {msg.reply_to && (
                            <div className="border-l-2 border-gray-300 pl-2 mb-2 text-xs opacity-75">
                              <div className="font-medium">Replying to {msg.reply_to.sender?.name || 'Unknown'}</div>
                              <div className="truncate">{msg.reply_to.content}</div>
                            </div>
                          )}

                          <span className="block">{msg.content}</span>
                          {msg.file_path && (
                            <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{getFileIcon(msg.file_name || 'file')}</span>
                                <div>
                                  <div className="font-medium">{msg.file_name || 'File'}</div>
                                  {msg.file_size && <div className="text-gray-500">{(msg.file_size / 1024 / 1024).toFixed(2)} MB</div>}
                                </div>
                              </div>
                              {msg.file_path && (
                                <a
                                  href={`http://localhost:3001${msg.file_path}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline mt-1 inline-block"
                                  aria-label={`View file: ${msg.file_name || 'File'}`}
                                >
                                  View File
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        <div className={clsx("text-xs mt-1 flex items-center gap-1", isMe ? "justify-end text-blue-400" : "justify-start text-gray-400")}>
                          <span>{formatTime(msg.sent_at)}</span>
                          {isMe && (
                            <span className="text-xs">
                              {messageStatus[msg.id] === 'sending' && <span className="text-yellow-500">⏳</span>}
                              {messageStatus[msg.id] === 'sent' && <span className="text-blue-500">✓</span>}
                              {messageStatus[msg.id] === 'delivered' && <span className="text-green-500">✓✓</span>}
                              {messageStatus[msg.id] === 'error' && <span className="text-red-500">✗</span>}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Typing Indicator */}
                {typingUsers.length > 0 && (
                  <div className="flex items-center gap-2 text-gray-500 text-sm italic">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span>
                      {typingUsers.length === 1
                        ? `${typingUsers[0]} is typing...`
                        : `${typingUsers.slice(0, -1).join(', ')} and ${typingUsers[typingUsers.length - 1]} are typing...`
                      }
                    </span>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            )
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">Select a conversation to start chatting.</div>
          )}
        </div>
        {/* Input */}
        {selectedId && (
          <>
            {/* File preview above input */}
            {file && (
              <div className="p-3 bg-blue-50 border-l-4 border-blue-400 mb-2 rounded">
                <div className="flex items-center gap-2">
                  {filePreview && file.type.startsWith("image/") ? (
                    <img src={filePreview} alt="preview" className="w-16 h-16 object-cover rounded shadow" />
                  ) : (
                    <span className="inline-block w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-2xl" role="img" aria-label={`File type: ${file.name.split('.').pop()?.toUpperCase() || 'Unknown'}`}>
                      {getFileIcon(file.name)}
                    </span>
                  )}
                  <div className="flex-1">
                    <span className="text-blue-900 text-sm font-semibold block">{file.name}</span>
                    <span className="text-blue-600 text-xs">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                  <button
                    onClick={() => {
                      setFile(null);
                      setFilePreview(null);
                      setUploadError(null);
                      setUploadProgress(0);
                    }}
                    className="text-blue-400 hover:text-blue-700 text-lg"
                  >
                    &times;
                  </button>
                </div>
                {sending && uploadProgress > 0 && (
                  <div className="mt-2">
                    <div className="bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-blue-600 mt-1">Uploading... {uploadProgress}%</div>
                  </div>
                )}
                {uploadError && (
                  <div className="mt-2 text-red-600 text-sm bg-red-50 p-2 rounded">
                    {uploadError}
                  </div>
                )}
              </div>
            )}
            <form onSubmit={handleSend} className="p-4 border-t bg-white flex gap-2">
              {/* Voice message button (placeholder for future implementation) */}
              <button
                type="button"
                className="px-2 text-2xl text-blue-400 hover:text-blue-700 focus:outline-none opacity-50 cursor-not-allowed"
                disabled
                title="Voice messages coming soon"
                aria-label="Voice message (coming soon)"
              >
                🎤
              </button>

              {/* Attachment icon */}
              <button
                type="button"
                className="px-2 text-2xl text-blue-400 hover:text-blue-700 focus:outline-none"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach file"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l7.07-7.07a4 4 0 00-5.656-5.657l-8.486 8.485a6 6 0 108.485 8.486l7.071-7.072"/></svg>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,audio/*"
              />
              <input
                type="text"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);

                  // Handle typing indicators
                  if (selectedId && e.target.value.trim()) {
                    socketService.getSocket()?.emit('start_typing', { conversationId: selectedId });

                    // Clear existing timeout
                    if (typingTimeoutRef.current) {
                      clearTimeout(typingTimeoutRef.current);
                    }

                    // Set timeout to stop typing indicator after 3 seconds of inactivity
                    typingTimeoutRef.current = setTimeout(() => {
                      socketService.getSocket()?.emit('stop_typing', { conversationId: selectedId });
                      typingTimeoutRef.current = null;
                    }, 3000);
                  } else if (selectedId) {
                    // Stop typing if message is cleared
                    socketService.getSocket()?.emit('stop_typing', { conversationId: selectedId });
                    if (typingTimeoutRef.current) {
                      clearTimeout(typingTimeoutRef.current);
                      typingTimeoutRef.current = null;
                    }
                  }
                }}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                autoFocus
                disabled={sending}
                aria-label="Type your message"
                maxLength={1000}
              />
              <ButtonLoader
                type="submit"
                loading={sending}
                label="Send"
                loadingText="Sending..."
                variant="primary"
                disabled={!message.trim() && !file}
                aria-label="Send message"
              />
            </form>
          </>
        )}
      </main>
    </div>
  );
};

export default Messaging;