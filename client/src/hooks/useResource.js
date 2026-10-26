import { useEffect, useState } from "react";
import { api } from "../services/api";
export function useResource(path, version = 0) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: "",
    path: null,
  });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!path) {
      setState({ data: null, loading: false, error: "", path });
      return;
    }
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: "" }));
    api(path, { signal: controller.signal })
      .then((data) => setState({ data, loading: false, error: "", path }))
      .catch((e) => {
        if (e.name !== "AbortError")
          setState({ data: null, loading: false, error: e.message, path });
      });
    return () => controller.abort();
  }, [path, version, retry]);
  return {
    ...state,
    data: state.path === path ? state.data : null,
    loading: !!path && (state.path !== path || state.loading),
    reload: () => setRetry((r) => r + 1),
  };
}
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
