import type { ProviderRegistry } from '../../registry/ProviderRegistry.js';
import type { SendListRequest } from '../../contracts/requests/index.js';
import type { SendResult } from '../../contracts/responses/index.js';

export class SendListMessage {
  constructor(private readonly registry: ProviderRegistry) {}

  async execute(request: SendListRequest): Promise<SendResult> {
    return this.registry.resolve(request.provider).sendList(request.instanceId, request.to, request.content);
  }
}
