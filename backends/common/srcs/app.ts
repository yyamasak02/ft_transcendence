import fastifyAutoload from "@fastify/autoload";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import path from "node:path";

export default async function serviceApp(
  fastify: FastifyInstance,
  opts: FastifyPluginOptions,
) {
  // This loads all external plugins defined in plugins/external
  // those should be registered first as your application plugins might depend on them
  await fastify.register(fastifyAutoload, {
    dir: path.join(import.meta.dirname, "plugins/external"),
    options: {},
  });

  // This loads all your application plugins defined in plugins/app
  // those should be support plugins that are reused
  // through your application
  fastify.register(fastifyAutoload, {
    dir: path.join(import.meta.dirname, "plugins/app"),
    options: { ...opts },
  });

  fastify.register(fastifyAutoload, {
    dir: path.join(import.meta.dirname, "routes"),
    autoHooks: true,
    cascadeHooks: true,
    options: { ...opts },
  });
}
