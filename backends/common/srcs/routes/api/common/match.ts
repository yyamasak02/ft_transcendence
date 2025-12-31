import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { FastifyInstance } from "fastify";
import {
  errorResponseSchema,
} from "../../../schemas/user.js";
import {
  matchResultBodySchema,
  matchResultResponseSchema,
  matchSessionBodySchema,
  matchSessionResponseSchema,
  matchRecentQuerySchema,
  matchRecentResponseSchema,
} from "../../../schemas/match.js";
import type {
  MatchResultBody,
  MatchSessionBody,
  MatchRecentQuery,
} from "../../../schemas/match.js";

export default async function (fastify: FastifyInstance) {
  const f = fastify.withTypeProvider<TypeBoxTypeProvider>();

  f.post<{ Body: MatchSessionBody }>(
    "/match_session",
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ["Match"],
        body: matchSessionBodySchema,
        response: {
          201: matchSessionResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const guestPuid = request.body.guestPuid ?? null;
      const ownerPuid = request.user.puid;
      if (guestPuid && guestPuid === ownerPuid) {
        reply.code(400);
        return { message: "Guest cannot be the owner." };
      }

      const owner = await fastify.db.get<{ id: number }>(
        "SELECT id FROM users WHERE puid = ?",
        ownerPuid,
      );
      if (!owner) {
        reply.code(404);
        return { message: "Owner not found." };
      }

      if (guestPuid) {
        const guest = await fastify.db.get<{ id: number }>(
          "SELECT id FROM users WHERE puid = ?",
          guestPuid,
        );
        if (!guest) {
          reply.code(404);
          return { message: "Guest not found." };
        }
      }

      const result = await fastify.db.run(
        "INSERT INTO match_sessions (owner_puid, guest_puid) VALUES (?, ?)",
        ownerPuid,
        guestPuid,
      );

      const row = await fastify.db.get<{ id: number; created_at: string }>(
        "SELECT id, created_at FROM match_sessions WHERE id = ?",
        result.lastID,
      );

      if (!row) {
        reply.code(500);
        return { message: "Failed to create match session." };
      }

      reply.code(201);
      return { id: row.id, createdAt: row.created_at };
    },
  );

  f.post<{ Body: MatchResultBody }>(
    "/match_result",
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ["Match"],
        body: matchResultBodySchema,
        response: {
          201: matchResultResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { matchId, ownerScore, guestScore } = request.body;

      const session = await fastify.db.get<{
        owner_puid: string;
        guest_puid: string | null;
      }>(
        "SELECT owner_puid, guest_puid FROM match_sessions WHERE id = ?",
        matchId,
      );

      if (!session) {
        reply.code(404);
        return { message: "Match session not found." };
      }

      if (request.user.puid !== session.owner_puid) {
        reply.code(403);
        return { message: "Only the owner can record match results." };
      }

      const existing = await fastify.db.get(
        "SELECT 1 FROM match_results WHERE match_id = ?",
        matchId,
      );
      if (existing) {
        reply.code(409);
        return { message: "Match result already recorded." };
      }

      const result = await fastify.db.run(
        "INSERT INTO match_results (match_id, owner_puid, guest_puid, owner_score, guest_score) VALUES (?, ?, ?, ?, ?)",
        matchId,
        session.owner_puid,
        session.guest_puid,
        ownerScore,
        guestScore,
      );

      const row = await fastify.db.get<{ id: number; created_at: string }>(
        "SELECT id, created_at FROM match_results WHERE id = ?",
        result.lastID,
      );

      if (!row) {
        reply.code(500);
        return { message: "Failed to store match result." };
      }

      reply.code(201);
      return { id: row.id, createdAt: row.created_at };
    },
  );

  f.get<{ Querystring: MatchRecentQuery }>(
    "/match_results",
    {
      preHandler: fastify.authenticate,
      schema: {
        tags: ["Match"],
        querystring: matchRecentQuerySchema,
        response: {
          200: matchRecentResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const limit = request.query.limit;
      const rows = await fastify.db.all<Array<{
        id: number;
        owner_name: string;
        guest_name: string | null;
        owner_score: number;
        guest_score: number;
        created_at: string;
      }>>(
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
         ORDER BY match_results.created_at DESC
         LIMIT ?`,
        request.user.puid,
        request.user.puid,
        limit,
      );

      return rows.map((row) => ({
        id: row.id,
        ownerName: row.owner_name,
        guestName: row.guest_name ?? undefined,
        ownerScore: row.owner_score,
        guestScore: row.guest_score,
        createdAt: row.created_at,
      }));
    },
  );
}
