
import { useEffect, useState } from "react";
import { api } from "@/services/api";

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
}

interface CurrentUser {
  id: string;
}

export default function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  /*
   * Load the authenticated user's ID.
   *
   * This allows conversation history to be stored
   * separately for every user.
   */
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const response = await api.get<CurrentUser>("/users/me");

        setCurrentUserId(response.data.id);
      } catch (error) {
        console.error("Could not load current user:", error);
        setCurrentUserId(null);
      } finally {
        setUserLoading(false);
      }
    };

    loadCurrentUser();
  }, []);

  /*
   * Load conversation history for the CURRENT USER only.
   *
   * Each user gets a separate localStorage key.
   */
  useEffect(() => {
    if (!currentUserId) {
      setConversations([]);
      setConversationId(null);
      setMessages([]);
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

    /*
     * Reset the currently opened conversation when
     * switching to another user.
     */
    setConversationId(null);
    setMessages([]);
  }, [currentUserId]);

  /*
   * Save conversations to a user-specific localStorage key.
   */
  useEffect(() => {
    if (!currentUserId) return;

    const storageKey = `chat_conversations_${currentUserId}`;

    localStorage.setItem(
      storageKey,
      JSON.stringify(conversations)
    );
  }, [conversations, currentUserId]);

  /*
   * Send message to FastAPI.
   */
  const sendMessage = async () => {
    if (!message.trim() || loading) return;

    const userText = message.trim();

    setMessage("");
    setLoading(true);

    try {
      const response = await api.post("/chat", {
        message: userText,
        conversation_id: conversationId,
      });

      const data = response.data;

      const newConversationId = data.conversation_id;

      setConversationId(newConversationId);

      setMessages((prev) => [
        ...prev,
        data.user_message,
        data.ai_response,
      ]);

      /*
       * Update local conversation history.
       */
      setConversations((prev) => {
        const existingConversation = prev.find(
          (conversation) => conversation.id === newConversationId
        );

        if (existingConversation) {
          return prev.map((conversation) =>
            conversation.id === newConversationId
              ? {
                  ...conversation,
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
            messages: [
              data.user_message,
              data.ai_response,
            ],
          },
        ];
      });
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setLoading(false);
    }
  };

  /*
   * Open an existing conversation.
   *
   * Backend also verifies that the conversation belongs
   * to the currently authenticated user.
   */
  const openConversation = async (id: string) => {
    setHistoryLoading(true);

    try {
      const response = await api.get(`/chat/history/${id}`);

      const data = response.data;

      setConversationId(data.id);
      setMessages(data.messages);
    } catch (error) {
      console.error("Could not load conversation:", error);
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
  };

  if (userLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center text-gray-500 mt-20">
          Loading chat...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* Conversation History */}
        <aside className="md:col-span-1 border rounded-lg p-4 bg-white">

          <button
            onClick={startNewChat}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 mb-4"
          >
            + New Chat
          </button>

          <h2 className="font-semibold text-lg mb-3">
            Conversation History
          </h2>

          {conversations.length === 0 ? (
            <p className="text-sm text-gray-500">
              No previous conversations.
            </p>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => openConversation(conversation.id)}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-100 border"
                >
                  <p className="text-sm font-medium truncate">
                    {conversation.title || "Conversation"}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(
                      conversation.started_at
                    ).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* Chat */}
        <main className="md:col-span-3">

          <h1 className="text-3xl font-bold mb-2">
            AI Psychology Companion
          </h1>

          <p className="text-gray-600 mb-6">
            A supportive AI companion for general emotional support.
          </p>

          <div className="border rounded-lg p-4 min-h-[400px] max-h-[500px] overflow-y-auto mb-4 bg-gray-50">

            {historyLoading ? (
              <div className="text-center text-gray-500 mt-20">
                Loading conversation...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-20">

                <p className="text-lg">
                  How are you feeling today?
                </p>

                <p className="text-sm mt-2">
                  You can share what's on your mind.
                </p>

              </div>
            ) : (
              <div className="space-y-4">

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >

                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        msg.sender === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-white border text-gray-800"
                      }`}
                    >
                      {msg.content}
                    </div>

                  </div>
                ))}

              </div>
            )}

            {loading && (
              <div className="mt-4 text-gray-500">
                AI is thinking...
              </div>
            )}

          </div>

          {/* Message Input */}
          <div className="flex gap-2">

            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
              placeholder="Type your message..."
              disabled={loading}
              className="flex-1 border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={sendMessage}
              disabled={loading || !message.trim()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send"}
            </button>

          </div>

        </main>

      </div>

    </div>
  );
}
