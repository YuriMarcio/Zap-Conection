import { describe, expect, it } from 'vitest';
import { InMemoryInstanceRepository } from '../../../src/infrastructure/persistence/InMemoryInstanceRepository.js';
import type { Instance } from '../../../src/core/entities/Instance.js';

function makeInstance(overrides: Partial<Instance> = {}): Instance {
  return {
    id: 'inst-01',
    provider: 'evolution',
    state: 'connecting',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('InMemoryInstanceRepository', () => {
  it('save + findById retorna a instância salva', async () => {
    const repo = new InMemoryInstanceRepository();
    const instance = makeInstance();

    await repo.save(instance);

    expect(await repo.findById('inst-01')).toEqual(instance);
  });

  it('findById retorna undefined para instância inexistente', async () => {
    const repo = new InMemoryInstanceRepository();
    expect(await repo.findById('inexistente')).toBeUndefined();
  });

  it('delete remove a instância', async () => {
    const repo = new InMemoryInstanceRepository();
    await repo.save(makeInstance());

    await repo.delete('inst-01');

    expect(await repo.findById('inst-01')).toBeUndefined();
  });

  it('list retorna todas as instâncias salvas', async () => {
    const repo = new InMemoryInstanceRepository();
    await repo.save(makeInstance({ id: 'a' }));
    await repo.save(makeInstance({ id: 'b' }));

    const list = await repo.list();

    expect(list.map((i) => i.id).sort()).toEqual(['a', 'b']);
  });

  it('save sobrescreve uma instância existente com o mesmo id', async () => {
    const repo = new InMemoryInstanceRepository();
    await repo.save(makeInstance({ state: 'connecting' }));
    await repo.save(makeInstance({ state: 'open' }));

    expect((await repo.findById('inst-01'))?.state).toBe('open');
    expect(await repo.list()).toHaveLength(1);
  });
});
