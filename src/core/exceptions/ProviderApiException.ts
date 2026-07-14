import type { WhatsAppProviderName } from '../interfaces/CommunicationProvider.js';

/**
 * Erro genérico de chamada a um provider (resposta 4xx/5xx). Generaliza o que hoje é
 * `EvolutionApiError`, para ser reaproveitado pelos três providers.
 */
export class ProviderApiException extends Error {
  constructor(
    message: string,
    public readonly provider: WhatsAppProviderName,
    public readonly endpoint: string,
    public readonly statusCode: number,
    public readonly responseBody: unknown = null,
  ) {
    super(message);
    this.name = 'ProviderApiException';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ProviderApiException);
    }
  }

  static fromResponse(
    provider: WhatsAppProviderName,
    endpoint: string,
    status: number,
    body: unknown,
  ): ProviderApiException {
    const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
    return new ProviderApiException(
      `[${provider}] API error [${status}] on ${endpoint}: ${bodyStr}`,
      provider,
      endpoint,
      status,
      body,
    );
  }
}
