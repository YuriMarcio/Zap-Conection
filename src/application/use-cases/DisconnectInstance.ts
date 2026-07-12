import type { ProviderRegistry } from '../../registry/ProviderRegistry.js';
import type { DisconnectInstanceRequest } from '../../contracts/requests/index.js';

export class DisconnectInstance {
  constructor(private readonly registry: ProviderRegistry) {}

  async execute(request: DisconnectInstanceRequest): Promise<void> {
    return this.registry.resolve(request.provider).disconnect(request.instanceId);
  }
}
