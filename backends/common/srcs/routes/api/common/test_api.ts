// 一番単純なAPI構成。参考用
import { FastifyInstance } from 'fastify'

export default async function (fastify: FastifyInstance) {
  fastify.get('/test_api', async () => {
    return { message: 'hello user!' }
  })
}
