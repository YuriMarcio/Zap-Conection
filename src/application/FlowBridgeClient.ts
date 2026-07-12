import type { ProviderRegistry } from '../registry/ProviderRegistry.js';
import {
  CheckNumbers,
  ConnectInstance,
  DisconnectInstance,
  GetInstanceStatus,
  SendAudioMessage,
  SendButtonsMessage,
  SendCarouselMessage,
  SendDocumentMessage,
  SendImageMessage,
  SendListMessage,
  SendLocationMessage,
  SendReaction,
  SendTextMessage,
  SendVideoMessage,
  SetWebhook,
} from './use-cases/index.js';
import type {
  CheckNumbersRequest,
  ConnectInstanceRequest,
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
} from '../contracts/requests/index.js';
import type { CheckNumbersResponse, ConnectResult, InstanceStatus, SendResult } from '../contracts/responses/index.js';

/**
 * Fachada que a aplicação consumidora usa — é o SDK oficial do FlowBridge. Por baixo, cada
 * método só delega para o use-case correspondente (application/use-cases/), que por sua vez
 * resolve o provider certo através do ProviderRegistry. Nenhum método aqui conhece detalhes
 * de Evolution/Z-API/Meta.
 */
export class FlowBridgeClient {
  private readonly connectInstance: ConnectInstance;
  private readonly disconnectInstance: DisconnectInstance;
  private readonly getInstanceStatus: GetInstanceStatus;
  private readonly setWebhookUseCase: SetWebhook;
  private readonly checkNumbersUseCase: CheckNumbers;
  private readonly sendTextMessage: SendTextMessage;
  private readonly sendImageMessage: SendImageMessage;
  private readonly sendAudioMessage: SendAudioMessage;
  private readonly sendVideoMessage: SendVideoMessage;
  private readonly sendDocumentMessage: SendDocumentMessage;
  private readonly sendLocationMessage: SendLocationMessage;
  private readonly sendButtonsMessage: SendButtonsMessage;
  private readonly sendListMessage: SendListMessage;
  private readonly sendCarouselMessage: SendCarouselMessage;
  private readonly sendReactionUseCase: SendReaction;

  constructor(registry: ProviderRegistry) {
    this.connectInstance = new ConnectInstance(registry);
    this.disconnectInstance = new DisconnectInstance(registry);
    this.getInstanceStatus = new GetInstanceStatus(registry);
    this.setWebhookUseCase = new SetWebhook(registry);
    this.checkNumbersUseCase = new CheckNumbers(registry);
    this.sendTextMessage = new SendTextMessage(registry);
    this.sendImageMessage = new SendImageMessage(registry);
    this.sendAudioMessage = new SendAudioMessage(registry);
    this.sendVideoMessage = new SendVideoMessage(registry);
    this.sendDocumentMessage = new SendDocumentMessage(registry);
    this.sendLocationMessage = new SendLocationMessage(registry);
    this.sendButtonsMessage = new SendButtonsMessage(registry);
    this.sendListMessage = new SendListMessage(registry);
    this.sendCarouselMessage = new SendCarouselMessage(registry);
    this.sendReactionUseCase = new SendReaction(registry);
  }

  connect(request: ConnectInstanceRequest): Promise<ConnectResult> {
    return this.connectInstance.execute(request);
  }

  disconnect(request: DisconnectInstanceRequest): Promise<void> {
    return this.disconnectInstance.execute(request);
  }

  getStatus(request: GetInstanceStatusRequest): Promise<InstanceStatus> {
    return this.getInstanceStatus.execute(request);
  }

  setWebhook(request: SetWebhookRequest): Promise<void> {
    return this.setWebhookUseCase.execute(request);
  }

  checkNumbers(request: CheckNumbersRequest): Promise<CheckNumbersResponse> {
    return this.checkNumbersUseCase.execute(request);
  }

  sendText(request: SendTextRequest): Promise<SendResult> {
    return this.sendTextMessage.execute(request);
  }

  sendImage(request: SendImageRequest): Promise<SendResult> {
    return this.sendImageMessage.execute(request);
  }

  sendAudio(request: SendAudioRequest): Promise<SendResult> {
    return this.sendAudioMessage.execute(request);
  }

  sendVideo(request: SendVideoRequest): Promise<SendResult> {
    return this.sendVideoMessage.execute(request);
  }

  sendDocument(request: SendDocumentRequest): Promise<SendResult> {
    return this.sendDocumentMessage.execute(request);
  }

  sendLocation(request: SendLocationRequest): Promise<SendResult> {
    return this.sendLocationMessage.execute(request);
  }

  sendButtons(request: SendButtonsRequest): Promise<SendResult> {
    return this.sendButtonsMessage.execute(request);
  }

  sendList(request: SendListRequest): Promise<SendResult> {
    return this.sendListMessage.execute(request);
  }

  sendCarousel(request: SendCarouselRequest): Promise<SendResult> {
    return this.sendCarouselMessage.execute(request);
  }

  sendReaction(request: SendReactionRequest): Promise<SendResult> {
    return this.sendReactionUseCase.execute(request);
  }
}
