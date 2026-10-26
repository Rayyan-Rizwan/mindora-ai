export interface ServerConversationSummary {
  id: string;
  title: string | null;
  started_at: string;
}

export interface ConversationWithMessages<MessageType> {
  id: string;
  title: string | null;
  started_at: string;
  messages: MessageType[];
  archived?: boolean;
}

export interface ChatSessionIdentity {
  sessionToken: string | null;
  storedToken: string | null;
  activeUserId: string | null;
}

export interface ConversationSyncIdentity extends ChatSessionIdentity {
  userId: string;
}

/*
 * A Chat session is only usable while the token that verified its user is
 * still the token stored for the app. A login or logout in another tab can
 * replace that shared token at any time.
 */
export function getActiveChatSessionToken({
  sessionToken,
  storedToken,
  activeUserId,
}: ChatSessionIdentity): string | null {
  if (!sessionToken || storedToken !== sessionToken) return null;
  if (!activeUserId) return null;
  return sessionToken;
}

export function getAuthorizedConversationSyncToken({
  sessionToken,
  storedToken,
  activeUserId,
  userId,
}: ConversationSyncIdentity): string | null {
  const activeToken = getActiveChatSessionToken({
    sessionToken,
    storedToken,
    activeUserId,
  });

  if (!activeToken || activeUserId !== userId) return null;
  return activeToken;
}

export function mergeConversationSummaries<MessageType>(
  local: ConversationWithMessages<MessageType>[],
  server: ServerConversationSummary[],
): ConversationWithMessages<MessageType>[] {
  const byId = new Map<string, ConversationWithMessages<MessageType>>();

  for (const conversation of local) {
    byId.set(conversation.id, conversation);
  }

  for (const summary of server) {
    const existing = byId.get(summary.id);

    if (existing) {
      byId.set(summary.id, {
        ...existing,
        title: existing.title || summary.title,
        started_at: existing.started_at || summary.started_at,
      });
    } else {
      byId.set(summary.id, {
        id: summary.id,
        title: summary.title,
        started_at: summary.started_at,
        messages: [],
        archived: false,
      });
    }
  }

  return Array.from(byId.values()).sort(
    (a, b) =>
      new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
  );
}
