import { ActionTypes } from "../consts/consts";

export async function createWebSocket(data: {
  action: ActionTypes;
  joinRoomId: string | null;
}) {
  let url = `/api/connect/connect?action=${data.action}`;
  if (ActionTypes.CREATE !== data.action && data.joinRoomId) {
    url += `&joinRoomId=${encodeURIComponent(data.joinRoomId)}`;
  }
  const ws = new WebSocket(url);
  return ws;
}
