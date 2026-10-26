export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      credentials: "include",
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("Cannot reach NEURON. Check that the server is running.");
  }
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("The API is unavailable. Check the server and MongoDB.");
  }
  if (!response.ok || !payload.success) {
    const error = new Error(payload.message || "Request failed");
    error.status = response.status;
    throw error;
  }
  return payload.data;
}
export const query = (values) =>
  new URLSearchParams(
    Object.entries(values).filter(([, v]) => v !== "" && v !== undefined),
  ).toString();
