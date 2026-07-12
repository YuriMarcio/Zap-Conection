import type { CommunicationProvider, WhatsAppProviderName } from '../core/interfaces/CommunicationProvider.js';

/**
 * Único lugar do sistema que sabe resolver um provider pelo nome. Nenhuma outra camada deve
 * ter `if (provider === 'evolution')` — sempre `registry.resolve(name)` seguido de
 * polimorfismo sobre CommunicationProvider.
 */
export class ProviderRegistry {
  private readonly providers = new Map<WhatsAppProviderName, CommunicationProvider>();

  register(provider: CommunicationProvider): void {
    this.providers.set(provider.name, provider);
  }

  resolve(name: WhatsAppProviderName): CommunicationProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Provider "${name}" não está registrado no ProviderRegistry.`);
    }
    return provider;
  }

  has(name: WhatsAppProviderName): boolean {
    return this.providers.has(name);
  }

  list(): CommunicationProvider[] {
    return [...this.providers.values()];
  }
}
