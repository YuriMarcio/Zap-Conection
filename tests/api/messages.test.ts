import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildServer } from '../../src/api/buildServer.js';
import { InMemoryInstanceRepository } from '../../src/infrastructure/persistence/InMemoryInstanceRepository.js';
import { ConsoleLogger } from '../../src/infrastructure/logging/ConsoleLogger.js';

vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof axios>('axios');
  return {
    default: {
      ...actual.default,
      create: vi.fn(() => ({
        post: vi.fn().mockResolvedValue({ data: { messageId: 'msg-1' } }),
        get: vi.fn().mockResolvedValue({ data: {} }),
        put: vi.fn().mockResolvedValue({ data: {} }),
        delete: vi.fn().mockResolvedValue({ data: {} }),
      })),
      isAxiosError: actual.default.isAxiosError,
    },
  };
});

describe('api/messages', () => {
  function makeApp() {
    const logger = new ConsoleLogger();
    vi.spyOn(logger, 'warn').mockImplementation(() => {});
    return buildServer({ logger, instanceRepository: new InMemoryInstanceRepository(), apiKey: undefined });
  }

  async function createZapiInstance(app: ReturnType<typeof makeApp>['app']): Promise<string> {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/instances',
      payload: { provider: 'zapi', credentials: { instanceId: 'zapi-1', token: 'tok' } },
    });
    return response.json().instance.id;
  }

  it('POST /v1/instances/:id/messages/text envia e retorna SendResult', async () => {
    const { app } = makeApp();
    const id = await createZapiInstance(app);

    const response = await app.inject({
      method: 'POST',
      url: `/v1/instances/${id}/messages/text`,
      payload: { to: '5598999990000', text: 'Olá!' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ messageId: 'msg-1' });
  });

  it('POST /v1/instances/:id/messages/buttons repassa content para o provider', async () => {
    const { app } = makeApp();
    const id = await createZapiInstance(app);

    const response = await app.inject({
      method: 'POST',
      url: `/v1/instances/${id}/messages/buttons`,
      payload: { to: '5598999990000', content: { body: 'Confirma?', buttons: [{ id: 'SIM', displayText: 'Sim' }] } },
    });

    expect(response.statusCode).toBe(200);
  });

  it('mensagem para instância inexistente retorna 404', async () => {
    const { app } = makeApp();

    const response = await app.inject({
      method: 'POST',
      url: '/v1/instances/nao-existe/messages/text',
      payload: { to: '5598999990000', text: 'Olá!' },
    });

    expect(response.statusCode).toBe(404);
  });
});
