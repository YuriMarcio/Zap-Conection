import type { ProviderRegistry } from '../../registry/ProviderRegistry.js';
import type { SendImageRequest } from '../../contracts/requests/index.js';
import type { SendResult } from '../../contracts/responses/index.js';

export class SendImageMessage {
  constructor(private readonly registry: ProviderRegistry) {}

  async execute(request: SendImageRequest): Promise<SendResult> {
    return this.registry.resolve(request.provider).sendImage(request.instanceId, request.to, request.mediaUrl, request.caption);
  }
}
