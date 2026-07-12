import type { ProviderRegistry } from '../../registry/ProviderRegistry.js';
import type { SetWebhookRequest } from '../../contracts/requests/index.js';

export class SetWebhook {
  constructor(private readonly registry: ProviderRegistry) {}

  async execute(request: SetWebhookRequest): Promise<void> {
    return this.registry.resolve(request.provider).setWebhook(request.instanceId, request.config);
  }
}
