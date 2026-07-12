import type { ProviderRegistry } from '../../registry/ProviderRegistry.js';
import type { SendCarouselRequest } from '../../contracts/requests/index.js';
import type { SendResult } from '../../contracts/responses/index.js';

export class SendCarouselMessage {
  constructor(private readonly registry: ProviderRegistry) {}

  async execute(request: SendCarouselRequest): Promise<SendResult> {
    return this.registry
      .resolve(request.provider)
      .sendCarousel(request.instanceId, request.to, request.content, request.providerOptions);
  }
}
