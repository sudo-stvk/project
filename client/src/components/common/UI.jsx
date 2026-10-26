import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Network, X, Sparkles, Plus } from "lucide-react";
import { api } from "../../services/api";
import { useApp } from "../../context/AppContext";
export function Brand() {
  return (
    <Link className="brand" to="/">
      <img src="/neuron.svg" alt="" />
      NEURON
      <span className="brand-dot" />
    </Link>
  );
}
export function Loading() {
  return (
    <div className="skeletons" aria-label="Loading" role="status">
      <div />
      <div />
      <div />
      <span className="sr-only">Loading your knowledge…</span>
    </div>
  );
}
export function ErrorState({ error, retry }) {
  return (
    <div className="empty error-state" role="alert">
      <h3>Something interrupted the connection</h3>
      <p>{error}</p>
      {retry && (
        <button className="button" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}
export function Empty({
  title = "A little space for a big idea.",
  description = "Capture your first thought. The connections will follow.",
  children,
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Network size={30} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function PageHeading({ eyebrow, title, description, children }) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <div className="heading-actions">{children}</div>
    </div>
  );
}
export function Modal({ title, children, onClose }) {
  const ref = useRef(null),
    titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    dialog
      .querySelector('input:not([type="checkbox"]), textarea, select')
      ?.focus();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="modal"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="section-heading">
        <h2 id={titleId}>{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Confirm({
  title,
  children,
  onClose,
  onConfirm,
  confirmLabel = "Delete",
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={title} onClose={() => !busy && onClose()}>
      <p>{children}</p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="modal-actions">
        <button onClick={onClose} disabled={busy} className="button">
          Cancel
        </button>
        <button onClick={confirm} disabled={busy} className="button danger">
          {busy ? "Working…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
export function SeedButton() {
  const { refresh, toast } = useApp(),
    [busy, setBusy] = useState(false);
  async function seed() {
    setBusy(true);
    try {
      await api("/demo/seed", { method: "POST", body: {} });
      refresh();
      toast("Your Demo Brain is ready. Explore 20 connected ideas.");
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <button className="button" disabled={busy} onClick={seed}>
      <Sparkles size={16} />
      {busy ? "Connecting ideas…" : "Load Demo Brain"}
    </button>
  );
}
export function CreateButton({ onClick, small = false }) {
  return (
    <button className="button primary" onClick={onClick}>
      <Plus size={17} />
      {small ? "New note" : "Create a note"}
    </button>
  );
}
export function SectionLink({ to, children }) {
  return (
    <Link className="text-link" to={to}>
      {children}
      <ArrowUpRight size={15} />
    </Link>
  );
}
export const date = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
export const relationLabel = (value) => value.replaceAll("_", " ");
