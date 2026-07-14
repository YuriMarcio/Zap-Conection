// ============================================================================
// Camada de compatibilidade — mantém exatamente o mesmo comportamento que o SINAL já
// consome hoje via `@sinal/evolution-client` (EvolutionClient, createEvolutionClient,
// IEvolutionClient, EvolutionApiError). Congelada de propósito: implementação própria,
// independente do EvolutionProvider da nova arquitetura, para não arriscar mudar
// comportamento de um consumidor em produção durante a reestruturação.
// ============================================================================

export { EvolutionClient } from './EvolutionClient.js';
export { createEvolutionClient } from './createEvolutionClient.js';
export { EvolutionApiError } from './EvolutionApiError.js';
export type {
  CarouselCard as LegacyCarouselCard,
  CreateInstanceOptions,
  EvolutionClientConfig,
  IEvolutionClient,
  InstanceStatus as LegacyInstanceStatus,
  ListSection as LegacyListSection,
  ReplyButton as LegacyReplyButton,
  WebhookOptions,
  WhatsAppNumberResult,
} from './types.js';
