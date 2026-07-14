import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpForwardingEventPublisher } from '../../../src/infrastructure/events/HttpForwardingEventPublisher.js';
import { InMemoryInstanceRepository } from '../../../src/infrastructure/persistence/InMemoryInstanceRepository.js';
import { ConsoleLogger } from '../../../src/infrastructure/logging/ConsoleLogger.js';
import { InstanceConnected } from '../../../src/core/events/index.js';
import type { Instance } from '../../../src/core/entities/Instance.js';

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('HttpForwardingEventPublisher', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('faz POST do evento para o callbackUrl da instância', async () => {
    const repo = new InMemoryInstanceRepository();
    const instance: Instance = {
      id: 'inst-01',
      provider: 'evolution',
      state: 'open',
      callbackUrl: 'https://consumer.test/webhook',
      createdAt: new Date().toISOString(),
    };
    await repo.save(instance);

    const publisher = new HttpForwardingEventPublisher(repo, new ConsoleLogger());
    const event = InstanceConnected('evolution', 'inst-01');

    publisher.publish(event);
    await flushMicrotasks();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://consumer.test/webhook',
      expect.objectContaining({ method: 'POST', headers: { 'Content-Type': 'application/json' } }),
    );
    const body = JSON.parse((fetchMock.mock.calls[0]?.[1] as { body: string }).body);
    expect(body).toMatchObject({ type: 'InstanceConnected', instanceId: 'inst-01' });
  });

  it('não faz request quando a instância não tem callbackUrl', async () => {
    const repo = new InMemoryInstanceRepository();
    await repo.save({ id: 'inst-01', provider: 'evolution', state: 'open', createdAt: new Date().toISOString() });

    const publisher = new HttpForwardingEventPublisher(repo, new ConsoleLogger());
    publisher.publish(InstanceConnected('evolution', 'inst-01'));
    await flushMicrotasks();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('não faz request quando a instância não existe', async () => {
    const repo = new InMemoryInstanceRepository();
    const publisher = new HttpForwardingEventPublisher(repo, new ConsoleLogger());

    publisher.publish(InstanceConnected('evolution', 'inexistente'));
    await flushMicrotasks();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('loga um warning quando o fetch falha, sem lançar', async () => {
    const repo = new InMemoryInstanceRepository();
    await repo.save({
      id: 'inst-01',
      provider: 'evolution',
      state: 'open',
      callbackUrl: 'https://consumer.test/webhook',
      createdAt: new Date().toISOString(),
    });
    fetchMock.mockRejectedValueOnce(new Error('network down'));

    const logger = new ConsoleLogger();
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    const publisher = new HttpForwardingEventPublisher(repo, logger);

    publisher.publish(InstanceConnected('evolution', 'inst-01'));
    await flushMicrotasks();

    expect(warnSpy).toHaveBeenCalled();
  });
});
