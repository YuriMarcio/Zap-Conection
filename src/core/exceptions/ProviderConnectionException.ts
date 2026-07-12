import type { WhatsAppProviderName } from '../interfaces/CommunicationProvider.js';

/**
 * Lançada quando não é possível estabelecer/verificar a conexão de uma instância
 * (ex.: falha de rede ao consultar status, timeout ao conectar).
 */
export class ProviderConnectionException extends Error {
  constructor(
    public readonly provider: WhatsAppProviderName,
    public readonly instanceId: string,
    cause: unknown,
  ) {
    super(`[${provider}] falha ao conectar instância "${instanceId}": ${String(cause)}`);
    this.name = 'ProviderConnectionException';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ProviderConnectionException);
    }
  }
}
