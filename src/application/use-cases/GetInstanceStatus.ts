import type { ProviderRegistry } from '../../registry/ProviderRegistry.js';
import type { GetInstanceStatusRequest } from '../../contracts/requests/index.js';
import type { InstanceStatus } from '../../contracts/responses/index.js';

export class GetInstanceStatus {
  constructor(private readonly registry: ProviderRegistry) {}

  async execute(request: GetInstanceStatusRequest): Promise<InstanceStatus> {
    return this.registry.resolve(request.provider).getStatus(request.instanceId);
  }
}
