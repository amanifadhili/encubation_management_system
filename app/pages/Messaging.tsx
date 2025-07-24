import React, { useState, useMemo, useRef, useEffect, Fragment} from "react";
import ReactDOM from "react-dom";
import { conversations as mockConversations } from "../mock/messagingData";
import { mockUsers } from "../mock/credentials";
import { useAuth } from "../context/AuthContext";
import clsx from "clsx";


// Role-based color map
const roleColors: { [key: string]: string } = {
  director: "bg-purple-600 text-white",
  manager: "bg-blue-600 text-white",
  mentor: "bg-green-600 text-white",
  incubator: "bg-yellow-500 text-white",
  default: "bg-gray-400 text-white"
};

function getUserInfo(name: string) {
  return (
    mockUsers.find((u: any) => u.name === name) ||
    { name, role: "default" }
  );
}

const REACTION_EMOJIS = ["👍", "❤️", "😂", "🎉", "😮", "😢"];

function addReactionToMessage(
  convos: any[],
  convoId: number,
  msgIdx: number,
  emoji: string,
  userName: string
) {
  return convos.map((c: any) => {
    if (c.id !== convoId) return c;
    return {
      ...c,
      messages: c.messages.map((msg: any, i: number) => {
        if (i !== msgIdx) return msg;
        const reactions = msg.reactions || [];
        const existing = reactions.find((r: any) => r.emoji === emoji);
        let newReactions;
        if (existing) {
          // Toggle user reaction
          if (existing.users.includes(userName)) {
            newReactions = reactions.map((r: any) =>
              r.emoji === emoji
                ? { ...r, users: r.users.filter((u: string) => u !== userName) }
                : r
            ).filter((r: any) => r.users.length > 0);
          } else {
            newReactions = reactions.map((r: any) =>
              r.emoji === emoji
                ? { ...r, users: [...r.users, userName] }
                : r
            );
          }
        } else {
          newReactions = [...reactions, { emoji, users: [userName] }];
        }
        return { ...msg, reactions: newReactions };
      })
    };
  });
}

// Add at the top:

// Add reply to thread
function addThreadReply(
  convos: any[],
  convoId: number,
  msgIdx: number,
  reply: string,
  userName: string
) {
  return convos.map((c: any) => {
    if (c.id !== convoId) return c;
    return {
      ...c,
      messages: c.messages.map((msg: any, i: number) => {
        if (i !== msgIdx) return msg;
        const replies = msg.replies || [];
        return {
          ...msg,
          replies: [
            ...replies,
            {
              sender: userName,
              content: reply,
              timestamp: new Date().toISOString()
            }
          ]
        };
      })
    };
  });
}

// Refactor context menu to receive message and senderInfo as props
// Add a ContextMenu component inside Messaging
function ContextMenu({
  anchor,
  pos,
  message,
  senderInfo,
  onReact,
  onReply,
  onClose,
  msgIdx,
  convoId
}: {
  anchor: HTMLElement | null;
  pos: { top: number; left: number };
  message: any;
  senderInfo: { name: string; role: string };
  onReact: (emoji: string, msgIdx: number, convoId: number) => void;
  onReply: (msgIdx: number, convoId: number) => void;
  onClose: () => void;
  msgIdx: number;
  convoId: number;
}) {
  return ReactDOM.createPortal(
    <div
      className="fixed z-[9999] min-w-[200px] bg-white rounded-lg shadow-lg border p-2 animate-fade-in"
      style={{ top: pos.top, left: pos.left, maxWidth: 280, width: '90vw' }}
    >
      {/* Emoji reactions bar */}
      <div className="flex gap-1 mb-2 border-b pb-2 overflow-x-auto">
        {REACTION_EMOJIS.map(emoji => {
          const count = (message.reactions || []).find((r: any) => r.emoji === emoji)?.users.length || 0;
          const reacted = (message.reactions || []).find((r: any) => r.emoji === emoji)?.users.includes(senderInfo.name);
          return (
            <button
              key={emoji}
              className={clsx(
                "px-1 text-lg rounded hover:bg-blue-100 transition",
                reacted && "bg-blue-200"
              )}
              onClick={() => { 
                console.log('React clicked', { emoji, msgIdx, convoId });
                onReact(emoji, msgIdx, convoId); 
                onClose(); 
              }}
              type="button"
              aria-label={`React with ${emoji}`}
            >
              {emoji} {count > 0 && <span className="text-xs font-bold">{count}</span>}
            </button>
          );
        })}
      </div>
      {/* Reply action */}
      <button
        className="w-full flex items-center gap-2 px-2 py-2 text-left text-blue-700 hover:bg-blue-50 rounded transition"
        onClick={() => { 
          console.log('Reply clicked', { msgIdx, convoId });
          onReply(msgIdx, convoId); 
          onClose(); 
        }}
        type="button"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h7V6a1 1 0 0 1 1.707-.707l8 8a1 1 0 0 1 0 1.414l-8 8A1 1 0 0 1 10 22v-4H3a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1z"/></svg>
        Reply
      </button>
    </div>,
    document.body
  );
}

