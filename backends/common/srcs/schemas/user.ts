import { Static, Type } from "@sinclair/typebox";

export const registerBodySchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  password: Type.String({ minLength: 8 }),
});

export type RegisterBody = Static<typeof registerBodySchema>;

export const registerResponseSchema = Type.Object({
  message: Type.String({ minLength: 1 }),
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
  accessToken: Type.String(),
  longTermToken: Type.Optional(Type.String()),
});

export const twoFactorRequiredSchema = Type.Object({
  twoFactorRequired: Type.Literal(true),
  twoFactorToken: Type.String({ minLength: 1 }),
});

export const loginResponseSchema = Type.Union([
  loginSuccessSchema,
  twoFactorRequiredSchema,
]);

export const googleLoginBodySchema = Type.Object({
  idToken: Type.String({ minLength: 1 }),
  longTerm: Type.Optional(Type.Boolean()),
});

export type GoogleLoginBody = Static<typeof googleLoginBodySchema>;

export const googleRegisterBodySchema = Type.Object({
  idToken: Type.String({ minLength: 1 }),
  name: Type.String({ minLength: 1 }),
  longTerm: Type.Optional(Type.Boolean()),
});

export type GoogleRegisterBody = Static<typeof googleRegisterBodySchema>;

export const twoFactorEnableResponseSchema = Type.Object({
  token: Type.String({ minLength: 1 }),
});

export const twoFactorStatusResponseSchema = Type.Object({
  enabled: Type.Boolean(),
});

export const twoFactorVerifyBodySchema = Type.Object({
  twoFactorToken: Type.String({ minLength: 1 }),
  code: Type.String({ minLength: 1 }),
  longTerm: Type.Optional(Type.Boolean()),
});

export type TwoFactorVerifyBody = Static<typeof twoFactorVerifyBodySchema>;

export const userIdentifierSchema = Type.Object({
  puid: Type.String({ minLength: 1 }),
});

export type UserIdentifier = Static<typeof userIdentifierSchema>;

export const userActionResponseSchema = Type.Object({
  message: Type.String(),
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
    targetPuid: Type.String({ minLength: 1 }),
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
});

export const updatePasswordBodySchema = Type.Composite([
  userIdentifierSchema,
  Type.Object({
    currentPassword: Type.String({ minLength: 1 }),
    newPassword: Type.String({ minLength: 8 }),
  }),
]);

export type UpdatePasswordBody = Static<typeof updatePasswordBodySchema>;

export const updateUserNameBodySchema = Type.Object({
  name: Type.String({ minLength: 1 }),
});

export type UpdateUserNameBody = Static<typeof updateUserNameBodySchema>;

export const updateUserNameResponseSchema = Type.Object({
  accessToken: Type.String({ minLength: 1 }),
  message: Type.String({ minLength: 1 }),
});

export const deleteUserBodySchema = Type.Composite([
  userIdentifierSchema,
  Type.Object({
    reason: Type.Optional(Type.String()),
  }),
]);

export type DeleteUserBody = Static<typeof deleteUserBodySchema>;

export const puidLookupQuerySchema = Type.Object({
  name: Type.String({ minLength: 1 }),
});

export const puidLookupResponseSchema = Type.Object({
  puid: Type.String({ minLength: 1 }),
});

export type PuidLookupQuery = Static<typeof puidLookupQuerySchema>;
export type PuidLookupResponse = Static<typeof puidLookupResponseSchema>;
