import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EvolutionApiError } from '../src/exceptions/EvolutionApiError.js';
import { EvolutionClient } from '../src/EvolutionClient.js';
import { createEvolutionClient } from '../src/factory.js';
import { ThrottledSender } from '../src/support/ThrottledSender.js';

// ---------------------------------------------------------------------------
// Mock do axios
// ---------------------------------------------------------------------------

vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof axios>('axios');
  return {
    default: {
      ...actual.default,
      create: vi.fn(() => ({
        post:   vi.fn(),
        get:    vi.fn(),
        delete: vi.fn(),
      })),
      isAxiosError: actual.default.isAxiosError,
    },
  };
});

function makeClient(throwOnError = false) {
  return new EvolutionClient({
    baseUrl: 'https://evolution.test',
    apiKey: 'test-key',
    throwOnError,
  });
}

function getHttp(client: EvolutionClient) {
  // acessa o http privado via cast para testar
  return (client as unknown as { http: Record<string, ReturnType<typeof vi.fn>> }).http;
}

// ---------------------------------------------------------------------------
// checkNumbers
// ---------------------------------------------------------------------------

describe('checkNumbers', () => {
  let client: EvolutionClient;

  beforeEach(() => {
    client = makeClient();
  });

  it('retorna apenas números válidos limpos', async () => {
    const http = getHttp(client);
    http['post']!.mockResolvedValueOnce({
      data: [
        { jid: '5598999990000@s.whatsapp.net', exists: true },
        { jid: '5511000000000@s.whatsapp.net', exists: false },
        { jid: '5521988880000@s.whatsapp.net', exists: true },
      ],
    });

    const result = await client.checkNumbers('inst-01', ['5598999990000', '5511000000000', '5521988880000']);

    expect(result).toEqual(['5598999990000', '5521988880000']);
  });

  it('retorna array vazio sem fazer request quando lista vazia', async () => {
    const http = getHttp(client);
    const result = await client.checkNumbers('inst-01', []);
    expect(result).toEqual([]);
    expect(http['post']).not.toHaveBeenCalled();
  });

  it('retorna array vazio em erro silencioso (throwOnError=false)', async () => {
    const http = getHttp(client);
    const axiosError = Object.assign(new Error('Network Error'), {
      isAxiosError: true,
      response: { status: 500, data: { error: 'Internal Server Error' } },
    });
    http['post']!.mockRejectedValueOnce(axiosError);

    // sobrescreve isAxiosError para retornar true
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    const result = await client.checkNumbers('inst-01', ['5598999990000']);
    expect(result).toEqual([]);
  });

  it('lança EvolutionApiError quando throwOnError=true', async () => {
    const strictClient = makeClient(true);
    const http = getHttp(strictClient);
    const axiosError = Object.assign(new Error('Fail'), {
      isAxiosError: true,
      response: { status: 500, data: {} },
    });
    http['post']!.mockRejectedValueOnce(axiosError);
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    await expect(strictClient.checkNumbers('inst-01', ['5598999990000'])).rejects.toThrow(EvolutionApiError);
  });
});

// ---------------------------------------------------------------------------
// sendText
// ---------------------------------------------------------------------------

describe('sendText', () => {
  it('envia payload correto com delay padrão', async () => {
    const client = makeClient();
    const http = getHttp(client);
    http['post']!.mockResolvedValueOnce({ data: { key: { id: 'abc123' } } });

    await client.sendText('inst-01', '5598999990000', 'Olá!');

    expect(http['post']).toHaveBeenCalledWith('/message/sendText/inst-01', {
      number: '5598999990000',
      text: 'Olá!',
      delay: 1200,
    });
  });

  it('respeita delay customizado', async () => {
    const client = makeClient();
    const http = getHttp(client);
    http['post']!.mockResolvedValueOnce({ data: {} });

    await client.sendText('inst-01', '5598999990000', 'Teste', 3000);

    expect(http['post']).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ delay: 3000 }),
    );
  });
});

// ---------------------------------------------------------------------------
// createInstance
// ---------------------------------------------------------------------------

