import type { ProviderRegistry } from '../../registry/ProviderRegistry.js';
import type { ConnectInstanceRequest } from '../../contracts/requests/index.js';
import type { ConnectResult } from '../../contracts/responses/index.js';

export class ConnectInstance {
  constructor(private readonly registry: ProviderRegistry) {}

  async execute(request: ConnectInstanceRequest): Promise<ConnectResult> {
    return this.registry.resolve(request.provider).connect(request.instanceId);
  }
}
