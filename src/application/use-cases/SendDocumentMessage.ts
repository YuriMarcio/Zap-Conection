import type { ProviderRegistry } from '../../registry/ProviderRegistry.js';
import type { SendDocumentRequest } from '../../contracts/requests/index.js';
import type { SendResult } from '../../contracts/responses/index.js';

export class SendDocumentMessage {
  constructor(private readonly registry: ProviderRegistry) {}

  async execute(request: SendDocumentRequest): Promise<SendResult> {
    return this.registry
      .resolve(request.provider)
      .sendDocument(request.instanceId, request.to, request.mediaUrl, request.fileName);
  }
}
