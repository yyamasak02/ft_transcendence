import { Static, Type } from "@sinclair/typebox";

export const matchSessionBodySchema = Type.Object({
  guestPuid: Type.Optional(Type.String({ minLength: 1 })),
});

export type MatchSessionBody = Static<typeof matchSessionBodySchema>;

export const matchSessionResponseSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
  createdAt: Type.String({ minLength: 1 }),
});

export type MatchSessionResponse = Static<typeof matchSessionResponseSchema>;

export const matchResultBodySchema = Type.Object({
  matchId: Type.Integer({ minimum: 1 }),
  ownerScore: Type.Integer({ minimum: 0 }),
  guestScore: Type.Integer({ minimum: 0 }),
});

export type MatchResultBody = Static<typeof matchResultBodySchema>;

export const matchResultResponseSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
  createdAt: Type.String({ minLength: 1 }),
});

export type MatchResultResponse = Static<typeof matchResultResponseSchema>;

export const remoteMatchResultBodySchema = Type.Object({
  ownerUserId: Type.String({ minLength: 1 }),
  guestUserId: Type.String({ minLength: 1 }),
  ownerScore: Type.Integer({ minimum: 0 }),
  guestScore: Type.Integer({ minimum: 0 }),
});

export type RemoteMatchResultBody = Static<typeof remoteMatchResultBodySchema>;

export const remoteMatchResultResponseSchema = Type.Object({
  stored: Type.Boolean(),
  id: Type.Optional(Type.Integer({ minimum: 1 })),
  createdAt: Type.Optional(Type.String({ minLength: 1 })),
  reason: Type.Optional(Type.String({ minLength: 1 })),
});

export type RemoteMatchResultResponse = Static<
  typeof remoteMatchResultResponseSchema
>;

export const matchRecentQuerySchema = Type.Object({
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 50, default: 10 })),
});

export type MatchRecentQuery = Static<typeof matchRecentQuerySchema>;

export const matchRecentItemSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
  ownerName: Type.String({ minLength: 1 }),
  guestName: Type.Optional(Type.String({ minLength: 1 })),
  ownerScore: Type.Integer({ minimum: 0 }),
  guestScore: Type.Integer({ minimum: 0 }),
  createdAt: Type.String({ minLength: 1 }),
});

export const matchRecentResponseSchema = Type.Array(matchRecentItemSchema);
