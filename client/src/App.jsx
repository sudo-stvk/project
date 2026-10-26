import { Component, lazy, Suspense } from "react";
import {
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  Link,
} from "react-router-dom";
import { useApp } from "./context/AppContext";
import { Loading, ErrorState } from "./components/common/UI";
import Shell from "./components/layout/Shell";
const Landing = lazy(() => import("./pages/Landing"));
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
const Graph = lazy(() => import("./pages/Graph"));
import Notes from "./pages/Notes";
const Editor = lazy(() => import("./pages/Editor"));
import Discover from "./pages/Discover";
import Settings from "./pages/Settings";
function Protected() {
  const { user, ready, sessionError, loadSession } = useApp(),
    location = useLocation();
  if (!ready) return <Loading />;
  if (sessionError)
    return <ErrorState error={sessionError} retry={loadSession} />;
  return user ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace state={{ from: location.pathname }} />
  );
}
export class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    return this.state.error ? (
      <div className="empty">
        <h1>Let’s reconnect.</h1>
        <p>An unexpected interface error occurred.</p>
        <button className="button" onClick={() => window.location.reload()}>
          Reload NEURON
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Auth register />} />
          <Route element={<Protected />}>
            <Route path="/app" element={<Shell />}>
              <Route index element={<Dashboard />} />
              <Route path="graph" element={<Graph />} />
              <Route path="notes" element={<Notes />} />
              <Route path="notes/:id" element={<Editor />} />
              <Route path="discover" element={<Discover />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>
          <Route
            path="*"
            element={
              <div className="empty">
                <h1>A thought off the map.</h1>
                <p>This page doesn’t exist.</p>
                <Link className="button primary" to="/app">
                  Return to your workspace
                </Link>
              </div>
            }
          />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
