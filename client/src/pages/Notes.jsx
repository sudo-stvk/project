import { useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import {
  Search,
  LayoutGrid,
  List,
  Pin,
  Archive,
  Trash2,
  Link2,
  FileText,
  ArrowUpRight,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { useResource, useDebounce } from "../hooks/useResource";
import { api, query } from "../services/api";
import {
  PageHeading,
  CreateButton,
  Empty,
  Loading,
  ErrorState,
  Confirm,
  date,
} from "../components/common/UI";
import SpotlightCard from "../components/reactbits/SpotlightCard";
export default function Notes() {
  const { version, refresh, toast } = useApp(),
    { onCreate } = useOutletContext(),
    [params] = useSearchParams();
  const [search, setSearch] = useState(""),
    [tag, setTag] = useState(params.get("tag") || ""),
    [archived, setArchived] = useState("false"),
    [pinned, setPinned] = useState(false),
    [sort, setSort] = useState("recent"),
    [view, setView] = useState("grid"),
    [page, setPage] = useState(1),
    [remove, setRemove] = useState(null);
  const term = useDebounce(search),
    result = useResource(
      `/notes?${query({ search: term, tag, archived, pinned: pinned ? "true" : undefined, sort, page, limit: 24 })}`,
      version,
    ),
    stats = useResource("/analytics/overview", version);
  async function patch(note, body) {
    try {
      await api(`/notes/${note._id}`, { method: "PATCH", body });
      refresh();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  const filter = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };
  return (
    <>
      <PageHeading
        eyebrow="COLLECT. REFLECT. CONNECT."
        title="Your library of thoughts."
        description={`${result.data?.total ?? "…"} notes. One endlessly curious mind.`}
      >
        <CreateButton onClick={onCreate} />
      </PageHeading>
      <div className="library-toolbar">
        <div className="search-field">
          <Search size={17} />
          <input
            aria-label="Search notes"
            placeholder="Search notes, content, tags…"
            value={search}
            onChange={filter(setSearch)}
          />
        </div>
        <input
          className="tag-filter"
          list="all-tags"
          aria-label="Filter by tag"
          placeholder="All tags"
          value={tag}
          onChange={filter(setTag)}
        />
        <datalist id="all-tags">
          {stats.data?.topTags.map((t) => (
            <option key={t._id} value={t._id} />
          ))}
        </datalist>
        <select
          aria-label="Archive filter"
          value={archived}
          onChange={filter(setArchived)}
        >
          <option value="false">Active notes</option>
          <option value="true">Archived</option>
          <option value="all">All notes</option>
        </select>
        <select aria-label="Sort notes" value={sort} onChange={filter(setSort)}>
          <option value="recent">Recently edited</option>
          <option value="title">Title A–Z</option>
          <option value="relevance">Search relevance</option>
        </select>
        <button
          className={`icon-button ${pinned ? "active" : ""}`}
          aria-label="Show only pinned notes"
          aria-pressed={pinned}
          onClick={() => {
            setPinned((p) => !p);
            setPage(1);
          }}
        >
          <Pin size={17} />
        </button>
        <div className="segmented">
          <button
            className={view === "grid" ? "active" : ""}
            aria-label="Grid view"
            onClick={() => setView("grid")}
          >
            <LayoutGrid size={17} />
          </button>
          <button
            className={view === "list" ? "active" : ""}
            aria-label="List view"
            onClick={() => setView("list")}
          >
            <List size={17} />
          </button>
        </div>
      </div>
      {result.loading ? (
        <Loading />
      ) : result.error ? (
        <ErrorState error={result.error} retry={result.reload} />
      ) : result.data.notes.length ? (
        <>
          <div className={`notes-${view}`}>
            {result.data.notes.map((note) => (
              <SpotlightCard
                key={note._id}
                className="note-card"
                spotlightColor={note.color}
                intensity={0.06}
              >
                <div className="note-card-top">
                  <span className="note-symbol" style={{ color: note.color }}>
                    <FileText size={20} />
                  </span>
                  <div className="note-card-actions">
                    <button
                      className={`icon-button ${note.isPinned ? "active" : ""}`}
                      title={note.isPinned ? "Unpin note" : "Pin note"}
                      aria-label={`${note.isPinned ? "Unpin" : "Pin"} ${note.title}`}
                      onClick={() => patch(note, { isPinned: !note.isPinned })}
                    >
                      <Pin size={15} />
                    </button>
                    <button
                      className="icon-button"
                      title={note.isArchived ? "Unarchive" : "Archive"}
                      aria-label={`${note.isArchived ? "Unarchive" : "Archive"} ${note.title}`}
                      onClick={() =>
                        patch(note, { isArchived: !note.isArchived })
                      }
                    >
                      <Archive size={15} />
                    </button>
                    <button
                      className="icon-button"
                      title="Delete note"
                      aria-label={`Delete ${note.title}`}
                      onClick={() => setRemove(note)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <Link
                  className="note-card-content"
                  to={`/app/notes/${note._id}`}
                >
                  <h2>
                    {note.title}
                    <ArrowUpRight size={16} />
                  </h2>
                  <p>
                    {note.content.replace(/[#*>`]/g, "").slice(0, 155) ||
                      "A blank page. An open possibility."}
                  </p>
                </Link>
                <div className="tags">
                  {note.tags.slice(0, 4).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTag(t);
                        setPage(1);
                      }}
                    >
                      #{t}
                    </button>
                  ))}
                </div>
                <div className="note-card-footer">
                  <span>{date(note.updatedAt)}</span>
                  <span>
                    <Link2 size={13} />
                    {note.connectionCount} connections
                  </span>
                  <input
                    type="color"
                    aria-label={`Color for ${note.title}`}
                    value={note.color}
                    onChange={(e) => patch(note, { color: e.target.value })}
                  />
                </div>
              </SpotlightCard>
            ))}
          </div>
          <div className="pagination">
            <button
              className="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <span>
              Page {page} of {result.data.pages}
            </span>
            <button
              className="button"
              disabled={page >= result.data.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <Empty
          title={
            search || tag || pinned
              ? "No thoughts match this filter."
              : "Make space for your first idea."
          }
          description="Try a different search, or start something new."
        >
          <CreateButton onClick={onCreate} />
        </Empty>
      )}
      {remove && (
        <Confirm
          title={`Delete “${remove.title}”?`}
          onClose={() => setRemove(null)}
          onConfirm={async () => {
            await api(`/notes/${remove._id}`, { method: "DELETE" });
            refresh();
            toast("Note and its connections deleted.");
          }}
        >
          This permanently deletes the note, its relationships, and its saved
          graph position.
        </Confirm>
      )}
    </>
  );
}
