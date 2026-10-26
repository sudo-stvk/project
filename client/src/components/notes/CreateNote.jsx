import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "../common/UI";
import { api } from "../../services/api";
import { useApp } from "../../context/AppContext";
export default function CreateNote({ onClose }) {
  const [title, setTitle] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const navigate = useNavigate(),
    { refresh, toast } = useApp();
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const note = await api("/notes", { method: "POST", body: { title } });
      refresh();
      onClose();
      navigate(`/app/notes/${note._id}`);
      toast("A new thought, ready to grow.");
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }
  return (
    <Modal title="Start with a thought." onClose={() => !busy && onClose()}>
      <p>Give your idea a name. You can connect the dots later.</p>
      <form onSubmit={submit}>
        <label>
          Note title
          <input
            autoFocus
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What’s on your mind?"
          />
        </label>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button
            className="button"
            type="button"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button className="button primary" disabled={busy || !title.trim()}>
            {busy ? "Creating…" : "Create note"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
