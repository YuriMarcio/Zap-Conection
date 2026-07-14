import type { WhatsAppProviderName } from '../interfaces/CommunicationProvider.js';

/**
 * Lançada quando uma operação da interface CommunicationProvider é chamada num provider que
 * genuinamente não a suporta (ex.: checkNumbers na Meta Cloud API). Existe para deixar a
 * limitação explícita em vez de simular um comportamento que não existe.
 */
export class UnsupportedProviderOperationException extends Error {
  constructor(
    public readonly provider: WhatsAppProviderName,
    public readonly operation: string,
    public readonly reason: string,
  ) {
    super(`[${provider}] não suporta a operação "${operation}": ${reason}`);
    this.name = 'UnsupportedProviderOperationException';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UnsupportedProviderOperationException);
    }
  }
}
