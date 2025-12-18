export const SignalStatus = {
  NO_CONNECTION: "00",
  WAIT: "01",
  CONNECTED: "02",
} as const;

export const ActionTypes = {
  CREATE: "00",
  JOIN: "01",
  HEART_BEAT: "02",
} as const;

export const EventTypes = {
  CREATED_ROOM: "00",
  JOINED_ROOM: "01",
  HEALTH_CHECK: "02",
} as const;

export interface Stomp {
  event_type: (typeof EventTypes)[keyof typeof EventTypes];
  payload: any;
}

export type SignalStatus = (typeof SignalStatus)[keyof typeof SignalStatus];
export type ActionTypes = (typeof ActionTypes)[keyof typeof ActionTypes];
export type EventTypes = (typeof EventTypes)[keyof typeof EventTypes];
