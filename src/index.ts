// ============================================================================
// Compatibilidade — mesmo comportamento e mesmos nomes que `@sinal/evolution-client` já
// expõe hoje. Não remover/renomear nada aqui sem avaliar o impacto no SINAL.
// ============================================================================

export { EvolutionClient, createEvolutionClient, EvolutionApiError } from './compat/index.js';
export type {
  CreateInstanceOptions,
  EvolutionClientConfig,
  IEvolutionClient,
  WebhookOptions,
  WhatsAppNumberResult,
  LegacyCarouselCard as CarouselCard,
  LegacyInstanceStatus as InstanceStatus,
  LegacyListSection as ListSection,
  LegacyReplyButton as ReplyButton,
} from './compat/index.js';

export { ThrottledSender } from './support/ThrottledSender.js';
export type { BatchCallbacks, BatchResult, ThrottledSenderOptions } from './support/ThrottledSender.js';

// ============================================================================
// FlowBridge — SDK multi-provider (Evolution, Z-API, Meta Cloud API). `ReplyButton`,
// `CarouselCard`, `ListSection` e `InstanceStatus` colidem de nome com os tipos legados
// acima (formas diferentes) — aqui saem prefixados com `WhatsApp` para não colidir.
// ============================================================================

export { createFlowBridgeClient } from './application/factories/FlowBridgeClientFactory.js';
export type { FlowBridgeClientConfig } from './application/factories/FlowBridgeClientFactory.js';
export { FlowBridgeClient } from './application/FlowBridgeClient.js';
export { ProviderRegistry } from './registry/ProviderRegistry.js';

export { EvolutionProvider } from './providers/evolution/EvolutionProvider.js';
export { ZApiProvider } from './providers/zapi/ZApiProvider.js';
export { MetaCloudApiProvider } from './providers/meta/MetaCloudApiProvider.js';

export type { CommunicationProvider } from './core/interfaces/CommunicationProvider.js';
export type { Logger, LogContext } from './core/interfaces/Logger.js';
export type { EventPublisher } from './core/interfaces/EventPublisher.js';
export { ConsoleLogger } from './infrastructure/logging/ConsoleLogger.js';
export { PhoneNumber } from './core/value-objects/PhoneNumber.js';

export { ProviderApiException } from './core/exceptions/ProviderApiException.js';
export { UnsupportedProviderOperationException } from './core/exceptions/UnsupportedProviderOperationException.js';
export { ProviderConnectionException } from './core/exceptions/ProviderConnectionException.js';

// ============================================================================
// API HTTP (api/) — infraestrutura para rodar o FlowBridge como microsserviço,
// necessária para consumidores que não são TS/Node (ex.: PHP). `buildServer` monta o
// Fastify app sem chamar `listen`, útil para testes com `app.inject()`; o processo real
// (`npm run dev`/`start`) usa `src/api/server.ts`, que não é exportado por não fazer sentido
// importar (ele chama `listen` e `process.exit` como side effect ao ser carregado).
// ============================================================================

export { buildServer } from './api/buildServer.js';
export type { BuildServerOptions, BuiltServer } from './api/buildServer.js';

export { InstanceProviderRegistry } from './application/InstanceProviderRegistry.js';
export type { InstanceCredentials } from './application/InstanceProviderRegistry.js';

export type { InstanceRepository } from './core/interfaces/InstanceRepository.js';
export { InMemoryInstanceRepository } from './infrastructure/persistence/InMemoryInstanceRepository.js';
export { PostgresInstanceRepository } from './infrastructure/persistence/PostgresInstanceRepository.js';
export type { PostgresConfig, RetryOptions } from './infrastructure/persistence/PostgresInstanceRepository.js';
export { HttpForwardingEventPublisher } from './infrastructure/events/HttpForwardingEventPublisher.js';
export type { Instance, InstanceConnectionState } from './core/entities/Instance.js';

export type {
  ButtonsContent,
  CarouselContent,
  CarouselProviderOptions,
  ConnectResult,
  EvolutionProviderConfig,
  ListContent,
  MetaProviderConfig,
  ProviderConfig,
  SendResult,
  SendTextOptions,
  WebhookConfig,
  WhatsAppProviderName,
  ZApiProviderConfig,
  HistorySyncWebhookPayload,
  SmbAppStateSyncWebhookPayload,
  SmbMessageEchoWebhookPayload,
  ReplyButton as WhatsAppReplyButton,
  CarouselCard as WhatsAppCarouselCard,
  ListSection as WhatsAppListSection,
  ListSectionRow as WhatsAppListSectionRow,
  InstanceStatus as WhatsAppInstanceStatus,
} from './contracts/dto/index.js';

export type {
  BaseProviderRequest,
  CheckNumbersRequest,
  ConnectInstanceRequest,
  CreateInstanceApiRequest,
  DisconnectInstanceRequest,
  GetInstanceStatusRequest,
  SendAudioRequest,
  SendButtonsRequest,
  SendCarouselRequest,
  SendDocumentRequest,
  SendImageRequest,
  SendListRequest,
  SendLocationRequest,
  SendReactionRequest,
  SendTextRequest,
  SendVideoRequest,
  SetWebhookRequest,
} from './contracts/requests/index.js';

export type { CheckNumbersResponse, CreateInstanceApiResponse } from './contracts/responses/index.js';

export * from './core/events/index.js';
