import type { ProviderRegistry } from '../../registry/ProviderRegistry.js';
import type { SendButtonsRequest } from '../../contracts/requests/index.js';
import type { SendResult } from '../../contracts/responses/index.js';

export class SendButtonsMessage {
  constructor(private readonly registry: ProviderRegistry) {}

  async execute(request: SendButtonsRequest): Promise<SendResult> {
    return this.registry.resolve(request.provider).sendButtons(request.instanceId, request.to, request.content);
  }
}
