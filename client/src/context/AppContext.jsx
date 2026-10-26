import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { api } from "../services/api";
const Context = createContext(null);
export function AppProvider({ children }) {
  const [user, setUser] = useState(null),
    [ready, setReady] = useState(false),
    [sessionError, setSessionError] = useState("");
  const [version, setVersion] = useState(0),
    [toasts, setToasts] = useState([]);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  const toast = useCallback((message, kind = "success") => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t.slice(-3), { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5500);
  }, []);
  const loadSession = useCallback(async () => {
    setReady(false);
    setSessionError("");
    try {
      setUser(await api("/auth/me"));
    } catch (e) {
      if (e.status !== 401) setSessionError(e.message);
    } finally {
      setReady(true);
    }
  }, []);
  useEffect(() => {
    loadSession();
  }, [loadSession]);
  useEffect(() => {
    document.documentElement.dataset.motion =
      user?.settings?.reducedMotion ||
      user?.settings?.animationIntensity === "off"
        ? "off"
        : user?.settings?.animationIntensity || "subtle";
  }, [user]);
  const logout = async () => {
    await api("/auth/logout", { method: "POST", body: {} });
    setUser(null);
    refresh();
  };
  return (
    <Context.Provider
      value={{
        user,
        setUser,
        ready,
        sessionError,
        loadSession,
        logout,
        version,
        refresh,
        toast,
      }}
    >
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast ${t.kind}`}
            role={t.kind === "error" ? "alert" : "status"}
          >
            {t.message}
            <button
              aria-label="Dismiss notification"
              onClick={() =>
                setToasts((all) => all.filter((x) => x.id !== t.id))
              }
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </Context.Provider>
  );
}
export const useApp = () => useContext(Context);
