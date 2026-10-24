import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import axios from "axios";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import type {
  KnowledgeBaseDocument,
  KnowledgeBaseDocumentDetail,
  KnowledgeBaseDocumentInput,
  KnowledgeBaseList,
  KnowledgeBasePdfDocumentInput,
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
  Spinner,
  StatTile,
  Textarea,
} from "@/components/ui";

const BASE = "/admin/knowledge-base/documents";
const MAX_PDF_BYTES = 10 * 1024 * 1024;

interface FormState {
  id: string | null;
  title: string;
  category: string;
  text: string;
}

const emptyForm: FormState = { id: null, title: "", category: "", text: "" };

const messageFrom = (err: unknown, fallback: string): string => {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") return detail;
  }
  return fallback;
};

const readFileAsBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Could not read the file."));
        return;
      }
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });

const displayName = (doc: KnowledgeBaseDocument): string =>
  doc.title || doc.file_name || doc.source;

export default function AdminKnowledgeBasePage() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [data, setData] = useState<KnowledgeBaseList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState<FormState | null>(null);
  const [detail, setDetail] = useState<KnowledgeBaseDocumentDetail | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<KnowledgeBaseList>(BASE);
      setData(response.data);
    } catch (err) {
      console.error("Could not load knowledge base:", err);
      setError("Could not load the knowledge base. Please try again.");
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
    setDetail(null);
    setForm({ ...emptyForm });
  };

  const openEdit = async (doc: KnowledgeBaseDocument) => {
    if (!doc.id) return;
    setError("");
    setNotice("");
    setDetail(null);

    try {
      const response = await api.get<KnowledgeBaseDocumentDetail>(
        `${BASE}/${doc.id}`
      );
      const full = response.data;
      setForm({
        id: full.id,
        title: (full.metadata?.title as string) ?? full.title ?? "",
        category: full.category ?? "",
        text: full.text,
      });
    } catch (err) {
      setError(messageFrom(err, "Could not load the document."));
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;

    if (!form.text.trim()) {
      setError("Document text is required.");
      return;
    }

    const metadata: Record<string, unknown> = {};
    if (form.title.trim()) metadata.title = form.title.trim();
    if (form.category.trim()) metadata.category = form.category.trim();

    const payload: KnowledgeBaseDocumentInput = {
      text: form.text,
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
    };

    setBusy(true);
    setError("");
    setNotice("");

    try {
      if (form.id) {
        await api.put(`${BASE}/${form.id}`, payload);
        setNotice("Document updated.");
      } else {
        await api.post(BASE, payload);
        setNotice("Document created.");
      }
      setForm(null);
      await load();
    } catch (err) {
      setError(messageFrom(err, "Could not save the document."));
    } finally {
      setBusy(false);
    }
  };

  const uploadPdf = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    setError("");
    setNotice("");

    const looksLikePdf =
      file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (!looksLikePdf) {
      setError("Please choose a PDF file.");
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setError("The PDF is too large. The maximum size is 10 MB.");
      return;
    }

    setBusy(true);

    try {
      const file_base64 = await readFileAsBase64(file);
      const payload: KnowledgeBasePdfDocumentInput = {
        file_base64,
        file_name: file.name,
        metadata: { title: file.name.replace(/\.pdf$/i, "") },
      };
      await api.post(`${BASE}/pdf`, payload);
      setNotice("PDF uploaded and processed.");
      await load();
    } catch (err) {
      setError(messageFrom(err, "Could not upload the PDF."));
    } finally {
      setBusy(false);
    }
  };

  const view = async (doc: KnowledgeBaseDocument) => {
    if (!doc.id) return;
    setError("");
    setForm(null);

    try {
      const response = await api.get<KnowledgeBaseDocumentDetail>(
        `${BASE}/${doc.id}`
      );
      setDetail(response.data);
    } catch (err) {
      setError(messageFrom(err, "Could not load the document."));
    }
  };

  const reprocess = async (doc: KnowledgeBaseDocument) => {
    if (!doc.id) return;
    setBusy(true);
    setError("");
    setNotice("");

    try {
      await api.post(`${BASE}/${doc.id}/reprocess`);
      setNotice("Document reprocessed.");
      await load();
    } catch (err) {
      setError(messageFrom(err, "Could not reprocess the document."));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (doc: KnowledgeBaseDocument) => {
    if (!doc.id) return;
    const confirmed = window.confirm(
      `Delete "${displayName(doc)}"? This removes all of its chunks.`
    );
    if (!confirmed) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      await api.delete(`${BASE}/${doc.id}`);
      setNotice("Document deleted.");
      await load();
    } catch (err) {
      setError(messageFrom(err, "Could not delete the document."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        eyebrow="Administration"
        title="Knowledge Base"
        description="Manage the documents the assistant uses to answer questions. File-based documents are read-only; admin-authored documents can be edited or removed."
        actions={
          <>
            <label
              className={`inline-flex cursor-pointer items-center justify-center rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink-800 shadow-sm transition-all hover:border-line-strong hover:bg-mist ${
                busy ? "pointer-events-none opacity-50" : ""
              }`}
            >
              Upload PDF
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={uploadPdf}
                disabled={busy}
              />
            </label>

            <Button onClick={openCreate}>Add Document</Button>
          </>
        }
      />

      {error && <Alert tone="danger">{error}</Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}

      {data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile title="Documents" value={data.total_documents} />
          <StatTile title="Chunks" value={data.total_chunks} />
          <StatTile title="Admin-managed" value={data.managed_documents} />
          <StatTile title="Read-only files" value={data.legacy_documents} />
        </div>
      )}

      {form && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-ink-900">
            {form.id ? "Edit Document" : "New Document"}
          </h2>

          <form onSubmit={submit} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" htmlFor="doc-title">
                <Input
                  id="doc-title"
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  maxLength={200}
                />
              </Field>

              <Field label="Category" htmlFor="doc-category">
                <Input
                  id="doc-category"
                  type="text"
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value })
                  }
                  maxLength={100}
                />
              </Field>
            </div>

            <Field label="Text" htmlFor="doc-text" required>
              <Textarea
                id="doc-text"
                value={form.text}
                onChange={(event) =>
                  setForm({ ...form, text: event.target.value })
                }
                rows={12}
                className="font-mono"
                placeholder="Paste the document content here..."
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

      {detail && (
        <Card className="space-y-3 p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-semibold text-ink-900">
              {displayName(detail)}
            </h2>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => setDetail(null)}
            >
              Close
            </Button>
          </div>

          <p className="text-xs text-ink-400">
            {detail.source} · {detail.chunk_count} chunk(s)
          </p>

          <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-2xl bg-mist p-4 text-sm text-ink-700">
            {detail.text}
          </pre>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-ink-500">
          <Spinner size="sm" className="text-brand-500" />
          Loading knowledge base...
        </div>
      ) : data ? (
        data.documents.length > 0 ? (
          <div className="overflow-x-auto rounded-4xl border border-line bg-white shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-ink-400">
                  <th className="px-4 py-3 font-medium">Document</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 text-right font-medium">Chunks</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.documents.map((doc) => (
                  <tr
                    key={doc.source}
                    className="border-b border-line align-top last:border-0"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-800">
                        {displayName(doc)}
                      </p>
                      <p className="text-xs text-ink-400">{doc.source}</p>
                    </td>

                    <td className="px-4 py-3 uppercase text-ink-500">
                      {doc.file_type ?? "—"}
                    </td>

                    <td className="px-4 py-3 text-right text-ink-600">
                      {doc.chunk_count}
                    </td>

                    <td className="px-4 py-3">
                      <Badge tone={doc.managed ? "brand" : "neutral"}>
                        {doc.managed ? "Managed" : "Read-only"}
                      </Badge>
                    </td>

                    <td className="px-4 py-3">
                      {doc.managed && doc.id ? (
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => view(doc)}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openEdit(doc)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => reprocess(doc)}
                            disabled={busy}
                          >
                            Reprocess
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => remove(doc)}
                            disabled={busy}
                          >
                            Delete
                          </Button>
                        </div>
                      ) : (
                        <p className="text-right text-xs text-ink-300">
                          Read-only
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No documents yet"
            description="Add one to get started."
            icon="📚"
          />
        )
      ) : null}
    </div>
  );
}
