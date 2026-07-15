import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EvolutionProvider } from '../../../src/providers/evolution/EvolutionProvider.js';
import { ConsoleLogger } from '../../../src/infrastructure/logging/ConsoleLogger.js';

vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof axios>('axios');
  return {
    default: {
      ...actual.default,
      create: vi.fn(() => ({ post: vi.fn(), get: vi.fn(), delete: vi.fn(), put: vi.fn() })),
      isAxiosError: actual.default.isAxiosError,
    },
  };
});

function makeProvider() {
  const logger = new ConsoleLogger();
  vi.spyOn(logger, 'error').mockImplementation(() => {});
  vi.spyOn(logger, 'warn').mockImplementation(() => {});
  const provider = new EvolutionProvider({ name: 'evolution', baseUrl: 'https://evolution.test', apiKey: 'key' }, logger);
  return provider;
}

function getAxios(provider: EvolutionProvider) {
  return (provider as unknown as { http: { options: { axiosInstance: Record<string, ReturnType<typeof vi.fn>> } } }).http
    .options.axiosInstance;
}

describe('EvolutionProvider', () => {
  let provider: EvolutionProvider;

  beforeEach(() => {
    provider = makeProvider();
  });

  it('sendText envia payload correto com delay padrão', async () => {
    const http = getAxios(provider);
    http['post']!.mockResolvedValueOnce({ data: { key: { id: 'abc123' } } });

    const result = await provider.sendText('inst-01', '5598999990000', 'Olá!');

    expect(http['post']).toHaveBeenCalledWith('/message/sendText/inst-01', {
      number: '5598999990000',
      text: 'Olá!',
      delay: 1200,
    });
    expect(result.messageId).toBe('abc123');
  });

  it('sendText respeita delayMs customizado', async () => {
    const http = getAxios(provider);
    http['post']!.mockResolvedValueOnce({ data: {} });

    await provider.sendText('inst-01', '5598999990000', 'Teste', { delayMs: 3000 });

    expect(http['post']).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ delay: 3000 }));
  });

  it('checkNumbers retorna apenas números válidos limpos', async () => {
    const http = getAxios(provider);
    http['post']!.mockResolvedValueOnce({
      data: [
        { jid: '5598999990000@s.whatsapp.net', exists: true },
        { jid: '5511000000000@s.whatsapp.net', exists: false },
        { jid: '5521988880000@s.whatsapp.net', exists: true },
      ],
    });

    const result = await provider.checkNumbers('inst-01', ['5598999990000', '5511000000000', '5521988880000']);

    expect(result).toEqual(['5598999990000', '5521988880000']);
  });

  it('checkNumbers não faz request para lista vazia', async () => {
    const http = getAxios(provider);
    const result = await provider.checkNumbers('inst-01', []);
    expect(result).toEqual([]);
    expect(http['post']).not.toHaveBeenCalled();
  });

  it('connect cria a instância e busca o QR code', async () => {
    const http = getAxios(provider);
    http['post']!.mockResolvedValueOnce({ data: { instance: { instanceName: 'inst-01' } } });
    http['get']!.mockResolvedValueOnce({ data: { qrcode: { base64: 'data:image/png;base64,AAA' } } });

    const result = await provider.connect('inst-01');

    expect(http['post']).toHaveBeenCalledWith(
      '/instance/create',
      expect.objectContaining({ instanceName: 'inst-01', integration: 'WHATSAPP-BAILEYS' }),
    );
    expect(http['get']).toHaveBeenCalledWith('/instance/connect/inst-01');
    expect(result.status).toBe('qr_required');
    expect(result.qrCode).toBe('data:image/png;base64,AAA');
  });

  it('getQrCode busca um QR novo sem chamar /instance/create de novo', async () => {
    const http = getAxios(provider);
    http['get']!.mockResolvedValueOnce({ data: { qrcode: { base64: 'data:image/png;base64,BBB' } } });

    const result = await provider.getQrCode('inst-01');

    expect(http['post']).not.toHaveBeenCalled();
    expect(http['get']).toHaveBeenCalledWith('/instance/connect/inst-01');
    expect(result.qrCode).toBe('data:image/png;base64,BBB');
  });

  it('getStatus mapeia o state retornado pela Evolution', async () => {
    const http = getAxios(provider);
    http['get']!.mockResolvedValueOnce({ data: { instance: { state: 'open' } } });

    const status = await provider.getStatus('inst-01');

    expect(status).toEqual({ instanceId: 'inst-01', state: 'open', raw: { instance: { state: 'open' } } });
  });

  it('sendButtons mapeia ButtonsContent para o payload da Evolution', async () => {
    const http = getAxios(provider);
    http['post']!.mockResolvedValueOnce({ data: {} });

    await provider.sendButtons('inst-01', '5598999990000', {
      title: 'Título',
      body: 'Corpo',
      footer: 'Rodapé',
      buttons: [{ id: 'BTN_SIM', displayText: 'Sim' }],
    });

    expect(http['post']).toHaveBeenCalledWith(
      '/message/sendButtons/inst-01',
      expect.objectContaining({
        number: '5598999990000',
        title: 'Título',
        description: 'Corpo',
        footer: 'Rodapé',
        buttons: [{ type: 'reply', displayText: 'Sim', id: 'BTN_SIM' }],
      }),
    );
  });

  it('sendReaction monta o remoteJid a partir do número', async () => {
    const http = getAxios(provider);
    http['post']!.mockResolvedValueOnce({ data: {} });

    await provider.sendReaction('inst-01', '5598999990000', 'MSG_ID', '👍');

    expect(http['post']).toHaveBeenCalledWith('/message/sendReaction/inst-01', {
      reactionMessage: {
        key: { remoteJid: '5598999990000@s.whatsapp.net', fromMe: false, id: 'MSG_ID' },
        reaction: '👍',
      },
    });
  });

  describe('parseWebhookPayload', () => {
    function payload(body: unknown): Buffer {
      return Buffer.from(JSON.stringify(body));
    }

    it('messages.upsert de mensagem recebida vira MessageReceived', () => {
      const events = provider.parseWebhookPayload(
        payload({
          event: 'messages.upsert',
          instance: 'inst-01',
          data: { key: { id: 'MSG1', remoteJid: '5598999990000@s.whatsapp.net', fromMe: false }, message: { conversation: 'oi' } },
        }),
        {},
      );

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        type: 'MessageReceived',
        instanceId: 'inst-01',
        payload: { from: '5598999990000', messageId: 'MSG1' },
      });
    });

    it('messages.upsert de mensagem própria (fromMe) não gera evento', () => {
      const events = provider.parseWebhookPayload(
        payload({ event: 'messages.upsert', instance: 'inst-01', data: { key: { fromMe: true } } }),
        {},
      );
      expect(events).toEqual([]);
    });

    it('connection.update state=open vira InstanceConnected', () => {
      const events = provider.parseWebhookPayload(
        payload({ event: 'connection.update', instance: 'inst-01', data: { state: 'open' } }),
        {},
      );
      expect(events[0]).toMatchObject({ type: 'InstanceConnected', instanceId: 'inst-01' });
    });

    it('evento desconhecido não gera nenhum DomainEvent', () => {
      const events = provider.parseWebhookPayload(payload({ event: 'algo.novo' }), {});
      expect(events).toEqual([]);
    });
  });
});
