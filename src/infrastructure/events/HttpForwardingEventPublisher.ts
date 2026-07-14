import type { DomainEvent } from '../../core/events/index.js';
import type { EventPublisher } from '../../core/interfaces/EventPublisher.js';
import type { InstanceRepository } from '../../core/interfaces/InstanceRepository.js';
import type { Logger } from '../../core/interfaces/Logger.js';

/**
 * Repassa eventos de domínio via HTTP POST para o `callbackUrl` cadastrado na instância —
 * substitui uma fila real (RabbitMQ/Kafka) nesta primeira versão da API HTTP. Falha de
 * entrega é logada, sem retry (documentado como próximo passo quando existir fila de verdade).
 */
export class HttpForwardingEventPublisher implements EventPublisher {
  constructor(
    private readonly instanceRepository: InstanceRepository,
    private readonly logger: Logger,
  ) {}

  publish(event: DomainEvent): void {
    void this.forward(event);
  }

  private async forward(event: DomainEvent): Promise<void> {
    const instance = await this.instanceRepository.findById(event.instanceId);
    if (!instance?.callbackUrl) return;

    try {
      const response = await fetch(instance.callbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        this.logger.warn('callbackUrl respondeu com status de erro', {
          provider: event.provider,
          instanceId: event.instanceId,
          eventType: event.type,
          status: response.status,
        });
      }
    } catch (err) {
      this.logger.warn('Falha ao repassar evento para callbackUrl', {
        provider: event.provider,
        instanceId: event.instanceId,
        eventType: event.type,
        error: String(err),
      });
    }
  }
}
