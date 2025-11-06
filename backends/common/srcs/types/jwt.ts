export type AccessTokenPayload = {
  userId: number;
  name: string;
  type: "access";
};

export type RefreshTokenPayload = {
  userId: number;
  name: string;
  type: "refresh";
  tokenId: string;
};
