import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PostgresInstanceRepository } from '../../../src/infrastructure/persistence/PostgresInstanceRepository.js';
import { ConsoleLogger } from '../../../src/infrastructure/logging/ConsoleLogger.js';
import type { Instance } from '../../../src/core/entities/Instance.js';

const queryMock = vi.fn();

vi.mock('pg', () => ({
  Pool: vi.fn(() => ({ query: queryMock })),
}));

function makeRepo(retry?: { maxAttempts?: number; delayMs?: number }) {
  const logger = new ConsoleLogger();
  vi.spyOn(logger, 'info').mockImplementation(() => {});
  vi.spyOn(logger, 'warn').mockImplementation(() => {});
  vi.spyOn(logger, 'error').mockImplementation(() => {});
  return new PostgresInstanceRepository({ connectionString: 'postgresql://u:p@db/flowbridge' }, logger, retry);
}

describe('PostgresInstanceRepository', () => {
  beforeEach(() => {
    queryMock.mockReset();
    queryMock.mockResolvedValue({ rows: [] });
  });

  it('cria a tabela (CREATE TABLE IF NOT EXISTS) no construtor', async () => {
    const repo = makeRepo();
    await repo.list(); // força aguardar `ready`

    expect(queryMock.mock.calls[0]?.[0]).toContain('CREATE TABLE IF NOT EXISTS instances');
  });

  it('tenta de novo até conseguir conectar (recupera de falha transitória)', async () => {
    queryMock.mockReset();
    queryMock
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockResolvedValue({ rows: [] });

    const repo = makeRepo({ maxAttempts: 5, delayMs: 1 });

    await expect(repo.list()).resolves.toEqual([]);
    expect(queryMock).toHaveBeenCalledTimes(4); // 2 falhas + 1 CREATE TABLE ok + 1 SELECT do list()
  });

  it('depois de esgotar as tentativas, propaga o erro real sem tentar o SELECT', async () => {
    queryMock.mockReset();
    queryMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const repo = makeRepo({ maxAttempts: 3, delayMs: 1 });

    await expect(repo.list()).rejects.toThrow('ECONNREFUSED');
    expect(queryMock).toHaveBeenCalledTimes(3);
  });

  it('save faz INSERT ... ON CONFLICT DO UPDATE com os campos mapeados', async () => {
    const repo = makeRepo();
    const instance: Instance = {
      id: 'inst-01',
      provider: 'zapi',
      state: 'open',
      callbackUrl: 'https://app.test/webhook',
      credentials: { instanceId: 'zapi-inst', token: 'tok' },
      createdAt: '2026-07-14T10:00:00.000Z',
    };

    await repo.save(instance);

    const call = queryMock.mock.calls.find(([sql]) => String(sql).includes('INSERT INTO instances'));
    expect(call).toBeDefined();
    const [, params] = call as [string, unknown[]];
    expect(params).toEqual([
      'inst-01',
      'zapi',
      null,
      'open',
      'https://app.test/webhook',
      JSON.stringify({ instanceId: 'zapi-inst', token: 'tok' }),
      '2026-07-14T10:00:00.000Z',
    ]);
  });

  it('findById retorna undefined quando não há linha', async () => {
    const repo = makeRepo();
    expect(await repo.findById('inexistente')).toBeUndefined();
  });

  it('findById mapeia a linha (incluindo credentials JSONB já parseado) de volta para Instance', async () => {
    const repo = makeRepo();
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 'inst-01',
          provider: 'meta',
          phone_number: null,
          state: 'open',
          callback_url: 'https://app.test/webhook',
          credentials: { phoneNumberId: 'PHONE_ID', accessToken: 'tok' }, // pg já entrega JSONB parseado
          created_at: new Date('2026-07-14T10:00:00.000Z'),
        },
      ],
    });

    const instance = await repo.findById('inst-01');

    expect(instance).toEqual({
      id: 'inst-01',
      provider: 'meta',
      phoneNumber: undefined,
      state: 'open',
      callbackUrl: 'https://app.test/webhook',
      credentials: { phoneNumberId: 'PHONE_ID', accessToken: 'tok' },
      createdAt: '2026-07-14T10:00:00.000Z',
    });
  });

  it('delete executa DELETE FROM instances WHERE id = $1', async () => {
    const repo = makeRepo();
    await repo.delete('inst-01');

    const call = queryMock.mock.calls.find(([sql]) => String(sql).includes('DELETE FROM instances'));
    expect(call?.[1]).toEqual(['inst-01']);
  });

  it('list retorna todas as linhas mapeadas', async () => {
    const repo = makeRepo();
    queryMock.mockResolvedValueOnce({
      rows: [
        { id: 'a', provider: 'evolution', phone_number: null, state: 'open', callback_url: null, credentials: null, created_at: new Date('2026-01-01') },
        { id: 'b', provider: 'zapi', phone_number: null, state: 'close', callback_url: null, credentials: null, created_at: new Date('2026-01-01') },
      ],
    });

    const list = await repo.list();

    expect(list.map((i) => i.id)).toEqual(['a', 'b']);
  });
});
