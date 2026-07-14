import type { Instance } from '../../core/entities/Instance.js';
import type { ConnectResult } from '../../core/interfaces/CommunicationProvider.js';

export type { ConnectResult, InstanceStatus, SendResult } from '../../core/interfaces/CommunicationProvider.js';

/** Resultado de checkNumbers: só os números válidos, já limpos. */
export type CheckNumbersResponse = string[];

// ============================================================================
// Respostas da API HTTP (api/)
// ============================================================================

export type { Instance } from '../../core/entities/Instance.js';

export interface CreateInstanceApiResponse {
  instance: Instance;
  connect: ConnectResult;
}
