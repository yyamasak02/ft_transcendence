// ユーザー登録・ログインAPI例
// Register: curl -X POST http://localhost:8080/api/common/user/register -H "Content-Type: application/json" -d '{"email":"foo@example.com","name":"foo","password":"barbazqux"}'
// Login:    curl -X POST http://localhost:8080/api/common/user/login    -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"42admin"}'
// Login:    curl -X POST http://localhost:8080/api/common/user/login    -H "Content-Type: application/json" -d '{"email":"foo@example.com","password":"barbazqux"}'
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { FastifyInstance } from "fastify";
import { randomBytes } from "node:crypto";
import {
  issueTokens,
  hashPassword,
  verifyUserCredentials,
  issueLongTermToken,
  issueTwoFactorToken,
  verifyLongTermToken,
  removeLongTermToken,
  findUserByPuid,
  findUserByName,
  findUserByEmail,
  findUserByGoogleSub,
  linkGoogleAccount,
  generatePuid,
  MAX_PUID_GENERATION_RETRIES,
  verifyTotp,
  generateTotpSecret,
  verifyGoogleIdToken,
} from "../../../utils/auth.js";
import { ONLINE_THRESHOLD_MS, isRecentlyActive } from "../../../utils/date.js";
import {
  deleteUserBodySchema,
  destroyTokenBodySchema,
  errorResponseSchema,
  loginBodySchema,
  loginResponseSchema,
  lastAccessResponseSchema,
  refreshTokenBodySchema,
  refreshTokenResponseSchema,
  registerBodySchema,
  registerResponseSchema,
  updatePasswordBodySchema,
  updateUserNameBodySchema,
  updateUserNameResponseSchema,
  userActionResponseSchema,
  userBanBodySchema,
  userBlockBodySchema,
  userProfileQuerySchema,
  userProfileImageQuerySchema,
  userProfileImageResponseSchema,
  userProfileResponseSchema,
  updateProfileImageBodySchema,
  uploadProfileImageBodySchema,
  friendRequestBodySchema,
  friendRespondBodySchema,
  friendRemoveBodySchema,
  friendsListResponseSchema,
  puidLookupQuerySchema,
  puidLookupResponseSchema,
  googleLoginBodySchema,
  googleLoginResponseSchema,
  googleRegisterBodySchema,
  twoFactorEnableResponseSchema,
  twoFactorVerifyBodySchema,
  twoFactorStatusResponseSchema,
} from "../../../schemas/user.js";
import type {
  DeleteUserBody,
  DestroyTokenBody,
  LoginBody,
  RefreshTokenBody,
  RegisterBody,
  UpdatePasswordBody,
  UpdateUserNameBody,
  UserBanBody,
  UserBlockBody,
  PuidLookupQuery,
  GoogleLoginBody,
  GoogleRegisterBody,
  TwoFactorVerifyBody,
  UserProfileQuery,
  UserProfileImageQuery,
  UpdateProfileImageBody,
  UploadProfileImageBody,
  FriendRequestBody,
  FriendRespondBody,
  FriendRemoveBody,
  ProfileImageKey,
} from "../../../schemas/user.js";
import type { TwoFactorTokenPayload } from "../../../types/jwt.js";

