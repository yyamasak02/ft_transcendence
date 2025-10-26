import { Type } from "@sinclair/typebox";

export const UserSchema = Type.Object({
  id: Type.Number(),
  name: Type.String(),
  password: Type.String(),
  salt: Type.String(),
});

export const UsersSchema = Type.Array(UserSchema);
