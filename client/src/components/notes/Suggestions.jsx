import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, X, Sparkles } from "lucide-react";
import { useResource } from "../../hooks/useResource";
import { useApp } from "../../context/AppContext";
import { api } from "../../services/api";
export default function Suggestions({ noteId, compact = false }) {
  const { version, refresh, toast } = useApp(),
    result = useResource(noteId ? `/recommendations/${noteId}` : null, version),
    [dismissed, setDismissed] = useState([]),
    [busy, setBusy] = useState("");
  async function connect(id) {
    setBusy(id);
    try {
      await api("/links", {
        method: "POST",
        body: {
          sourceNote: noteId,
          targetNote: id,
          relationType: "relates_to",
        },
      });
      refresh();
      toast("Connection added to your graph.");
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setBusy("");
    }
  }
  const suggestions =
    result.data?.suggestions
      .filter((s) => !dismissed.includes(`${noteId}:${s.noteId}`))
      .slice(0, compact ? 3 : 8) || [];
  if (!noteId)
    return <p className="muted">Choose a note to find related ideas.</p>;
  return (
    <div className="suggestions">
      {result.loading ? (
        <p className="muted">Finding common threads…</p>
      ) : result.error ? (
        <p role="alert" className="form-error">
          {result.error}
        </p>
      ) : suggestions.length ? (
        suggestions.map((s) => (
          <div className="suggestion" key={s.noteId}>
            <div className="suggestion-symbol" style={{ color: s.color }}>
              <Sparkles size={19} />
            </div>
            <div>
              <Link to={`/app/notes/${s.noteId}`}>
                <strong>{s.title}</strong>
              </Link>
              <small>{s.reasons.join(" · ")}</small>
              <span className="match-score">
                {Math.round(s.score * 100)}% similarity
              </span>
            </div>
            <button
              className="icon-button"
              disabled={!!busy}
              aria-label={`Connect ${s.title}`}
              title="Accept connection"
              onClick={() => connect(s.noteId)}
            >
              <Plus size={18} />
            </button>
            {!compact && (
              <button
                className="icon-button"
                aria-label={`Dismiss ${s.title}`}
                onClick={() =>
                  setDismissed((d) => [...d, `${noteId}:${s.noteId}`])
                }
              >
                <X size={15} />
              </button>
            )}
          </div>
        ))
      ) : (
        <p className="muted">
          No new matches yet. Add notes with shared tags or vocabulary to find
          more connections.
        </p>
      )}
    </div>
  );
}
