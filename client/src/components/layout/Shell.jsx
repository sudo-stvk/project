import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Network,
  Files,
  Compass,
  Settings,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Sparkles,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Brand } from "../common/UI";
import CreateNote from "../notes/CreateNote";
import CommandPalette from "./CommandPalette";
const nav = [
  ["/app", LayoutDashboard, "Overview"],
  ["/app/graph", Network, "Knowledge graph"],
  ["/app/notes", Files, "All notes"],
  ["/app/discover", Compass, "Discover"],
];
export default function Shell() {
  const { user } = useApp(),
    location = useLocation();
  const [collapsed, setCollapsed] = useState(false),
    [create, setCreate] = useState(false),
    [palette, setPalette] = useState(false);
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  const title = location.pathname.includes("/graph")
    ? "Knowledge graph"
    : location.pathname.includes("/notes/")
      ? "Your workspace / Note"
      : nav.find((n) => n[0] === location.pathname)?.[2] || "Settings";
  return (
    <div className={`app-shell ${collapsed ? "collapsed" : ""}`}>
      <aside className="sidebar">
        <Brand />
        <button
          className="new-note-side"
          onClick={() => setCreate(true)}
          title="New note"
        >
          <Plus size={18} />
          <span>New note</span>
          <kbd>+</kbd>
        </button>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {nav.map(([to, Icon, label]) => (
            <NavLink key={to} to={to} end={to === "/app"} title={label}>
              <Icon size={19} />
              <span>{label}</span>
              {label === "Discover" && <span className="nav-dot" />}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="brain-tip">
            <Sparkles size={19} />
            <strong>
              A second brain.
              <br />A wider perspective.
            </strong>
            <p>Great ideas don’t live alone.</p>
          </div>
          <NavLink to="/app/settings" title="Settings">
            <Settings size={18} />
            <span>Settings & preferences</span>
          </NavLink>
          <Link
            className="profile-button"
            to="/app/settings"
            title="Account settings"
          >
            <span className="avatar">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
            <span>
              <strong>{user.name}</strong>
              <small>Personal workspace</small>
            </span>
            <Settings size={16} />
          </Link>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <button
            className="icon-button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? (
              <PanelLeftOpen size={19} />
            ) : (
              <PanelLeftClose size={19} />
            )}
          </button>
          <div className="breadcrumb">
            <span>Workspace</span>
            <span>/</span>
            <strong>{title}</strong>
          </div>
          <button className="top-search" onClick={() => setPalette(true)}>
            <Search size={16} />
            <span>Search your mind</span>
            <kbd>⌘ K</kbd>
          </button>
          <span className="online-dot" title="Personal workspace" />
          <span className="avatar small">
            {user.name.slice(0, 1).toUpperCase()}
          </span>
        </header>
        <main
          className={
            location.pathname === "/app/graph" ? "graph-main" : "page-content"
          }
        >
          <Outlet context={{ onCreate: () => setCreate(true) }} />
        </main>
      </div>
      {create && <CreateNote onClose={() => setCreate(false)} />}{" "}
      {palette && (
        <CommandPalette
          onClose={() => setPalette(false)}
          onCreate={() => setCreate(true)}
        />
      )}
    </div>
  );
}
