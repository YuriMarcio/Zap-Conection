import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { ProviderApiException } from '../../core/exceptions/ProviderApiException.js';
import type { Logger } from '../../core/interfaces/Logger.js';
import type { WhatsAppProviderName } from '../../core/interfaces/CommunicationProvider.js';

export interface ProviderHttpClientOptions {
  provider: WhatsAppProviderName;
  axiosInstance: AxiosInstance;
  logger: Logger;
  throwOnError: boolean;
}

/**
 * Wrapper fino de HTTP reaproveitado pelos três providers: mesmo tratamento de erro (loga e
 * retorna {} quando throwOnError=false, lança ProviderApiException quando true) que hoje
 * estava duplicado em cada método do EvolutionClient.
 */
export class ProviderHttpClient {
  constructor(private readonly options: ProviderHttpClientOptions) {}

  async post<T = unknown>(endpoint: string, payload: unknown = {}): Promise<T> {
    return this.execute<T>(endpoint, () => this.options.axiosInstance.post(endpoint, payload));
  }

  async get<T = unknown>(endpoint: string): Promise<T> {
    return this.execute<T>(endpoint, () => this.options.axiosInstance.get(endpoint));
  }

  async put<T = unknown>(endpoint: string, payload: unknown = {}): Promise<T> {
    return this.execute<T>(endpoint, () => this.options.axiosInstance.put(endpoint, payload));
  }

  async delete<T = unknown>(endpoint: string): Promise<T> {
    return this.execute<T>(endpoint, () => this.options.axiosInstance.delete(endpoint));
  }

  private async execute<T>(endpoint: string, call: () => Promise<AxiosResponse<T>>): Promise<T> {
    const { provider, logger, throwOnError } = this.options;
    try {
      const res = await call();
      return res.data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        const error = ProviderApiException.fromResponse(provider, endpoint, err.response.status, err.response.data);
        if (throwOnError) throw error;
        logger.error(error.message, { provider, endpoint, statusCode: err.response.status });
        return {} as T;
      }
      throw err;
    }
  }
}
