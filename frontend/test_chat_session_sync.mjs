/*
 * Focused cross-tab identity tests for the chat conversation sync and bound
 * chat requests.
 *
 * These tests exercise the real authorization/session guards, merge helper,
 * request-header helper, and 401 decision helper used by Chat.tsx / api.ts /
 * AuthContext.tsx. The cache stands in for the per-user
 * `chat_conversations_<userId>` localStorage key. No network, production
 * database, or real account data is used.
 */

import assert from "node:assert/strict";
import test from "node:test";
import axios, { AxiosError, AxiosHeaders } from "axios";

import {
  getActiveChatSessionToken,
  getAuthorizedConversationSyncToken,
  mergeConversationSummaries,
} from "./src/utils/chatConversations.ts";
import {
  applyStoredAuthorizationHeader,
  getRequestAuthorization,
  shouldClearStoredSessionToken,
} from "./src/services/apiAuth.ts";

const USER_A = "00000000-0000-4000-8000-00000000000a";
const USER_B = "00000000-0000-4000-8000-00000000000b";
const TOKEN_A = "synthetic-session-token-a";
const TOKEN_B = "synthetic-session-token-b";

function identity(overrides = {}) {
  return {
    sessionToken: TOKEN_A,
    storedToken: TOKEN_A,
    activeUserId: USER_A,
    userId: USER_A,
    ...overrides,
  };
}

function chatSession(overrides = {}) {
  return {
    sessionToken: TOKEN_A,
    storedToken: TOKEN_A,
    activeUserId: USER_A,
    ...overrides,
  };
}

/*
 * Mirrors the sendMessage/openConversation sequence in Chat.tsx: read the
 * active session before dispatching, bind the request to that exact token,
 * then re-check the session before applying the response.
 */
function runBoundChatRequest({ getSession, dispatch, applyResponse }) {
  const requestToken = getActiveChatSessionToken(getSession());

  if (!requestToken) {
    return { sent: false, applied: false, requestToken: null, payload: null };
  }

  const payload = dispatch(requestToken);
  const responseToken = getActiveChatSessionToken(getSession());

  if (responseToken !== requestToken) {
    return { sent: true, applied: false, requestToken, payload };
  }

  applyResponse(payload);
  return { sent: true, applied: true, requestToken, payload };
}

function unauthorizedError(config) {
  return new AxiosError(
    "Request failed with status code 401",
    "ERR_BAD_REQUEST",
    config,
    null,
    {
      data: null,
      status: 401,
      statusText: "Unauthorized",
      headers: new AxiosHeaders(),
      config,
    },
  );
}

function localConversations() {
  return [
    {
      id: "a-local",
      title: "A local title",
      started_at: "2026-01-01T10:00:00.000Z",
      messages: [
        {
          id: "a-local-message",
          sender: "user",
          content: "Synthetic local message",
          created_at: "2026-01-01T10:01:00.000Z",
        },
      ],
      archived: false,
    },
    {
      id: "a-archived",
      title: "Archived A conversation",
      started_at: "2026-01-02T10:00:00.000Z",
      messages: [
        {
          id: "a-archived-message",
          sender: "ai",
          content: "Synthetic archived reply",
          created_at: "2026-01-02T10:01:00.000Z",
        },
      ],
      archived: true,
    },
    {
      id: "shared",
      title: "Local shared title",
      started_at: "2026-01-03T10:00:00.000Z",
      messages: [
        {
          id: "shared-local-message",
          sender: "user",
          content: "Synthetic shared message",
          created_at: "2026-01-03T10:01:00.000Z",
        },
      ],
      archived: false,
    },
  ];
}

function serverSummaries() {
  return [
    {
      id: "shared",
      title: "Server shared title",
      started_at: "2025-12-31T10:00:00.000Z",
    },
    {
      id: "a-server-only",
      title: "Server-only A conversation",
      started_at: "2026-01-04T10:00:00.000Z",
    },
  ];
}

function compromisedServerResponse() {
  return [
    ...serverSummaries(),
    {
      id: "b-secret",
      title: "Synthetic B conversation",
      started_at: "2026-01-05T10:00:00.000Z",
    },
  ];
}

/*
 * Mirrors Chat's authorized sync sequence: guard -> request/merge -> persist
 * under the signed-in user's own cache key.
 */
