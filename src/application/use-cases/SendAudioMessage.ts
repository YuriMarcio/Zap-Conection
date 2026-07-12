import type { ProviderRegistry } from '../../registry/ProviderRegistry.js';
import type { SendAudioRequest } from '../../contracts/requests/index.js';
import type { SendResult } from '../../contracts/responses/index.js';

export class SendAudioMessage {
  constructor(private readonly registry: ProviderRegistry) {}

  async execute(request: SendAudioRequest): Promise<SendResult> {
    return this.registry.resolve(request.provider).sendAudio(request.instanceId, request.to, request.mediaUrl);
  }
}
