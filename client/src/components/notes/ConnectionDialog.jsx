import { useState } from "react";
import { Modal, relationLabel } from "../common/UI";
import { useResource, useDebounce } from "../../hooks/useResource";
import { api, query } from "../../services/api";
import { useApp } from "../../context/AppContext";
export const relations = ["relates_to", "supports", "extends", "contradicts"];
export default function ConnectionDialog({ source, onClose, onDone }) {
  const [search, setSearch] = useState(""),
    [target, setTarget] = useState(""),
    [type, setType] = useState("relates_to"),
    [label, setLabel] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const term = useDebounce(search),
    result = useResource(
      `/notes?${query({ search: term, limit: 250, archived: "false" })}`,
    ),
    { refresh, toast } = useApp();
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/links", {
        method: "POST",
        body: {
          sourceNote: source._id || source.id,
          targetNote: target,
          relationType: type,
          label,
        },
      });
      refresh();
      toast("Ideas connected.");
      onDone?.();
      onClose();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }
  return (
    <Modal title="Connect the dots" onClose={() => !busy && onClose()}>
      <p>
        From <strong>{source.title}</strong> to a related idea.
      </p>
      <form onSubmit={submit}>
        <label>
          Find a note
          <input
            placeholder="Search all saved notes…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setTarget("");
            }}
          />
        </label>
        <label>
          Connect to
          <select
            value={target}
            required
            onChange={(e) => setTarget(e.target.value)}
          >
            <option value="">
              {result.loading ? "Loading…" : "Choose a note"}
            </option>
            {result.data?.notes
              .filter((n) => n._id !== (source._id || source.id))
              .map((n) => (
                <option value={n._id} key={n._id}>
                  {n.title}
                </option>
              ))}
          </select>
        </label>
        <label>
          Relationship
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {relations.map((r) => (
              <option key={r} value={r}>
                {relationLabel(r)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Label <span className="muted">(optional)</span>
          <input
            maxLength={100}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Why do these ideas connect?"
          />
        </label>
        {(error || result.error) && (
          <p className="form-error" role="alert">
            {error || result.error}
          </p>
        )}
        <button className="button primary full" disabled={!target || busy}>
          {busy ? "Connecting…" : "Create connection"}
        </button>
      </form>
    </Modal>
  );
}
