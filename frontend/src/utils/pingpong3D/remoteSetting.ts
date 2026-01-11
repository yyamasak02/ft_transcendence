const REMOTE_USER_NAME_STORAGE_KEY = "pp3d-remote-userId";

export function setRemoteUserId(userId: string) {
  localStorage.setItem(REMOTE_USER_NAME_STORAGE_KEY, userId);
}

export function getRemoteUserId(): string | null {
  return localStorage.getItem(REMOTE_USER_NAME_STORAGE_KEY);
}
