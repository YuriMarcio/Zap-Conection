import type { WhatsAppProviderName } from '../interfaces/CommunicationProvider.js';

export type InstanceConnectionState = 'open' | 'close' | 'connecting';

/**
 * Representação de domínio de uma instância/conexão WhatsApp, independente de qual provider
 * a implementa por baixo.
 */
export interface Instance {
  readonly id: string;
  readonly provider: WhatsAppProviderName;
  readonly phoneNumber?: string;
  readonly state: InstanceConnectionState;
  /** URL para onde a API HTTP repassa os eventos normalizados desta instância. */
  readonly callbackUrl?: string;
  readonly createdAt: string;
}
