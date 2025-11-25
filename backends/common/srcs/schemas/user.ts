import { Static, Type } from "@sinclair/typebox";

export const registerBodySchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  password: Type.String({ minLength: 8 }),
});

export type RegisterBody = Static<typeof registerBodySchema>;

export const registerResponseSchema = Type.Object({
  id: Type.Number(),
  name: Type.String(),
});

export const errorResponseSchema = Type.Object({
  message: Type.String(),
});

export const loginBodySchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  password: Type.String({ minLength: 1 }),
  longTerm: Type.Optional(Type.Boolean()),
});

export type LoginBody = Static<typeof loginBodySchema>;

export const loginSuccessSchema = Type.Object({
  id: Type.Number(),
  name: Type.String(),
  accessToken: Type.String(),
  refreshToken: Type.String(),
  longTermToken: Type.Optional(Type.String()),
});

export const userIdentifierSchema = Type.Object({
  userId: Type.Number({ minimum: 1 }),
});

export type UserIdentifier = Static<typeof userIdentifierSchema>;

export const userActionResponseSchema = Type.Object({
  message: Type.String(),
});

export const userInformationQuerySchema = userIdentifierSchema;

export const userInformationResponseSchema = Type.Object({
  id: Type.Number(),
  name: Type.String(),
  status: Type.String(),
});

export const userBanBodySchema = Type.Composite([
  userIdentifierSchema,
  Type.Object({
    reason: Type.Optional(Type.String()),
  }),
]);

export type UserBanBody = Static<typeof userBanBodySchema>;

export const userBlockBodySchema = Type.Composite([
  userIdentifierSchema,
  Type.Object({
    targetUserId: Type.Number({ minimum: 1 }),
  }),
]);

export type UserBlockBody = Static<typeof userBlockBodySchema>;

export const destroyTokenBodySchema = Type.Composite([
  userIdentifierSchema,
  Type.Object({
    longTermToken: Type.String({ minLength: 1 }),
  }),
]);

export type DestroyTokenBody = Static<typeof destroyTokenBodySchema>;

export const refreshTokenBodySchema = Type.Object({
  longTermToken: Type.String({ minLength: 1 }),
});

export type RefreshTokenBody = Static<typeof refreshTokenBodySchema>;

export const refreshTokenResponseSchema = Type.Object({
  accessToken: Type.String(),
  refreshToken: Type.String(),
});

export const updatePasswordBodySchema = Type.Composite([
  userIdentifierSchema,
  Type.Object({
    currentPassword: Type.String({ minLength: 1 }),
    newPassword: Type.String({ minLength: 8 }),
  }),
]);

export type UpdatePasswordBody = Static<typeof updatePasswordBodySchema>;

export const deleteUserBodySchema = Type.Composite([
  userIdentifierSchema,
  Type.Object({
    reason: Type.Optional(Type.String()),
  }),
]);

export type DeleteUserBody = Static<typeof deleteUserBodySchema>;
