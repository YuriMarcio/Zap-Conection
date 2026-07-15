// ============================================================================
// Vocabulário compartilhado da interface CommunicationProvider.
// Definido em core/ (não em contracts/) porque é a linguagem que os próprios providers
// implementam — contracts/dto, contracts/requests e contracts/responses reexportam essas
// formas como API pública estável, sem duplicar a definição.
// ============================================================================

import type { DomainEvent } from '../events/index.js';

export type WhatsAppProviderName = 'evolution' | 'zapi' | 'meta';

export interface ReplyButton {
  id: string;
  displayText: string;
}

export interface CarouselCard {
  title?: string;
  body: string;
  footer?: string;
  imageUrl?: string;
  buttons: ReplyButton[];
}

export interface ListSectionRow {
  rowId: string;
  title: string;
  description?: string;
}

export interface ListSection {
  title: string;
  rows: ListSectionRow[];
}

export interface WebhookConfig {
  url: string;
  enabled: boolean;
  events?: string[];
}

export interface SendTextOptions {
  /** Delay antes do envio, em ms. */
  delayMs?: number;
}

export interface ButtonsContent {
  title?: string;
  body: string;
  footer?: string;
  imageUrl?: string;
  buttons: ReplyButton[];
}

export interface ListContent {
  title: string;
  description: string;
  buttonText: string;
  footer?: string;
  sections: ListSection[];
}

export interface CarouselContent {
  body: string;
  cards: CarouselCard[];
}

/**
 * Opções específicas da Meta Cloud API — o carrossel lá só existe como template
 * pré-aprovado (não é freeform como na Evolution/Z-API). Ignorado pelos outros providers.
 */
export interface CarouselProviderOptions {
  templateName?: string;
  languageCode?: string;
}

export interface ConnectResult {
  status: 'connected' | 'connecting' | 'qr_required';
  qrCode?: string;
  raw?: unknown;
}

export interface InstanceStatus {
  instanceId: string;
  state: 'open' | 'close' | 'connecting';
  raw?: unknown;
}

export interface SendResult {
  messageId?: string;
  raw: unknown;
}

/**
 * Contrato único que Evolution, Z-API e Meta Cloud API implementam. Nenhuma camada acima
 * (application/use-cases, SDK) conhece detalhes de um provider específico — tudo passa por
 * aqui, resolvido via ProviderRegistry.
 *
 * Operações que um provider genuinamente não suporta (ex.: checkNumbers na Meta) lançam
 * UnsupportedProviderOperationException em vez de simular um comportamento inexistente.
 */
export interface CommunicationProvider {
  readonly name: WhatsAppProviderName;

  connect(instanceId: string): Promise<ConnectResult>;
  /**
   * Busca um QR code novo para uma instância que já existe, sem recriá-la — necessário
   * porque o QR do Baileys (Evolution/Z-API) expira em segundos e `connect()` sozinho não dá
   * para chamar de novo sem risco de tentar recriar a instância. Lança
   * UnsupportedProviderOperationException na Meta (não existe conceito de QR na Cloud API).
   */
  getQrCode(instanceId: string): Promise<ConnectResult>;
  disconnect(instanceId: string): Promise<void>;
  getStatus(instanceId: string): Promise<InstanceStatus>;
  setWebhook(instanceId: string, config: WebhookConfig): Promise<void>;
  checkNumbers(instanceId: string, numbers: string[]): Promise<string[]>;

  sendText(instanceId: string, to: string, text: string, options?: SendTextOptions): Promise<SendResult>;
  sendImage(instanceId: string, to: string, mediaUrl: string, caption?: string): Promise<SendResult>;
  sendAudio(instanceId: string, to: string, mediaUrl: string): Promise<SendResult>;
  sendVideo(instanceId: string, to: string, mediaUrl: string, caption?: string): Promise<SendResult>;
  sendDocument(instanceId: string, to: string, mediaUrl: string, fileName: string): Promise<SendResult>;
  sendLocation(
    instanceId: string,
    to: string,
    latitude: number,
    longitude: number,
    name?: string,
    address?: string,
  ): Promise<SendResult>;

  sendButtons(instanceId: string, to: string, content: ButtonsContent): Promise<SendResult>;
  sendList(instanceId: string, to: string, content: ListContent): Promise<SendResult>;
  sendCarousel(
    instanceId: string,
    to: string,
    content: CarouselContent,
    providerOptions?: CarouselProviderOptions,
  ): Promise<SendResult>;
  sendReaction(instanceId: string, to: string, messageId: string, emoji: string): Promise<SendResult>;

  /**
   * Normaliza o corpo bruto de um webhook recebido DO provider em eventos de domínio. Recebe
   * o Buffer bruto (não o JSON já parseado) porque a Meta exige validar a assinatura
   * X-Hub-Signature-256 sobre os bytes originais antes de qualquer parsing.
   */
  parseWebhookPayload(rawBody: Buffer, headers: Record<string, string>): DomainEvent[];
}
