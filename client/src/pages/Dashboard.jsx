import { Link, useOutletContext } from "react-router-dom";
import {
  FileText,
  Link2,
  Network,
  Orbit,
  ArrowUpRight,
  Sparkles,
  Activity,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { useResource } from "../hooks/useResource";
import {
  PageHeading,
  CreateButton,
  SeedButton,
  Loading,
  ErrorState,
  SectionLink,
  date,
} from "../components/common/UI";
import SpotlightCard from "../components/reactbits/SpotlightCard";
import CountUp from "../components/reactbits/CountUp";
import KnowledgeGraph from "../components/graph/KnowledgeGraph";
import Suggestions from "../components/notes/Suggestions";
export default function Dashboard() {
  const { user, version } = useApp(),
    { onCreate } = useOutletContext(),
    stats = useResource("/analytics/overview", version),
    graph = useResource("/graph", version),
    activities = useResource("/activities", version);
  if (stats.loading) return <Loading />;
  if (stats.error)
    return <ErrorState error={stats.error} retry={stats.reload} />;
  const data = stats.data,
    animate =
      user.settings.animationIntensity !== "off" &&
      !user.settings.reducedMotion &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return (
    <div className="dashboard">
      <PageHeading
        eyebrow="A LITTLE CLARITY. A LOT OF POSSIBILITY."
        title={`Welcome back, ${user.name.split(" ")[0]}.`}
        description="A fresh perspective on everything you’ve been thinking about."
      >
        <CreateButton onClick={onCreate} />
      </PageHeading>
      <div className="stats-grid">
        {[
          [
            FileText,
            "Total notes",
            data.totalNotes,
            "Ideas worth keeping",
            "purple",
          ],
          [
            Link2,
            "Connections",
            data.totalEdges,
            "Threads between thoughts",
            "cyan",
          ],
          [
            Network,
            "Connected notes",
            data.connectedNotes,
            "Part of the bigger picture",
            "pink",
          ],
          [
            Orbit,
            "Unconnected notes",
            data.orphanedNotes,
            "Room for discovery",
            "orange",
          ],
        ].map(([Icon, label, value, caption, color]) => (
          <SpotlightCard
            key={label}
            className={`stat-card ${color}`}
            spotlightColor="#A78BFA"
            intensity={0.08}
          >
            <div className="stat-top">
              <span>{label}</span>
              <Icon size={18} />
            </div>
            <div className="stat-value">
              {animate ? <CountUp to={value} duration={0.8} /> : value}
            </div>
            <small>{caption}</small>
          </SpotlightCard>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="panel graph-preview-panel">
          <div className="section-heading">
            <div>
              <h2>Your neural landscape</h2>
              <p>Every idea has a place. Every connection, a possibility.</p>
            </div>
            <SectionLink to="/app/graph">Explore graph</SectionLink>
          </div>
          <div className="dashboard-graph">
            {graph.loading ? (
              <Loading />
            ) : graph.error ? (
              <ErrorState error={graph.error} retry={graph.reload} />
            ) : graph.data.nodes.length ? (
              <>
                <KnowledgeGraph
                  data={graph.data}
                  preview
                  reducedMotion={!animate}
                />
                <Link className="preview-open" to="/app/graph">
                  Step inside your mind
                  <ArrowUpRight size={17} />
                </Link>
              </>
            ) : (
              <div className="empty">
                <Network size={44} />
                <h3>Your next idea starts here.</h3>
                <p>
                  Try a connected collection of notes, or begin with your own.
                </p>
                <SeedButton />
              </div>
            )}
          </div>
          <div className="graph-preview-footer">
            <span>
              <i className="online-dot" /> {data.totalNotes} ideas in your
              universe
            </span>
            <span>Built one connection at a time</span>
          </div>
        </section>
        <section className="panel recent-notes">
          <div className="section-heading">
            <h2>Recently edited</h2>
            <SectionLink to="/app/notes">All notes</SectionLink>
          </div>
          {data.recentNotes.length ? (
            data.recentNotes.map((n) => (
              <Link
                to={`/app/notes/${n._id}`}
                className="recent-note"
                key={n._id}
              >
                <span className="note-symbol" style={{ color: n.color }}>
                  <FileText size={19} />
                </span>
                <div>
                  <strong>{n.title}</strong>
                  <small>
                    {n.tags
                      .slice(0, 2)
                      .map((t) => `#${t}`)
                      .join("  ") || "A thought in progress"}
                  </small>
                </div>
                <time>{date(n.updatedAt)}</time>
              </Link>
            ))
          ) : (
            <p className="muted">
              Your recently edited notes will appear here.
            </p>
          )}
          <button className="subtle-create" onClick={onCreate}>
            + Capture a thought
          </button>
        </section>
        <section className="panel">
          <div className="section-heading">
            <div className="inline-heading">
              <Sparkles size={18} />
              <h2>Unexpected connections</h2>
            </div>
            <SectionLink to="/app/discover">Discover</SectionLink>
          </div>
          {data.recentNotes[0] && (
            <p className="section-description">
              Common threads with <strong>{data.recentNotes[0].title}</strong>
            </p>
          )}
          <Suggestions noteId={data.recentNotes[0]?._id} compact />
        </section>
        <section className="panel">
          <div className="section-heading">
            <div className="inline-heading">
              <Activity size={18} />
              <h2>Your mind in motion</h2>
            </div>
            <span className="muted">Recent activity</span>
          </div>
          <div className="activity-list">
            {activities.error ? (
              <p className="form-error">{activities.error}</p>
            ) : activities.data?.length ? (
              activities.data.slice(0, 5).map((a) => (
                <div key={a._id}>
                  <span className="activity-dot" />
                  <p>
                    {a.action}
                    <small>
                      {date(a.createdAt)} ·{" "}
                      {new Date(a.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </p>
                </div>
              ))
            ) : (
              <p className="muted">
                A quiet start. Your activity will grow with your ideas.
              </p>
            )}
          </div>
        </section>
      </div>
      <section className="topic-strip">
        <span className="eyebrow">THINKING ABOUT</span>
        {data.topTags.length ? (
          data.topTags.map((t) => (
            <Link
              to={`/app/notes?tag=${encodeURIComponent(t._id)}`}
              key={t._id}
            >
              #{t._id}
              <span>{t.count}</span>
            </Link>
          ))
        ) : (
          <span className="muted">Add tags to find your recurring themes.</span>
        )}
      </section>
      <section className="activity-chart panel">
        <div className="section-heading">
          <h2>30 days of thinking</h2>
          <span className="muted">Saved activity · UTC days</span>
        </div>
        <div className="activity-bars">
          {Array.from({ length: 30 }, (_, i) => {
            const day = new Date(Date.now() - (29 - i) * 86400000)
                .toISOString()
                .slice(0, 10),
              count =
                data.activityOverTime.find((a) => a._id === day)?.count || 0,
              maximum = Math.max(
                1,
                ...data.activityOverTime.map((a) => a.count),
              );
            return (
              <div
                key={day}
                title={`${day}: ${count} activities`}
                style={{ height: `${Math.max(3, (count / maximum) * 100)}%` }}
              >
                <span className="sr-only">
                  {day}: {count}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
