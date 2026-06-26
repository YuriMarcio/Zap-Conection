// Cliente principal
export { EvolutionClient } from './EvolutionClient.js';

// Factory (cria a partir de env vars)
export { createEvolutionClient } from './factory.js';

// Tipos e contratos
export type {
  CarouselCard,
  CreateInstanceOptions,
  EvolutionClientConfig,
  IEvolutionClient,
  InstanceStatus,
  ListSection,
  ReplyButton,
  WebhookOptions,
  WhatsAppNumberResult,
} from './contracts/types.js';

// Exceção
export { EvolutionApiError } from './exceptions/EvolutionApiError.js';

// Suporte a prospecção
export { ThrottledSender } from './support/ThrottledSender.js';
export type { BatchCallbacks, BatchResult, ThrottledSenderOptions } from './support/ThrottledSender.js';
