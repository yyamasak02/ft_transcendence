export type AccessTokenPayload = {
  userId: number;
  puid: string;
  name: string;
  type: "access";
};

export type TwoFactorTokenPayload = {
  userId: number;
  type: "2fa";
};

export type AuthTokenPayload = AccessTokenPayload | TwoFactorTokenPayload;
