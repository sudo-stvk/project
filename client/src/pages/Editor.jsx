import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useNavigate, useBlocker } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  Check,
  Link2,
  Archive,
  Trash2,
  Pin,
  Columns2,
  Eye,
  Code,
  Save,
  X,
} from "lucide-react";
import { useResource } from "../hooks/useResource";
import { useApp } from "../context/AppContext";
import { api } from "../services/api";
import {
  Loading,
  ErrorState,
  Confirm,
  Modal,
  relationLabel,
} from "../components/common/UI";
import Suggestions from "../components/notes/Suggestions";
import ConnectionDialog, {
  relations,
} from "../components/notes/ConnectionDialog";
import { createSaveQueue } from "../utils/saveQueue";
export default function Editor() {
  const { id } = useParams(),
    result = useResource(`/notes/${id}`);
  if (result.loading) return <Loading />;
  if (result.error)
    return <ErrorState error={result.error} retry={result.reload} />;
  return <NoteEditor key={id} initial={result.data.note} />;
}
function NoteEditor({ initial }) {
  const [draft, setDraft] = useState(initial),
    [tagText, setTagText] = useState(initial.tags.join(", ")),
    [mode, setMode] = useState("split"),
    [status, setStatus] = useState("All changes saved"),
    [connect, setConnect] = useState(false),
    [remove, setRemove] = useState(null);
  const { version, refresh, toast } = useApp(),
    detail = useResource(`/notes/${initial._id}`, version),
    navigate = useNavigate(),
    timer = useRef(null),
    bypass = useRef(false),
    mounted = useRef(true);
  const queue = useMemo(
    () =>
      createSaveQueue(
        (body) => api(`/notes/${initial._id}`, { method: "PATCH", body }),
        (text) => {
          if (mounted.current) setStatus(text);
        },
        refresh,
      ),
    [initial._id, refresh],
  );
  function edit(fields) {
    const next = { ...draft, ...fields };
    setDraft(next);
    queue.edit({
      title: next.title,
      content: next.content,
      tags: next.tags,
      color: next.color,
      isPinned: next.isPinned,
      isArchived: next.isArchived,
    });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => queue.flush().catch(() => {}), 750);
  }
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !bypass.current &&
      queue.dirty &&
      currentLocation.pathname !== nextLocation.pathname,
  );
  useEffect(() => {
    mounted.current = true;
    const prevent = (e) => {
      if (queue.dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", prevent);
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
      window.removeEventListener("beforeunload", prevent);
    };
  }, [queue]);
  async function save() {
    clearTimeout(timer.current);
    try {
      await queue.flush();
      return true;
    } catch (e) {
      toast(e.message, "error");
      return false;
    }
  }
  async function deleteNote() {
    if (!(await save())) throw new Error("Save failed. Retry before deleting.");
    await api(`/notes/${initial._id}`, { method: "DELETE" });
    bypass.current = true;
    refresh();
    navigate("/app/notes");
    toast("Note deleted.");
  }
  async function updateRelation(link, relationType) {
    try {
      await api(`/links/${link._id}`, {
        method: "PATCH",
        body: { relationType },
      });
      refresh();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  const renderLinks = (links, direction) =>
    links?.length ? (
      links.map((l) => (
        <div className="editor-link" key={l._id}>
          <Link to={`/app/notes/${l.note?._id}`}>
            <span>{direction === "in" ? "↙" : "↗"}</span>
            {l.note?.title || "Note"}
          </Link>
          <div>
            <select
              aria-label={`Relationship to ${l.note?.title}`}
              value={l.relationType}
              onChange={(e) => updateRelation(l, e.target.value)}
            >
              {relations.map((r) => (
                <option value={r} key={r}>
                  {relationLabel(r)}
                </option>
              ))}
            </select>
            <button
              className="icon-button"
              aria-label={`Remove connection to ${l.note?.title}`}
              onClick={() => setRemove({ type: "link", id: l._id })}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ))
    ) : (
      <p className="muted">
        No {direction === "in" ? "backlinks" : "outgoing connections"} yet.
      </p>
    );
  return (
    <div className="editor-page">
      <div className="editor-top">
        <Link className="text-link" to="/app/notes">
          <ArrowLeft size={16} />
          All notes
        </Link>
        <span
          className={`save-status ${status.startsWith("Save failed") ? "error" : ""}`}
          role="status"
        >
          {status === "All changes saved" && <Check size={14} />} {status}
        </span>
        <button
          className="icon-button"
          title="Save now"
          aria-label="Save now"
          onClick={save}
        >
          <Save size={17} />
        </button>
        <button
          className={`icon-button ${draft.isPinned ? "active" : ""}`}
          aria-label={draft.isPinned ? "Unpin note" : "Pin note"}
          onClick={() => edit({ isPinned: !draft.isPinned })}
        >
          <Pin size={17} />
        </button>
        <button
          className="icon-button"
          aria-label={draft.isArchived ? "Unarchive note" : "Archive note"}
          onClick={() => edit({ isArchived: !draft.isArchived })}
        >
          <Archive size={17} />
        </button>
        <button
          className="icon-button"
          aria-label="Delete note"
          onClick={() => setRemove({ type: "note" })}
        >
          <Trash2 size={17} />
        </button>
      </div>
      {status.startsWith("Save failed") && (
        <div className="save-error" role="alert">
          Your text is still here. <button onClick={save}>Retry saving</button>
        </div>
      )}
      <div className="editor-title-row">
        <span className="note-color-dot" style={{ background: draft.color }} />
        <input
          className="editor-title"
          aria-label="Note title"
          value={draft.title}
          maxLength={200}
          onChange={(e) => edit({ title: e.target.value })}
        />
      </div>
      <div className="editor-meta">
        <label className="tag-edit">
          Tags
          <input
            aria-label="Note tags separated by commas"
            placeholder="Add tags, separated by commas"
            maxLength={819}
            value={tagText}
            onChange={(e) => {
              setTagText(e.target.value);
              edit({
                tags: [
                  ...new Set(
                    e.target.value
                      .split(",")
                      .map((t) => t.trim().toLowerCase())
                      .filter(Boolean),
                  ),
                ],
              });
            }}
          />
        </label>
        <label className="color-edit">
          Color
          <input
            type="color"
            value={draft.color}
            onChange={(e) => edit({ color: e.target.value })}
          />
        </label>
        {draft.isArchived && <span className="badge">Archived</span>}
      </div>
      <div className="editor-layout">
        <div className="editor-writing">
          <div className="editor-toolbar">
            <span className="eyebrow">A PLACE TO THINK</span>
            <div className="segmented">
              {[
                ["write", Code, "Write"],
                ["split", Columns2, "Split"],
                ["preview", Eye, "Preview"],
              ].map(([value, Icon, label]) => (
                <button
                  key={value}
                  className={mode === value ? "active" : ""}
                  onClick={() => setMode(value)}
                >
                  <Icon size={15} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className={`markdown-workspace mode-${mode}`}>
            {mode !== "preview" && (
              <textarea
                className="markdown-input"
                aria-label="Markdown content"
                maxLength={100000}
                value={draft.content}
                placeholder={
                  "Let the thought unfold…\n\nUse # for headings, **bold** for emphasis, and - for lists."
                }
                onChange={(e) => edit({ content: e.target.value })}
              />
            )}{" "}
            {mode !== "write" && (
              <article className="markdown-preview">
                <ReactMarkdown>
                  {draft.content || "*Your words will take shape here.*"}
                </ReactMarkdown>
              </article>
            )}
          </div>
          <div className="editor-footnote">
            <span>Markdown supported</span>
            <span>
              {draft.content.trim()
                ? draft.content.trim().split(/\s+/).length
                : 0}{" "}
              words · {draft.content.length.toLocaleString()} characters
            </span>
          </div>
        </div>
        <aside className="editor-connections">
          <div className="section-heading">
            <h3>Connections</h3>
            <button
              className="icon-button"
              aria-label="Create connection"
              onClick={() => setConnect(true)}
            >
              <Link2 size={18} />
            </button>
          </div>
          <h4>OUTGOING</h4>
          {renderLinks(detail.data?.outgoing, "out")}
          <h4>BACKLINKS</h4>
          {renderLinks(detail.data?.backlinks, "in")}
          {detail.error && <p className="form-error">{detail.error}</p>}
          <div className="editor-suggestions">
            <h3>Discover a connection</h3>
            <p className="muted">Suggested, never added automatically.</p>
            <Suggestions noteId={initial._id} compact />
          </div>
        </aside>
      </div>
      {connect && (
        <ConnectionDialog source={draft} onClose={() => setConnect(false)} />
      )}{" "}
      {remove && (
        <Confirm
          title={
            remove.type === "note"
              ? "Delete this thought?"
              : "Remove this connection?"
          }
          onClose={() => setRemove(null)}
          onConfirm={async () => {
            if (remove.type === "note") await deleteNote();
            else {
              await api(`/links/${remove.id}`, { method: "DELETE" });
              refresh();
            }
          }}
        >
          {remove.type === "note"
            ? "The note and all its connections will be permanently deleted."
            : "Both notes will remain in your library."}
        </Confirm>
      )}
      {blocker.state === "blocked" && (
        <Modal
          title="Keep your latest thoughts?"
          onClose={() => blocker.reset()}
        >
          <p>
            Your latest changes haven’t been saved yet. Save them before
            leaving.
          </p>
          <div className="modal-actions">
            <button className="button" onClick={() => blocker.reset()}>
              Keep editing
            </button>
            <button
              className="button primary"
              onClick={async () => {
                if (await save()) blocker.proceed();
              }}
            >
              Save & leave
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
