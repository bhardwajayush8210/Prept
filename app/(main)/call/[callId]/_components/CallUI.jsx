"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import {
  StreamTheme,
  SpeakerLayout,
  useCallStateHooks,
  useCall,
  CallingState,
  CallControls,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";

import {
  Chat,
  Channel,
  Window,
  MessageList,
  MessageInput,
  useCreateChatClient,
  useMessageContext,
} from "stream-chat-react";
import "stream-chat-react/dist/css/v2/index.css";

import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Sparkles,
  Loader2,
  MoreVertical,
  Reply,
  Pin,
  Eye,
  Edit2,
  Trash2,
} from "lucide-react";
import AIQuestionsPanel from "./AIQuestions";

function CustomMessage() {
  const { message, isMyMessage } = useMessageContext();
  const [showMenu, setShowMenu] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [pinnedMessages, setPinnedMessages] = useState(new Set());
  const [unreadMessages, setUnreadMessages] = useState(new Set());
  const menuRef = useRef(null);

  if (!message?.text) return null;

  const time = message.created_at
    ? new Date(message.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const handleEdit = () => {
    setEditingId(message.id);
    setEditText(message.text);
    setShowMenu(false);
  };

  const handleSaveEdit = () => {
    if (editText.trim()) {
      message.text = editText;
      setEditingId(null);
    }
  };

  const handleDelete = async () => {
    try {
      await message.delete();
      setShowMenu(false);
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const handlePin = () => {
    setPinnedMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(message.id)) newSet.delete(message.id);
      else newSet.add(message.id);
      return newSet;
    });
    setShowMenu(false);
  };

  const handleMarkUnread = () => {
    setUnreadMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(message.id)) newSet.delete(message.id);
      else newSet.add(message.id);
      return newSet;
    });
    setShowMenu(false);
  };

  const isPinned = pinnedMessages.has(message.id);
  const isUnread = unreadMessages.has(message.id);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  return (
    <div
      className={`px-3 py-2 flex flex-col ${
        isMyMessage() ? "items-end" : "items-start"
      } group relative`}
    >
      {isPinned && (
        <div className="text-[10px] text-amber-400 mb-1 flex items-center gap-1">
          <Pin size={10} /> Pinned
        </div>
      )}

      {editingId === message.id ? (
        <div className="flex gap-2 w-full max-w-[260px]">
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="flex-1 bg-[#2a2a2b] text-stone-200 px-3 py-2 rounded-lg text-sm border border-stone-600 focus:outline-none focus:border-amber-500"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveEdit();
              if (e.key === "Escape") setEditingId(null);
            }}
          />
          <button
            onClick={handleSaveEdit}
            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 px-2 py-1 rounded text-xs"
          >
            Save
          </button>
          <button
            onClick={() => setEditingId(null)}
            className="bg-stone-700 hover:bg-stone-600 text-stone-300 px-2 py-1 rounded text-xs"
          >
            ✕
          </button>
        </div>
      ) : (
        <div
          className={`flex items-start gap-1.5 max-w-[260px] ${
            isMyMessage() ? "flex-row-reverse" : "flex-row"
          }`}
        >
          <div
            className={`px-3 py-2 rounded-2xl break-words text-sm ${
              isMyMessage()
                ? "bg-blue-600 text-white rounded-br-sm"
                : "bg-[#1a1a1b] text-stone-200 border border-stone-700/50 rounded-bl-sm"
            } ${isUnread ? "ring-2 ring-amber-400/50" : ""}`}
          >
            {message.text}
          </div>

          {/* Three dot menu */}
          <div className="relative shrink-0 self-center" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-stone-500 hover:text-stone-300 hover:bg-white/8 rounded opacity-0 group-hover:opacity-100 transition-all"
            >
              <MoreVertical size={14} />
            </button>

            {showMenu && (
              <div
                className={`absolute bottom-full mb-1 bg-[#1c1c1e] border border-white/10 rounded-xl shadow-2xl min-w-[148px] py-1 z-50 ${
                  isMyMessage() ? "right-0" : "left-0"
                }`}
              >
                <button
                  onClick={() => setShowMenu(false)}
                  className="w-full px-3 py-2 flex items-center gap-2.5 text-stone-300 hover:bg-white/6 text-xs transition-colors"
                >
                  <Reply size={12} /> Reply
                </button>
                <button
                  onClick={handlePin}
                  className="w-full px-3 py-2 flex items-center gap-2.5 text-stone-300 hover:bg-white/6 text-xs transition-colors"
                >
                  <Pin size={12} className={isPinned ? "text-amber-400" : ""} />
                  {isPinned ? "Unpin" : "Pin"}
                </button>
                <button
                  onClick={handleMarkUnread}
                  className="w-full px-3 py-2 flex items-center gap-2.5 text-stone-300 hover:bg-white/6 text-xs transition-colors"
                >
                  <Eye size={12} className={isUnread ? "text-amber-400" : ""} />
                  {isUnread ? "Mark Read" : "Mark Unread"}
                </button>
                {isMyMessage() && (
                  <>
                    <button
                      onClick={handleEdit}
                      className="w-full px-3 py-2 flex items-center gap-2.5 text-stone-300 hover:bg-white/6 text-xs transition-colors"
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    <div className="border-t border-white/8 mx-2 my-1" />
                    <button
                      onClick={handleDelete}
                      className="w-full px-3 py-2 flex items-center gap-2.5 text-red-400 hover:bg-red-400/8 text-xs transition-colors"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5 mt-0.5 px-1">
        <span className="text-[10px] text-stone-600">{time}</span>
        {isUnread && (
          <span className="text-[9px] text-amber-400/80">• unread</span>
        )}
      </div>
    </div>
  );
}

function CustomMessageInput() {
  return (
    <div className="border-t border-white/8 bg-[#0a0a0b] p-3 shrink-0">
      <MessageInput focus />
    </div>
  );
}

export default function CallUI({
  callId,
  isInterviewer,
  booking,
  onLeave,
  apiKey,
  token,
  currentUser,
}) {
  const { useCallCallingState } = useCallStateHooks();
  const call = useCall();
  const callingState = useCallCallingState();
  const [activeTab, setActiveTab] = useState("chat");

  const handleLeave = useCallback(async () => {
    try {
      if (call) {
        const isRecording = call.state?.recording;
        if (isRecording) await call.stopRecording().catch(() => {});
        await call.leave().catch(() => {});
      }
    } finally {
      onLeave();
    }
  }, [call, onLeave]);

  const chatClient = useCreateChatClient({
    apiKey,
    tokenOrProvider: token,
    userData: {
      id: currentUser.id,
      name: currentUser.name,
      image: currentUser.imageUrl,
    },
  });

  const [chatChannel, setChatChannel] = useState(null);

  useEffect(() => {
    if (!chatClient) return;
    const init = async () => {
      const channel = chatClient.channel("messaging", callId, {
        name: "Interview Chat",
        members: [
          booking.interviewer.clerkUserId,
          booking.interviewee.clerkUserId,
        ],
      });
      await channel.watch();
      setChatChannel(channel);
    };
    init();
  }, [chatClient, callId, booking]);

  if (callingState === CallingState.LEFT) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <p className="text-stone-400 text-sm">Leaving call…</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .str-chat {
          height: 100% !important;
          background: transparent !important;
        }
        .str-chat__container {
          height: 100% !important;
          background: transparent !important;
        }
        .str-chat__main-panel {
          height: 100% !important;
          background: transparent !important;
        }
        .str-chat__avatar {
          display: none !important;
        }
        .str-chat__message-status {
          display: none !important;
        }
        .str-chat__message-list {
          display: flex;
          flex-direction: column;
          height: 100% !important;
          background: transparent !important;
        }

        /* Hide native file input text, keep the icon clickable */
.str-chat__fileupload-wrapper input[type="file"] {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  opacity: 0 !important;
  overflow: hidden !important;
  clip: rect(0,0,0,0) !important;
  pointer-events: none !important;
}
        .str-chat__virtual-list {
          flex: 1;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          background: transparent !important;
        }
        .str-chat__input-flat {
          display: none !important;
        }
        .str-chat__virtual-list::-webkit-scrollbar {
          width: 4px;
        }
        .str-chat__virtual-list::-webkit-scrollbar-track {
          background: transparent;
        }
        .str-chat__virtual-list::-webkit-scrollbar-thumb {
          background: #2a2a2b;
          border-radius: 4px;
        }
        .str-chat__virtual-list::-webkit-scrollbar-thumb:hover {
          background: #3a3a3b;
        }
        /* Message input overrides */
        .str-chat__message-input {
          background: transparent !important;
          padding: 0 !important;
          border: none !important;
        }
        .str-chat__message-input-inner {
          background: rgba(255,255,255,0.05) !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 10px !important;
        }
        .str-chat__textarea textarea {
          background: transparent !important;
          color: #d6d3d1 !important;
          font-size: 13px !important;
        }
        .str-chat__textarea textarea::placeholder {
          color: #57534e !important;
        }
        .str-chat__send-button svg {
          color: #fbbf24 !important;
          fill: #fbbf24 !important;
          width: 15px !important;
          height: 15px !important;
        }
      `}</style>

      <div
        className="min-h-[92vh] bg-[#0a0a0b] flex flex-col overflow-hidden"
        style={{ height: "100dvh" }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-white/10 text-stone-500 text-xs"
            >
              {booking.interviewer.name}
              <span className="text-stone-700 mx-1.5">×</span>
              {booking.interviewee.name}
            </Badge>
            {isInterviewer && (
              <Badge
                variant="outline"
                className="border-amber-400/20 bg-amber-400/5 text-amber-400 text-xs"
              >
                Interviewer
              </Badge>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* LEFT: Video */}
          <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
            <StreamTheme
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minHeight: 0,
                height: "100%",
              }}
            >
              <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
                <SpeakerLayout participantBarPosition="bottom" />
              </div>
              <div style={{ flexShrink: 0 }}>
                <CallControls onLeave={handleLeave} />
              </div>
            </StreamTheme>
          </div>

          {/* RIGHT: Chat & AI Panel */}
          <div
            className="shrink-0 flex flex-col border-l border-white/8 bg-[#0a0a0b] overflow-hidden"
            style={{
              width: "300px",
              minWidth: "300px",
              maxWidth: "300px",
              height: "100%",
            }}
          >
            {/* Tab switcher */}
            <div className="flex border-b border-white/8 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("chat")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-colors ${
                  activeTab === "chat"
                    ? "text-amber-400 border-b-2 border-amber-400"
                    : "text-stone-500 hover:text-stone-300"
                }`}
              >
                <MessageSquare size={13} />
                Chat
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("questions")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-colors ${
                  activeTab === "questions"
                    ? "text-amber-400 border-b-2 border-amber-400"
                    : "text-stone-500 hover:text-stone-300"
                }`}
              >
                <Sparkles size={13} />
                AI Questions
              </button>
            </div>

            {/* ── FIXED: Panel content with proper height containment ── */}
            <div
              style={{
                flex: 1,
                minHeight: 0,
                maxHeight: "100%",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* Chat tab */}
              <div
                style={{
                  display: activeTab === "chat" ? "flex" : "none",
                  flexDirection: "column",
                  flex: 1,
                  minHeight: 0,
                  overflow: "hidden",
                }}
              >
                {chatClient && chatChannel ? (
                  <Chat client={chatClient} theme="str-chat__theme-dark">
                    <Channel channel={chatChannel}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          height: "100%",
                          minHeight: 0,
                          flex: 1,
                        }}
                      >
                        <div
                          style={{ flex: 1, minHeight: 0, overflowY: "auto" }}
                        >
                          <MessageList Message={CustomMessage} />
                        </div>
                        <CustomMessageInput />
                      </div>
                    </Channel>
                  </Chat>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Loader2
                      className="animate-spin text-stone-600"
                      size={24}
                    />
                  </div>
                )}
              </div>

              {/* ── AI tab — FIXED height containment ── */}
              <div
                style={{
                  display: activeTab === "questions" ? "flex" : "none",
                  flexDirection: "column",
                  flex: 1,
                  minHeight: 0,
                  maxHeight: "100%",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    minHeight: 0,
                    maxHeight: "100%",
                    overflowY: "auto",
                    overflowX: "hidden",
                    padding: "12px",
                  }}
                >
                  <AIQuestionsPanel categories={booking.categories} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
