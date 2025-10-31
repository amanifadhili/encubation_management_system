import React, { useState, useRef, useEffect } from "react";
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
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load conversations and users on mount
  useEffect(() => {
    if (user) {
      loadConversations();
      loadUsers();
    }
  }, [user]);

  // Connect to socket when user is available
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      if (token) {
        socketService.connect(token);

        // Listen for new messages
        const handleNewMessage = (event: any) => {
          const { data } = event.detail;
          if (selectedId === data.conversation_id) {
            setMessages(prev => [...prev, data]);
          }
          // Update conversation list if needed
          loadConversations();
        };

        window.addEventListener('socket:message_received', handleNewMessage);

        return () => {
          window.removeEventListener('socket:message_received', handleNewMessage);
          socketService.disconnect();
        };
      }
    }
  }, [user, selectedId]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedId) {
      loadMessages(selectedId);
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

  const loadMessages = async (conversationId: string) => {
    setMessagesLoading(true);
    try {
      const data = await getConversationMessages(conversationId);
      setMessages(data);
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'loading messages');
    } finally {
      setMessagesLoading(false);
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && !file) || !selectedId || sending) return;

    setSending(true);
    setUploadError(null);
    setUploadProgress(0);
    try {
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('conversationId', selectedId);
        formData.append('content', message || 'File shared');

        await sendFileMessage(selectedId, formData, (progress) => {
          setUploadProgress(progress);
        });
      } else {
        await sendMessage(selectedId, { content: message });
      }

      setMessage("");
      setFile(null);
      setFilePreview(null);
      setUploadProgress(0);
    } catch (error: any) {
      console.error('Failed to send message:', error);
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
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = ev => setFilePreview(ev.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
  };

  const handleStartDM = async () => {
    if (!dmTarget) return;

    setCreating(true);
    try {
      const result = await createConversation({
        participants: [user!.id, dmTarget] // Both are string user IDs
      });

      setConversations(prev => [...prev, result]);
      setSelectedId(result.id);
      setShowNewDM(false);
      setDMTarget("");
    } catch (error: any) {
      ErrorHandler.handleError(error, showToast, 'creating conversation');
    } finally {
      setCreating(false);
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const Avatar = ({ name, role }: { name: string; role: string }) => {
    const initials = name.split(" ").map(n => n[0]).join("").toUpperCase();
    return (
      <span className={clsx("inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-lg shadow", roleColors[role] || roleColors.default)}>
        {initials}
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
    <div className="flex h-[80vh] bg-white rounded-lg shadow-lg overflow-hidden max-w-5xl mx-auto mt-8">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-50 border-r flex flex-col">
        <div className="p-4 border-b text-xl font-extrabold text-blue-900 flex items-center justify-between">
          Inbox
          <ButtonLoader
            onClick={() => setShowNewDM(true)}
            loading={false}
            label="+ New"
            variant="primary"
            size="sm"
            className="text-xs"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-gray-400 text-center">No conversations yet.</div>
          ) : (
            conversations.map(c => {
              // Show conversation name (other participant)
              const participants = c.participants || c.other_participants || [];
              const otherParticipant = participants.find((p: string) => p !== user.id) || user.id;
              const label = `User ${otherParticipant}`; // In real app, get user name
              const lastMsg = c.latest_message || c.messages?.[c.messages.length - 1];
              return (
                <button
                  key={c.id}
                  className={clsx(
                    "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-100 transition border-b focus:outline-none",
                    selectedId === c.id && "bg-blue-50 border-l-4 border-blue-600"
                  )}
                  onClick={() => setSelectedId(c.id)}
                >
                  <Avatar name={label} role="default" />
                  <div className="flex-1">
                    <div className="font-semibold text-blue-900 truncate">{label}</div>
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
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
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
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center gap-3 bg-white">
          {selectedId ? (
            <>
              <Avatar name="Chat" role="default" />
              <div>
                <div className="font-bold text-blue-900">
                  Conversation
                </div>
                <div className="text-xs text-gray-500">
                  Direct message
                </div>
              </div>
            </>
          ) : (
            <div className="text-gray-400">Select a conversation</div>
          )}
        </div>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 bg-gradient-to-br from-blue-50 to-white">
          {selectedId ? (
            messagesLoading ? (
              <PageSkeleton count={4} layout="list" />
            ) : (
              <div className="flex flex-col gap-4">
                {messages.map((msg, i) => {
                  const senderId = msg.sender?.id || msg.sender_id;
                  const isMe = senderId === user.id;
                  return (
                    <div key={msg.id || i} className={clsx("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}>
                      {!isMe && <Avatar name={msg.sender?.name || `User ${senderId}`} role={msg.sender?.role || "default"} />}
                      <div>
                        <div className={clsx(
                          "px-4 py-2 rounded-lg shadow text-sm max-w-xs break-words",
                          isMe
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-white text-gray-900 rounded-bl-none"
                        )}>
                          <span className="block">{msg.content}</span>
                          {msg.file_path && (
                            <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">📎</span>
                                <div>
                                  <div className="font-medium">{msg.file_name || 'File'}</div>
                                  {msg.file_size && <div className="text-gray-500">{(msg.file_size / 1024 / 1024).toFixed(2)} MB</div>}
                                </div>
                              </div>
                              {msg.file_path && (
                                <a
                                  href={msg.file_path}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline mt-1 inline-block"
                                >
                                  View File
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                        <div className={clsx("text-xs mt-1", isMe ? "text-right text-blue-400" : "text-gray-400")}>
                          {formatTime(msg.sent_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                    <span className="inline-block w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-2xl">
                      📎
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
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              />
              <input
                type="text"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 bg-blue-50"
                autoFocus
                disabled={sending}
              />
              <ButtonLoader
                type="submit"
                loading={sending}
                label="Send"
                loadingText="Sending..."
                variant="primary"
                disabled={!message.trim() && !file}
              />
            </form>
          </>
        )}
      </main>
    </div>
  );
};

export default Messaging;