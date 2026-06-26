# @sinal/evolution-client

Cliente TypeScript para a [Evolution API](https://github.com/EvolutionAPI/evolution-api).

Usado pelo **SINAL** e pelo módulo de prospecção. Qualquer fix aqui beneficia os dois projetos.

---

## Instalação

### 1. Configure o repositório privado no projeto consumidor

```json
// package.json
{
  "dependencies": {
    "@sinal/evolution-client": "github:sinal-app/evolution-client"
  }
}
```

```bash
npm install
```

### 2. Configure o `.env`

```env
EVOLUTION_API_URL=https://evolution.seudominio.com
EVOLUTION_API_KEY=sua-api-key

# Lançar exceção em 4xx/5xx? "true" = útil em workers com retry. Default: false
EVOLUTION_THROW_ON_ERROR=false

# Timeout em ms. Default: 15000
EVOLUTION_TIMEOUT_MS=15000
```

---

## Uso

### Factory (recomendado — lê o .env automaticamente)

```ts
import { createEvolutionClient } from '@sinal/evolution-client';

const client = createEvolutionClient();
```

### Instanciação manual

```ts
import { EvolutionClient } from '@sinal/evolution-client';

const client = new EvolutionClient({
  baseUrl: 'https://evolution.seudominio.com',
  apiKey: process.env.EVOLUTION_API_KEY!,
  throwOnError: true, // lança EvolutionApiError em 4xx/5xx
});
```

---

## Referência

### Instâncias

```ts
await client.createInstance({ instanceName: 'prospeccao-01' });

await client.setWebhook('prospeccao-01', {
  enabled: true,
  url: 'https://seuapp.com/webhook/whatsapp',
  events: ['MESSAGES_UPSERT'],
});

await client.getQrCode('prospeccao-01');
await client.getInstanceStatus('prospeccao-01');
await client.deleteInstance('prospeccao-01');
```

### Validação de números ← chave para prospecção

```ts
const valid = await client.checkNumbers('prospeccao-01', [
  '5598999990000',
  '5511000000000', // não existe no WA → filtrado
  '5521988880000',
]);
// → ['5598999990000', '5521988880000']
```

Sempre valide antes de disparar. Enviar para números inexistentes aumenta o score de ban da instância Baileys.

### Mensagens

```ts
await client.sendText('instancia', '5598999990000', 'Olá!');
await client.sendText('instancia', '5598999990000', 'Olá!', 3000); // delay customizado em ms

await client.sendImage('instancia', '5598999990000', 'https://img.url/foto.jpg', 'Legenda');

await client.sendAudio('instancia', '5598999990000', 'https://audio.url/voz.ogg');

await client.sendDocument('instancia', '5598999990000', 'https://url/proposta.pdf', 'proposta.pdf');

await client.sendButtons('instancia', '5598999990000',
  'Título', 'Corpo da mensagem', 'Rodapé',
  [
    { type: 'reply', displayText: 'Sim', id: 'BTN_SIM' },
    { type: 'reply', displayText: 'Não', id: 'BTN_NAO' },
  ]
);

await client.sendCarousel('instancia', '5598999990000', 'Confira nossos planos:', [
  {
    title: 'Plano Pro',
    body: 'R$ 350/mês',
    footer: 'Mais popular',
    imageUrl: 'https://img.url/pro.jpg',
    buttons: [{ type: 'reply', displayText: 'Quero esse', id: 'PLANO_PRO' }],
  },
]);

await client.sendReaction('instancia', '5598999990000', 'MSG_ID_AQUI', '👍');
```

---

## ThrottledSender — disparos seguros em prospecção

```ts
import { ThrottledSender, createEvolutionClient } from '@sinal/evolution-client';

const client = createEvolutionClient();
const sender = new ThrottledSender({ minMs: 8_000, maxMs: 15_000 });

// Estimativa antes de rodar
const est = sender.estimateSeconds(numbers.length);
console.log(`Vai levar entre ${est.minSeconds}s e ${est.maxSeconds}s`);

// Valida → filtra → dispara
const valid = await client.checkNumbers('prospeccao-01', rawNumbers);

await sender.batch(
  valid,
  (number) => client.sendText('prospeccao-01', number, mensagem),
  {
    onSent:  (n, _, i, total) => console.log(`[${i}/${total}] ✓ ${n}`),
    onError: (n, err, i)      => console.error(`[${i}] ✗ ${n}: ${err.message}`),
  },
);
```

**Nunca use delay < 8s em instâncias Baileys em produção.**

---

## Tratamento de erros

```ts
import { EvolutionApiError, createEvolutionClient } from '@sinal/evolution-client';

const client = createEvolutionClient({ throwOnError: true });

try {
  await client.sendText('inst', '5598999990000', 'Olá');
} catch (err) {
  if (err instanceof EvolutionApiError) {
    console.error(err.statusCode);  // 422, 500, etc.
    console.error(err.endpoint);    // '/message/sendText/inst'
    console.error(err.responseBody);
  }
}
```

Com `throwOnError: false` (padrão), erros são logados silenciosamente — mesmo comportamento do `EvolutionService.php` original do SINAL.

---

## Testes

```bash
npm test
```

---

## Como atualizar nos projetos consumidores

```bash
npm install github:sinal-app/evolution-client
```

Ou fixe uma tag de release:

```json
"@sinal/evolution-client": "github:sinal-app/evolution-client#v1.1.0"
```
