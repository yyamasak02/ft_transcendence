import { decodeJwtPayload } from "./jwt";
import { getStoredAccessToken } from "./token-storage";

export const isLoggedIn = () => {
  const accessToken: string | null = getStoredAccessToken();
  if (accessToken === null) return false;
  const payload = decodeJwtPayload(accessToken);
  if (payload === null) return false;
  return true;
};

export const userName = () => {
  const accessToken: string | null = getStoredAccessToken();
  if (accessToken === null) return null;
  const payload = decodeJwtPayload(accessToken);
  if (payload === null) return null;
  return payload.name;
};
