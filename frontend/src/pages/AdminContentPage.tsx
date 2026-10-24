import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import axios from "axios";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import type {
  BroadcastPreview,
  BroadcastRequest,
  BroadcastResult,
  BroadcastRecipientMode,
  MotivationalMessage,
  MotivationalMessageInput,
  MotivationalMessageList,
  UserRole,
} from "@/types";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  Spinner,
  StatTile,
  Textarea,
} from "@/components/ui";

const BASE = "/admin/content/motivational-messages";
const TITLE_MAX = 150;

interface FormState {
  id: string | null;
  title: string;
  content: string;
}

const emptyForm: FormState = { id: null, title: "", content: "" };

const messageFrom = (err: unknown, fallback: string): string => {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") return detail;
  }
  return fallback;
};

export default function AdminContentPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [data, setData] = useState<MotivationalMessageList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);

  const [broadcast, setBroadcast] = useState<{
    title: string;
    content: string;
    recipient_mode: BroadcastRecipientMode;
    role: UserRole | "";
    user_ids: string;
  }>({
    title: "",
    content: "",
    recipient_mode: "all",
    role: "",
    user_ids: "",
  });
  const [preview, setPreview] = useState<BroadcastPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [broadcastError, setBroadcastError] = useState("");
  const [broadcastNotice, setBroadcastNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<MotivationalMessageList>(BASE);
      setData(response.data);
    } catch (err) {
      console.error("Could not load motivational messages:", err);
      setError("Could not load motivational messages. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      if (!authLoading) setLoading(false);
      return;
    }

    void load();
  }, [authLoading, isAuthenticated, load]);

  const openCreate = () => {
    setError("");
    setNotice("");
    setForm({ ...emptyForm });
  };

  const openEdit = (message: MotivationalMessage) => {
    setError("");
    setNotice("");
    setForm({ id: message.id, title: message.title, content: message.content });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;

    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!form.content.trim()) {
      setError("Message content is required.");
      return;
    }

    const payload: MotivationalMessageInput = {
      title: form.title.trim(),
      content: form.content.trim(),
    };

    setBusy(true);
    setError("");
    setNotice("");

    try {
      if (form.id) {
        await api.put(`${BASE}/${form.id}`, payload);
        setNotice("Message updated.");
      } else {
        await api.post(BASE, payload);
        setNotice("Message created.");
      }
      setForm(null);
      await load();
    } catch (err) {
      setError(messageFrom(err, "Could not save the message."));
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (message: MotivationalMessage) => {
    setBusy(true);
    setError("");
    setNotice("");

    try {
      await api.put(`${BASE}/${message.id}`, { enabled: !message.enabled });
      setNotice(message.enabled ? "Message disabled." : "Message enabled.");
      await load();
    } catch (err) {
      setError(messageFrom(err, "Could not update the message."));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (message: MotivationalMessage) => {
    const confirmed = window.confirm(
      `Delete "${message.title}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      await api.delete(`${BASE}/${message.id}`);
      setNotice("Message deleted.");
      await load();
    } catch (err) {
      setError(messageFrom(err, "Could not delete the message."));
    } finally {
      setBusy(false);
    }
  };

  const buildBroadcastRequest = (
    force: boolean
  ): BroadcastRequest | null => {
    const title = broadcast.title.trim();
    const content = broadcast.content.trim();
    if (!title || !content) return null;

    if (broadcast.recipient_mode === "role") {
      if (!broadcast.role) return null;
      return {
        title,
        content,
        recipient_mode: "role",
        role: broadcast.role,
        force,
      };
    }

    if (broadcast.recipient_mode === "user_ids") {
      const ids = broadcast.user_ids
        .split(/[\s,]+/)
        .map((id) => id.trim())
        .filter(Boolean);
      if (ids.length === 0) return null;
      return { title, content, recipient_mode: "user_ids", user_ids: ids, force };
    }

    return { title, content, recipient_mode: "all", force };
  };

  const handlePreview = async () => {
    const payload = buildBroadcastRequest(false);
    if (!payload) {
      setBroadcastError(
        "Add a title and content, and pick valid recipients before previewing."
      );
      return;
    }

    setPreviewLoading(true);
    setBroadcastError("");
    setBroadcastNotice("");
    setPreview(null);

    try {
      const response = await api.post<BroadcastPreview>(
        "/admin/content/broadcast/preview",
        payload
      );
      setPreview(response.data);
    } catch (err) {
      setBroadcastError(
        messageFrom(err, "Could not preview recipients. Please try again.")
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSend = async (force: boolean) => {
    const payload = buildBroadcastRequest(force);
    if (!payload) {
      setBroadcastError(
        "Add a title and content, and pick valid recipients before sending."
      );
      return;
    }

    setSendLoading(true);
    setBroadcastError("");
    setBroadcastNotice("");

    try {
      const response = await api.post<BroadcastResult>(
        "/admin/content/broadcast",
        payload
      );
      const result = response.data;
      setBroadcastNotice(
        `Broadcast sent to ${result.notifications_created} recipient${
          result.notifications_created === 1 ? "" : "s"
        }.`
      );
      setPreview(null);
      setBroadcast({
        title: "",
        content: "",
        recipient_mode: "all",
        role: "",
        user_ids: "",
      });
    } catch (err) {
      if (
        axios.isAxiosError(err) &&
        err.response?.status === 409 &&
        typeof err.response.data?.detail === "string"
      ) {
        setBroadcastError(err.response.data.detail);
      } else {
        setBroadcastError(
          messageFrom(err, "Could not send the broadcast. Please try again.")
        );
      }
    } finally {
      setSendLoading(false);
    }
  };

  const handleSendClick = () => void handleSend(false);
  const handleForceSendClick = () => void handleSend(true);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        eyebrow="Administration"
        title="Motivational Messages"
        description="Manage the daily motivational notifications sent to users. At least one message must stay enabled."
        actions={<Button onClick={openCreate}>Add Message</Button>}
      />

      {error && <Alert tone="danger">{error}</Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}

      {data && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile title="Messages" value={data.total} />
          <StatTile title="Enabled" value={data.enabled_count} />
          <StatTile
            title="Source"
            value={data.using_defaults ? "Built-in defaults" : "Admin-managed"}
          />
        </div>
      )}

      {form && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-ink-900">
            {form.id ? "Edit Message" : "New Message"}
          </h2>

          <form onSubmit={submit} className="mt-4 space-y-4">
            <Field
              label="Title"
              htmlFor="message-title"
              required
              hint={`${form.title.length}/${TITLE_MAX}`}
            >
              <Input
                id="message-title"
                type="text"
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
                maxLength={TITLE_MAX}
                required
              />
            </Field>

            <Field label="Content" htmlFor="message-content" required>
              <Textarea
                id="message-content"
                value={form.content}
                onChange={(event) =>
                  setForm({ ...form, content: event.target.value })
                }
                rows={4}
                placeholder="Write an encouraging message..."
                required
              />
            </Field>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" loading={busy}>
                {form.id ? "Save Changes" : "Create"}
              </Button>

              <Button variant="secondary" onClick={() => setForm(null)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-ink-500">
          <Spinner size="sm" className="text-brand-500" />
          Loading messages...
        </div>
      ) : data ? (
        data.messages.length === 0 ? (
          <EmptyState
            title="No messages yet"
            description="Add a motivational message to get started."
            icon="💬"
          />
        ) : (
          <div className="overflow-x-auto rounded-4xl border border-line bg-white shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-ink-400">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Content</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.messages.map((message) => (
                  <tr
                    key={message.id}
                    className="border-b border-line align-top last:border-0"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-800">
                        {message.title}
                      </p>
                      {message.builtin && (
                        <span className="text-xs text-amber-600">
                          Built-in
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-ink-600">
                      {message.content}
                    </td>

                    <td className="px-4 py-3">
                      <Badge tone={message.enabled ? "success" : "neutral"}>
                        {message.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openEdit(message)}
                        >
                          Edit
                        </Button>

                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => toggle(message)}
                          disabled={busy}
                        >
                          {message.enabled ? "Disable" : "Enable"}
                        </Button>

                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => remove(message)}
                          disabled={busy}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : null}

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-ink-900">
          Send a broadcast
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Send an in-app notification to users, professionals or everyone.
          Duplicate broadcasts are blocked for 10 minutes.
        </p>

        <form
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            handlePreview();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" htmlFor="broadcast-title" required>
              <Input
                id="broadcast-title"
                type="text"
                maxLength={150}
                value={broadcast.title}
                onChange={(event) =>
                  setBroadcast({ ...broadcast, title: event.target.value })
                }
                placeholder="New features available"
                required
              />
            </Field>

            <Field
              label="Recipients"
              htmlFor="broadcast-mode"
              hint="Everyone gets an in-app notification."
            >
              <Select
                id="broadcast-mode"
                value={broadcast.recipient_mode}
                onChange={(event) =>
                  setBroadcast({
                    ...broadcast,
                    recipient_mode: event.target
                      .value as BroadcastRecipientMode,
                  })
                }
              >
                <option value="all">All active users</option>
                <option value="role">By role</option>
                <option value="user_ids">Specific user IDs</option>
              </Select>
            </Field>
          </div>

          {broadcast.recipient_mode === "role" && (
            <Field
              label="Role"
              htmlFor="broadcast-role"
              required
              hint="Only active accounts with this role will receive it."
            >
              <Select
                id="broadcast-role"
                value={broadcast.role}
                onChange={(event) =>
                  setBroadcast({
                    ...broadcast,
                    role: event.target.value as UserRole | "",
                  })
                }
                required
              >
                <option value="">Select a role...</option>
                <option value="user">User</option>
                <option value="professional">Professional</option>
                <option value="admin">Admin</option>
              </Select>
            </Field>
          )}

          {broadcast.recipient_mode === "user_ids" && (
            <Field
              label="User IDs"
              htmlFor="broadcast-user-ids"
              required
              hint="One or more user IDs, separated by commas or new lines. Unknown or inactive IDs are skipped."
            >
              <Textarea
                id="broadcast-user-ids"
                value={broadcast.user_ids}
                onChange={(event) =>
                  setBroadcast({ ...broadcast, user_ids: event.target.value })
                }
                rows={3}
                placeholder="user-uuid-1, user-uuid-2"
              />
            </Field>
          )}

          <Field label="Message" htmlFor="broadcast-content" required>
            <Textarea
              id="broadcast-content"
              value={broadcast.content}
              onChange={(event) =>
                setBroadcast({ ...broadcast, content: event.target.value })
              }
              rows={4}
              maxLength={2000}
              placeholder="Write an encouraging update..."
              required
            />
          </Field>

          {broadcastError && (
            <Alert tone="danger" title="Broadcast not sent">
              {broadcastError}
              {broadcastError.toLowerCase().includes("identical") && (
                <div className="mt-2">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={handleForceSendClick}
                    disabled={sendLoading}
                  >
                    Send anyway
                  </Button>
                </div>
              )}
            </Alert>
          )}

          {broadcastNotice && (
            <Alert tone="success">{broadcastNotice}</Alert>
          )}

          {preview && (
            <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
              <p className="font-semibold">Preview</p>
              <ul className="mt-1 space-y-1">
                <li>
                  Recipients: <strong>{preview.total_recipients}</strong>{" "}
                  {preview.recipient_mode === "role" && preview.role && (
                    <>(role: {preview.role})</>
                  )}
                </li>
                {Object.entries(preview.by_role).map(([roleName, count]) => (
                  <li key={roleName}>
                    {roleName}: {count}
                  </li>
                ))}
                {preview.inactive_or_unknown_ids != null &&
                  preview.inactive_or_unknown_ids > 0 && (
                    <li>
                      Skipped (inactive or unknown):{" "}
                      {preview.inactive_or_unknown_ids}
                    </li>
                  )}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => void handlePreview()}
              loading={previewLoading}
              disabled={sendLoading}
            >
              Preview recipients
            </Button>

            <Button
              type="button"
              onClick={handleSendClick}
              loading={sendLoading}
              disabled={previewLoading || !preview}
              title={
                !preview
                  ? "Run a preview first to confirm recipient counts."
                  : undefined
              }
            >
              Send broadcast
            </Button>
          </div>

          {!preview && !sendLoading && (
            <p className="text-xs text-ink-400">
              Run a preview first. Sending stays disabled until you have seen
              the recipient count.
            </p>
          )}
        </form>
      </Card>
    </div>
  );
}
