import type { ProviderRegistry } from '../../registry/ProviderRegistry.js';
import type { SendTextRequest } from '../../contracts/requests/index.js';
import type { SendResult } from '../../contracts/responses/index.js';

export class SendTextMessage {
  constructor(private readonly registry: ProviderRegistry) {}

  async execute(request: SendTextRequest): Promise<SendResult> {
    return this.registry.resolve(request.provider).sendText(request.instanceId, request.to, request.text, request.options);
  }
}
