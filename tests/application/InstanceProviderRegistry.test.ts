import { describe, expect, it } from 'vitest';
import { InstanceProviderRegistry } from '../../src/application/InstanceProviderRegistry.js';
import { ProviderRegistry } from '../../src/registry/ProviderRegistry.js';
import { ConsoleLogger } from '../../src/infrastructure/logging/ConsoleLogger.js';
import { ZApiProvider } from '../../src/providers/zapi/ZApiProvider.js';
import type { CommunicationProvider } from '../../src/core/interfaces/CommunicationProvider.js';

function fakeEvolutionProvider(): CommunicationProvider {
  return {
    name: 'evolution',
    connect: async () => ({ status: 'connected' }),
    disconnect: async () => {},
    getStatus: async () => ({ instanceId: 'x', state: 'open' }),
    setWebhook: async () => {},
    checkNumbers: async () => [],
    sendText: async () => ({ raw: null }),
    sendImage: async () => ({ raw: null }),
    sendAudio: async () => ({ raw: null }),
    sendVideo: async () => ({ raw: null }),
    sendDocument: async () => ({ raw: null }),
    sendLocation: async () => ({ raw: null }),
    sendButtons: async () => ({ raw: null }),
    sendList: async () => ({ raw: null }),
    sendCarousel: async () => ({ raw: null }),
    sendReaction: async () => ({ raw: null }),
    parseWebhookPayload: () => [],
  };
}

describe('InstanceProviderRegistry', () => {
  it('create para evolution devolve o provider compartilhado do ProviderRegistry', () => {
    const shared = new ProviderRegistry();
    const evolution = fakeEvolutionProvider();
    shared.register(evolution);

    const registry = new InstanceProviderRegistry(shared, new ConsoleLogger());
    const provider = registry.create('inst-01', 'evolution');

    expect(provider).toBe(evolution);
  });

  it('create para zapi constrói um ZApiProvider dedicado a partir das credenciais', () => {
    const registry = new InstanceProviderRegistry(new ProviderRegistry(), new ConsoleLogger());

    const provider = registry.create('inst-01', 'zapi', { instanceId: 'zapi-inst', token: 'tok' });

    expect(provider).toBeInstanceOf(ZApiProvider);
    expect(registry.resolve('inst-01', 'zapi')).toBe(provider);
  });

  it('create para zapi sem credenciais lança erro claro', () => {
    const registry = new InstanceProviderRegistry(new ProviderRegistry(), new ConsoleLogger());
    expect(() => registry.create('inst-01', 'zapi')).toThrow(/Credenciais da Z-API/);
  });

  it('create para meta sem credenciais lança erro claro', () => {
    const registry = new InstanceProviderRegistry(new ProviderRegistry(), new ConsoleLogger());
    expect(() => registry.create('inst-01', 'meta')).toThrow(/Credenciais da Meta Cloud API/);
  });

  it('create com provider desconhecido lança erro claro (não cai silenciosamente em meta)', () => {
    const registry = new InstanceProviderRegistry(new ProviderRegistry(), new ConsoleLogger());
    expect(() =>
      registry.create('inst-01', 'discord' as unknown as 'meta', { phoneNumberId: 'x', accessToken: 'y' }),
    ).toThrow(/Provider desconhecido/);
  });

  it('resolve lança erro para instância zapi/meta não criada', () => {
    const registry = new InstanceProviderRegistry(new ProviderRegistry(), new ConsoleLogger());
    expect(() => registry.resolve('nunca-criada', 'zapi')).toThrow(/não encontrada/);
  });

  it('delete remove o provider por instância, mas não afeta o registry compartilhado', () => {
    const shared = new ProviderRegistry();
    shared.register(fakeEvolutionProvider());
    const registry = new InstanceProviderRegistry(shared, new ConsoleLogger());
    registry.create('inst-01', 'zapi', { instanceId: 'zapi-inst', token: 'tok' });

    registry.delete('inst-01');

    expect(() => registry.resolve('inst-01', 'zapi')).toThrow(/não encontrada/);
    expect(registry.resolve('qualquer', 'evolution')).toBeDefined();
  });
});
