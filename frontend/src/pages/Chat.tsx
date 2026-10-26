import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/services/api";
import { Button, Card, PageHeader, Spinner } from "@/components/ui";
import { classNames } from "@/utils";
import {
  getActiveChatSessionToken,
  getAuthorizedConversationSyncToken,
  mergeConversationSummaries,
  type ServerConversationSummary,
} from "@/utils/chatConversations";

interface Message {
  id: string;
  sender: "user" | "ai";
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string | null;
  started_at: string;
  messages: Message[];
  // Archived (hidden) conversations stay fully stored -- archiving only
  // removes them from the active list. It never deletes backend records.
  archived?: boolean;
}

interface ConversationHistory {
  id: string;
  title: string | null;
  started_at: string;
  messages: Message[];
}

interface CurrentUser {
  id: string;
}

const SESSION_CHANGED_MESSAGE =
  "Your sign-in session changed in another tab. Reload the page to continue.";

/*
 * Minimal typing for the (still experimental) Web Speech API. Not every
 * browser ships `SpeechRecognition`, so we feature-detect at runtime and
 * hide the microphone button when it is unavailable.
 */
interface SpeechRecognitionEventResult {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult:
    | ((event: { results: ArrayLike<SpeechRecognitionEventResult> }) => void)
    | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const getSpeechRecognitionCtor = (): SpeechRecognitionCtor | null => {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

const getSpeechSynthesis = (): SpeechSynthesis | null => {
  return typeof window !== "undefined" ? window.speechSynthesis ?? null : null;
};

const describeSpeechError = (code: string | undefined): string => {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone access was denied. Allow the microphone for this site in your browser settings, then try again.";
    case "audio-capture":
      return "No microphone was found. Check that a microphone is connected and enabled.";
    case "network":
      return "Speech recognition needs a network connection. Check your internet and try again.";
    case "no-speech":
      return "No speech was detected. Press the mic and speak clearly.";
    case "aborted":
      return "";
    default:
      return "Speech recognition stopped unexpectedly. Press the mic to try again.";
  }
};

export default function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [conversationsError, setConversationsError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const activeUserIdRef = useRef<string | null>(null);
  const sessionTokenRef = useRef<string | null>(null);

  const [speechSupported, setSpeechSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const [ttsSupported, setTtsSupported] = useState(false);
  const [speakReplies, setSpeakReplies] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const toggleListening = useCallback(() => {
    if (!speechSupported) return;

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = navigator.language || "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (transcript) {
        setMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setSpeechError("");
      } else {
        setSpeechError(
          "Nothing was heard. Press the mic and speak clearly."
        );
      }
    };

    recognition.onerror = (event) => {
      setListening(false);
      setSpeechError(describeSpeechError(event?.error));
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    setSpeechError("");
    setListening(true);

    try {
      recognition.start();
    } catch {
      setListening(false);
      setSpeechError(
        "Could not start speech recognition. Check microphone permissions and try again."
      );
      recognitionRef.current = null;
    }
  }, [listening, speechSupported]);

  // Detect support once and clean up any live recognition on unmount.
  useEffect(() => {
    setSpeechSupported(getSpeechRecognitionCtor() !== null);
    setTtsSupported(getSpeechSynthesis() !== null);

    return () => {
      recognitionRef.current?.abort?.();
      recognitionRef.current = null;
      getSpeechSynthesis()?.cancel();
    };
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  /*
   * Keep the composer height in sync with its content so long, multi-line
   * messages stay fully visible without scrolling the whole page.
   */
  const resizeComposer = useCallback(() => {
    const el = composerRef.current;
    if (!el) return;

    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  /*
   * Requests read the active session at call time. If another tab has replaced
   * the shared token, this Chat must stop acting instead of using that token.
   */
  const getActiveSessionToken = () =>
    getActiveChatSessionToken({
      sessionToken: sessionTokenRef.current,
      storedToken: localStorage.getItem("access_token"),
      activeUserId: activeUserIdRef.current,
    });

  /*
   * Only merge account conversations while the exact token that verified this
   * Chat identity is still active. A cross-tab login can replace the shared
   * token at any time, and a stale response must never enter this user's cache.
   */
  const syncConversations = useCallback(async (userId: string) => {
    const authorizedToken = getAuthorizedConversationSyncToken({
      sessionToken: sessionTokenRef.current,
      storedToken: localStorage.getItem("access_token"),
      activeUserId: activeUserIdRef.current,
      userId,
    });

    if (!authorizedToken) {
      if (activeUserIdRef.current === userId) {
        setConversationsLoading(false);
      }
      return;
    }

    setConversationsLoading(true);
    setConversationsError("");

    try {
      const response = await api.get<ServerConversationSummary[]>(
        "/chat/conversations",
        { headers: { Authorization: `Bearer ${authorizedToken}` } }
      );

      const responseToken = getAuthorizedConversationSyncToken({
        sessionToken: sessionTokenRef.current,
        storedToken: localStorage.getItem("access_token"),
        activeUserId: activeUserIdRef.current,
        userId,
      });

      if (responseToken !== authorizedToken) return;

      setConversations((current) =>
        mergeConversationSummaries(current, response.data)
      );
    } catch (error) {
      const errorToken = getAuthorizedConversationSyncToken({
        sessionToken: sessionTokenRef.current,
        storedToken: localStorage.getItem("access_token"),
        activeUserId: activeUserIdRef.current,
        userId,
      });

      if (errorToken !== authorizedToken) return;

      console.error("Could not load account conversations:", error);
      setConversationsError(
        "Could not sync conversations from your account. Chats saved on this device are still shown."
      );
    } finally {
      if (activeUserIdRef.current === userId) {
        setConversationsLoading(false);
      }
    }
  }, []);

  /*
   * Load the authenticated user's ID so conversation history can be stored
   * separately for every user.
   */
  useEffect(() => {
    const loadCurrentUser = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        sessionTokenRef.current = null;
        setCurrentUserId(null);
        setUserLoading(false);
        return;
      }

      try {
        const response = await api.get<CurrentUser>("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (localStorage.getItem("access_token") !== token) {
          sessionTokenRef.current = null;
          setCurrentUserId(null);
          return;
        }

        sessionTokenRef.current = token;
        setCurrentUserId(response.data.id);
      } catch (error) {
        console.error("Could not load current user:", error);
        sessionTokenRef.current = null;
        setCurrentUserId(null);
      } finally {
        setUserLoading(false);
      }
    };

    void loadCurrentUser();
  }, []);

  /*
   * Load conversation history for the CURRENT USER only.
   * Each user gets a separate localStorage key, then account
   * conversations are merged in from the backend.
   */
  useEffect(() => {
    activeUserIdRef.current = currentUserId;

    if (!currentUserId) {
      setConversations([]);
      setConversationId(null);
      setMessages([]);
      setConversationsError("");
      setConversationsLoading(false);
      setHistoryError("");
      return;
    }

    const storageKey = `chat_conversations_${currentUserId}`;

    const savedConversations = localStorage.getItem(storageKey);

    if (savedConversations) {
      try {
        setConversations(JSON.parse(savedConversations));
      } catch (error) {
        console.error("Could not load saved conversations:", error);
        setConversations([]);
      }
    } else {
      setConversations([]);
    }

    // Reset the currently opened conversation when switching users.
    setConversationId(null);
    setMessages([]);
    setHistoryError("");

    void syncConversations(currentUserId);

    return () => {
      activeUserIdRef.current = null;
    };
  }, [currentUserId, syncConversations]);

  /*
   * Save conversations to a user-specific localStorage key.
   */
  useEffect(() => {
    if (!currentUserId) return;

    const storageKey = `chat_conversations_${currentUserId}`;

    localStorage.setItem(storageKey, JSON.stringify(conversations));
  }, [conversations, currentUserId]);

  // Keep the latest message in view.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, historyLoading]);

  /*
   * Send message to FastAPI.
   */
  const sendMessage = async () => {
    if (!message.trim() || loading) return;

    const userText = message.trim();
    const sessionToken = getActiveSessionToken();

    if (!sessionToken) {
      setHistoryError(SESSION_CHANGED_MESSAGE);
      return;
    }

    setMessage("");
    setLoading(true);
    setHistoryError("");
    if (composerRef.current) composerRef.current.style.height = "auto";

    try {
      const response = await api.post(
        "/chat",
        {
          message: userText,
          conversation_id: conversationId,
        },
        { headers: { Authorization: `Bearer ${sessionToken}` } }
      );

      if (getActiveSessionToken() !== sessionToken) {
        setHistoryError(SESSION_CHANGED_MESSAGE);
        return;
      }

      const data = response.data;

      const newConversationId = data.conversation_id;

      setConversationId(newConversationId);

      setMessages((prev) => [...prev, data.user_message, data.ai_response]);

      // Optional spoken reply via the browser's built-in speech synthesis.
      // Never blocks or alters the chat pipeline if synthesis is unavailable.
      if (speakReplies) {
        const synthesis = getSpeechSynthesis();
        const replyText = data.ai_response?.content as string | undefined;
        if (synthesis && replyText) {
          synthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(replyText);
          utterance.lang = navigator.language || "en-US";
          synthesis.speak(utterance);
        }
      }

      setConversations((prev) => {
        const existingConversation = prev.find(
          (conversation) => conversation.id === newConversationId
        );

        if (existingConversation) {
          return prev.map((conversation) =>
            conversation.id === newConversationId
              ? {
                  ...conversation,
                  archived: false,
                  messages: [
                    ...conversation.messages,
                    data.user_message,
                    data.ai_response,
                  ],
                }
              : conversation
          );
        }

        return [
          ...prev,
          {
            id: newConversationId,
            title: userText.substring(0, 40),
            started_at: data.user_message.created_at,
            messages: [data.user_message, data.ai_response],
          },
        ];
      });
    } catch (error) {
      if (getActiveSessionToken() !== sessionToken) {
        setHistoryError(SESSION_CHANGED_MESSAGE);
      } else {
        console.error("Chat error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  /*
   * Open an existing conversation. The backend verifies that the conversation
   * belongs to the currently authenticated user.
   */
  const openConversation = async (id: string) => {
    const sessionToken = getActiveSessionToken();

    if (!sessionToken) {
      setHistoryError(SESSION_CHANGED_MESSAGE);
      return;
    }

    setHistoryLoading(true);
    setHistoryError("");

    try {
      const response = await api.get<ConversationHistory>(
        `/chat/history/${id}`,
        { headers: { Authorization: `Bearer ${sessionToken}` } }
      );

      if (getActiveSessionToken() !== sessionToken) {
        setHistoryError(SESSION_CHANGED_MESSAGE);
        return;
      }

      const data = response.data;

      setConversationId(data.id);
      setMessages(data.messages);
    } catch (error) {
      if (getActiveSessionToken() !== sessionToken) {
        setHistoryError(SESSION_CHANGED_MESSAGE);
      } else {
        console.error("Could not load conversation:", error);
        setHistoryError(
          "Could not load this conversation from your account. Check your connection and try again."
        );
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  /*
   * Start a completely new conversation.
   */
  const startNewChat = () => {
    setConversationId(null);
    setMessages([]);
    setMessage("");
    setHistoryError("");
  };

  /*
   * Archive (hide) a conversation from the active history list. This is
   * non-destructive: the conversation stays in the user's storage and the
   * backend records are left untouched. It can be restored at any time.
   */
  const archiveConversation = (id: string) => {
    const confirmed = window.confirm(
      "Archive this conversation? It will be hidden from your active history but you can restore it anytime. Nothing is permanently deleted."
    );

    if (!confirmed) return;

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === id
          ? { ...conversation, archived: true }
          : conversation
      )
    );

    if (conversationId === id) {
      startNewChat();
    }
  };

  /*
   * Restore an archived conversation back into the active history list.
   */
  const restoreConversation = (id: string) => {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === id
          ? { ...conversation, archived: false }
          : conversation
      )
    );
  };

  const activeConversations = conversations.filter(
    (conversation) => !conversation.archived
  );

  const archivedConversations = conversations.filter(
    (conversation) => conversation.archived
  );

  if (userLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-ink-500">
        <Spinner className="text-brand-500" />
        Loading chat...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Support"
        title="AI Companion"
        description="A supportive AI companion for general emotional support. It does not replace professional care or emergency services."
        actions={
          <Button onClick={startNewChat} leftIcon={<span aria-hidden>+</span>}>
            New chat
          </Button>
        }
      />
      <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Conversation History */}
        <Card className="h-fit min-w-0 p-4">
          <h2 className="px-1 text-sm font-semibold text-ink-900">
            Conversation history
          </h2>

          {conversationsError && (
            <div
              className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
              role="alert"
            >
              <p>{conversationsError}</p>

              <button
                type="button"
                onClick={() => {
                  if (currentUserId) {
                    void syncConversations(currentUserId);
                  }
                }}
                className="mt-2 font-semibold underline underline-offset-2"
              >
                Retry
              </button>
            </div>
          )}

          {conversationsLoading && activeConversations.length === 0 ? (
            <div className="flex items-center gap-2 px-1 py-4 text-sm text-ink-500">
              <Spinner size="sm" className="text-brand-500" />
              Loading conversations...
            </div>
          ) : activeConversations.length === 0 ? (
            conversationsError ? null : (
              <p className="px-1 py-4 text-sm text-ink-500">
                No previous conversations.
              </p>
            )
          ) : (
            <div className="mt-3 max-h-64 space-y-2 overflow-y-auto lg:max-h-[460px]">
              {activeConversations.map((conversation) => {
                const active = conversation.id === conversationId;

                return (
                  <div
                    key={conversation.id}
                    className={classNames(
                      "group rounded-2xl border p-2 transition-colors",
                      active
                        ? "border-brand-300 bg-brand-50"
                        : "border-line hover:bg-mist"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => void openConversation(conversation.id)}
                      aria-current={active ? "true" : undefined}
                      className="w-full rounded-xl p-1 text-left"
                    >
                      <p className="truncate text-sm font-medium text-ink-800">
                        {conversation.title || "Conversation"}
                      </p>

                      <p className="mt-1 text-xs text-ink-400">
                        {new Date(
                          conversation.started_at
                        ).toLocaleDateString()}
                      </p>
                    </button>

                    <div className="mt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => archiveConversation(conversation.id)}
                        className="rounded-full px-2.5 py-1 text-xs font-medium text-ink-400 transition-colors hover:bg-white hover:text-ink-700"
                      >
                        Archive
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {archivedConversations.length > 0 && (
            <div className="mt-4 border-t border-line pt-3">
              <button
                type="button"
                onClick={() => setShowArchived((open) => !open)}
                aria-expanded={showArchived}
                className="flex w-full items-center justify-between px-1 text-xs font-semibold uppercase tracking-wide text-ink-400 transition-colors hover:text-ink-700"
              >
                Archived chats ({archivedConversations.length})
                <span aria-hidden>{showArchived ? "▲" : "▼"}</span>
              </button>

              {showArchived && (
                <div className="mt-3 space-y-2">
                  {archivedConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className="rounded-2xl border border-line bg-mist/60 p-2"
                    >
                      <button
                        type="button"
                        onClick={() => void openConversation(conversation.id)}
                        className="w-full rounded-xl p-1 text-left"
                      >
                        <p className="truncate text-sm font-medium text-ink-700">
                          {conversation.title || "Conversation"}
                        </p>

                        <p className="mt-1 text-xs text-ink-400">
                          {new Date(
                            conversation.started_at
                          ).toLocaleDateString()}
                        </p>
                      </button>

                      <div className="mt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => restoreConversation(conversation.id)}
                          className="rounded-full px-2.5 py-1 text-xs font-medium text-brand-600 transition-colors hover:bg-white"
                        >
                          Restore
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Chat */}
        <Card className="flex min-w-0 flex-col overflow-hidden">
          <div
            className="h-[440px] overflow-y-auto overflow-x-hidden bg-mist/50 p-4 sm:p-6 lg:h-[520px]"
            aria-live="polite"
          >
            {historyError && (
              <div
                className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                {historyError}
              </div>
            )}

            {historyLoading ? (
              <div className="flex h-full items-center justify-center gap-2 text-sm text-ink-500">
                <Spinner className="text-brand-500" />
                Loading conversation...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-2xl text-brand-600">
                  ✦
                </span>

                <p className="mt-4 text-lg font-semibold text-ink-900">
                  How are you feeling today?
                </p>

                <p className="mt-1 text-sm text-ink-500">
                  You can share what's on your mind.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={classNames(
                      "flex",
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={classNames(
                        "max-w-[85%] break-words rounded-2xl px-4 py-2.5 text-sm leading-7 shadow-sm sm:max-w-[75ch] md:px-5 md:py-3",
                        msg.sender === "user"
                          ? "bg-brand-500 text-white"
                          : "border border-line bg-white text-ink-800"
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-3xl border border-line bg-white px-4 py-3 text-sm text-ink-500 shadow-sm">
                      <Spinner size="sm" className="text-brand-500" />
                      AI is thinking...
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="safe-bottom mx-auto flex w-full max-w-4xl items-end gap-2 border-t border-line bg-surface px-3 py-3 sm:px-4">
            <textarea
              ref={composerRef}
              value={message}
              rows={1}
              onChange={(e) => {
                setMessage(e.target.value);
                resizeComposer();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder="Type your message..."
              aria-label="Message"
              disabled={loading}
              className="max-h-[200px] min-w-0 flex-1 resize-none break-words rounded-2xl border border-line bg-white px-4 py-2.5 text-sm text-ink-900 shadow-sm outline-none transition-all placeholder:text-ink-300 focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-mist"
            />

            {speechSupported && (
              <button
                type="button"
                onClick={toggleListening}
                aria-pressed={listening}
                aria-label={
                  listening ? "Stop dictation" : "Dictate message with your voice"
                }
                title={
                  listening
                    ? "Stop dictation"
                    : "Dictate your message (browser speech-to-text)"
                }
                disabled={loading}
                className={classNames(
                  "flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl border transition-all disabled:cursor-not-allowed disabled:opacity-50",
                  listening
                    ? "border-red-300 bg-red-50 text-red-600"
                    : "border-line bg-white text-ink-500 hover:border-brand-300 hover:text-brand-600"
                )}
              >
                {listening ? (
                  <span
                    aria-hidden
                    className="block h-3 w-3 animate-pulse rounded-sm bg-red-500"
                  />
                ) : (
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            )}

            {ttsSupported && (
              <button
                type="button"
                onClick={() => {
                  const next = !speakReplies;
                  setSpeakReplies(next);
                  if (!next) getSpeechSynthesis()?.cancel();
                }}
                aria-pressed={speakReplies}
                aria-label={
                  speakReplies
                    ? "Disable spoken replies"
                    : "Enable spoken replies"
                }
                title={
                  speakReplies
                    ? "Spoken replies on - click to mute"
                    : "Read AI replies aloud (browser text-to-speech)"
                }
                className={classNames(
                  "flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl border transition-all",
                  speakReplies
                    ? "border-brand-300 bg-brand-50 text-brand-600"
                    : "border-line bg-white text-ink-500 hover:border-brand-300 hover:text-brand-600"
                )}
              >
                {speakReplies ? (
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M11 5 6 9H3v6h3l5 4V5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                    <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M11 5 6 9H3v6h3l5 4V5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                    <path d="m16 9 4 6M20 9l-4 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
            )}

            <Button
              onClick={sendMessage}
              disabled={loading || !message.trim()}
              loading={loading}
              size="lg"
            >
              {loading ? "Sending..." : "Send"}
            </Button>
          </div>

          {(speechSupported || ttsSupported) && (
            <p
              className={classNames(
                "px-4 pb-3 text-xs",
                speechError ? "text-red-600" : "text-ink-400"
              )}
              role={speechError ? "alert" : "status"}
            >
              {speechError
                ? speechError
                : listening
                  ? "Listening... speak now, then press the mic again to stop. Your words appear in the message box so you can review before sending."
                  : [
                      speechSupported
                        ? "Press the mic to dictate your message."
                        : null,
                      ttsSupported
                        ? "Toggle the speaker to hear replies read aloud."
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" ")}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
