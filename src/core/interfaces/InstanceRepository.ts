import type { Instance } from '../entities/Instance.js';

/**
 * Persistência de metadados de instância (id, provider, callbackUrl, state) usada pela API
 * HTTP para gerenciar múltiplas instâncias por provider — algo que o SDK embutido não
 * precisa, já que lá cada provider é configurado uma vez por processo.
 */
export interface InstanceRepository {
  save(instance: Instance): Promise<void>;
  findById(id: string): Promise<Instance | undefined>;
  delete(id: string): Promise<void>;
  list(): Promise<Instance[]>;
}
