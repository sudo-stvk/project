import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Orbit, Network, Search } from "lucide-react";
import { useResource, useDebounce } from "../hooks/useResource";
import { useApp } from "../context/AppContext";
import {
  PageHeading,
  Loading,
  ErrorState,
  Empty,
  SeedButton,
} from "../components/common/UI";
import Suggestions from "../components/notes/Suggestions";
export default function Discover() {
  const { version } = useApp(),
    [selected, setSelected] = useState(""),
    [search, setSearch] = useState(""),
    term = useDebounce(search);
  const notes = useResource(
      `/notes?limit=250&archived=false&search=${encodeURIComponent(term)}`,
      version,
    ),
    stats = useResource("/analytics/overview", version);
  const noteId = selected || notes.data?.notes[0]?._id;
  if (stats.loading) return <Loading />;
  if (stats.error)
    return <ErrorState error={stats.error} retry={stats.reload} />;
  return (
    <>
      <PageHeading
        eyebrow="CURIOSITY FINDS A WAY"
        title="The ideas between your ideas."
        description="Find common threads you may not have noticed."
      />
      <div className="discovery-banner">
        <Sparkles size={28} />
        <div>
          <h2>Sometimes, the connection is the idea.</h2>
          <p>
            NEURON compares shared tags, title keywords, and text patterns. You
            decide which connections matter.
          </p>
        </div>
        <span className="badge">Local · Explainable</span>
      </div>
      {!stats.data.totalNotes ? (
        <Empty
          title="Give curiosity something to work with."
          description="Add notes or explore a Demo Brain to start finding common threads."
        >
          <SeedButton />
        </Empty>
      ) : (
        <div className="discover-grid">
          <section className="panel">
            <div className="section-heading">
              <h2>Suggested connections</h2>
              <Sparkles size={18} />
            </div>
            <label>
              Start with a thought
              <div className="search-field">
                <Search size={16} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search all your notes…"
                />
              </div>
              <select
                value={noteId || ""}
                onChange={(e) => setSelected(e.target.value)}
              >
                {notes.data?.notes.map((n) => (
                  <option key={n._id} value={n._id}>
                    {n.title}
                  </option>
                ))}
              </select>
            </label>
            {notes.error && (
              <p role="alert" className="form-error">
                {notes.error}
              </p>
            )}
            <Suggestions key={noteId} noteId={noteId} />
            <div className="algorithm-note">
              45% tag overlap · 35% TF-IDF cosine · 20% title overlap
              <br />
              Suggestions are word and tag matches, not conceptual
              understanding.
            </div>
          </section>
          <div className="discover-side">
            <section className="panel">
              <h2>
                <Orbit size={19} />
                On their own
              </h2>
              <p className="muted">
                A few ideas waiting for their first connection.
              </p>
              {stats.data.unconnected.length ? (
                stats.data.unconnected.map((n) => (
                  <Link
                    className="discovery-note"
                    to={`/app/notes/${n._id}`}
                    key={n._id}
                  >
                    <i style={{ background: n.color }} />
                    {n.title}
                    <span>↗</span>
                  </Link>
                ))
              ) : (
                <p className="muted">Every note has a connection.</p>
              )}
            </section>
            <section className="panel">
              <h2>
                <Network size={19} />
                Centers of gravity
              </h2>
              <p className="muted">Your most connected concepts.</p>
              {stats.data.mostConnected.map((n) => (
                <Link
                  className="discovery-note"
                  to={`/app/notes/${n._id}`}
                  key={n._id}
                >
                  <i style={{ background: n.color }} />
                  {n.title}
                  <span>{n.degree}</span>
                </Link>
              ))}
            </section>
          </div>
        </div>
      )}
      <section className="panel shared-topics">
        <h2>Shared territory</h2>
        <p className="muted">Explore notes that share a tag.</p>
        <div className="topic-strip">
          {stats.data.topTags.map((t) => (
            <Link
              key={t._id}
              to={`/app/notes?tag=${encodeURIComponent(t._id)}`}
            >
              #{t._id}
              <span>{t.count} notes</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
