export type JwtPayload = {
  name?: string;
  puid?: string;
  exp?: number;
};

export const decodeJwtPayload = (token: string): JwtPayload | null => {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    return payload as JwtPayload;
  } catch {
    return null;
  }
};

export const isJwtExpired = (token: string) => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return Date.now() >= payload.exp * 1000;
};
