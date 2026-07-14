import type { CommunicationProvider, WhatsAppProviderName } from '../core/interfaces/CommunicationProvider.js';
import type { EventPublisher } from '../core/interfaces/EventPublisher.js';
import type { Logger } from '../core/interfaces/Logger.js';
import type { ProviderRegistry } from '../registry/ProviderRegistry.js';
import { ZApiProvider } from '../providers/zapi/ZApiProvider.js';
import { MetaCloudApiProvider } from '../providers/meta/MetaCloudApiProvider.js';
import type { InstanceCredentials } from '../contracts/requests/index.js';

export type { InstanceCredentials } from '../contracts/requests/index.js';

/**
 * Resolve o CommunicationProvider concreto de cada instância criada via API HTTP.
 *
 * A Evolution já é multi-tenant nativamente (um client, N instanceId) — usa sempre o provider
 * compartilhado do ProviderRegistry (registrado uma vez a partir das env vars, igual ao SDK
 * embutido). Z-API e Meta Cloud API não têm esse conceito: cada client representa uma única
 * credencial fixa. Por isso, para essas duas, esta classe constrói (e reaproveita) um provider
 * por instância a partir das credenciais informadas na criação da instância.
 */
export class InstanceProviderRegistry {
  private readonly perInstanceProviders = new Map<string, CommunicationProvider>();

  constructor(
    private readonly sharedRegistry: ProviderRegistry,
    private readonly logger: Logger,
    private readonly eventPublisher?: EventPublisher,
  ) {}

  create(instanceId: string, providerName: WhatsAppProviderName, credentials?: InstanceCredentials): CommunicationProvider {
    if (providerName === 'evolution') {
      return this.sharedRegistry.resolve('evolution');
    }

    if (providerName === 'zapi') {
      if (!credentials?.instanceId || !credentials.token) {
        throw new Error('Credenciais da Z-API (instanceId, token) são obrigatórias para criar esta instância.');
      }
      const provider = new ZApiProvider(
        { name: 'zapi', instanceId: credentials.instanceId, token: credentials.token, clientToken: credentials.clientToken },
        this.logger,
        this.eventPublisher,
      );
      this.perInstanceProviders.set(instanceId, provider);
      return provider;
    }

    if (providerName !== 'meta') {
      const exhaustive: never = providerName;
      throw new Error(`Provider desconhecido: "${String(exhaustive)}". Valores aceitos: evolution, zapi, meta.`);
    }

    if (!credentials?.phoneNumberId || !credentials.accessToken) {
      throw new Error('Credenciais da Meta Cloud API (phoneNumberId, accessToken) são obrigatórias para criar esta instância.');
    }
    const provider = new MetaCloudApiProvider(
      {
        name: 'meta',
        phoneNumberId: credentials.phoneNumberId,
        accessToken: credentials.accessToken,
        wabaId: credentials.wabaId,
        apiVersion: credentials.apiVersion,
        appSecret: credentials.appSecret,
      },
      this.logger,
      this.eventPublisher,
    );
    this.perInstanceProviders.set(instanceId, provider);
    return provider;
  }

  resolve(instanceId: string, providerName: WhatsAppProviderName): CommunicationProvider {
    if (providerName === 'evolution') {
      return this.sharedRegistry.resolve('evolution');
    }

    const provider = this.perInstanceProviders.get(instanceId);
    if (!provider) {
      throw new Error(`Instância "${instanceId}" não encontrada (provider "${providerName}" não foi criado nesta instância da API).`);
    }
    return provider;
  }

  delete(instanceId: string): void {
    this.perInstanceProviders.delete(instanceId);
  }
}
