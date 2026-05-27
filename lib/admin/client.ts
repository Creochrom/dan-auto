/** Browser admin API calls — always send session cookie. */
export const adminFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, credentials: "include" });