describe('createInstance', () => {
  it('envia integração WHATSAPP-BAILEYS por padrão', async () => {
    const client = makeClient();
    const http = getHttp(client);
    http['post']!.mockResolvedValueOnce({ data: { instance: { instanceName: 'inst-01' } } });

    await client.createInstance({ instanceName: 'inst-01' });

    expect(http['post']).toHaveBeenCalledWith(
      '/instance/create',
      expect.objectContaining({ integration: 'WHATSAPP-BAILEYS', instanceName: 'inst-01' }),
    );
  });
});

// ---------------------------------------------------------------------------
// EvolutionApiError
// ---------------------------------------------------------------------------

describe('EvolutionApiError', () => {
  it('fromResponse monta mensagem correta', () => {
    const err = EvolutionApiError.fromResponse('/test', 422, { message: 'fail' });
    expect(err.statusCode).toBe(422);
    expect(err.endpoint).toBe('/test');
    expect(err.message).toContain('422');
    expect(err.name).toBe('EvolutionApiError');
  });
});

// ---------------------------------------------------------------------------
// ThrottledSender
// ---------------------------------------------------------------------------

describe('ThrottledSender', () => {
  it('processa batch e retorna resultados corretos', async () => {
    const sender = new ThrottledSender({ minMs: 0, maxMs: 1 });
    const numbers = ['5598111110000', '5598222220000', '5598333330000'];
    const sent: string[] = [];

    const results = await sender.batch(
      numbers,
      async (n) => {
        sent.push(n);
        return { ok: true };
      },
    );

    expect(sent).toHaveLength(3);
    expect(results).toHaveLength(3);
    expect(results[0]!.error).toBeNull();
  });

  it('captura erros sem interromper o batch', async () => {
    const sender = new ThrottledSender({ minMs: 0, maxMs: 1 });
    const errors: string[] = [];

    const results = await sender.batch(
      ['5598111110000', '5598222220000'],
      async (n) => {
        if (n === '5598222220000') throw new Error('Falhou');
        return { ok: true };
      },
      {
        onError: (item) => errors.push(item),
      },
    );

    expect(errors).toContain('5598222220000');
    expect(results[0]!.error).toBeNull();
    expect(results[1]!.error).toBe('Falhou');
  });

  it('dispara onSent com index e total corretos', async () => {
    const sender = new ThrottledSender({ minMs: 0, maxMs: 1 });
    const calls: Array<[number, number]> = [];

    await sender.batch(
      ['a', 'b', 'c'],
      async () => 'ok',
      { onSent: (_, __, i, total) => calls.push([i, total]) },
    );

    expect(calls).toEqual([[1, 3], [2, 3], [3, 3]]);
  });

  it('estimateSeconds calcula corretamente', () => {
    const sender = new ThrottledSender({ minMs: 8_000, maxMs: 15_000 });
    const est = sender.estimateSeconds(11);
    expect(est.minSeconds).toBe(80);
    expect(est.maxSeconds).toBe(150);
  });

  it('estimateSeconds retorna zero para 1 item', () => {
    const sender = new ThrottledSender();
    const est = sender.estimateSeconds(1);
    expect(est.minSeconds).toBe(0);
    expect(est.maxSeconds).toBe(0);
  });

  it('lança erro se minMs > maxMs', () => {
    expect(() => new ThrottledSender({ minMs: 20_000, maxMs: 5_000 })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

describe('createEvolutionClient', () => {
  it('lança erro sem EVOLUTION_API_URL', () => {
    delete process.env['EVOLUTION_API_URL'];
    delete process.env['EVOLUTION_API_KEY'];
    expect(() => createEvolutionClient()).toThrow('EVOLUTION_API_URL');
  });

  it('lança erro sem EVOLUTION_API_KEY', () => {
    process.env['EVOLUTION_API_URL'] = 'https://evolution.test';
    delete process.env['EVOLUTION_API_KEY'];
    expect(() => createEvolutionClient()).toThrow('EVOLUTION_API_KEY');
  });

  it('cria cliente com env vars válidas', () => {
    process.env['EVOLUTION_API_URL'] = 'https://evolution.test';
    process.env['EVOLUTION_API_KEY'] = 'key-123';
    const client = createEvolutionClient();
    expect(client).toBeInstanceOf(EvolutionClient);
  });
});
