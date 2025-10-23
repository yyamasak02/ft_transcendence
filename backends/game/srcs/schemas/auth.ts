import { Static, Type } from "@sinclair/typebox";

export const User = Type.Object(
  {
    id: Type.Number(),
    name: Type.String(),
    password: Type.String(),
    salt: Type.String(),
  },
  { $id: "User" },
);

export type UserType = Static<typeof User>;
export const Users = Type.Array(User, { $id: "Users" });
