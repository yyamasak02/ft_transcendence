const DISALLOWED_RETURN_PREFIXES = [
  "/login",
  "/register",
  "/google-signup",
  "/two-factor",
];

export const sanitizeReturnTo = (value: string | null) => {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  if (DISALLOWED_RETURN_PREFIXES.some((prefix) => value.startsWith(prefix))) {
    return "/";
  }
  return value;
};

export const getReturnTo = () => {
  const params = new URLSearchParams(window.location.search);
  return sanitizeReturnTo(params.get("from"));
};

export const getCurrentPath = () =>
  `${window.location.pathname}${window.location.search}`;

export const appendReturnTo = (path: string, returnTo: string) => {
  const safeReturnTo = sanitizeReturnTo(returnTo);
  if (safeReturnTo === "/") return path;
  const url = new URL(path, window.location.origin);
  url.searchParams.set("from", safeReturnTo);
  return url.pathname + url.search;
};
