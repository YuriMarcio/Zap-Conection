import type { EvolutionProviderConfig, MetaProviderConfig, ZApiProviderConfig } from '../contracts/dto/index.js';

/**
 * Centraliza a leitura de variáveis de ambiente por provider (antes espalhada dentro de
 * factory.ts). Cada função retorna `undefined` quando as variáveis obrigatórias daquele
 * provider não estão configuradas — quem chama decide se isso é um erro ou só "provider não
 * habilitado".
 */

export function readEvolutionEnv(): EvolutionProviderConfig | undefined {
  const baseUrl = process.env['EVOLUTION_API_URL'];
  const apiKey = process.env['EVOLUTION_API_KEY'];
  if (!baseUrl || !apiKey) return undefined;

  return {
    name: 'evolution',
    baseUrl,
    apiKey,
    throwOnError: process.env['EVOLUTION_THROW_ON_ERROR'] === 'true',
    timeout: Number(process.env['EVOLUTION_TIMEOUT_MS'] ?? 15_000),
  };
}

export function readZApiEnv(): ZApiProviderConfig | undefined {
  const instanceId = process.env['ZAPI_INSTANCE_ID'];
  const token = process.env['ZAPI_TOKEN'];
  if (!instanceId || !token) return undefined;

  return {
    name: 'zapi',
    instanceId,
    token,
    clientToken: process.env['ZAPI_CLIENT_TOKEN'],
    throwOnError: process.env['ZAPI_THROW_ON_ERROR'] === 'true',
    timeout: Number(process.env['ZAPI_TIMEOUT_MS'] ?? 15_000),
  };
}

export function readMetaEnv(): MetaProviderConfig | undefined {
  const phoneNumberId = process.env['WHATSAPP_CLOUD_PHONE_NUMBER_ID'];
  const accessToken = process.env['WHATSAPP_CLOUD_ACCESS_TOKEN'];
  if (!phoneNumberId || !accessToken) return undefined;

  return {
    name: 'meta',
    phoneNumberId,
    accessToken,
    wabaId: process.env['WHATSAPP_CLOUD_WABA_ID'],
    apiVersion: process.env['WHATSAPP_CLOUD_API_VERSION'] ?? 'v23.0',
    throwOnError: process.env['WHATSAPP_THROW_ON_ERROR'] === 'true',
    timeout: Number(process.env['WHATSAPP_TIMEOUT_MS'] ?? 15_000),
  };
}
