import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createFlowBridgeClient } from '../../../src/application/factories/FlowBridgeClientFactory.js';
import { FlowBridgeClient } from '../../../src/application/FlowBridgeClient.js';

const ENV_KEYS = [
  'EVOLUTION_API_URL',
  'EVOLUTION_API_KEY',
  'ZAPI_INSTANCE_ID',
  'ZAPI_TOKEN',
  'WHATSAPP_CLOUD_PHONE_NUMBER_ID',
  'WHATSAPP_CLOUD_ACCESS_TOKEN',
];

describe('createFlowBridgeClient', () => {
  beforeEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
  });

  afterEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
  });

  it('lança erro quando nenhum provider está configurado', () => {
    expect(() => createFlowBridgeClient()).toThrow('Nenhum provider configurado');
  });

  it('cria o client com providers explícitos', () => {
    const client = createFlowBridgeClient({
      providers: [{ name: 'evolution', baseUrl: 'https://evolution.test', apiKey: 'key' }],
    });

    expect(client).toBeInstanceOf(FlowBridgeClient);
  });

  it('detecta providers configurados via variáveis de ambiente', () => {
    process.env['EVOLUTION_API_URL'] = 'https://evolution.test';
    process.env['EVOLUTION_API_KEY'] = 'key';
    process.env['ZAPI_INSTANCE_ID'] = 'inst-01';
    process.env['ZAPI_TOKEN'] = 'token-01';

    const client = createFlowBridgeClient();

    expect(client).toBeInstanceOf(FlowBridgeClient);
  });

  it('registra múltiplos providers simultaneamente sem lançar erro', () => {
    expect(() =>
      createFlowBridgeClient({
        providers: [
          { name: 'evolution', baseUrl: 'https://evolution.test', apiKey: 'key' },
          { name: 'meta', phoneNumberId: 'PHONE_ID', accessToken: 'token' },
        ],
      }),
    ).not.toThrow();
  });
});