export default async function (fastify: FastifyInstance) {
  const f = fastify.withTypeProvider<TypeBoxTypeProvider>();
  const isSqliteConstraintError = (error: unknown) =>
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "SQLITE_CONSTRAINT";
  const isTwoFactorPayload = (value: unknown): value is TwoFactorTokenPayload =>
    typeof value === "object" &&
    value !== null &&
    (value as { type?: unknown }).type === "2fa" &&
    typeof (value as { userId?: unknown }).userId === "number";
  const profileImageKeys = new Set([
    "Robot",
    "Snowman",
    "Sniper",
    "Suicider",
    "Queen",
  ]);
  const PNG_SIGNATURE = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  const MAX_PROFILE_IMAGE_BYTES = 1024 * 1024;
  const FRIEND_STATUS = {
    PENDING: "pending",
    ACCEPTED: "accepted",
  } as const;
  const toProfileImage = (value: string | null): ProfileImageKey | null => {
    if (!value || !profileImageKeys.has(value)) return null;
    return value as ProfileImageKey;
  };

  f.post<{ Body: RegisterBody }>(
    "/user/register",
    {
      schema: {
        tags: ["User"],
        body: registerBodySchema,
        response: {
          201: registerResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { email, name, password } = request.body;
      const salt = randomBytes(16).toString("hex");
      const hashedPassword = await hashPassword(password, salt);

      for (let attempt = 0; attempt < MAX_PUID_GENERATION_RETRIES; attempt++) {
        const puid = generatePuid();
        try {
          await fastify.db.run(
            "INSERT INTO users (email, name, password, salt, puid) VALUES (?, ?, ?, ?, ?)",
            email,
            name,
            hashedPassword,
            salt,
            puid,
          );

          reply.code(201);
          return { message: "User registered." };
        } catch (error) {
          if (isSqliteConstraintError(error)) {
            const existing = await fastify.db.get(
              "SELECT 1 FROM users WHERE email = ? OR name = ?",
              email,
              name,
            );
            if (existing) {
              reply.code(409);
              return { message: "User already exists." };
            }
            continue;
          }

          throw error;
        }
      }

      fastify.log.error(
        { username: name, email },
        "Failed to generate unique PUID after 5 attempts during user registration.",
      );
      reply.code(500);
      return { message: "Failed to generate unique PUID." };
    },
  );

  f.post<{ Body: LoginBody }>(
    "/user/login",
    {
      schema: {
        tags: ["User"],
        body: loginBodySchema,
        response: {
          200: loginResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { email, password, longTerm } = request.body;
      const user = await verifyUserCredentials(fastify, email, password);
      if (!user) {
        reply.code(401);
        return { message: "Invalid credentials." };
      }

      const twoFactor = await fastify.db.get<{
        two_factor_enabled: number;
        two_factor_secret: string | null;
      }>(
        "SELECT two_factor_enabled, two_factor_secret FROM users WHERE id = ?",
        user.id,
      );

      if (twoFactor?.two_factor_enabled && twoFactor.two_factor_secret) {
        const twoFactorToken = await issueTwoFactorToken(fastify, user.id);
        return { twoFactorRequired: true, twoFactorToken };
      }

      const tokens = await issueTokens(fastify, {
        id: user.id,
        puid: user.puid,
        name: user.name,
      });

      let longTermToken: string | undefined;
      if (longTerm) {
        const issued = await issueLongTermToken(fastify, user.id);
        longTermToken = issued.token;
      }

      return {
        ...tokens,
        ...(longTermToken ? { longTermToken } : {}),
      };
    },
  );

  f.post<{ Body: GoogleLoginBody }>(
    "/user/google_login",
    {
      schema: {
        tags: ["User"],
        body: googleLoginBodySchema,
        response: {
          200: googleLoginResponseSchema,
          401: errorResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) {
        reply.code(500);
        return { message: "GOOGLE_CLIENT_ID is not configured." };
      }

      const googleProfile = await verifyGoogleIdToken(
        request.body.idToken,
        clientId,
        (error) => {
          fastify.log.error(
            { err: error },
            "Failed to verify Google ID token.",
          );
        },
      );

      if (!googleProfile) {
        reply.code(401);
        return { message: "Invalid Google ID token." };
      }

      const user = await findUserByGoogleSub(fastify, googleProfile.sub);
      if (!user) {
        return { requiresSignup: true };
      }

      const twoFactor = await fastify.db.get<{
        two_factor_enabled: number;
        two_factor_secret: string | null;
      }>(
        "SELECT two_factor_enabled, two_factor_secret FROM users WHERE id = ?",
        user.id,
      );

      if (twoFactor?.two_factor_enabled && twoFactor.two_factor_secret) {
        const twoFactorToken = await issueTwoFactorToken(fastify, user.id);
        return { twoFactorRequired: true, twoFactorToken };
      }

      const tokens = await issueTokens(fastify, {
        id: user.id,
        puid: user.puid,
        name: user.name,
      });

      let longTermToken: string | undefined;
      if (request.body.longTerm) {
        const issued = await issueLongTermToken(fastify, user.id);
        longTermToken = issued.token;
      }

      return {
        ...tokens,
        ...(longTermToken ? { longTermToken } : {}),
      };
    },
  );

  f.post<{ Body: GoogleRegisterBody }>(
    "/user/google_register",
    {
      schema: {
        tags: ["User"],
        body: googleRegisterBodySchema,
        response: {
          200: loginResponseSchema,
          401: errorResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) {
        reply.code(500);
        return { message: "GOOGLE_CLIENT_ID is not configured." };
      }

      const googleProfile = await verifyGoogleIdToken(
        request.body.idToken,
        clientId,
        (error) => {
          fastify.log.error(
            { err: error },
            "Failed to verify Google ID token.",
          );
        },
      );

      if (!googleProfile) {
        reply.code(401);
        return { message: "Invalid Google ID token." };
      }

      const existing = await findUserByGoogleSub(fastify, googleProfile.sub);
      if (existing) {
        reply.code(409);
        return { message: "Google account already registered." };
      }

      const { name } = request.body;
      const email = googleProfile.email?.trim();
      if (!email) {
        reply.code(500);
        return { message: "Google profile email is missing." };
      }
      const emailOwner = await findUserByEmail(fastify, email);
      if (emailOwner) {
        reply.code(409);
        return { message: "Email already exists." };
      }
      // Google 認証ユーザーはパスワード認証を行わないため、DB の NOT NULL 制約を満たすためのプレースホルダ値を使用する。
      const placeholderPassword = "GOOGLE_AUTH_USER";
      const placeholderSalt = "GOOGLE_AUTH_USER";

      let userId: number | null = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        const puid = generatePuid();
        try {
          const result = await fastify.db.run(
            "INSERT INTO users (email, name, password, salt, puid) VALUES (?, ?, ?, ?, ?)",
            email,
            name,
            placeholderPassword,
            placeholderSalt,
            puid,
          );
          userId = result.lastID ?? null;
          break;
        } catch (error) {
          if (isSqliteConstraintError(error)) {
            const existing = await fastify.db.get(
              "SELECT 1 FROM users WHERE email = ? OR name = ?",
              email,
              name,
            );
            if (existing) {
              reply.code(409);
              return { message: "User already exists." };
            }
            continue;
          }

          throw error;
        }
      }

      if (!userId) {
        fastify.log.error(
          { username: name },
          "Failed to generate unique PUID after retries during Google registration.",
        );
        reply.code(500);
        return { message: "Failed to provision user." };
      }

      await linkGoogleAccount(
        fastify,
        userId,
        googleProfile.sub,
        googleProfile.email,
        googleProfile.emailVerified,
      );

      const user = await fastify.db.get<{
        id: number;
        puid: string;
        name: string;
      }>("SELECT id, puid, name FROM users WHERE id = ?", userId);

      if (!user) {
        reply.code(500);
        return { message: "Failed to provision user." };
      }

      const tokens = await issueTokens(fastify, user);

      let longTermToken: string | undefined;
      if (request.body.longTerm) {
        const issued = await issueLongTermToken(fastify, user.id);
        longTermToken = issued.token;
      }

      return {
        ...tokens,
        ...(longTermToken ? { longTermToken } : {}),
      };
    },
  );

  f.get<{ Querystring: PuidLookupQuery }>(
    "/user/puid",
    {
      schema: {
        tags: ["User"],
        querystring: puidLookupQuerySchema,
        response: {
          200: puidLookupResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { name } = request.query;
      const user = await findUserByName(fastify, name);
      if (!user) {
        reply.code(404);
        return { message: "User not found." };
      }

      return { puid: user.puid };
    },
  );

  f.get<{ Querystring: UserProfileQuery }>(
    "/user/profile",
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ["User"],
        querystring: userProfileQuerySchema,
        response: {
          200: userProfileResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { name } = request.query;
      const user = await fastify.db.get<{
        id: number;
        puid: string;
        name: string;
        last_accessed_at: string | null;
        profile_image: string | null;
      }>(
        "SELECT id, puid, name, last_accessed_at, profile_image FROM users WHERE name = ?",
        name,
      );
      if (!user) {
        reply.code(404);
        return { message: "User not found." };
      }

      const online = isRecentlyActive(
        user.last_accessed_at,
        ONLINE_THRESHOLD_MS,
      );

      const rows = await fastify.db.all<
        Array<{
          id: number;
          owner_name: string;
          guest_name: string | null;
          owner_score: number;
          guest_score: number;
          created_at: string;
        }>
      >(
        `SELECT
           match_results.id,
           owner.name AS owner_name,
           guest.name AS guest_name,
           match_results.owner_score,
           match_results.guest_score,
           match_results.created_at
         FROM match_results
         LEFT JOIN users AS owner ON owner.puid = match_results.owner_puid
         LEFT JOIN users AS guest ON guest.puid = match_results.guest_puid
         WHERE match_results.owner_puid = ? OR match_results.guest_puid = ?
         ORDER BY match_results.created_at DESC`,
        user.puid,
        user.puid,
      );

      const profileImage = toProfileImage(user.profile_image ?? null);

      return {
        name: user.name,
        online,
        profileImage,
        matches: rows.map((row) => ({
          id: row.id,
          ownerName: row.owner_name,
          guestName: row.guest_name ?? undefined,
          ownerScore: row.owner_score,
          guestScore: row.guest_score,
          createdAt: row.created_at,
        })),
      };
    },
  );

  f.get<{ Querystring: UserProfileImageQuery }>(
    "/user/profile_image",
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ["User"],
        querystring: userProfileImageQuerySchema,
        response: {
          200: userProfileImageResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { name } = request.query;
      const user = await fastify.db.get<{ profile_image: string | null }>(
        "SELECT profile_image FROM users WHERE name = ?",
        name,
      );
      if (!user) {
        reply.code(404);
        return { message: "User not found." };
      }
      const profileImage = toProfileImage(user.profile_image ?? null);
      return { profileImage };
    },
  );

  f.patch<{ Body: UpdateProfileImageBody }>(
    "/user/profile_image",
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ["User"],
        body: updateProfileImageBodySchema,
        response: {
          200: userActionResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const { profileImage } = request.body;
      await fastify.db.run(
        "UPDATE users SET profile_image = ?, profile_image_data = NULL WHERE id = ?",
        profileImage,
        request.user.userId,
      );
      return { message: "Profile image updated." };
    },
  );

  f.post<{ Body: UploadProfileImageBody }>(
    "/user/profile_image_upload",
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ["User"],
        body: uploadProfileImageBodySchema,
        response: {
          200: userActionResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { imageBase64 } = request.body;
      const DATA_URL_PNG_BASE64_PREFIX = /^data:image\/png;base64\s*,/i;
      const trimmed = imageBase64.trim();
      const rawBase64 = DATA_URL_PNG_BASE64_PREFIX.test(trimmed)
        ? trimmed.replace(DATA_URL_PNG_BASE64_PREFIX, "")
        : trimmed;
      let buffer: Buffer;
      try {
        buffer = Buffer.from(rawBase64, "base64");
      } catch {
        reply.code(400);
        return { message: "Invalid base64 image." };
      }
      if (buffer.length === 0) {
        reply.code(400);
        return { message: "Image is required." };
      }
      if (
        buffer.length < PNG_SIGNATURE.length ||
        !buffer.subarray(0, 8).equals(PNG_SIGNATURE)
      ) {
        reply.code(400);
        return { message: "PNG format is required." };
      }
      if (buffer.length > MAX_PROFILE_IMAGE_BYTES) {
        reply.code(400);
        return { message: "Image is too large." };
      }

      await fastify.db.run(
        "UPDATE users SET profile_image = NULL, profile_image_data = ? WHERE id = ?",
        buffer,
        request.user.userId,
      );
      return { message: "Profile image uploaded." };
    },
  );

  f.get<{ Querystring: UserProfileImageQuery }>(
    "/user/profile_image_data",
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ["User"],
        querystring: userProfileImageQuerySchema,
        response: {
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { name } = request.query;
      const user = await fastify.db.get<{ profile_image_data: Buffer | null }>(
        "SELECT profile_image_data FROM users WHERE name = ?",
        name,
      );
      if (!user || !user.profile_image_data) {
        reply.code(404);
        reply.type("application/json");
        return { message: "Profile image not found." };
      }
      reply.header("Content-Type", "image/png");
      return reply.send(user.profile_image_data);
    },
  );

  f.get(
    "/user/friends",
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ["User"],
        response: {
          200: friendsListResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const rows = await fastify.db.all<
        Array<{
          id: number;
          status: string;
          requester_puid: string;
          addressee_puid: string;
          requester_name: string;
          addressee_name: string;
          requester_image: string | null;
          addressee_image: string | null;
          requester_access: string | null;
          addressee_access: string | null;
        }>
      >(
        `SELECT
           f.id,
           f.status,
           f.requester_puid,
           f.addressee_puid,
           requester.name AS requester_name,
           addressee.name AS addressee_name,
           requester.profile_image AS requester_image,
           addressee.profile_image AS addressee_image,
           requester.last_accessed_at AS requester_access,
           addressee.last_accessed_at AS addressee_access
         FROM friends f
         JOIN users AS requester ON requester.puid = f.requester_puid
         JOIN users AS addressee ON addressee.puid = f.addressee_puid
         WHERE f.requester_puid = ? OR f.addressee_puid = ?
         ORDER BY f.created_at DESC`,
        request.user.puid,
        request.user.puid,
      );

      const friends: Array<{
        id: number;
        name: string;
        profileImage:
          | "Robot"
          | "Snowman"
          | "Sniper"
          | "Suicider"
          | "Queen"
          | null;
        online: boolean;
        status: "accepted" | "pending_incoming" | "pending_outgoing";
      }> = rows.map((row) => {
        const isRequester = row.requester_puid === request.user.puid;
        const status: "accepted" | "pending_outgoing" | "pending_incoming" =
          row.status === "accepted"
            ? "accepted"
            : isRequester
              ? "pending_outgoing"
              : "pending_incoming";
        const name = isRequester ? row.addressee_name : row.requester_name;
        const profileImage = toProfileImage(
          isRequester ? row.addressee_image : row.requester_image,
        );
        const online = isRecentlyActive(
          isRequester ? row.addressee_access : row.requester_access,
          ONLINE_THRESHOLD_MS,
        );
        return {
          id: row.id,
          name,
          profileImage,
          online,
          status,
        };
      });

      return { friends };
    },
  );

  f.post<{ Body: FriendRequestBody }>(
    "/user/friends/request",
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ["User"],
        body: friendRequestBodySchema,
        response: {
          200: userActionResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { name } = request.body;
      const target = await fastify.db.get<{ puid: string }>(
        "SELECT puid FROM users WHERE name = ?",
        name,
      );
      if (!target) {
        reply.code(404);
        return { message: "User not found." };
      }
      if (target.puid === request.user.puid) {
        reply.code(400);
        return { message: "Cannot add yourself." };
      }
      const existing = await fastify.db.get<{ id: number }>(
        `SELECT id FROM friends
         WHERE (requester_puid = ? AND addressee_puid = ?)
            OR (requester_puid = ? AND addressee_puid = ?)`,
        request.user.puid,
        target.puid,
        target.puid,
        request.user.puid,
      );
      if (existing) {
        reply.code(409);
        return { message: "Friend request already exists." };
      }
      await fastify.db.run(
        "INSERT INTO friends (requester_puid, addressee_puid, status) VALUES (?, ?, ?)",
        request.user.puid,
        target.puid,
        FRIEND_STATUS.PENDING,
      );
      return { message: "Friend request sent." };
    },
  );

  f.patch<{ Body: FriendRespondBody }>(
    "/user/friends/respond",
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ["User"],
        body: friendRespondBodySchema,
        response: {
          200: userActionResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { requestId, accept } = request.body;
      const row = await fastify.db.get<{
        requester_puid: string;
        addressee_puid: string;
        status: string;
      }>(
        "SELECT requester_puid, addressee_puid, status FROM friends WHERE id = ?",
        requestId,
      );
      if (!row) {
        reply.code(404);
        return { message: "Friend request not found." };
      }
      if (
        row.addressee_puid !== request.user.puid ||
        row.status !== FRIEND_STATUS.PENDING
      ) {
        reply.code(400);
        return { message: "Invalid friend request." };
      }
      if (accept) {
        await fastify.db.run(
          "UPDATE friends SET status = ? WHERE id = ?",
          FRIEND_STATUS.ACCEPTED,
          requestId,
        );
        return { message: "Friend request accepted." };
      }
      await fastify.db.run("DELETE FROM friends WHERE id = ?", requestId);
      return { message: "Friend request declined." };
    },
  );

  f.post<{ Body: FriendRemoveBody }>(
    "/user/friends/remove",
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ["User"],
        body: friendRemoveBodySchema,
        response: {
          200: userActionResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { friendId } = request.body;
      const row = await fastify.db.get<{
        requester_puid: string;
        addressee_puid: string;
        status: string;
      }>(
        "SELECT requester_puid, addressee_puid, status FROM friends WHERE id = ?",
        friendId,
      );
      if (!row) {
        reply.code(404);
        return { message: "Friend not found." };
      }
      if (row.status !== "accepted") {
        reply.code(400);
        return { message: "Friend is not accepted." };
      }
      if (
        row.requester_puid !== request.user.puid &&
        row.addressee_puid !== request.user.puid
      ) {
        reply.code(400);
        return { message: "Invalid friend request." };
      }
      await fastify.db.run("DELETE FROM friends WHERE id = ?", friendId);
      return { message: "Friend removed." };
    },
  );

  f.get(
    "/user/last_access",
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ["User"],
        response: {
          200: lastAccessResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const row = await fastify.db.get<{ last_accessed_at: string | null }>(
        "SELECT last_accessed_at FROM users WHERE id = ?",
        request.user.userId,
      );
      if (!row) {
        reply.code(404);
        return { message: "User not found." };
      }
      return { lastAccessedAt: row.last_accessed_at };
    },
  );

  f.post<{ Body: UserBanBody }>(
    "/user/ban",
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ["User"],
        body: userBanBodySchema,
        response: {
          200: userActionResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const { puid, reason } = request.body;

      return {
        message: `User ${puid} banned${reason ? ` for ${reason}` : ""}.`,
      };
    },
  );

  f.post<{ Body: UserBlockBody }>(
    "/user/block",
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ["User"],
        body: userBlockBodySchema,
        response: {
          200: userActionResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const { puid, targetPuid } = request.body;

      return {
        message: `User ${puid} blocked user ${targetPuid}.`,
      };
    },
  );

  f.get(
    "/user/jwt_test",
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ["User"],
        response: {
          200: userActionResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const payload = request.user;

      return {
        message: `JWT verified for user ${payload.name} (puid: ${payload.puid}).`,
      };
    },
  );

  f.post<{ Body: DestroyTokenBody }>(
    "/user/destroy_token",
    {
      schema: {
        tags: ["User"],
        body: destroyTokenBodySchema,
        response: {
          200: userActionResponseSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { puid, longTermToken } = request.body;

      // リクエストにロングタームトークンが含まれているか検証し、欠けていれば即時400を返す
      if (!longTermToken) {
        reply.code(400);
        return { message: "Token is required." };
      }

      // puidでユーザーを取得できなければ、その場で404を返して処理を打ち切る
      const user = await findUserByPuid(fastify, puid);
      if (!user) {
        reply.code(404);
        return { message: "User not found." };
      }

      // トークンの整合性と所有者を確認し、想定ユーザーのものではなければ400を返す
      const verified = await verifyLongTermToken(fastify, longTermToken);
      if (!verified || verified.userId !== user.id) {
        reply.code(400);
        return { message: "Invalid token." };
      }

      // 条件を満たした場合のみトークンを削除し、破棄完了メッセージを返す
      await removeLongTermToken(fastify, longTermToken);
      return {
        message: `Long-term token revoked for user ${puid}.`,
      };
    },
  );

  f.post<{ Body: RefreshTokenBody }>(
    "/user/refresh_token",
    {
      schema: {
        tags: ["User"],
        body: refreshTokenBodySchema,
        response: {
          200: refreshTokenResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { longTermToken } = request.body;

      const verified = await verifyLongTermToken(fastify, longTermToken);
      if (!verified) {
        reply.code(401);
        return { message: "Invalid long-term token." };
      }

      const user = await fastify.db.get<{
        id: number;
        name: string;
        puid: string;
      }>("SELECT id, name, puid FROM users WHERE id = ?", verified.userId);

      if (!user) {
        await removeLongTermToken(fastify, longTermToken);
        reply.code(401);
        return { message: "User no longer exists." };
      }

      return issueTokens(fastify, user);
    },
  );

  f.patch<{ Body: UpdatePasswordBody }>(
    "/user/password",
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ["User"],
        body: updatePasswordBodySchema,
        response: {
          200: userActionResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const { puid } = request.body;

      return {
        message: `Password updated for user ${puid}.`,
      };
    },
  );

  f.patch<{ Body: UpdateUserNameBody }>(
    "/user/name",
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ["User"],
        body: updateUserNameBodySchema,
        response: {
          200: updateUserNameResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const nextName = request.body.name.trim();
      if (!nextName) {
        reply.code(400);
        return { message: "Name is required." };
      }

      const user = await fastify.db.get<{
        id: number;
        name: string;
        puid: string;
      }>("SELECT id, name, puid FROM users WHERE id = ?", request.user.userId);
      if (!user) {
        reply.code(404);
        return { message: "User not found." };
      }

      if (user.name !== nextName) {
        try {
          await fastify.db.run(
            "UPDATE users SET name = ? WHERE id = ?",
            nextName,
            user.id,
          );
        } catch (error) {
          if (isSqliteConstraintError(error)) {
            reply.code(409);
            return { message: "User already exists." };
          }
          throw error;
        }
      }

      const tokens = await issueTokens(fastify, {
        id: user.id,
        puid: user.puid,
        name: nextName,
      });

      return { accessToken: tokens.accessToken, message: "Name updated." };
    },
  );

  f.delete<{ Body: DeleteUserBody }>(
    "/user/delete",
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ["User"],
        body: deleteUserBodySchema,
        response: {
          200: userActionResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const { puid, reason } = request.body;

      return {
        message: `User ${puid} deleted${reason ? ` for ${reason}` : ""}.`,
      };
    },
  );

  f.post(
    "/user/enable_2fa",
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ["User"],
        response: {
          200: twoFactorEnableResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const secret = generateTotpSecret();
      await fastify.db.run(
        "UPDATE users SET two_factor_enabled = 1, two_factor_secret = ? WHERE id = ?",
        secret,
        request.user.userId,
      );
      return { token: secret };
    },
  );

  f.get(
    "/user/2fa_status",
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ["User"],
        response: {
          200: twoFactorStatusResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const row = await fastify.db.get<{
        two_factor_enabled: number;
        two_factor_secret: string | null;
      }>(
        "SELECT two_factor_enabled, two_factor_secret FROM users WHERE id = ?",
        request.user.userId,
      );
      const enabled = Boolean(
        row?.two_factor_enabled && row?.two_factor_secret,
      );
      return { enabled };
    },
  );

  f.post<{ Body: TwoFactorVerifyBody }>(
    "/user/verify_2fa",
    {
      schema: {
        tags: ["User"],
        body: twoFactorVerifyBodySchema,
        response: {
          200: loginResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { twoFactorToken, code, longTerm } = request.body;
      let payload: TwoFactorTokenPayload;
      try {
        const verified = await fastify.jwt.verify(twoFactorToken);
        if (!isTwoFactorPayload(verified)) {
          reply.code(401);
          return { message: "Invalid 2FA token." };
        }
        payload = verified;
      } catch (error) {
        reply.code(401);
        return { message: "Invalid 2FA token." };
      }

      const user = await fastify.db.get<{
        id: number;
        puid: string;
        name: string;
        two_factor_enabled: number;
        two_factor_secret: string | null;
      }>(
        "SELECT id, puid, name, two_factor_enabled, two_factor_secret FROM users WHERE id = ?",
        payload.userId,
      );

      if (!user || !user.two_factor_enabled || !user.two_factor_secret) {
        reply.code(400);
        return { message: "2FA is not enabled." };
      }

      const totpValid = verifyTotp(user.two_factor_secret, code);
      if (totpValid === null) {
        fastify.log.error({ userId: user.id }, "Invalid 2FA secret format.");
        reply.code(500);
        return { message: "Invalid 2FA configuration." };
      }
      if (!totpValid) {
        reply.code(401);
        return { message: "Invalid 2FA code." };
      }

      const tokens = await issueTokens(fastify, {
        id: user.id,
        puid: user.puid,
        name: user.name,
      });

      let longTermToken: string | undefined;
      if (longTerm) {
        const issued = await issueLongTermToken(fastify, user.id);
        longTermToken = issued.token;
      }

      return {
        ...tokens,
        ...(longTermToken ? { longTermToken } : {}),
      };
    },
  );
}
