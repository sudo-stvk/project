import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowUpRight, FileText, Command } from "lucide-react";
import { Modal } from "../common/UI";
import { useResource, useDebounce } from "../../hooks/useResource";
export default function CommandPalette({ onClose, onCreate }) {
  const [text, setText] = useState(""),
    [active, setActive] = useState(0),
    term = useDebounce(text),
    navigate = useNavigate(),
    list = useRef(null);
  const result = useResource(
    term.trim() ? `/search?q=${encodeURIComponent(term)}&limit=10` : null,
  );
  const commands = [
    { title: "Create Note", action: onCreate },
    { title: "Open Knowledge Graph", to: "/app/graph" },
    { title: "Go to Dashboard", to: "/app" },
    { title: "Browse Notes", to: "/app/notes" },
    { title: "Discover Connections", to: "/app/discover" },
  ].filter((c) => !text || c.title.toLowerCase().includes(text.toLowerCase()));
  const items = [
    ...commands,
    ...(result.data?.notes || []).map((n) => ({
      title: n.title,
      to: `/app/notes/${n._id}`,
      note: true,
    })),
  ];
  function choose(item) {
    if (!item) return;
    onClose();
    item.action ? item.action() : navigate(item.to);
  }
  useEffect(() => {
    setActive(0);
  }, [text]);
  useEffect(() => {
    list.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);
  return (
    <Modal title="Find a thought. Follow a connection." onClose={onClose}>
      <div className="search-field">
        <Search size={18} />
        <input
          autoFocus
          aria-label="Search notes and commands"
          role="combobox"
          aria-controls="command-results"
          aria-expanded="true"
          aria-activedescendant={
            items[active] ? `command-${active}` : undefined
          }
          value={text}
          placeholder="Search your mind…"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) =>
                Math.max(
                  0,
                  Math.min(
                    items.length - 1,
                    a + (e.key === "ArrowDown" ? 1 : -1),
                  ),
                ),
              );
            }
            if (e.key === "Enter") {
              e.preventDefault();
              choose(items[active]);
            }
          }}
        />
        <kbd>ESC</kbd>
      </div>
      <div
        id="command-results"
        role="listbox"
        ref={list}
        className="command-results"
      >
        {items.map((item, i) => (
          <button
            id={`command-${i}`}
            key={item.to || item.title}
            role="option"
            aria-selected={i === active}
            className={i === active ? "selected" : ""}
            onClick={() => choose(item)}
          >
            {item.note ? <FileText size={17} /> : <Command size={17} />}
            <span>{item.title}</span>
            <ArrowUpRight size={16} />
          </button>
        ))}
        {result.loading && <p>Searching your saved notes…</p>}
        {result.error && <p role="alert">{result.error}</p>}
        {!result.loading && !items.length && <p>No matching thoughts yet.</p>}
      </div>
      <div className="command-footer">
        <span>↑ ↓ to navigate</span>
        <span>↵ to open</span>
        <span>esc to close</span>
      </div>
    </Modal>
  );
}
