import fp from "fastify-plugin";
import fastifySwaggerUi from "@fastify/swagger-ui";
import fastifySwagger from "@fastify/swagger";
import { JSONObject } from "@fastify/swagger";
import type { URIComponents } from "uri-js";
import fs from "fs";
import path from "path";

export default fp(async function (fastify) {
  /**
   * A Fastify plugin for serving Swagger (OpenAPI v2) or OpenAPI v3 schemas
   *
   * @see {@link https://github.com/fastify/fastify-swagger}
   */
  await fastify.register(fastifySwagger, {
    hideUntagged: true,
    openapi: {
      info: {
        title: "Fastify demo API",
        description: "The official Fastify demo API",
        version: "0.1.0",
      },
    },
    refResolver: {
      buildLocalReference(
        json: JSONObject,
        _baseUri: URIComponents,
        _fragment: string,
        i: number,
      ): string {
        return String((json as any).$id ?? `def-${i}`);
      },
    },
  });

  /**
   * A Fastify plugin for serving Swagger UI.
   *
   * @see {@link https://github.com/fastify/fastify-swagger-ui}
   */
  await fastify.register(fastifySwaggerUi, {
    routePrefix: "/api/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
  });

  fastify.addHook("onReady", async () => {
    const yaml = fastify.swagger({ yaml: true });
    const outputPath = path.join(process.cwd(), "swagger", "swagger.yml");

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, yaml);
    fastify.log.info(`✅ Swagger YAML exported to ${outputPath}`);
  });
});
