import { ACCESS_TOKEN_KEY, LONG_TERM_TOKEN_KEY } from "@/constants/auth";

export const storeTokens = (accessToken: string, longTermToken?: string) => {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (longTermToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(LONG_TERM_TOKEN_KEY, longTermToken);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(LONG_TERM_TOKEN_KEY);
  }
};

export const getStoredAccessToken = () =>
  sessionStorage.getItem(ACCESS_TOKEN_KEY) ??
  localStorage.getItem(ACCESS_TOKEN_KEY);
