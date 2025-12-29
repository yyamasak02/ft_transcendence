import { ActionTypes } from "../consts/consts";

export async function createWebSocket(data: {
  action: ActionTypes;
  joinRoomId: string | null;
  userId: string;
}) {
  let url = `/ws/connect/connect?action=${data.action}&userId=${data.userId}`;
  if (ActionTypes.CREATE !== data.action && data.joinRoomId) {
    url += `&joinRoomId=${encodeURIComponent(data.joinRoomId)}`;
  }
  const ws = new WebSocket(url);
  return ws;
}
