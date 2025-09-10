import fastifyEnv from "fastify-env";

const schema = {
    type: 'object',
    required: ['PORT', 'HOST'],
    properties: {
        PORT: { type: 'string', default: '3000' },
        HOST: { type: 'string', default: '0.0.0.0' }
    }
};

const envOptions = {
    confKey: 'config',
    schema,
    dotenv: true,
};

export { envOptions };