import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function registerSchemas(fastify: FastifyInstance) {
  const schemaDir = path.join(__dirname, "../../schemas");
  console.log("test", schemaDir);

  for (const file of fs.readdirSync(schemaDir)) {
    if (file.endsWith(".js") || file.endsWith(".ts")) {
      const schemaModule = await import(path.join(schemaDir, file));
      for (const value of Object.values(schemaModule)) {
        const schema = value as { $id?: string };
        console.log(schema, value);
        if (schema.$id) fastify.addSchema(value);
      }
    }
  }
}

export default fp(async (fastify: FastifyInstance) => {
  await registerSchemas(fastify);
});
