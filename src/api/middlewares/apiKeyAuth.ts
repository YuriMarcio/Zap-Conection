import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Checa o header `x-api-key` contra a chave configurada. Se `apiKey` for `undefined` (env
 * FLOWBRIDGE_API_KEY não definida), a checagem é pulada — conveniente em desenvolvimento
 * local, mas nunca deve acontecer em produção (documentado no README).
 */
export function createApiKeyAuth(apiKey: string | undefined) {
  return async function apiKeyAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!apiKey) return;

    const provided = request.headers['x-api-key'];
    if (provided !== apiKey) {
      reply.code(401).send({ error: 'Header x-api-key ausente ou inválido.' });
    }
  };
}
