import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MySqlInstanceRepository } from '../../../src/infrastructure/persistence/MySqlInstanceRepository.js';
import { ConsoleLogger } from '../../../src/infrastructure/logging/ConsoleLogger.js';
import type { Instance } from '../../../src/core/entities/Instance.js';

const queryMock = vi.fn();

vi.mock('mysql2/promise', () => ({
  createPool: vi.fn(() => ({ query: queryMock })),
}));

function makeRepo() {
  const logger = new ConsoleLogger();
  vi.spyOn(logger, 'info').mockImplementation(() => {});
  vi.spyOn(logger, 'warn').mockImplementation(() => {});
  return new MySqlInstanceRepository(
    { host: 'db', port: 3306, user: 'u', password: 'p', database: 'flowbridge' },
    logger,
  );
}

describe('MySqlInstanceRepository', () => {
  beforeEach(() => {
    queryMock.mockReset();
    queryMock.mockResolvedValue([[], []]);
  });

  it('cria a tabela (CREATE TABLE IF NOT EXISTS) no construtor', async () => {
    const repo = makeRepo();
    await repo.list(); // força aguardar `ready`

    expect(queryMock.mock.calls[0]?.[0]).toContain('CREATE TABLE IF NOT EXISTS instances');
  });

  it('save faz INSERT ... ON DUPLICATE KEY UPDATE com os campos mapeados', async () => {
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
      '2026-07-14 10:00:00',
    ]);
  });

  it('findById retorna undefined quando não há linha', async () => {
    const repo = makeRepo();
    queryMock.mockResolvedValueOnce([[], []]); // CREATE TABLE
    queryMock.mockResolvedValueOnce([[], []]); // SELECT

    expect(await repo.findById('inexistente')).toBeUndefined();
  });

  it('findById mapeia a linha (incluindo credentials JSON) de volta para Instance', async () => {
    const repo = makeRepo();
    queryMock.mockResolvedValueOnce([
      [
        {
          id: 'inst-01',
          provider: 'meta',
          phone_number: null,
          state: 'open',
          callback_url: 'https://app.test/webhook',
          credentials: JSON.stringify({ phoneNumberId: 'PHONE_ID', accessToken: 'tok' }),
          created_at: new Date('2026-07-14T10:00:00.000Z'),
        },
      ],
      [],
    ]);

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

  it('delete executa DELETE FROM instances WHERE id = ?', async () => {
    const repo = makeRepo();
    await repo.delete('inst-01');

    const call = queryMock.mock.calls.find(([sql]) => String(sql).includes('DELETE FROM instances'));
    expect(call?.[1]).toEqual(['inst-01']);
  });

  it('list retorna todas as linhas mapeadas', async () => {
    const repo = makeRepo();
    queryMock.mockResolvedValueOnce([
      [
        { id: 'a', provider: 'evolution', phone_number: null, state: 'open', callback_url: null, credentials: null, created_at: '2026-01-01 00:00:00' },
        { id: 'b', provider: 'zapi', phone_number: null, state: 'close', callback_url: null, credentials: null, created_at: '2026-01-01 00:00:00' },
      ],
      [],
    ]);

    const list = await repo.list();

    expect(list.map((i) => i.id)).toEqual(['a', 'b']);
  });
});
