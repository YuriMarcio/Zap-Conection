import type { ProviderRegistry } from '../../registry/ProviderRegistry.js';
import type { SendReactionRequest } from '../../contracts/requests/index.js';
import type { SendResult } from '../../contracts/responses/index.js';

export class SendReaction {
  constructor(private readonly registry: ProviderRegistry) {}

  async execute(request: SendReactionRequest): Promise<SendResult> {
    return this.registry
      .resolve(request.provider)
      .sendReaction(request.instanceId, request.to, request.messageId, request.emoji);
  }
}
