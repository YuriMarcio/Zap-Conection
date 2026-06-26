import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { EvolutionApiError } from './exceptions/EvolutionApiError.js';
import type {
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

export class EvolutionClient implements IEvolutionClient {
  private readonly http: AxiosInstance;
  private readonly throwOnError: boolean;

  constructor(config: EvolutionClientConfig) {
    this.throwOnError = config.throwOnError ?? false;

    this.http = axios.create({
      baseURL: config.baseUrl.replace(/\/$/, ''),
      timeout: config.timeout ?? 15_000,
      headers: {
        apikey: config.apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  // ==========================================================================
  // HTTP base
  // ==========================================================================

  private async post<T = unknown>(endpoint: string, payload: unknown = {}): Promise<T> {
    try {
      const res: AxiosResponse<T> = await this.http.post(endpoint, payload);
      return res.data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        const error = EvolutionApiError.fromResponse(endpoint, err.response.status, err.response.data);
        if (this.throwOnError) throw error;
        // silencioso: loga e retorna vazio
        console.error(`[EvolutionClient] ${error.message}`);
        return {} as T;
      }
      throw err;
    }
  }

  private async get<T = unknown>(endpoint: string): Promise<T> {
    try {
      const res: AxiosResponse<T> = await this.http.get(endpoint);
      return res.data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        const error = EvolutionApiError.fromResponse(endpoint, err.response.status, err.response.data);
        if (this.throwOnError) throw error;
        console.error(`[EvolutionClient] ${error.message}`);
        return {} as T;
      }
      throw err;
    }
  }

  private async delete<T = unknown>(endpoint: string): Promise<T> {
    try {
      const res: AxiosResponse<T> = await this.http.delete(endpoint);
      return res.data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        const error = EvolutionApiError.fromResponse(endpoint, err.response.status, err.response.data);
        if (this.throwOnError) throw error;
        console.error(`[EvolutionClient] ${error.message}`);
        return {} as T;
      }
      throw err;
    }
  }

  // ==========================================================================
  // Instâncias
  // ==========================================================================

  async createInstance(options: CreateInstanceOptions): Promise<Record<string, unknown>> {
    return this.post('/instance/create', {
      instanceName: options.instanceName,
      qrcode: options.qrcode ?? true,
      integration: options.integration ?? 'WHATSAPP-BAILEYS',
    });
  }

  async setWebhook(instanceName: string, options: WebhookOptions): Promise<Record<string, unknown>> {
    return this.post(`/webhook/set/${instanceName}`, {
      webhook: {
        enabled: options.enabled,
        url: options.url,
        events: options.events ?? ['MESSAGES_UPSERT'],
      },
    });
  }

  async getQrCode(instanceName: string): Promise<Record<string, unknown>> {
    return this.get(`/instance/connect/${instanceName}`);
  }

  async getInstanceStatus(instanceName: string): Promise<InstanceStatus> {
    return this.get(`/instance/connectionState/${instanceName}`);
  }

  async deleteInstance(instanceName: string): Promise<Record<string, unknown>> {
    return this.delete(`/instance/delete/${instanceName}`);
  }

  // ==========================================================================
  // Validação de números  ← chave para prospecção
  // ==========================================================================

  /**
   * Valida em lote quais números existem no WhatsApp.
   * Retorna apenas os válidos, limpos (sem @s.whatsapp.net).
   *
   * Sempre chame isso antes de qualquer disparo em lote —
   * enviar para números inexistentes aumenta o score de ban da instância Baileys.
   *
   * @example
   * const valid = await client.checkNumbers('prospeccao-01', ['5598999990000', '5511000000000']);
   * // → ['5598999990000']
   */
  async checkNumbers(instanceName: string, numbers: string[]): Promise<string[]> {
    if (numbers.length === 0) return [];

    const results = await this.post<WhatsAppNumberResult[]>(
      `/chat/whatsappNumbers/${instanceName}`,
      { numbers },
    );

    if (!Array.isArray(results)) {
      console.warn('[EvolutionClient] checkNumbers: resposta inesperada', results);
      return [];
    }

    return results
      .filter((item) => item.exists === true)
      .map((item) => item.jid.replace('@s.whatsapp.net', ''));
  }

  // ==========================================================================
  // Mensagens
  // ==========================================================================

  async sendText(instanceName: string, number: string, text: string, delay = 1200): Promise<unknown> {
    return this.post(`/message/sendText/${instanceName}`, { number, text, delay });
  }

  async sendImage(instanceName: string, number: string, imageUrl: string, caption = ''): Promise<unknown> {
    return this.post(`/message/sendMedia/${instanceName}`, {
      number,
      mediatype: 'image',
      media: imageUrl,
      caption,
    });
  }

  async sendAudio(instanceName: string, number: string, audioUrl: string): Promise<unknown> {
    return this.post(`/message/sendWhatsAppAudio/${instanceName}`, { number, audio: audioUrl });
  }

  async sendDocument(
    instanceName: string,
    number: string,
    documentUrl: string,
    fileName: string,
  ): Promise<unknown> {
    return this.post(`/message/sendMedia/${instanceName}`, {
      number,
      mediatype: 'document',
      media: documentUrl,
      fileName,
    });
  }

  async sendButtons(
    instanceName: string,
    number: string,
    title: string,
    description: string,
    footer: string,
    buttons: ReplyButton[],
  ): Promise<unknown> {
    return this.post(`/message/sendButtons/${instanceName}`, {
      number,
      title,
      description,
      footer,
      buttons,
      delay: 1000,
    });
  }

  async sendButtonsWithImage(
    instanceName: string,
    number: string,
    title: string,
    description: string,
    imageUrl: string,
    buttons: ReplyButton[],
  ): Promise<unknown> {
    return this.post(`/message/sendButtons/${instanceName}`, {
      number,
      thumbnailUrl: imageUrl,
      title,
      description,
      buttons,
      delay: 1000,
    });
  }

  async sendCarousel(
    instanceName: string,
    number: string,
    body: string,
    cards: CarouselCard[],
  ): Promise<unknown> {
    console.info(`[EvolutionClient] Enviando carrossel para ${number} com ${cards.length} cards`);
    return this.post(`/message/sendCarousel/${instanceName}`, { number, body, cards, delay: 1000 });
  }

  async sendList(
    instanceName: string,
    number: string,
    title: string,
    description: string,
    buttonText: string,
    footer: string,
    sections: ListSection[],
  ): Promise<unknown> {
    return this.post(`/message/sendList/${instanceName}`, {
      number,
      title,
      description,
      buttonText,
      footerText: footer,
      sections,
    });
  }

  async sendReaction(
    instanceName: string,
    number: string,
    messageId: string,
    emoji: string,
  ): Promise<unknown> {
    return this.post(`/message/sendReaction/${instanceName}`, {
      reactionMessage: {
        key: {
          remoteJid: `${number}@s.whatsapp.net`,
          fromMe: false,
          id: messageId,
        },
        reaction: emoji,
      },
    });
  }
}