function runGuardedSync({ identity: syncIdentity, local, server }) {
  const cache = new Map();
  const token = getAuthorizedConversationSyncToken(syncIdentity);

  if (!token) {
    return { token, merged: null, cache, cacheWritten: false };
  }

  const merged = mergeConversationSummaries(local, server);
  cache.set(`chat_conversations_${syncIdentity.userId}`, merged);

  return { token, merged, cache, cacheWritten: true };
}

test("legitimate sync merges server summaries without losing local state", () => {
  const local = localConversations();
  const result = runGuardedSync({
    identity: identity(),
    local,
    server: serverSummaries(),
  });

  assert.equal(result.token, TOKEN_A);
  assert.equal(result.cacheWritten, true);

  const merged = result.merged;
  assert.equal(merged.length, 4);

  const localConversation = merged.find((item) => item.id === "a-local");
  assert.deepEqual(localConversation.messages, local[0].messages);
  assert.equal(localConversation.title, "A local title");
  assert.equal(localConversation.archived, false);

  const archivedConversation = merged.find((item) => item.id === "a-archived");
  assert.equal(archivedConversation.archived, true);
  assert.deepEqual(archivedConversation.messages, local[1].messages);

  const shared = merged.find((item) => item.id === "shared");
  assert.equal(shared.title, "Local shared title");
  assert.equal(shared.started_at, "2026-01-03T10:00:00.000Z");
  assert.deepEqual(shared.messages, local[2].messages);

  const serverOnly = merged.find((item) => item.id === "a-server-only");
  assert.deepEqual(serverOnly.messages, []);
  assert.equal(serverOnly.archived, false);

  assert.equal(merged[0].id, "a-server-only");
  assert.equal(merged[3].id, "a-local");

  assert.deepEqual(
    result.cache.get(`chat_conversations_${USER_A}`),
    merged,
  );
  assert.equal(result.cache.has(`chat_conversations_${USER_B}`), false);
});

test("token replacement blocks the sync before any request or cache write", () => {
  const result = runGuardedSync({
    identity: identity({ storedToken: TOKEN_B }),
    local: localConversations(),
    server: compromisedServerResponse(),
  });

  assert.equal(result.token, null);
  assert.equal(result.merged, null);
  assert.equal(result.cacheWritten, false);
  assert.equal(result.cache.size, 0);
});

test("stale response after a token replacement is ignored", () => {
  const requestToken = getAuthorizedConversationSyncToken(identity());
  assert.equal(requestToken, TOKEN_A);

  const responseToken = getAuthorizedConversationSyncToken(
    identity({ storedToken: TOKEN_B }),
  );
  assert.equal(responseToken, null);

  const merged =
    responseToken === requestToken
      ? mergeConversationSummaries(
          localConversations(),
          compromisedServerResponse(),
        )
      : null;

  assert.equal(merged, null);

  const reboundToken = getAuthorizedConversationSyncToken(
    identity({
      sessionToken: TOKEN_B,
      storedToken: TOKEN_B,
      activeUserId: USER_B,
      userId: USER_B,
    }),
  );

  assert.equal(reboundToken, TOKEN_B);
  assert.notEqual(reboundToken, requestToken);
});

test("logout or identity change invalidates an in-flight sync", () => {
  assert.equal(
    getAuthorizedConversationSyncToken(identity({ storedToken: null })),
    null,
  );
  assert.equal(
    getAuthorizedConversationSyncToken(identity({ activeUserId: null })),
    null,
  );
  assert.equal(
    getAuthorizedConversationSyncToken(identity({ activeUserId: USER_B })),
    null,
  );
});

test("a fresh same-tab login binds its own token and cache", () => {
  const result = runGuardedSync({
    identity: identity({
      sessionToken: TOKEN_B,
      storedToken: TOKEN_B,
      activeUserId: USER_B,
      userId: USER_B,
    }),
    local: [
      {
        id: "b-local",
        title: "B local title",
        started_at: "2026-01-06T10:00:00.000Z",
        messages: [],
        archived: false,
      },
    ],
    server: [
      {
        id: "b-server-only",
        title: "B server conversation",
        started_at: "2026-01-07T10:00:00.000Z",
      },
    ],
  });

  assert.equal(result.token, TOKEN_B);
  assert.equal(result.cacheWritten, true);
  assert.equal(result.merged.length, 2);
  assert.equal(result.cache.has(`chat_conversations_${USER_B}`), true);
  assert.equal(result.cache.has(`chat_conversations_${USER_A}`), false);
});

