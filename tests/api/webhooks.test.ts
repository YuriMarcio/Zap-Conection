import axios from 'axios';
import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildServer } from '../../src/api/buildServer.js';
import { InMemoryInstanceRepository } from '../../src/infrastructure/persistence/InMemoryInstanceRepository.js';
import { ConsoleLogger } from '../../src/infrastructure/logging/ConsoleLogger.js';
import type { EventPublisher } from '../../src/core/interfaces/EventPublisher.js';

vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof axios>('axios');
  return {
    default: {
      ...actual.default,
      create: vi.fn(() => ({
        post: vi.fn().mockResolvedValue({ data: {} }),
        get: vi.fn().mockResolvedValue({ data: {} }),
        put: vi.fn().mockResolvedValue({ data: {} }),
        delete: vi.fn().mockResolvedValue({ data: {} }),
      })),
      isAxiosError: actual.default.isAxiosError,
    },
  };
});

function fakePublisher(): EventPublisher & { events: unknown[] } {
  const events: unknown[] = [];
  return {
    events,
    publish(event) {
      events.push(event);
    },
  };
}

describe('api/webhooks', () => {
  function makeApp(eventPublisher = fakePublisher()) {
    const logger = new ConsoleLogger();
    vi.spyOn(logger, 'warn').mockImplementation(() => {});
    const built = buildServer({
      logger,
      instanceRepository: new InMemoryInstanceRepository(),
      eventPublisher,
      apiKey: undefined,
    });
    return { ...built, eventPublisher };
  }

  it('webhook da Z-API é normalizado e publicado', async () => {
    const { app, eventPublisher } = makeApp();

    const create = await app.inject({
      method: 'POST',
      url: '/v1/instances',
      payload: { provider: 'zapi', credentials: { instanceId: 'zapi-1', token: 'tok' } },
    });
    const id = create.json().instance.id;

    const response = await app.inject({
      method: 'POST',
      url: `/v1/webhooks/zapi/${id}`,
      payload: { instanceId: id, phone: '5598999990000', messageId: 'MSG1', text: { message: 'oi' } },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ received: 1 });
    expect(eventPublisher.events).toHaveLength(1);
    expect(eventPublisher.events[0]).toMatchObject({ type: 'MessageReceived' });
  });

  it('webhook para instância inexistente retorna 404', async () => {
    const { app } = makeApp();

    const response = await app.inject({
      method: 'POST',
      url: '/v1/webhooks/zapi/nao-existe',
      payload: {},
    });

    expect(response.statusCode).toBe(404);
  });

  it('webhook da Meta sem assinatura válida retorna 401 quando appSecret está configurado', async () => {
    const { app } = makeApp();

    const create = await app.inject({
      method: 'POST',
      url: '/v1/instances',
      payload: {
        provider: 'meta',
        credentials: { phoneNumberId: 'PHONE_ID', accessToken: 'tok', appSecret: 'shh' },
      },
    });
    const id = create.json().instance.id;

    const response = await app.inject({
      method: 'POST',
      url: `/v1/webhooks/meta/${id}`,
      payload: { entry: [] },
    });

    expect(response.statusCode).toBe(401);
  });

  it('webhook da Meta com assinatura válida é aceito', async () => {
    const { app, eventPublisher } = makeApp();

    const create = await app.inject({
      method: 'POST',
      url: '/v1/instances',
      payload: {
        provider: 'meta',
        credentials: { phoneNumberId: 'PHONE_ID', accessToken: 'tok', appSecret: 'shh' },
      },
    });
    const id = create.json().instance.id;

    const rawBody = JSON.stringify({
      entry: [{ changes: [{ field: 'messages', value: { messages: [{ from: '5598999990000', id: 'wamid.1' }] } }] }],
    });
    const signature = `sha256=${createHmac('sha256', 'shh').update(rawBody).digest('hex')}`;

    const response = await app.inject({
      method: 'POST',
      url: `/v1/webhooks/meta/${id}`,
      headers: { 'content-type': 'application/json', 'x-hub-signature-256': signature },
      payload: rawBody,
    });

    expect(response.statusCode).toBe(200);
    expect(eventPublisher.events).toContainEqual(expect.objectContaining({ type: 'MessageReceived' }));
  });
});
