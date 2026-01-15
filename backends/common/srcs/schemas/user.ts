import { Static, Type } from "@sinclair/typebox";
import { matchRecentResponseSchema } from "./match.js";

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

export const googleSignupRequiredSchema = Type.Object({
  requiresSignup: Type.Literal(true),
});

export const loginResponseSchema = Type.Union([
  loginSuccessSchema,
  twoFactorRequiredSchema,
]);

export const googleLoginResponseSchema = Type.Union([
  loginSuccessSchema,
  twoFactorRequiredSchema,
  googleSignupRequiredSchema,
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

export const userProfileQuerySchema = Type.Object({
  name: Type.String({ minLength: 1 }),
});

export type UserProfileQuery = Static<typeof userProfileQuerySchema>;

export const profileImageSchema = Type.Union([
  Type.Literal("Robot"),
  Type.Literal("Snowman"),
  Type.Literal("Sniper"),
  Type.Literal("Suicider"),
  Type.Literal("Queen"),
]);

export type ProfileImageKey = Static<typeof profileImageSchema>;

export const userProfileResponseSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  online: Type.Boolean(),
  profileImage: Type.Union([profileImageSchema, Type.Null()]),
  matches: matchRecentResponseSchema,
});

export type UserProfileResponse = Static<typeof userProfileResponseSchema>;

export const userProfileImageQuerySchema = userProfileQuerySchema;

export type UserProfileImageQuery = Static<typeof userProfileImageQuerySchema>;

export const userProfileImageResponseSchema = Type.Object({
  profileImage: Type.Union([profileImageSchema, Type.Null()]),
});

export type UserProfileImageResponse = Static<
  typeof userProfileImageResponseSchema
>;

export const updateProfileImageBodySchema = Type.Object({
  profileImage: profileImageSchema,
});

export type UpdateProfileImageBody = Static<
  typeof updateProfileImageBodySchema
>;

export const uploadProfileImageBodySchema = Type.Object({
  imageBase64: Type.String({ minLength: 1 }),
});

export type UploadProfileImageBody = Static<
  typeof uploadProfileImageBodySchema
>;

const friendStatusSchema = Type.Union([
  Type.Literal("accepted"),
  Type.Literal("pending_incoming"),
  Type.Literal("pending_outgoing"),
]);

export const friendItemSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
  name: Type.String({ minLength: 1 }),
  profileImage: Type.Union([profileImageSchema, Type.Null()]),
  online: Type.Boolean(),
  status: friendStatusSchema,
});

export const friendsListResponseSchema = Type.Object({
  friends: Type.Array(friendItemSchema),
});

export const friendRequestBodySchema = Type.Object({
  name: Type.String({ minLength: 1 }),
});

export type FriendRequestBody = Static<typeof friendRequestBodySchema>;

export const friendRespondBodySchema = Type.Object({
  requestId: Type.Integer({ minimum: 1 }),
  accept: Type.Boolean(),
});

export type FriendRespondBody = Static<typeof friendRespondBodySchema>;

export const friendRemoveBodySchema = Type.Object({
  friendId: Type.Integer({ minimum: 1 }),
});

export type FriendRemoveBody = Static<typeof friendRemoveBodySchema>;

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

export const lastAccessResponseSchema = Type.Object({
  lastAccessedAt: Type.Union([Type.String({ minLength: 1 }), Type.Null()]),
});

export type LastAccessResponse = Static<typeof lastAccessResponseSchema>;

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
