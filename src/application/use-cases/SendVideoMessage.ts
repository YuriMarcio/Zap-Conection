import type { ProviderRegistry } from '../../registry/ProviderRegistry.js';
import type { SendVideoRequest } from '../../contracts/requests/index.js';
import type { SendResult } from '../../contracts/responses/index.js';

export class SendVideoMessage {
  constructor(private readonly registry: ProviderRegistry) {}

  async execute(request: SendVideoRequest): Promise<SendResult> {
    return this.registry.resolve(request.provider).sendVideo(request.instanceId, request.to, request.mediaUrl, request.caption);
  }
}
