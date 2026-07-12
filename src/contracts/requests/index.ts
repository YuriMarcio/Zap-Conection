import type {
  ButtonsContent,
  CarouselContent,
  CarouselProviderOptions,
  ListContent,
  SendTextOptions,
  WebhookConfig,
  WhatsAppProviderName,
} from '../dto/index.js';

/**
 * Toda operação da Application layer recebe um Request com essa forma — já preparado para
 * ser mapeado 1:1 a partir de um body HTTP quando a camada api/ existir, sem exigir mudanças
 * nos use-cases.
 */
export interface BaseProviderRequest {
  provider: WhatsAppProviderName;
  instanceId: string;
}

export interface ConnectInstanceRequest extends BaseProviderRequest {}
export interface DisconnectInstanceRequest extends BaseProviderRequest {}
export interface GetInstanceStatusRequest extends BaseProviderRequest {}

export interface SetWebhookRequest extends BaseProviderRequest {
  config: WebhookConfig;
}

export interface CheckNumbersRequest extends BaseProviderRequest {
  numbers: string[];
}

export interface SendTextRequest extends BaseProviderRequest {
  to: string;
  text: string;
  options?: SendTextOptions;
}

export interface SendImageRequest extends BaseProviderRequest {
  to: string;
  mediaUrl: string;
  caption?: string;
}

export interface SendAudioRequest extends BaseProviderRequest {
  to: string;
  mediaUrl: string;
}

export interface SendVideoRequest extends BaseProviderRequest {
  to: string;
  mediaUrl: string;
  caption?: string;
}

export interface SendDocumentRequest extends BaseProviderRequest {
  to: string;
  mediaUrl: string;
  fileName: string;
}

export interface SendLocationRequest extends BaseProviderRequest {
  to: string;
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface SendButtonsRequest extends BaseProviderRequest {
  to: string;
  content: ButtonsContent;
}

export interface SendListRequest extends BaseProviderRequest {
  to: string;
  content: ListContent;
}

export interface SendCarouselRequest extends BaseProviderRequest {
  to: string;
  content: CarouselContent;
  providerOptions?: CarouselProviderOptions;
}

export interface SendReactionRequest extends BaseProviderRequest {
  to: string;
  messageId: string;
  emoji: string;
}
