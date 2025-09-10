// Require the framework and instantiate it
import Fastify from 'fastify'
import fastifyEnv from '@fastify/env';
import { envOptions } from './config/env.js';

async function bootstrap() {
  // CommonJs
  const fastify = Fastify({
    logger: true
  });
  // register env
  await fastify.register(fastifyEnv, envOptions);
  const {PORT, HOST} = fastify.config;

  // Declare a route
  fastify.get('/', (request, reply) => {
    reply.send({ hello: 'world' })
  })

  // Run the server!
  fastify.listen({ port: PORT, host: HOST }, (err, address) => {
    if (err) throw err
    // Server is now listening on ${address}
  })
};

bootstrap();