test("an empty session token never authorizes a sync", () => {
  assert.equal(
    getAuthorizedConversationSyncToken(
      identity({ sessionToken: "", storedToken: "" }),
    ),
    null,
  );
});

test("explicit Authorization headers are never overwritten by the interceptor helper", () => {
  const explicit = new AxiosHeaders();
  explicit.set("Authorization", `Bearer ${TOKEN_A}`);

  applyStoredAuthorizationHeader(explicit, TOKEN_B);

  assert.equal(explicit.get("Authorization"), `Bearer ${TOKEN_A}`);
});

test("a missing Authorization header still receives the stored token", () => {
  const headers = new AxiosHeaders();

  applyStoredAuthorizationHeader(headers, TOKEN_B);

  assert.equal(headers.has("Authorization"), true);
  assert.equal(headers.get("Authorization"), `Bearer ${TOKEN_B}`);
});

test("no Authorization header is added when no token is stored", () => {
  const headers = new AxiosHeaders();

  applyStoredAuthorizationHeader(headers, null);

  assert.equal(headers.has("Authorization"), false);
});

test("the Axios interceptor sends the explicit session token unchanged", async () => {
  const instance = axios.create({ baseURL: "http://synthetic.invalid" });
  const sentHeaders = [];

  instance.interceptors.request.use((config) => {
    applyStoredAuthorizationHeader(config.headers, TOKEN_B);
    return config;
  });

  instance.defaults.adapter = async (config) => {
    sentHeaders.push(config.headers.get("Authorization"));
    return {
      data: null,
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
  };

  await instance.get("/probe-a", {
    headers: { Authorization: `Bearer ${TOKEN_A}` },
  });
  await instance.get("/probe-b");

  assert.deepEqual(sentHeaders, [`Bearer ${TOKEN_A}`, `Bearer ${TOKEN_B}`]);
});

test("an active chat session exposes the verified token for chat requests", () => {
  assert.equal(getActiveChatSessionToken(chatSession()), TOKEN_A);
  assert.equal(
    getActiveChatSessionToken(chatSession({ storedToken: TOKEN_B })),
    null,
  );
  assert.equal(
    getActiveChatSessionToken(chatSession({ storedToken: null })),
    null,
  );
  assert.equal(
    getActiveChatSessionToken(chatSession({ activeUserId: null })),
    null,
  );
  assert.equal(
    getActiveChatSessionToken(
      chatSession({ sessionToken: "", storedToken: "" }),
    ),
    null,
  );
});

test("chat requests are blocked before dispatch when the stored token changed", () => {
  for (const endpoint of ["POST /chat", "GET /chat/history/a-server"]) {
    let dispatches = 0;

    const result = runBoundChatRequest({
      getSession: () => chatSession({ storedToken: TOKEN_B }),
      dispatch: () => {
        dispatches += 1;
        return { endpoint };
      },
      applyResponse: () => assert.fail("no response should be applied"),
    });

    assert.equal(result.requestToken, null);
    assert.equal(result.sent, false);
    assert.equal(result.applied, false);
    assert.equal(result.payload, null);
    assert.equal(dispatches, 0);
  }
});

test("an unchanged session still applies send and history responses", () => {
  const applied = [];

  const result = runBoundChatRequest({
    getSession: () => chatSession(),
    dispatch: (token) => {
      assert.equal(token, TOKEN_A);
      return { ok: true };
    },
    applyResponse: (payload) => applied.push(payload),
  });

  assert.equal(result.sent, true);
  assert.equal(result.applied, true);
  assert.deepEqual(applied, [{ ok: true }]);
});

test("an in-flight send cannot apply or cache a response after a token swap", () => {
  let storedToken = TOKEN_A;
  let messages = [];
  let conversations = [];

  const result = runBoundChatRequest({
    getSession: () => chatSession({ storedToken }),
    dispatch: (token) => {
      assert.equal(token, TOKEN_A);
      // Another tab logs in before this response reaches the page.
      storedToken = TOKEN_B;
      return {
        conversationId: "a-conversation",
        userMessage: { id: "a-user-message" },
        aiResponse: { id: "a-ai-response" },
      };
    },
    applyResponse: (payload) => {
      messages = [payload.userMessage, payload.aiResponse];
      conversations = [{ id: payload.conversationId }];
    },
  });

  assert.equal(result.sent, true);
  assert.equal(result.applied, false);
  assert.equal(result.requestToken, TOKEN_A);
  assert.deepEqual(messages, []);
  assert.deepEqual(conversations, []);
});

test("an in-flight history load cannot open a conversation after a token swap", () => {
  let storedToken = TOKEN_A;
  let openConversationId = null;
  let messages = [];

  const result = runBoundChatRequest({
    getSession: () => chatSession({ storedToken }),
    dispatch: (token) => {
      assert.equal(token, TOKEN_A);
      storedToken = TOKEN_B;
      return {
        id: "a-conversation",
        messages: [{ id: "a-message" }],
      };
    },
    applyResponse: (payload) => {
      openConversationId = payload.id;
      messages = payload.messages;
    },
  });

  assert.equal(result.sent, true);
  assert.equal(result.applied, false);
  assert.equal(openConversationId, null);
  assert.deepEqual(messages, []);
});

test("a 401 only clears the exact stored token that the request used", () => {
  assert.equal(
    shouldClearStoredSessionToken({
      status: 401,
      requestAuthorization: `Bearer ${TOKEN_A}`,
      storedToken: TOKEN_A,
    }),
    true,
  );

  assert.equal(
    shouldClearStoredSessionToken({
      status: 401,
      requestAuthorization: `Bearer ${TOKEN_A}`,
      storedToken: TOKEN_B,
    }),
    false,
  );

  assert.equal(
    shouldClearStoredSessionToken({
      status: 401,
      requestAuthorization: `Bearer ${TOKEN_A}`,
      storedToken: null,
    }),
    false,
  );

  assert.equal(
    shouldClearStoredSessionToken({
      status: 401,
      requestAuthorization: null,
      storedToken: TOKEN_A,
    }),
    false,
  );

  assert.equal(
    shouldClearStoredSessionToken({
      status: 401,
      requestAuthorization: TOKEN_A,
      storedToken: TOKEN_A,
    }),
    false,
  );

  for (const status of [400, 403, 500, undefined]) {
    assert.equal(
      shouldClearStoredSessionToken({
        status,
        requestAuthorization: `Bearer ${TOKEN_A}`,
        storedToken: TOKEN_A,
      }),
      false,
    );
  }
});

test("the failed request Authorization header is read from error config", () => {
  const headers = new AxiosHeaders();
  headers.set("Authorization", `Bearer ${TOKEN_A}`);

  assert.equal(
    getRequestAuthorization({ config: { headers } }),
    `Bearer ${TOKEN_A}`,
  );
  assert.equal(
    getRequestAuthorization({
      config: { headers: { authorization: `Bearer ${TOKEN_B}` } },
    }),
    `Bearer ${TOKEN_B}`,
  );
  assert.equal(getRequestAuthorization({ config: {} }), null);
  assert.equal(getRequestAuthorization({}), null);
});

test("a stale 401 cannot clear a token another tab has since stored", async () => {
  let storedToken = TOKEN_A;
  let clears = 0;

  const instance = axios.create({ baseURL: "http://synthetic.invalid" });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (
        shouldClearStoredSessionToken({
          status: error.response?.status,
          requestAuthorization: getRequestAuthorization(error),
          storedToken,
        })
      ) {
        storedToken = null;
        clears += 1;
      }

      return Promise.reject(error);
    },
  );

  instance.defaults.adapter = async (config) => {
    // Simulate a cross-tab login while this stale request is in flight.
    storedToken = TOKEN_B;
    throw unauthorizedError(config);
  };

  await assert.rejects(
    instance.get("/chat", {
      headers: { Authorization: `Bearer ${TOKEN_A}` },
    }),
    (error) => error.response?.status === 401,
  );

  assert.equal(storedToken, TOKEN_B);
  assert.equal(clears, 0);
});

test("a genuine 401 for the current token still clears the session", async () => {
  let storedToken = TOKEN_A;
  let clears = 0;

  const instance = axios.create({ baseURL: "http://synthetic.invalid" });

  instance.interceptors.request.use((config) => {
    applyStoredAuthorizationHeader(config.headers, storedToken);
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (
        shouldClearStoredSessionToken({
          status: error.response?.status,
          requestAuthorization: getRequestAuthorization(error),
          storedToken,
        })
      ) {
        storedToken = null;
        clears += 1;
      }

      return Promise.reject(error);
    },
  );

  instance.defaults.adapter = async (config) => {
    throw unauthorizedError(config);
  };

  await assert.rejects(
    instance.get("/chat"),
    (error) => error.response?.status === 401,
  );

  assert.equal(storedToken, null);
  assert.equal(clears, 1);
});
