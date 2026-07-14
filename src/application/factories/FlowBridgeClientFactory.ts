import type { CommunicationProvider } from '../../core/interfaces/CommunicationProvider.js';
import type { EventPublisher } from '../../core/interfaces/EventPublisher.js';
import type { Logger } from '../../core/interfaces/Logger.js';
import { ConsoleLogger } from '../../infrastructure/logging/ConsoleLogger.js';
import { ProviderRegistry } from '../../registry/ProviderRegistry.js';
import { EvolutionProvider } from '../../providers/evolution/EvolutionProvider.js';
import { ZApiProvider } from '../../providers/zapi/ZApiProvider.js';
import { MetaCloudApiProvider } from '../../providers/meta/MetaCloudApiProvider.js';
import type { ProviderConfig } from '../../contracts/dto/index.js';
import { readEvolutionEnv, readMetaEnv, readZApiEnv } from '../../config/env.js';
import { FlowBridgeClient } from '../FlowBridgeClient.js';

export interface FlowBridgeClientConfig {
  /** Providers a registrar. Se omitido, tenta ler de variáveis de ambiente (ver config/env.ts). */
  providers?: ProviderConfig[];
  logger?: Logger;
  eventPublisher?: EventPublisher;
}

function buildProvider(config: ProviderConfig, logger: Logger, eventPublisher?: EventPublisher): CommunicationProvider {
  switch (config.name) {
    case 'evolution':
      return new EvolutionProvider(config, logger, eventPublisher);
    case 'zapi':
      return new ZApiProvider(config, logger, eventPublisher);
    case 'meta':
      return new MetaCloudApiProvider(config, logger, eventPublisher);
  }
}

/**
 * Cria o SDK do FlowBridge: lê configuração (explícita ou de env vars), instancia cada
 * provider configurado, registra no ProviderRegistry e devolve a fachada (FlowBridgeClient)
 * que a aplicação consumidora usa. Esse é o único lugar do sistema que faz o mapeamento
 * "nome do provider → classe concreta" — é o próprio papel do Provider Registry, não uma
 * exceção à regra de nunca ramificar por provider fora dele.
 */
export function createFlowBridgeClient(config: FlowBridgeClientConfig = {}): FlowBridgeClient {
  const logger = config.logger ?? new ConsoleLogger();
  const providerConfigs = config.providers ?? [readEvolutionEnv(), readZApiEnv(), readMetaEnv()].filter(
    (providerConfig): providerConfig is NonNullable<typeof providerConfig> => providerConfig !== undefined,
  );

  if (providerConfigs.length === 0) {
    throw new Error(
      '[FlowBridge] Nenhum provider configurado. Informe `providers` explicitamente ou defina as variáveis ' +
        'de ambiente de ao menos um provider (EVOLUTION_*, ZAPI_* ou WHATSAPP_CLOUD_*).',
    );
  }

  const registry = new ProviderRegistry();
  for (const providerConfig of providerConfigs) {
    registry.register(buildProvider(providerConfig, logger, config.eventPublisher));
  }

  return new FlowBridgeClient(registry);
}
