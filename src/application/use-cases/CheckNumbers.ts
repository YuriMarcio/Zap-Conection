import type { ProviderRegistry } from '../../registry/ProviderRegistry.js';
import type { CheckNumbersRequest } from '../../contracts/requests/index.js';
import type { CheckNumbersResponse } from '../../contracts/responses/index.js';

export class CheckNumbers {
  constructor(private readonly registry: ProviderRegistry) {}

  async execute(request: CheckNumbersRequest): Promise<CheckNumbersResponse> {
    return this.registry.resolve(request.provider).checkNumbers(request.instanceId, request.numbers);
  }
}
