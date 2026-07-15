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
  /**
   * Credenciais da instância (Z-API/Meta — Evolution não usa, credenciais são globais).
   * Precisa ser persistido: é o que permite reconstruir o CommunicationProvider depois de um
   * restart do processo (ver InstanceProviderRegistry.resolve). Contém segredo em texto
   * plano — o repositório usado em produção precisa proteger esse dado (ver README).
   */
  readonly credentials?: Record<string, string>;
  readonly createdAt: string;
}
