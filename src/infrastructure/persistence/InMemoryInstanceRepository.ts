import type { Instance } from '../../core/entities/Instance.js';
import type { InstanceRepository } from '../../core/interfaces/InstanceRepository.js';

/**
 * Implementação MVP de InstanceRepository — Map em memória, reinicia zerado a cada deploy.
 * Primeiro degrau de uma implementação que pode virar um repositório com banco depois, sem
 * exigir mudanças em Core, Providers ou na api/ (que só conhece a interface).
 */
export class InMemoryInstanceRepository implements InstanceRepository {
  private readonly instances = new Map<string, Instance>();

  async save(instance: Instance): Promise<void> {
    this.instances.set(instance.id, instance);
  }

  async findById(id: string): Promise<Instance | undefined> {
    return this.instances.get(id);
  }

  async delete(id: string): Promise<void> {
    this.instances.delete(id);
  }

  async list(): Promise<Instance[]> {
    return [...this.instances.values()];
  }
}
