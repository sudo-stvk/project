import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  Search,
  Plus,
  Minus,
  Maximize,
  RotateCcw,
  Link2,
  Pin,
  X,
  ArrowUpRight,
  Route,
  Network,
  Trash2,
} from "lucide-react";
import KnowledgeGraph from "../components/graph/KnowledgeGraph";
import { useApp } from "../context/AppContext";
import { useResource, useDebounce } from "../hooks/useResource";
import { api, query } from "../services/api";
import { mergeLayout } from "../utils/layout";
import {
  Empty,
  ErrorState,
  Loading,
  SeedButton,
  Confirm,
  relationLabel,
} from "../components/common/UI";
import ConnectionDialog from "../components/notes/ConnectionDialog";
export default function Graph() {
  const { user, version, refresh, toast } = useApp(),
    { onCreate } = useOutletContext();
  const [search, setSearch] = useState(""),
    [tag, setTag] = useState(""),
    [archived, setArchived] = useState(false),
    [selected, setSelected] = useState(null),
    [connect, setConnect] = useState(false),
    [target, setTarget] = useState(""),
    [path, setPath] = useState([]),
    [pathMessage, setPathMessage] = useState(""),
    [confirm, setConfirm] = useState(null),
    [pinned, setPinned] = useState(false),
    [layoutStatus, setLayoutStatus] = useState("Layout saved");
  const term = useDebounce(search),
    resource = useResource(
      `/graph?${query({ search: term, tag, archived: archived ? "all" : "false" })}`,
      version,
    ),
    layout = useResource("/graph/layout"),
    overview = useResource("/analytics/overview", version);
  const detail = useResource(selected ? `/notes/${selected}` : null, version),
    graph = useRef(null),
    saveTimer = useRef(null),
    pending = useRef(null),
    localLayout = useRef(null),
    saving = useRef(false);
  const effectiveLayout = useMemo(
    () => localLayout.current || layout.data,
    [layout.data, resource.data],
  );
  const flush = useCallback(async () => {
    if (saving.current || !pending.current) return;
    saving.current = true;
    while (pending.current) {
      const value = {
        ...pending.current,
        positions: pending.current.positions.slice(0, 250),
      };
      pending.current =
        pending.current.positions.length > 250
          ? {
              ...pending.current,
              positions: pending.current.positions.slice(250),
            }
          : null;
      try {
        await api("/graph/layout", { method: "PUT", body: value });
      } catch (e) {
        pending.current = mergeLayout(value, pending.current || {});
        setLayoutStatus("Layout not saved — retry");
        toast(e.message, "error");
        saving.current = false;
        return;
      }
    }
    setLayoutStatus("Layout saved");
    saving.current = false;
  }, [toast]);
  const save = useCallback(
    (value) => {
      localLayout.current = mergeLayout(
        localLayout.current || layout.data,
        value,
      );
      pending.current = mergeLayout(pending.current, value);
      setLayoutStatus("Saving layout…");
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(flush, 700);
    },
    [flush, layout.data],
  );
  useEffect(
    () => () => {
      clearTimeout(saveTimer.current);
      flush();
    },
    [flush],
  );
  useEffect(() => {
    setPath([]);
    setPathMessage("");
    setTarget("");
  }, [selected, tag, term, archived, version]);
  useEffect(() => {
    setPinned(
      !!(localLayout.current || layout.data)?.positions.find(
        (p) => p.noteId === selected,
      )?.pinned,
    );
  }, [selected, layout.data]);
  useEffect(() => {
    if (
      selected &&
      resource.data &&
      !resource.data.nodes.some((n) => n.id === selected)
    )
      setSelected(null);
  }, [resource.data, selected]);
  const node = resource.data?.nodes.find((n) => n.id === selected);
  async function findPath() {
    try {
      const data = await api(`/graph/path?from=${selected}&to=${target}`);
      setPath(data.path);
      setPathMessage(
        data.path.length
          ? `${data.path.length - 1} ${data.path.length === 2 ? "connection" : "connections"} on the shortest path`
          : "These notes are not connected yet.",
      );
    } catch (e) {
      toast(e.message, "error");
    }
  }
  async function reset() {
    clearTimeout(saveTimer.current);
    await flush();
    if (pending.current || saving.current)
      throw new Error("Wait for layout saves to finish, then retry.");
    await api("/graph/layout", {
      method: "PUT",
      body: { reset: true, viewport: { x: 0, y: 0, zoom: 1 } },
    });
    localLayout.current = null;
    layout.reload();
    setPinned(false);
  }
  return (
    <div className="graph-workspace">
      <div className="graph-header">
        <div>
          <div className="eyebrow">YOUR MIND, CONNECTED</div>
          <h1>
            Knowledge graph
            <span className="badge">{resource.data?.total ?? "…"} notes</span>
          </h1>
        </div>
        <button className="button primary" onClick={onCreate}>
          <Plus size={16} />
          New note
        </button>
      </div>
      <div className="graph-filters">
        <div className="search-field">
          <Search size={16} />
          <input
            aria-label="Filter graph by search"
            placeholder="Find an idea in your graph…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            title="Search saved notes; press Enter to focus the first result"
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !resource.loading &&
                resource.data?.nodes.length
              )
                graph.current?.focus(resource.data.nodes[0].id);
            }}
          />
          {search && (
            <button
              className="icon-button"
              aria-label="Clear graph search"
              onClick={() => setSearch("")}
            >
              <X size={15} />
            </button>
          )}
        </div>
        <input
          aria-label="Filter graph by tag"
          className="tag-filter"
          list="graph-topics"
          placeholder="All topics"
          maxLength={40}
          value={tag}
          onChange={(e) => setTag(e.target.value)}
        />
        <datalist id="graph-topics">
          {overview.data?.topTags.map((t) => (
            <option key={t._id} value={t._id}>
              {t._id}
            </option>
          ))}
        </datalist>
        <label className="check-label">
          <input
            type="checkbox"
            checked={archived}
            onChange={(e) => setArchived(e.target.checked)}
          />
          Include archived
        </label>
      </div>
      <div className="graph-stage">
        <div className="graph-watermark">THE BIGGER PICTURE</div>
        {resource.loading || layout.loading ? (
          <Loading />
        ) : resource.error || layout.error ? (
          <ErrorState
            error={resource.error || layout.error}
            retry={() => {
              resource.reload();
              layout.reload();
            }}
          />
        ) : !resource.data.nodes.length ? (
          <Empty
            title={
              search || tag
                ? "No ideas match this view."
                : "Every connection starts with an idea."
            }
            description="Create a note or load a small collection to explore your first graph."
          >
            <div className="button-row">
              <button className="button primary" onClick={onCreate}>
                Create a note
              </button>
              <SeedButton />
            </div>
          </Empty>
        ) : (
          <KnowledgeGraph
            ref={graph}
            data={resource.data}
            layout={effectiveLayout}
            selected={selected}
            onSelect={setSelected}
            onSave={save}
            path={path}
            labels={user.settings.nodeLabels}
            reducedMotion={
              user.settings.reducedMotion ||
              user.settings.animationIntensity === "off" ||
              window.matchMedia("(prefers-reduced-motion: reduce)").matches
            }
          />
        )}
        {resource.data?.truncated && (
          <div className="graph-notice">
            Showing 250 of {resource.data.total} notes. Search or filter by
            topic to explore the rest.
          </div>
        )}
        <div className="graph-legend">
          <span>
            <i style={{ background: "#A78BFA" }} />
            Ideas
          </span>
          <span>
            <i style={{ background: "#22D3EE" }} />
            Connections
          </span>
          <span className="muted">Node size reflects connections</span>
        </div>
        <div className="graph-help">
          Drag to arrange · Scroll to zoom · Select to explore
        </div>
        <div className="graph-dock" aria-label="Graph controls">
          <button
            aria-label="Zoom in"
            title="Zoom in"
            onClick={() => graph.current?.zoom(1.25)}
          >
            <Plus size={19} />
          </button>
          <button
            aria-label="Zoom out"
            title="Zoom out"
            onClick={() => graph.current?.zoom(0.8)}
          >
            <Minus size={19} />
          </button>
          <span />
          <button
            aria-label="Fit graph"
            title="Fit graph"
            onClick={() => graph.current?.fit()}
          >
            <Maximize size={18} />
          </button>
          <button
            aria-label="Reset layout"
            title="Reset layout"
            onClick={() => setConfirm({ kind: "reset" })}
          >
            <RotateCcw size={18} />
          </button>
          <span />
          <button
            aria-label="Create note"
            title="Create note"
            onClick={onCreate}
          >
            <Plus size={19} />
          </button>
          <button
            aria-label="Connect selected note"
            title="Connect selected note"
            disabled={!node}
            onClick={() => setConnect(true)}
          >
            <Link2 size={19} />
          </button>
        </div>
        <button className="layout-status" onClick={flush}>
          {layoutStatus === "Layout saved" && <span className="online-dot" />}
          {layoutStatus}
        </button>
      </div>
      {node && (
        <aside className="inspector">
          <div className="section-heading">
            <span className="eyebrow">NOTE INSPECTOR</span>
            <button
              className="icon-button"
              aria-label="Close inspector"
              onClick={() => setSelected(null)}
            >
              <X size={18} />
            </button>
          </div>
          <div className="inspector-orb" style={{ "--note-color": node.color }}>
            <Network size={30} />
          </div>
          <h2>{node.title}</h2>
          <div className="tags">
            {node.tags.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTag(t);
                  setSelected(null);
                }}
              >
                #{t}
              </button>
            ))}
          </div>
          <p className="inspector-snippet">
            {detail.data?.note.content.replace(/[#*>`]/g, "").slice(0, 210) ||
              "An idea waiting to take shape."}
          </p>
          <Link className="button primary full" to={`/app/notes/${node.id}`}>
            Open note
            <ArrowUpRight size={16} />
          </Link>
          <div className="button-row">
            <button className="button" onClick={() => setConnect(true)}>
              <Link2 size={15} />
              Connect
            </button>
            <button
              className="button"
              onClick={() => setPinned(graph.current?.togglePin(node.id))}
            >
              <Pin size={15} />
              {pinned ? "Unpin" : "Pin position"}
            </button>
          </div>
          <div className="inspector-section">
            <div className="section-heading">
              <h3>Connections</h3>
              <span className="badge">{node.degree}</span>
            </div>
            {detail.error && <p className="form-error">{detail.error}</p>}
            {[
              ...(detail.data?.outgoing || []),
              ...(detail.data?.backlinks || []),
            ].map((l) => (
              <div className="connection-item" key={l._id}>
                <button
                  onClick={() => graph.current?.focus(l.note?._id)}
                  disabled={
                    !resource.data.nodes.some((n) => n.id === l.note?._id)
                  }
                >
                  <strong>{l.note?.title}</strong>
                  <small>
                    {relationLabel(l.relationType)}
                    {l.label ? ` · ${l.label}` : ""}
                  </small>
                </button>
                <button
                  className="icon-button"
                  aria-label={`Remove connection to ${l.note?.title}`}
                  onClick={() => setConfirm({ kind: "link", id: l._id })}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {node.degree === 0 && (
              <p className="muted">
                This idea is on its own. Give it a connection.
              </p>
            )}
          </div>
          <div className="inspector-section">
            <h3>
              <Route size={16} />
              Find a path
            </h3>
            <select
              aria-label="Path destination"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="">Choose a destination</option>
              {resource.data.nodes
                .filter((n) => n.id !== selected)
                .map((n) => (
                  <option value={n.id} key={n.id}>
                    {n.title}
                  </option>
                ))}
            </select>
            <button
              className="button full"
              disabled={!target}
              onClick={findPath}
            >
              Trace shortest path
            </button>
            {pathMessage && (
              <p className="path-result" role="status">
                {pathMessage}
              </p>
            )}
            {path.length > 0 && (
              <ol className="path-steps">
                {path.map((id) => (
                  <li key={id}>
                    {resource.data.nodes.find((n) => n.id === id)?.title ||
                      "Note outside current view"}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </aside>
      )}
      {connect && node && (
        <ConnectionDialog source={node} onClose={() => setConnect(false)} />
      )}{" "}
      {confirm && (
        <Confirm
          title={
            confirm.kind === "reset"
              ? "Reset your graph layout?"
              : "Remove this connection?"
          }
          confirmLabel={confirm.kind === "reset" ? "Reset layout" : "Remove"}
          onClose={() => setConfirm(null)}
          onConfirm={async () => {
            if (confirm.kind === "reset") await reset();
            else {
              await api(`/links/${confirm.id}`, { method: "DELETE" });
              refresh();
            }
          }}
        >
          {confirm.kind === "reset"
            ? "This clears all saved positions and lets the graph arrange itself again."
            : "Your notes will stay. Only this relationship will be removed."}
        </Confirm>
      )}
    </div>
  );
}
