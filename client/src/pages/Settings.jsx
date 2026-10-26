import { useState } from "react";
import {
  Download,
  LogOut,
  User,
  SlidersHorizontal,
  Database,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../services/api";
import { PageHeading, SeedButton } from "../components/common/UI";
export default function Settings() {
  const { user, setUser, logout, toast } = useApp(),
    [name, setName] = useState(user.name),
    [settings, setSettings] = useState(user.settings),
    [busy, setBusy] = useState(false);
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      setUser(
        await api("/auth/me", { method: "PATCH", body: { name, settings } }),
      );
      toast("Your preferences are saved.");
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setBusy(false);
    }
  }
  async function exportData() {
    try {
      const data = await api("/export"),
        url = URL.createObjectURL(
          new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
          }),
        );
      const a = document.createElement("a");
      a.href = url;
      a.download = `neuron-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast("Your knowledge export is ready.");
    } catch (e) {
      toast(e.message, "error");
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="MAKE YOURSELF AT HOME"
        title="Your space. Your rhythm."
        description="A workspace that feels like the way you think."
      />
      <form className="settings-form" onSubmit={save}>
        <section className="panel">
          <h2>
            <User size={19} />
            Your profile
          </h2>
          <label>
            Name
            <input
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            Email
            <input value={user.email} disabled />
          </label>
          <p className="muted">
            Your personal workspace is private to this account.
          </p>
        </section>
        <section className="panel">
          <h2>
            <SlidersHorizontal size={19} />
            Interface preferences
          </h2>
          <label>
            Animation intensity
            <select
              value={settings.animationIntensity}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  animationIntensity: e.target.value,
                }))
              }
            >
              <option value="off">Off — a still workspace</option>
              <option value="subtle">Subtle — just a little motion</option>
              <option value="full">Full — the immersive experience</option>
            </select>
          </label>
          <label className="setting-toggle">
            <span>
              <strong>Reduce motion</strong>
              <small>
                Keep transitions calm. System preferences are also respected.
              </small>
            </span>
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={(e) =>
                setSettings((s) => ({ ...s, reducedMotion: e.target.checked }))
              }
            />
          </label>
          <label className="setting-toggle">
            <span>
              <strong>Graph node labels</strong>
              <small>Show note titles beneath nodes.</small>
            </span>
            <input
              type="checkbox"
              checked={settings.nodeLabels}
              onChange={(e) =>
                setSettings((s) => ({ ...s, nodeLabels: e.target.checked }))
              }
            />
          </label>
        </section>
        <button className="button primary" disabled={busy}>
          {busy ? "Saving…" : "Save preferences"}
        </button>
      </form>
      <section className="panel data-settings">
        <h2>
          <Database size={19} />
          Your knowledge belongs to you.
        </h2>
        <p>
          Export your notes, relationships, and graph layout as a readable JSON
          file.
        </p>
        <div className="button-row">
          <button className="button" onClick={exportData}>
            <Download size={17} />
            Export your knowledge
          </button>
          <SeedButton />
        </div>
      </section>
      <button
        className="button danger"
        onClick={() => logout().catch((e) => toast(e.message, "error"))}
      >
        <LogOut size={17} />
        Sign out
      </button>
    </>
  );
}
