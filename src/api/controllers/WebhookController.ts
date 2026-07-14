import type { FastifyReply, FastifyRequest } from 'fastify';
import type { InstanceProviderRegistry } from '../../application/InstanceProviderRegistry.js';
import type { EventPublisher } from '../../core/interfaces/EventPublisher.js';
import type { WhatsAppProviderName } from '../../core/interfaces/CommunicationProvider.js';
import type { InstanceRepository } from '../../core/interfaces/InstanceRepository.js';
import type { Logger } from '../../core/interfaces/Logger.js';

/**
 * Recebe webhooks DOS providers (chamada pública, sem x-api-key — quem chama é a
 * Evolution/Z-API/Meta, não o consumidor do FlowBridge), normaliza via
 * `provider.parseWebhookPayload` e repassa os eventos resultantes ao EventPublisher, que se
 * encarrega de entregá-los ao `callbackUrl` da instância.
 */
export class WebhookController {
  constructor(
    private readonly instanceRepository: InstanceRepository,
    private readonly instanceProviderRegistry: InstanceProviderRegistry,
    private readonly eventPublisher: EventPublisher,
    private readonly logger: Logger,
  ) {}

  receive = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { provider, instanceId } = request.params as { provider: WhatsAppProviderName; instanceId: string };

    const instance = await this.instanceRepository.findById(instanceId);
    if (!instance) {
      reply.code(404).send({ error: `Instância "${instanceId}" não encontrada.` });
      return;
    }

    const providerImpl = this.instanceProviderRegistry.resolve(instanceId, provider);
    const rawBody = (request as unknown as { rawBody?: Buffer }).rawBody ?? Buffer.from(JSON.stringify(request.body ?? {}));
    const headers = this.flattenHeaders(request.headers);

    let events;
    try {
      events = providerImpl.parseWebhookPayload(rawBody, headers);
    } catch (err) {
      this.logger.warn('Falha ao processar webhook recebido', { provider, instanceId, error: String(err) });
      reply.code(401).send({ error: 'Webhook inválido.' });
      return;
    }

    for (const event of events) {
      this.eventPublisher.publish(event);
    }

    reply.code(200).send({ received: events.length });
  };

  private flattenHeaders(headers: FastifyRequest['headers']): Record<string, string> {
    const flat: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      flat[key] = Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
    }
    return flat;
  }
}
