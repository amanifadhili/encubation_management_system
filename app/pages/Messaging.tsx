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
  getUsers,
} from "../services/api";
import socketService from "../services/socket";

// Add custom animations via style tag
const animationStyles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
  
  .animate-fade-in-up {
    animation: fadeInUp 0.3s ease-out forwards;
  }
  
  .animate-slide-in-right {
    animation: slideInRight 0.3s ease-out forwards;
  }
  
  .animate-slide-in-left {
    animation: slideInLeft 0.3s ease-out forwards;
  }
  
  .animate-scale-in {
    animation: scaleIn 0.2s ease-out forwards;
  }
  
  .animate-pulse-slow {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
`;

// Role-based color map with gradients
const roleColors: { [key: string]: string } = {
  director:
    "bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 text-white",
  manager:
    "bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-600 text-white",
  mentor:
    "bg-gradient-to-br from-green-600 via-emerald-500 to-teal-600 text-white",
  incubator:
    "bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500 text-white",
  default:
    "bg-gradient-to-br from-gray-400 via-gray-500 to-slate-500 text-white",
};

// Role display names
const roleDisplayNames: { [key: string]: string } = {
  director: "Director",
  manager: "Manager",
  mentor: "Mentor",
  incubator: "Incubator",
  default: "User",
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
  const [messageStatus, setMessageStatus] = useState<{
    [key: string]: "sending" | "sent" | "delivered" | "error";
  }>({});
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [pullToRefreshState, setPullToRefreshState] = useState<{
    isPulling: boolean;
    distance: number;
  }>({ isPulling: false, distance: 0 });
  const pullToRefreshStartY = useRef<number>(0);
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

  // Responsive detection (Mobile, Tablet, Desktop)
  useEffect(() => {
    const checkResponsive = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      const tablet = width >= 768 && width < 1024;
      setIsMobile(mobile);
      setIsTablet(tablet);
      // Auto-hide sidebar on mobile when conversation is selected
      if (mobile && selectedId) {
        setShowSidebar(false);
      } else if (!mobile) {
        setShowSidebar(true);
      }
    };

    checkResponsive();
    window.addEventListener("resize", checkResponsive);
    return () => window.removeEventListener("resize", checkResponsive);
  }, [selectedId]);

  // Connect to socket when user is available (only once)
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem("token");
      if (token) {
        socketService.connect(token);

        // Listen for new messages
        const handleNewMessage = (event: any) => {
          const { data } = event.detail;

          // Add message to current conversation if it's the selected one
          if (
            selectedId === data.conversation_id ||
            selectedId === data.conversationId
          ) {
            setMessages((prev) => {
              // Avoid duplicates by checking if message already exists
              const messageExists = prev.some((msg) => msg.id === data.id);
              if (!messageExists) {
                return [...prev, data];
              }
              return prev;
            });
          }

          // Update conversation list to show latest message
          loadConversations();
        };

        // Listen for message notifications (for other conversations)
        const handleMessageNotification = (event: any) => {
          const { data } = event.detail;

          // If this notification is for the currently selected conversation, treat it as a new message
          if (selectedId === data.conversationId) {
            setMessages((prev) => {
              // Avoid duplicates by checking if message already exists
              const messageExists = prev.some((msg) => msg.id === data.id);
              if (!messageExists) {
                return [
                  ...prev,
                  {
                    id: data.id,
                    conversation_id: data.conversationId,
                    sender_id: data.sender?.id,
                    sender: data.sender,
                    content: data.content,
                    message_type: data.messageType,
                    sent_at: data.sentAt || new Date().toISOString(),
                  },
                ];
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
          if (data.conversationId === selectedId && data.userId !== user.id) {
            setTypingUsers((prev) => {
              if (!prev.includes(data.userName || data.userId)) {
                return [...prev, data.userName || `User ${data.userId}`];
              }
              return prev;
            });
          }
        };

        const handleTypingStop = (event: any) => {
          const { data } = event.detail;
          if (data.conversationId === selectedId) {
            setTypingUsers((prev) =>
              prev.filter(
                (name) => name !== (data.userName || `User ${data.userId}`)
              )
            );
          }
        };

        // Listen for user presence (online/offline status)
        const handleUserOnline = (event: any) => {
          const { data } = event.detail;
          setOnlineUsers((prev) => new Set([...prev, data.userId]));
        };

        const handleUserOffline = (event: any) => {
          const { data } = event.detail;
          setOnlineUsers((prev) => {
            const newSet = new Set(prev);
            newSet.delete(data.userId);
            return newSet;
          });
        };

        window.addEventListener("socket:message_received", handleNewMessage);
        window.addEventListener(
          "socket:message_notification",
          handleMessageNotification
        );
        window.addEventListener("socket:user_typing", handleTypingStart);
        window.addEventListener("socket:user_stopped_typing", handleTypingStop);
        window.addEventListener("socket:user_online", handleUserOnline);
        window.addEventListener("socket:user_offline", handleUserOffline);

        // Only remove event listeners on cleanup, don't disconnect socket
        return () => {
          window.removeEventListener(
            "socket:message_received",
            handleNewMessage
          );
          window.removeEventListener(
            "socket:message_notification",
            handleMessageNotification
          );
          window.removeEventListener("socket:user_typing", handleTypingStart);
          window.removeEventListener(
            "socket:user_stopped_typing",
            handleTypingStop
          );
          window.removeEventListener("socket:user_online", handleUserOnline);
          window.removeEventListener("socket:user_offline", handleUserOffline);
        };
      }
    }
  }, [user, selectedId]); // Added selectedId back to update when conversation changes

  // Cleanup socket and timeouts on unmount only
  useEffect(() => {
    return () => {
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Clear search timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
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
      socketService.getSocket()?.emit("join_conversation", selectedId);
    }
  }, [selectedId]);

  // Scroll to bottom when messages change with smooth animation
  useEffect(() => {
    if (chatEndRef.current && messages.length > 0) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
          inline: "nearest",
        });
      }, 100);
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
      ErrorHandler.handleError(error, showToast, "loading conversations");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (
    conversationId: string,
    page: number = 1,
    append: boolean = false
  ) => {
    if (page === 1) setMessagesLoading(true);
    if (append) setLoadingMore(true);

    try {
      // For now, load all messages since backend doesn't support pagination yet
      const data = await getConversationMessages(conversationId);
      if (append) {
        setMessages((prev) => [...data, ...prev]); // Prepend older messages
      } else {
        setMessages(data);
      }

      // Simulate pagination for now - assume more messages if we have many
      setHasMoreMessages(data.length >= 50);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "loading messages");
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
      // Ensure data is an array before filtering
      const usersArray = Array.isArray(data)
        ? data
        : data?.users || data?.data?.users || data?.data || [];
      // Filter out current user from the list
      setUsers(usersArray.filter((u: any) => u.id !== user?.id));
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "loading users");
      setUsers([]);
    }
  };

  const handleSend = useCallback(
    async (e: React.FormEvent) => {
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
      socketService
        .getSocket()
        ?.emit("stop_typing", { conversationId: selectedId });

      // Set initial status to 'sending'
      setMessageStatus((prev) => ({ ...prev, [tempMessageId]: "sending" }));

      try {
        let response;
        if (fileToSend) {
          const formData = new FormData();
          formData.append("file", fileToSend);
          formData.append("conversationId", selectedId);
          formData.append("content", messageContent || "File shared");

          // Include reply information if replying
          if (replyingTo) {
            formData.append("replyTo", replyingTo.id);
          }

          response = await sendFileMessage(selectedId, formData, (progress) => {
            setUploadProgress(progress);
          });
        } else {
          // Use HTTP API for reliable message sending
          response = await sendMessage(selectedId, {
            content: messageContent,
            replyTo: replyingTo?.id,
          });
        }

        // Update status to 'sent'
        setMessageStatus((prev) => ({ ...prev, [tempMessageId]: "sent" }));

        // Add the sent message to the local state immediately for instant UI feedback
        const newMessage = {
          id: response.id || tempMessageId,
          conversation_id: selectedId,
          sender_id: user!.id,
          sender: {
            id: user!.id,
            name: user!.name,
            email: user!.email,
            role: user!.role,
          },
          content: fileToSend
            ? messageContent || "File shared"
            : messageContent,
          message_type: fileToSend ? "file" : "text",
          file_path: fileToSend ? response.file_path : null,
          file_name: fileToSend ? fileToSend.name : null,
          file_size: fileToSend ? fileToSend.size : null,
          sent_at: new Date().toISOString(),
          status: "sent",
          reply_to: replyingTo,
        };

        // Add message to local state immediately
        setMessages((prev) => [...prev, newMessage]);

        // Clear input fields
        setMessage("");
        setFile(null);
        setFilePreview(null);
        setUploadProgress(0);

        // Clear reply state
        setReplyingTo(null);

        // Simulate delivered status after a short delay
        setTimeout(() => {
          setMessageStatus((prev) => ({
            ...prev,
            [tempMessageId]: "delivered",
          }));
        }, 1000);
      } catch (error: any) {
        console.error("Failed to send message:", error);
        // Update status to 'error'
        setMessageStatus((prev) => ({ ...prev, [tempMessageId]: "error" }));

        const errorDetails = ErrorHandler.parse(error);

        if (ErrorHandler.isPayloadTooLarge(error)) {
          const sizeError = ErrorHandler.parseFileSizeError(errorDetails);
          setUploadError(sizeError.message);
        } else {
          setUploadError(errorDetails.userMessage || "Failed to send message");
        }
      } finally {
        setSending(false);
      }
    },
    [message, file, selectedId, sending, user, replyingTo]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    if (selectedFile) {
      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (ev) => setFilePreview(ev.target?.result as string);
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
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return "📄";
      case "doc":
      case "docx":
        return "📝";
      case "xls":
      case "xlsx":
        return "📊";
      case "ppt":
      case "pptx":
        return "📽️";
      case "txt":
        return "📄";
      case "zip":
      case "rar":
        return "📦";
      default:
        return "📎";
    }
  };

  const handleStartDM = async () => {
    if (!dmTarget) return;

    setCreating(true);
    try {
      const result = await createConversation({
        participants: [user!.id, dmTarget], // Both are string user IDs
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

      showToast("Conversation started successfully!", "success");
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, "creating conversation");
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

  // Debounced search function
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback(
    (query: string) => {
      // Clear existing timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Debounce search by 300ms
      searchTimeoutRef.current = setTimeout(() => {
        if (!query.trim() || !selectedId) {
          setSearchResults([]);
          return;
        }

        try {
          // Filter local messages - in production, this would call an API
          const filtered = messages.filter((msg) =>
            msg.content?.toLowerCase().includes(query.toLowerCase())
          );
          setSearchResults(filtered);
        } catch (error: any) {
          ErrorHandler.handleError(error, showToast, "searching messages");
        }
      }, 300);
    },
    [messages, selectedId, showToast]
  );

  const scrollToMessage = useCallback((messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      // Highlight the message temporarily
      messageElement.classList.add("bg-yellow-100", "transition-colors");
      setTimeout(() => {
        messageElement.classList.remove("bg-yellow-100");
      }, 2000);
    }
    setShowSearch(false);
    setSearchResults([]);
    setSearchQuery("");
  }, []);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key: Close search or sidebar
      if (e.key === "Escape") {
        if (showSearch) {
          setShowSearch(false);
          setSearchResults([]);
          setSearchQuery("");
        } else if (isMobile && showSidebar) {
          setShowSidebar(false);
        }
      }

      // Ctrl/Cmd + K: Open search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
      }

      // Ctrl/Cmd + N: New message
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        setShowNewDM(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSearch, isMobile, showSidebar]);

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const Avatar = ({
    name,
    role,
    isOnline,
    size = "md",
  }: {
    name: string;
    role: string;
    isOnline?: boolean;
    size?: "sm" | "md" | "lg";
  }) => {
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const sizeClasses = {
      sm: "w-6 h-6 text-xs",
      md: "w-8 h-8 text-sm",
      lg: "w-10 h-10 text-base",
    };

    return (
      <div className="relative group">
        <span
          className={clsx(
            "inline-flex items-center justify-center rounded-full font-bold shadow-[0_2px_8px_-2px_rgba(0,0,0,0.2)] border-2 border-white/30 transition-all duration-200 hover:scale-105 hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)] cursor-pointer",
            sizeClasses[size],
            roleColors[role] || roleColors.default
          )}
          title={`${name} (${roleDisplayNames[role] || role})${
            isOnline ? " - Online" : ""
          }`}
        >
          {initials || "?"}
        </span>
        {isOnline !== undefined && (
          <span
            className={clsx(
              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white shadow-sm",
              isOnline ? "bg-green-500" : "bg-gray-400"
            )}
            title={isOnline ? "Online" : "Offline"}
          />
        )}
        {/* Tooltip on hover */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
          {name} ({roleDisplayNames[role] || role})
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
        </div>
      </div>
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

  // Helper function to group messages by date
  const groupMessagesByDate = (messages: any[]) => {
    const groups: { [key: string]: any[] } = {};
    messages.forEach((msg) => {
      const date = new Date(msg.sent_at).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    return groups;
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
    }
  };

  return (
    <>
      <style>{animationStyles}</style>
      <div
        className={`flex ${
          isMobile ? "flex-col h-screen" : "h-[calc(100vh-6rem)]"
        } bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3),0_10px_25px_-5px_rgba(0,0,0,0.1)] overflow-hidden ${
          isMobile ? "max-w-full mx-0 rounded-none" : "max-w-6xl mx-auto"
        } ${
          isMobile ? "mt-0" : "mt-4"
        } border border-slate-200/60 backdrop-blur-sm`}
        style={{
          background:
            "linear-gradient(135deg, #f8fafc 0%, #eff6ff 30%, #eef2ff 50%, #f5f3ff 100%)",
        }}
        role="main"
        aria-label="Messaging interface"
      >
        {/* Sidebar */}
        <aside
          className={`${
            isMobile
              ? showSidebar
                ? "fixed inset-y-0 left-0 z-50 w-full max-w-[85vw] animate-slide-in-left"
                : "hidden"
              : isTablet
              ? "w-72"
              : "w-80"
          } bg-white/98 backdrop-blur-md border-r border-slate-200/80 flex flex-col transition-all duration-300 ease-in-out shadow-[4px_0_20px_-5px_rgba(0,0,0,0.1),2px_0_8px_-2px_rgba(0,0,0,0.05)]`}
          role="complementary"
          aria-label="Conversations list"
        >
          {/* Sticky Header */}
          <div
            className={clsx(
              "sticky top-0 z-10 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 border-b border-blue-700/50 shadow-[0_4px_12px_-2px_rgba(59,130,246,0.3)]",
              isMobile ? "p-3" : "p-4"
            )}
          >
            <div
              className={clsx(
                "flex items-center justify-between",
                isMobile ? "mb-2" : "mb-3"
              )}
            >
              <h2
                className={clsx(
                  "font-bold text-white tracking-tight leading-tight",
                  isMobile ? "text-lg" : "text-xl"
                )}
              >
                Messages
              </h2>
              {isMobile && (
                <button
                  onClick={() => setShowSidebar(false)}
                  className="text-white hover:bg-white/20 p-1 rounded-lg transition-colors"
                  aria-label="Close sidebar"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
            <div className={clsx("flex gap-2", isMobile && "gap-1.5")}>
              <button
                onClick={() => setShowSearch(!showSearch)}
                className={clsx(
                  "flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm border border-white/10 touch-manipulation",
                  isMobile
                    ? "px-2.5 py-2 text-xs min-h-[40px]"
                    : "px-3 py-2 text-sm"
                )}
                aria-label="Search messages"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Search
              </button>
              <button
                onClick={() => setShowNewDM(true)}
                className={clsx(
                  "flex-1 bg-white hover:bg-gray-50 text-blue-600 font-semibold rounded-lg transition-all duration-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.15)] border border-white/20 touch-manipulation",
                  isMobile
                    ? "px-2.5 py-2 text-xs min-h-[40px]"
                    : "px-3 py-2 text-sm"
                )}
                aria-label="Start new conversation"
              >
                + New
              </button>
            </div>
          </div>

          {/* Search Bar */}
          {showSearch && (
            <div className="px-4 py-3 border-b border-slate-200/60 bg-gradient-to-b from-white/80 to-white/60 backdrop-blur-md shadow-sm">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  placeholder="Search messages..."
                  className="w-full px-4 py-2.5 pl-10 border border-slate-300/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 text-sm bg-white/90 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] transition-all duration-200 placeholder:text-slate-400"
                  autoFocus
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto rounded-lg bg-white/95 backdrop-blur-sm shadow-[0_4px_12px_-2px_rgba(0,0,0,0.15)] border border-slate-200/60">
                  {searchResults.map((msg, index) => (
                    <button
                      key={msg.id || index}
                      onClick={() => scrollToMessage(msg.id)}
                      className="w-full text-left p-3 hover:bg-blue-50/80 rounded-lg text-sm transition-colors border-b border-slate-100/60 last:border-b-0 font-medium text-slate-700 hover:text-blue-700"
                    >
                      <div className="truncate leading-relaxed">
                        {msg.content}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Conversations List */}
          <div
            className={`flex-1 overflow-y-auto ${
              isMobile ? "flex overflow-x-auto space-x-4 pb-2 px-2" : ""
            } scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent`}
          >
            {conversations.length === 0 ? (
              <div className="p-8 text-slate-400 text-center">
                <svg
                  className="w-12 h-12 mx-auto mb-3 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="text-sm font-semibold text-slate-600">
                  No conversations yet.
                </p>
                <p className="text-xs mt-1.5 text-slate-500 font-medium">
                  Start a new conversation to get started!
                </p>
              </div>
            ) : (
              conversations.map((c) => {
                // Show conversation name (other participant)
                const participants =
                  c.participants || c.other_participants || [];

                // Handle both old format (string IDs) and new format (user objects)
                let otherParticipant: any = null;
                let displayName = "";
                let participantRole = "default";

                if (participants.length > 0) {
                  // Find the other participant (not current user)
                  otherParticipant = participants.find((p: any) =>
                    typeof p === "string" ? p !== user.id : p.id !== user.id
                  );

                  if (otherParticipant) {
                    if (typeof otherParticipant === "string") {
                      // Old format: just user ID string
                      displayName = `User ${otherParticipant}`;
                      participantRole = "default";
                    } else {
                      // New format: user object with name, email, role
                      displayName =
                        otherParticipant.name ||
                        otherParticipant.email?.split("@")[0] ||
                        `User ${otherParticipant.id}`;
                      participantRole = otherParticipant.role || "default";
                    }
                  }
                }

                // Fallback if no other participant found
                if (!displayName) {
                  displayName = "Unknown User";
                  participantRole = "default";
                }

                const lastMsg =
                  c.latest_message || c.messages?.[c.messages.length - 1];
                const unreadCount = c.unread_count || 0;
                const isSelected = selectedId === c.id;

                return (
                  <button
                    key={c.id}
                    className={clsx(
                      `${
                        isMobile
                          ? "flex-shrink-0 w-48 min-h-[60px]"
                          : "w-full min-h-[56px]"
                      } flex items-center gap-3 text-left transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-xl mx-2 my-1 animate-slide-in-right touch-manipulation`,
                      isMobile ? "px-3 py-3" : "px-4 py-3.5",
                      isSelected
                        ? "bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white shadow-[0_4px_12px_-2px_rgba(59,130,246,0.4)] transform scale-[1.01] border border-blue-400/20"
                        : "hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50/50 hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] hover:scale-[1.01] border border-transparent hover:border-slate-200/60 active:scale-[0.98]"
                    )}
                    onClick={() => {
                      setSelectedId(c.id);
                      if (isMobile) setShowSidebar(false);
                    }}
                    aria-label={`Open conversation with ${displayName}`}
                    aria-pressed={isSelected}
                    style={{
                      animationDelay: `${conversations.indexOf(c) * 0.03}s`,
                      animationFillMode: "both",
                      touchAction: "manipulation",
                    }}
                  >
                    <Avatar
                      name={displayName}
                      role={participantRole}
                      isOnline={
                        otherParticipant &&
                        typeof otherParticipant === "object" &&
                        otherParticipant.id
                          ? onlineUsers.has(otherParticipant.id)
                          : undefined
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div
                          className={clsx(
                            "font-semibold truncate leading-tight",
                            isSelected ? "text-white" : "text-slate-900"
                          )}
                        >
                          {displayName}
                        </div>
                        {lastMsg && (
                          <span
                            className={clsx(
                              "text-xs ml-2 flex-shrink-0 font-medium",
                              isSelected ? "text-white/90" : "text-slate-500"
                            )}
                          >
                            {formatTime(lastMsg.sent_at || lastMsg.created_at)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div
                          className={clsx(
                            "text-xs truncate flex-1 leading-relaxed",
                            isSelected ? "text-white/95" : "text-slate-600"
                          )}
                        >
                          {lastMsg
                            ? (lastMsg.content || "File shared").slice(0, 40)
                            : "No messages yet."}
                        </div>
                        {unreadCount > 0 && (
                          <span
                            className={clsx(
                              "flex-shrink-0 min-w-[20px] h-5 px-2 rounded-full text-xs font-bold flex items-center justify-center shadow-sm",
                              isSelected
                                ? "bg-white/95 text-blue-600 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.1)]"
                                : "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_2px_6px_-1px_rgba(59,130,246,0.4)]"
                            )}
                          >
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                      </div>
                      {participantRole && participantRole !== "default" && (
                        <div
                          className={clsx(
                            "text-xs mt-1 font-medium",
                            isSelected ? "text-white/80" : "text-slate-500"
                          )}
                        >
                          {roleDisplayNames[participantRole] || participantRole}
                        </div>
                      )}
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
            onClose={() => {
              setShowNewDM(false);
              setDMTarget("");
            }}
            actions={null}
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-4">
              <label className="block mb-2 font-semibold text-slate-700">
                Select user to message
              </label>
              <div className="max-h-64 overflow-y-auto border border-slate-200/60 rounded-lg shadow-sm">
                {users.map((u) => {
                  const userName =
                    u.name || u.email?.split("@")[0] || `User ${u.id}`;
                  const isSelected = dmTarget === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setDMTarget(u.id)}
                      className={clsx(
                        "w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 hover:bg-blue-50/50 border-b border-slate-100/60 last:border-b-0",
                        isSelected && "bg-blue-50 border-l-4 border-l-blue-600"
                      )}
                    >
                      <Avatar
                        name={userName}
                        role={u.role || "default"}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 truncate">
                          {userName}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {u.email}
                          {u.role && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              {roleDisplayNames[u.role] || u.role}
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <svg
                          className="w-5 h-5 text-blue-600 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                  );
                })}
                {users.length === 0 && (
                  <div className="p-8 text-center text-slate-400">
                    <p className="text-sm font-medium">No users available</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <ButtonLoader
                variant="secondary"
                type="button"
                onClick={() => {
                  setShowNewDM(false);
                  setDMTarget("");
                }}
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
        {/* Mobile Sidebar Overlay */}
        {isMobile && showSidebar && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowSidebar(false)}
            aria-label="Close sidebar"
          />
        )}

        {/* Main Chat Area */}
        <main
          className={`flex-1 flex flex-col bg-gradient-to-b from-white via-slate-50/50 to-white relative`}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 p-4 border-b border-slate-200/60 bg-white/95 backdrop-blur-md shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {isMobile && !showSidebar && (
                  <button
                    onClick={() => setShowSidebar(true)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                    aria-label="Open sidebar"
                  >
                    <svg
                      className="w-6 h-6 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  </button>
                )}
                {selectedId ? (
                  (() => {
                    const currentConversation = conversations.find(
                      (c) => c.id === selectedId
                    );
                    const currentParticipants =
                      currentConversation?.participants ||
                      currentConversation?.other_participants ||
                      [];

                    // Find the other participant (not current user)
                    const currentOtherParticipant = currentParticipants.find(
                      (p: any) =>
                        typeof p === "string" ? p !== user.id : p.id !== user.id
                    );

                    let currentDisplayName = "Chat";
                    let currentParticipantRole = "default";

                    if (currentOtherParticipant) {
                      if (typeof currentOtherParticipant === "string") {
                        currentDisplayName = `User ${currentOtherParticipant}`;
                      } else {
                        currentDisplayName =
                          currentOtherParticipant.name ||
                          currentOtherParticipant.email?.split("@")[0] ||
                          `User ${currentOtherParticipant.id}`;
                        currentParticipantRole =
                          currentOtherParticipant.role || "default";
                      }
                    }

                    const currentOtherUserId =
                      typeof currentOtherParticipant === "string"
                        ? currentOtherParticipant
                        : currentOtherParticipant?.id;
                    const currentIsOnline =
                      currentOtherUserId && onlineUsers.has(currentOtherUserId);

                    return (
                      <>
                        <Avatar
                          name={currentDisplayName}
                          role={currentParticipantRole}
                          isOnline={currentIsOnline}
                          size="lg"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 truncate leading-tight tracking-tight">
                              {currentDisplayName}
                            </h3>
                            {currentParticipantRole &&
                              currentParticipantRole !== "default" && (
                                <span className="px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full flex-shrink-0 shadow-sm border border-blue-200/50">
                                  {roleDisplayNames[currentParticipantRole] ||
                                    currentParticipantRole}
                                </span>
                              )}
                          </div>
                          <div className="text-xs text-slate-600 flex items-center gap-2 mt-0.5 font-medium">
                            <span
                              className={clsx(
                                "flex items-center gap-1.5",
                                currentIsOnline
                                  ? "text-green-600"
                                  : "text-gray-400"
                              )}
                            >
                              <span
                                className={clsx(
                                  "w-2 h-2 rounded-full",
                                  currentIsOnline
                                    ? "bg-green-500"
                                    : "bg-gray-400"
                                )}
                              ></span>
                              {currentIsOnline ? "Online" : "Offline"}
                            </span>
                          </div>
                        </div>
                      </>
                    );
                  })()
                ) : (
                  <div className="flex items-center gap-3 text-gray-400">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <span>Select a conversation to start chatting</span>
                  </div>
                )}
              </div>
              {/* Action buttons */}
              {selectedId && (
                <div className="flex items-center gap-2">
                  <button
                    className="p-2 hover:bg-slate-100 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    aria-label="Search in conversation"
                  >
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </button>
                  <button
                    className="p-2 hover:bg-slate-100 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    aria-label="More options"
                  >
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* Messages */}
          <div
            ref={messagesContainerRef}
            className={clsx(
              "flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 via-white to-white scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent",
              isMobile ? "px-2 py-4" : "px-4 py-6"
            )}
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
            onTouchStart={(e) => {
              if (isMobile && messagesContainerRef.current?.scrollTop === 0) {
                pullToRefreshStartY.current = e.touches[0].clientY;
              }
            }}
            onTouchMove={(e) => {
              if (
                isMobile &&
                messagesContainerRef.current?.scrollTop === 0 &&
                pullToRefreshStartY.current > 0
              ) {
                const distance =
                  e.touches[0].clientY - pullToRefreshStartY.current;
                if (distance > 0) {
                  setPullToRefreshState({
                    isPulling: true,
                    distance: Math.min(distance, 100),
                  });
                }
              }
            }}
            onTouchEnd={(e) => {
              if (
                isMobile &&
                pullToRefreshState.isPulling &&
                pullToRefreshState.distance > 50
              ) {
                loadConversations();
              }
              setPullToRefreshState({ isPulling: false, distance: 0 });
              pullToRefreshStartY.current = 0;
            }}
          >
            {selectedId ? (
              messagesLoading ? (
                <div className="flex flex-col gap-4">
                  <PageSkeleton count={4} layout="list" />
                </div>
              ) : (
                <div
                  className={clsx(
                    "flex flex-col mx-auto",
                    isMobile
                      ? "gap-2 max-w-full"
                      : isTablet
                      ? "gap-2.5 max-w-3xl"
                      : "gap-3 max-w-4xl"
                  )}
                >
                  {/* Pull to Refresh Indicator */}
                  {isMobile && pullToRefreshState.isPulling && (
                    <div
                      className="flex justify-center items-center py-2"
                      style={{
                        transform: `translateY(${pullToRefreshState.distance}px)`,
                      }}
                    >
                      <div className="text-xs text-slate-500 font-medium">
                        {pullToRefreshState.distance > 50
                          ? "Release to refresh"
                          : "Pull to refresh"}
                      </div>
                    </div>
                  )}
                  {/* Load More Indicator */}
                  {loadingMore && (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                    </div>
                  )}

                  {(() => {
                    const groupedMessages = groupMessagesByDate(messages);
                    const dateKeys = Object.keys(groupedMessages).sort(
                      (a, b) => new Date(a).getTime() - new Date(b).getTime()
                    );

                    return dateKeys.map((dateKey, dateIndex) => (
                      <React.Fragment key={dateKey}>
                        {/* Date Separator */}
                        <div className="flex items-center gap-4 my-4">
                          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-slate-300"></div>
                          <span className="text-xs font-semibold text-slate-600 px-4 py-1.5 bg-white/90 backdrop-blur-sm rounded-full border border-slate-200/80 shadow-[0_2px_6px_-2px_rgba(0,0,0,0.1)] tracking-wide">
                            {formatDateHeader(dateKey)}
                          </span>
                          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-slate-300 to-slate-300"></div>
                        </div>

                        {groupedMessages[dateKey].map((msg, i) => {
                          const senderId = msg.sender?.id || msg.sender_id;
                          const isMe = senderId === user.id;
                          const prevMsg =
                            i > 0 ? groupedMessages[dateKey][i - 1] : null;
                          const nextMsg =
                            i < groupedMessages[dateKey].length - 1
                              ? groupedMessages[dateKey][i + 1]
                              : null;
                          const showAvatar =
                            !isMe &&
                            (!prevMsg ||
                              prevMsg.sender?.id !== senderId ||
                              prevMsg.sender_id !== senderId);
                          const showTime =
                            !nextMsg ||
                            nextMsg.sender?.id !== senderId ||
                            nextMsg.sender_id !== senderId ||
                            new Date(nextMsg.sent_at).getTime() -
                              new Date(msg.sent_at).getTime() >
                              300000; // 5 minutes

                          // Check if this is part of a consecutive group
                          const isConsecutive =
                            !showAvatar &&
                            prevMsg &&
                            prevMsg.sender_id === senderId;
                          const showTail = isConsecutive ? false : true;

                          return (
                            <div
                              key={msg.id || i}
                              id={`message-${msg.id}`}
                              className={clsx(
                                "flex items-end gap-2 group mb-1 relative animate-fade-in-up",
                                isMe ? "justify-end" : "justify-start"
                              )}
                              onMouseEnter={() => setHoveredMessage(msg.id)}
                              onMouseLeave={() => setHoveredMessage(null)}
                              style={{
                                animationDelay: `${i * 0.05}s`,
                                animationFillMode: "both",
                              }}
                            >
                              {!isMe && (
                                <div className="w-8 flex-shrink-0">
                                  {showAvatar ? (
                                    <Avatar
                                      name={
                                        msg.sender?.name ||
                                        msg.sender?.email?.split("@")[0] ||
                                        `User ${senderId}`
                                      }
                                      role={msg.sender?.role || "default"}
                                      isOnline={
                                        senderId && onlineUsers.has(senderId)
                                      }
                                    />
                                  ) : (
                                    <div className="w-8"></div>
                                  )}
                                </div>
                              )}
                              <div
                                className={clsx(
                                  "flex flex-col",
                                  isMe ? "items-end" : "items-start",
                                  isMobile
                                    ? "max-w-[85%]"
                                    : isTablet
                                    ? "max-w-[75%]"
                                    : "max-w-[70%]"
                                )}
                              >
                                {!isMe && showAvatar && (
                                  <span className="text-xs text-slate-600 mb-1 px-2 font-semibold">
                                    {msg.sender?.name || "User"}
                                  </span>
                                )}
                                <div
                                  className={clsx(
                                    "break-words relative shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all duration-300 leading-relaxed group/message hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.15)]",
                                    isMobile
                                      ? "px-3 py-2 text-sm"
                                      : "px-4 py-2.5 text-sm",
                                    isMe
                                      ? clsx(
                                          "bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white shadow-[0_4px_12px_-2px_rgba(59,130,246,0.4)]",
                                          showTail
                                            ? "rounded-2xl rounded-br-md"
                                            : "rounded-2xl"
                                        )
                                      : clsx(
                                          "bg-white text-slate-900 border border-slate-200/60 shadow-[0_2px_6px_-2px_rgba(0,0,0,0.08)] hover:border-slate-300/80",
                                          showTail
                                            ? "rounded-2xl rounded-bl-md"
                                            : "rounded-2xl"
                                        )
                                  )}
                                >
                                  {/* Message options menu */}
                                  <div
                                    className={clsx(
                                      "absolute top-0 flex items-center gap-1 opacity-0 group-hover/message:opacity-100 transition-opacity duration-200 z-10",
                                      isMe
                                        ? "left-0 -translate-x-full pr-2"
                                        : "right-0 translate-x-full pl-2"
                                    )}
                                  >
                                    {!isMe && (
                                      <button
                                        onClick={() => handleReply(msg)}
                                        className="p-1.5 bg-white hover:bg-blue-50 rounded-lg shadow-sm border border-slate-200 transition-colors"
                                        title="Reply"
                                        aria-label="Reply to message"
                                      >
                                        <svg
                                          className="w-4 h-4 text-slate-600"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                                          />
                                        </svg>
                                      </button>
                                    )}
                                    <button
                                      className="p-1.5 bg-white hover:bg-blue-50 rounded-lg shadow-sm border border-slate-200 transition-colors"
                                      title="More options"
                                      aria-label="Message options"
                                    >
                                      <svg
                                        className="w-4 h-4 text-slate-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                  {/* Reply indicator */}
                                  {msg.reply_to && (
                                    <div
                                      className={clsx(
                                        "border-l-3 pl-3 mb-2 text-xs rounded-l leading-relaxed",
                                        isMe
                                          ? "border-blue-300/80 bg-blue-400/25 backdrop-blur-sm"
                                          : "border-slate-300 bg-slate-100/80 backdrop-blur-sm"
                                      )}
                                    >
                                      <div
                                        className={clsx(
                                          "font-semibold mb-1",
                                          isMe
                                            ? "text-blue-50"
                                            : "text-slate-700"
                                        )}
                                      >
                                        Replying to{" "}
                                        {msg.reply_to.sender?.name || "Unknown"}
                                      </div>
                                      <div
                                        className={clsx(
                                          "truncate font-medium",
                                          isMe
                                            ? "text-blue-100"
                                            : "text-slate-600"
                                        )}
                                      >
                                        {msg.reply_to.content}
                                      </div>
                                    </div>
                                  )}

                                  <span className="block leading-relaxed">
                                    {msg.content}
                                  </span>
                                  {msg.file_path && (
                                    <div
                                      className={clsx(
                                        "mt-2 p-3 rounded-xl text-xs backdrop-blur-sm",
                                        isMe
                                          ? "bg-blue-400/25 border border-blue-300/30"
                                          : "bg-slate-100/80 border border-slate-200/60"
                                      )}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="text-lg">
                                          {getFileIcon(msg.file_name || "file")}
                                        </span>
                                        <div>
                                          <div
                                            className={clsx(
                                              "font-semibold",
                                              isMe
                                                ? "text-blue-50"
                                                : "text-slate-900"
                                            )}
                                          >
                                            {msg.file_name || "File"}
                                          </div>
                                          {msg.file_size && (
                                            <div
                                              className={clsx(
                                                "font-medium mt-0.5",
                                                isMe
                                                  ? "text-blue-100"
                                                  : "text-slate-600"
                                              )}
                                            >
                                              {(
                                                msg.file_size /
                                                1024 /
                                                1024
                                              ).toFixed(2)}{" "}
                                              MB
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      {msg.file_path && (
                                        <a
                                          href={`http://localhost:3001${msg.file_path}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={clsx(
                                            "underline mt-1.5 inline-block font-semibold transition-colors",
                                            isMe
                                              ? "text-blue-100 hover:text-white"
                                              : "text-blue-600 hover:text-blue-700"
                                          )}
                                          aria-label={`View file: ${
                                            msg.file_name || "File"
                                          }`}
                                        >
                                          View File
                                        </a>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {showTime && (
                                  <div
                                    className={clsx(
                                      "text-xs mt-1.5 flex items-center gap-1.5 px-1",
                                      isMe ? "justify-end" : "justify-start"
                                    )}
                                  >
                                    <span
                                      className={clsx(
                                        "font-medium",
                                        isMe
                                          ? "text-blue-300"
                                          : "text-slate-500"
                                      )}
                                    >
                                      {formatTime(msg.sent_at)}
                                    </span>
                                    {isMe && (
                                      <span className="text-xs">
                                        {messageStatus[msg.id] ===
                                          "sending" && (
                                          <span className="text-yellow-500">
                                            ⏳
                                          </span>
                                        )}
                                        {messageStatus[msg.id] === "sent" && (
                                          <span className="text-blue-400">
                                            ✓
                                          </span>
                                        )}
                                        {messageStatus[msg.id] ===
                                          "delivered" && (
                                          <span className="text-green-500">
                                            ✓✓
                                          </span>
                                        )}
                                        {messageStatus[msg.id] === "error" && (
                                          <span className="text-red-500">
                                            ✗
                                          </span>
                                        )}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ));
                  })()}

                  {/* Typing Indicator */}
                  {typingUsers.length > 0 && (
                    <div className="flex items-center gap-2 text-slate-500 text-sm italic animate-fade-in-up">
                      <div className="flex gap-1 px-3 py-2 bg-slate-100/80 rounded-full">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.15s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.3s" }}
                        ></div>
                      </div>
                      <span className="font-medium">
                        {typingUsers.length === 1
                          ? `${typingUsers[0]} is typing...`
                          : `${typingUsers.slice(0, -1).join(", ")} and ${
                              typingUsers[typingUsers.length - 1]
                            } are typing...`}
                      </span>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 bg-gradient-to-b from-white via-slate-50/30 to-white">
                <svg
                  className="w-16 h-16 mb-4 opacity-30"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="text-lg font-semibold mb-2 text-slate-600">
                  No conversation selected
                </p>
                <p className="text-sm text-slate-500 font-medium">
                  Select a conversation from the sidebar to start chatting
                </p>
              </div>
            )}
          </div>
          {/* Input */}
          {selectedId && (
            <>
              {/* File preview above input */}
              {file && (
                <div className="mx-4 mb-3 p-4 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 backdrop-blur-sm border border-blue-200/60 rounded-xl shadow-[0_4px_12px_-2px_rgba(59,130,246,0.2)]">
                  <div className="flex items-center gap-2">
                    {filePreview && file.type.startsWith("image/") ? (
                      <img
                        src={filePreview}
                        alt="preview"
                        className="w-16 h-16 object-cover rounded shadow"
                      />
                    ) : (
                      <span
                        className="inline-block w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-2xl"
                        role="img"
                        aria-label={`File type: ${
                          file.name.split(".").pop()?.toUpperCase() || "Unknown"
                        }`}
                      >
                        {getFileIcon(file.name)}
                      </span>
                    )}
                    <div className="flex-1">
                      <span className="text-blue-900 text-sm font-semibold block leading-tight">
                        {file.name}
                      </span>
                      <span className="text-blue-600 text-xs font-medium mt-0.5">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
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
                      <div className="bg-blue-200/60 rounded-full h-2 shadow-inner">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300 shadow-sm"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-blue-700 mt-1.5 font-semibold">
                        Uploading... {uploadProgress}%
                      </div>
                    </div>
                  )}
                  {uploadError && (
                    <div className="mt-2 text-red-700 text-sm font-medium bg-red-50/90 backdrop-blur-sm border border-red-200/60 p-2.5 rounded-lg shadow-sm">
                      {uploadError}
                    </div>
                  )}
                </div>
              )}
              <form
                onSubmit={handleSend}
                className={clsx(
                  "sticky bottom-0 border-t border-slate-200/60 bg-white/95 backdrop-blur-md shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.1)] flex gap-2",
                  isMobile ? "p-2.5" : "p-4"
                )}
              >
                {/* Voice message button (placeholder for future implementation) */}
                <button
                  type="button"
                  className="px-3 py-2 text-blue-400 hover:text-blue-500 hover:bg-blue-50/50 rounded-lg transition-all duration-200 focus:outline-none opacity-50 cursor-not-allowed active:scale-95"
                  disabled
                  title="Voice messages coming soon"
                  aria-label="Voice message (coming soon)"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                </button>

                {/* Attachment icon */}
                <button
                  type="button"
                  className={clsx(
                    "text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 active:scale-95 hover:scale-105",
                    isMobile
                      ? "px-2.5 py-2.5 min-w-[44px] min-h-[44px]"
                      : "px-3 py-2"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Attach file"
                  title="Attach file"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l7.07-7.07a4 4 0 00-5.656-5.657l-8.486 8.485a6 6 0 108.485 8.486l7.071-7.072"
                    />
                  </svg>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,audio/*"
                />
                <div className="flex-1 relative">
                  {/* Reply indicator */}
                  {replyingTo && (
                    <div className="absolute -top-12 left-0 right-0 bg-blue-50/90 backdrop-blur-sm border border-blue-200/60 rounded-lg p-2 shadow-sm flex items-center justify-between z-10 animate-scale-in">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-0.5 h-6 bg-blue-500 rounded-full"></div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-blue-900 truncate">
                            Replying to {replyingTo.sender?.name || "User"}
                          </div>
                          <div className="text-xs text-blue-700 truncate">
                            {replyingTo.content?.slice(0, 50) || "File shared"}
                            {replyingTo.content &&
                            replyingTo.content.length > 50
                              ? "..."
                              : ""}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={cancelReply}
                        className="p-1 hover:bg-blue-100 rounded transition-colors flex-shrink-0"
                        aria-label="Cancel reply"
                      >
                        <svg
                          className="w-4 h-4 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                  <input
                    type="text"
                    value={message}
                    placeholder="Type a message..."
                    onChange={(e) => {
                      setMessage(e.target.value);

                      // Handle typing indicators
                      if (selectedId && e.target.value.trim()) {
                        socketService.getSocket()?.emit("start_typing", {
                          conversationId: selectedId,
                        });

                        // Clear existing timeout
                        if (typingTimeoutRef.current) {
                          clearTimeout(typingTimeoutRef.current);
                        }

                        // Set timeout to stop typing indicator after 3 seconds of inactivity
                        typingTimeoutRef.current = setTimeout(() => {
                          socketService.getSocket()?.emit("stop_typing", {
                            conversationId: selectedId,
                          });
                          typingTimeoutRef.current = null;
                        }, 3000);
                      } else if (selectedId) {
                        // Stop typing if message is cleared
                        socketService
                          .getSocket()
                          ?.emit("stop_typing", { conversationId: selectedId });
                        if (typingTimeoutRef.current) {
                          clearTimeout(typingTimeoutRef.current);
                          typingTimeoutRef.current = null;
                        }
                      }
                    }}
                    className={clsx(
                      "w-full border border-slate-300/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 text-slate-900 bg-white/90 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] transition-all duration-300 placeholder:text-slate-400 leading-relaxed focus:shadow-[0_4px_12px_-2px_rgba(59,130,246,0.2)]",
                      isMobile
                        ? "px-3 py-2.5 text-base min-h-[44px]"
                        : "px-4 py-2.5 text-sm focus:scale-[1.01]"
                    )}
                    autoFocus={!isMobile}
                    disabled={sending}
                    aria-label="Type your message"
                    maxLength={1000}
                  />
                  {/* Character counter */}
                  {message.length > 0 && (
                    <div className="absolute bottom-1 right-2 text-xs text-slate-500 font-medium">
                      {message.length}/1000
                    </div>
                  )}
                </div>
                <ButtonLoader
                  type="submit"
                  loading={sending}
                  label="Send"
                  loadingText="Sending..."
                  variant="primary"
                  disabled={!message.trim() && !file}
                  aria-label="Send message"
                  className={clsx(isMobile && "min-h-[44px] min-w-[64px]")}
                />
              </form>
            </>
          )}
        </main>
      </div>
    </>
  );
};

export default Messaging;