const Messaging = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([...mockConversations]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const chatEndRef = useRef(null);
  // Remove thread state and sidebar logic, add inline reply state
  const [replyTo, setReplyTo] = useState<{ sender: string; content: string } | null>(null);
  // Add state for context menu
  const [menuOpen, setMenuOpen] = useState<{ idx: number | null; anchor: HTMLElement | null }>({ idx: null, anchor: null });
  // Add state for menu position
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handler to open menu (calculate position)
  const handleMenuOpen = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const menuWidth = 220;
    const menuHeight = 80;
    let top = rect.bottom + window.scrollY;
    let left = rect.left + window.scrollX;
    // If too close to right, shift left
    if (left + menuWidth > window.innerWidth - 8) {
      left = window.innerWidth - menuWidth - 8;
    }
    // If too close to left, shift right
    if (left < 8) {
      left = 8;
    }
    // If too close to bottom, show above
    if (top + menuHeight > window.innerHeight - 8) {
      top = rect.top + window.scrollY - menuHeight;
    }
    // If too close to top, show below
    if (top < 8) {
      top = 8;
    }
    setMenuOpen({ idx, anchor: e.currentTarget as HTMLElement });
    setMenuPos({ top, left });
  };
  // Handler to close menu
  const handleMenuClose = () => { setMenuOpen({ idx: null, anchor: null }); setMenuPos(null); };

  // Click outside to close menu
  useEffect(() => {
    function onClick(e: Event) {
      if (menuOpen.anchor && !(menuOpen.anchor as any).contains(e.target)) {
        setMenuOpen({ idx: null, anchor: null });
        setMenuPos(null);
      }
    }
    if (menuOpen.idx !== null) {
      document.addEventListener("mousedown", onClick);
      return () => document.removeEventListener("mousedown", onClick);
    }
  }, [menuOpen]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f && f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = ev => setFilePreview(ev.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setFilePreview(null);
    }
  };

  // Filter conversations for this user
  const userConvos = useMemo(() =>
    conversations.filter(c => c.participants.includes(user?.name)),
    [conversations, user]
  );

  // Select first conversation by default
  useEffect(() => {
    if (!selectedId && userConvos.length > 0) setSelectedId(userConvos[0].id as number);
  }, [selectedId, userConvos]);

  const selected = userConvos.find(c => c.id === selectedId);

  // Scroll to bottom on new message
  useEffect(() => {
    if (chatEndRef.current && typeof (chatEndRef.current as any).scrollIntoView === "function") {
      (chatEndRef.current as any).scrollIntoView({ behavior: "smooth" });
    }
  }, [selected?.messages.length]);

  // Update handleSend to include file
  const handleSend = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if ((!message.trim() && !file) || !selected) return;
    setConversations(prev => prev.map(c =>
      c.id === selected.id
        ? {
            ...c,
            messages: [
              ...c.messages,
              {
                sender: user!.name,
                content: message,
                timestamp: new Date().toISOString(),
                replyTo: replyTo ? { ...replyTo } : undefined,
                file: file ? { name: file.name, type: file.type, url: filePreview, size: file.size } : undefined
              }
            ]
          }
        : c
    ));
    setMessage("");
    setReplyTo(null);
    setFile(null);
    setFilePreview(null);
  };

  // Format timestamp
  function formatTime(ts: string) {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // Avatar (initials)
  function Avatar({ name, role }: { name: string; role: string }) {
    const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase();
    return (
      <span className={clsx("inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-lg shadow", roleColors[role as keyof typeof roleColors] || roleColors.default)}>
        {initials}
      </span>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-[80vh] bg-white rounded-lg shadow-lg overflow-hidden max-w-5xl mx-auto mt-8">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-50 border-r flex flex-col">
        <div className="p-4 border-b text-xl font-extrabold text-blue-900">Inbox</div>
        <div className="flex-1 overflow-y-auto">
          {userConvos.length === 0 ? (
            <div className="p-8 text-gray-400 text-center">No conversations yet.</div>
          ) : (
            userConvos.map(c => {
              // Show DM or group name
              const otherNames = c.participants.filter((n: string) => n !== (user?.name || ""));
              const label = c.name || otherNames.join(", ");
              // Unread: if last message not from user
              const lastMsg = c.messages[c.messages.length - 1];
              const unread = lastMsg && lastMsg.sender !== user.name;
              return (
                <button
                  key={c.id}
                  className={clsx(
                    "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-100 transition border-b focus:outline-none",
                    selectedId === c.id && "bg-blue-50 border-l-4 border-blue-600"
                  )}
                  onClick={() => setSelectedId(c.id)}
                >
                  <Avatar {...getUserInfo(String(otherNames[0] !== undefined ? otherNames[0] : ""))} />
                  <div className="flex-1">
                    <div className="font-semibold text-blue-900 truncate">{label}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {lastMsg ? lastMsg.content.slice(0, 30) : "No messages yet."}
                    </div>
                  </div>
                  {unread && <span className="w-2 h-2 bg-blue-500 rounded-full" title="Unread" />}
                </button>
              );
            })
          )}
        </div>
      </aside>
      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center gap-3 bg-white">
          {selected ? (
            <>
              <Avatar {...getUserInfo(selected.name ? selected.name : selected.participants.find(n => n !== user.name))} />
              <div>
                <div className="font-bold text-blue-900">
                  {selected.name || selected.participants.filter(n => n !== user.name).join(", ")}
                </div>
                <div className="text-xs text-gray-500">
                  {selected.participants.length > 2 ? "Group chat" : "Direct message"}
                </div>
              </div>
            </>
          ) : (
            <div className="text-gray-400">Select a conversation</div>
          )}
        </div>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 bg-gradient-to-br from-blue-50 to-white">
          {selected ? (
            <div className="flex flex-col gap-4">
              {selected.messages.map((msg, i) => {
                const m = msg as any;
                const senderInfo = getUserInfo(m.sender);
                const isMe = m.sender === user.name;
                return (
                  <div key={i} className={clsx("flex items-end gap-2 group relative", isMe ? "justify-end" : "justify-start")}> 
                    {!isMe && <Avatar {...senderInfo} />}
                    <div>
                      {m.replyTo && (
                        <div className="mb-1 px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs border-l-4 border-blue-300">
                          <span className="font-semibold">{m.replyTo.sender}:</span> {m.replyTo.content}
                        </div>
                      )}
                      <div className={clsx(
                        "px-4 py-2 rounded-lg shadow text-sm max-w-xs break-words relative",
                        isMe
                          ? "bg-blue-600 text-white rounded-br-none"
                          : (roleColors[senderInfo.role] || roleColors.default) + " rounded-bl-none"
                      )}
                        onContextMenu={e => handleMenuOpen(e as React.MouseEvent, i)}
                        onClick={e => handleMenuOpen(e as React.MouseEvent, i)}
                        tabIndex={0}
                        onKeyDown={e => { if (e.key === "Enter") handleMenuOpen(e as unknown as React.MouseEvent, i); }}
                        aria-label="Open message menu"
                        role="button"
                      >
                        <span className="block">{m.content}</span>
                        {/* Context menu trigger (three dots) */}
                        <button
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-xl text-blue-200 hover:text-blue-700 focus:opacity-100 transition"
                          onClick={e => handleMenuOpen(e as React.MouseEvent, i)}
                          tabIndex={-1}
                          aria-label="Open menu"
                          type="button"
                        >
                          &#x22EE;
                        </button>
                        {/* Context menu (inline, absolutely positioned with dynamic positioning) */}
                        {menuOpen.idx === i && menuPos && (
                          <div
                            className="fixed z-[9999] min-w-[200px] bg-white rounded-lg shadow-lg border p-2 animate-fade-in"
                            style={{ top: menuPos.top, left: menuPos.left, maxWidth: 280, width: '90vw' }}
                          >
                            {/* Emoji reactions bar */}
                            <div className="flex gap-1 mb-2 border-b pb-2 overflow-x-auto">
                              {REACTION_EMOJIS.map(emoji => {
                                const count = (m.reactions || []).find((r: any) => r.emoji === emoji)?.users.length || 0;
                                const reacted = (m.reactions || []).find((r: any) => r.emoji === emoji)?.users.includes(user!.name);
                                return (
                                  <button
                                    key={emoji}
                                    className={clsx(
                                      "px-1 text-lg rounded hover:bg-blue-100 transition",
                                      reacted && "bg-blue-200"
                                    )}
                                    onClick={() => {
                                      setConversations(prev => addReactionToMessage(prev, selected.id, i, emoji, user!.name));
                                      handleMenuClose();
                                    }}
                                    type="button"
                                    aria-label={`React with ${emoji}`}
                                  >
                                    {emoji} {count > 0 && <span className="text-xs font-bold">{count}</span>}
                                  </button>
                                );
                              })}
                            </div>
                            {/* Reply action */}
                            <button
                              className="w-full flex items-center gap-2 px-2 py-2 text-left text-blue-700 hover:bg-blue-50 rounded transition"
                              onClick={() => {
                                setReplyTo({ sender: String(senderInfo.name || ""), content: String(m.content || "") });
                                handleMenuClose();
                              }}
                              type="button"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h7V6a1 1 0 0 1 1.707-.707l8 8a1 1 0 0 1 0 1.414l-8 8A1 1 0 0 1 10 22v-4H3a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1z"/></svg>
                              Reply
                            </button>
                          </div>
                        )}
                      </div>
                      {/* Reactions bar (summary) */}
                      <div className="flex gap-1 mt-1">
                        {(m.reactions || []).filter((r: any) => r.users.length > 0).map((r: any) => (
                          <span key={r.emoji} className={clsx("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700")}>{r.emoji} {r.users.length}</span>
                        ))}
                      </div>
                      <div className={clsx("text-xs mt-1", isMe ? "text-right text-blue-400" : "text-gray-400")}>{senderInfo.name} • {formatTime(m.timestamp)}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">Select a conversation to start chatting.</div>
          )}
        </div>
        {/* Input */}
        {selected && (
          <>
            {replyTo && (
              <div className="flex items-center gap-2 p-2 bg-blue-50 border-l-4 border-blue-400 mb-2 rounded">
                <span className="font-semibold text-blue-700">Replying to {replyTo.sender}:</span>
                <span className="text-blue-900">{replyTo.content}</span>
                <button onClick={() => setReplyTo(null)} className="ml-auto text-blue-400 hover:text-blue-700 text-lg">&times;</button>
              </div>
            )}
            {/* File preview above input */}
            {file && (
              <div className="flex items-center gap-2 p-2 bg-blue-50 border-l-4 border-blue-400 mb-2 rounded">
                {filePreview && file.type.startsWith("image/") ? (
                  <img src={filePreview} alt="preview" className="w-16 h-16 object-cover rounded shadow" />
                ) : (
                  <span className="inline-block w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-2xl">
                    📎
                  </span>
                )}
                <span className="text-blue-900 text-sm font-semibold">{file.name}</span>
                <button onClick={() => { setFile(null); setFilePreview(null); }} className="ml-auto text-blue-400 hover:text-blue-700 text-lg">&times;</button>
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
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-700 text-white rounded font-semibold shadow hover:bg-blue-800 transition disabled:opacity-50"
                disabled={!message.trim() && !file}
              >
                Send
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
};

export default Messaging; 