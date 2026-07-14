import type { DomainEvent } from '../events/index.js';

export interface EventPublisher {
  publish(event: DomainEvent): void;
}
