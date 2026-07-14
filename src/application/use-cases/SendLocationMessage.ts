import type { ProviderRegistry } from '../../registry/ProviderRegistry.js';
import type { SendLocationRequest } from '../../contracts/requests/index.js';
import type { SendResult } from '../../contracts/responses/index.js';

export class SendLocationMessage {
  constructor(private readonly registry: ProviderRegistry) {}

  async execute(request: SendLocationRequest): Promise<SendResult> {
    return this.registry
      .resolve(request.provider)
      .sendLocation(request.instanceId, request.to, request.latitude, request.longitude, request.name, request.address);
  }
}
