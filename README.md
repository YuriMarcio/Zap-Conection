# FlowBridge

> Communication Platform para WhatsApp (e futuros canais). Build once. Connect everywhere.

SDK TypeScript que abstrai provedores de WhatsApp atrás de uma interface única
(`CommunicationProvider`), seguindo Clean Architecture (ver `VISION.md` e `ARCHITECTURE.md`).
Focado só em infraestrutura de comunicação — conexão, instância, webhook, envio de mensagens,
botões, listas e carrossel. Sem regra de negócio, sem UI, sem servidor HTTP próprio.

Três providers hoje:

- **Evolution API** — self-hosted, baseado em Baileys.
- **Z-API** — SaaS, baseado em Baileys.
- **Meta Cloud API** — API oficial do WhatsApp Business Platform.

Trocar de provider é mudar configuração — nenhum código consumidor precisa mudar.

---

## Instalação

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

---

## Uso — FlowBridge SDK (multi-provider)

### Criando o client

```ts
import { createFlowBridgeClient } from '@sinal/evolution-client';

// Lê configuração de variáveis de ambiente (ver tabela abaixo)
const flowBridge = createFlowBridgeClient();

// Ou com providers explícitos — pode registrar mais de um ao mesmo tempo
const flowBridge = createFlowBridgeClient({
  providers: [
    { name: 'evolution', baseUrl: 'https://evolution.seudominio.com', apiKey: '...' },
    { name: 'meta', phoneNumberId: '...', accessToken: '...', wabaId: '...' },
  ],
});
```

### Variáveis de ambiente por provider

| Provider | Variáveis |
|---|---|
| `evolution` | `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_THROW_ON_ERROR`, `EVOLUTION_TIMEOUT_MS` |
| `zapi` | `ZAPI_INSTANCE_ID`, `ZAPI_TOKEN`, `ZAPI_CLIENT_TOKEN`, `ZAPI_THROW_ON_ERROR`, `ZAPI_TIMEOUT_MS` |
| `meta` | `WHATSAPP_CLOUD_PHONE_NUMBER_ID`, `WHATSAPP_CLOUD_ACCESS_TOKEN`, `WHATSAPP_CLOUD_WABA_ID`, `WHATSAPP_CLOUD_API_VERSION`, `WHATSAPP_THROW_ON_ERROR`, `WHATSAPP_TIMEOUT_MS` |

`createFlowBridgeClient()` sem argumentos registra todos os providers cujas variáveis
obrigatórias estiverem presentes.

### Todo método recebe um Request com `provider` + `instanceId`

```ts
await flowBridge.sendText({
  provider: 'evolution',
  instanceId: 'prospeccao-01',
  to: '5598999990000',
  text: 'Olá!',
});

await flowBridge.sendButtons({
  provider: 'meta',
  instanceId: 'PHONE_NUMBER_ID',
  to: '5598999990000',
  content: {
    body: 'Confirma o agendamento?',
    buttons: [
      { id: 'SIM', displayText: 'Sim' },
      { id: 'NAO', displayText: 'Não' },
    ],
  },
});

await flowBridge.sendCarousel({
  provider: 'evolution',
  instanceId: 'prospeccao-01',
  to: '5598999990000',
  content: {
    body: 'Confira nossos planos:',
    cards: [{ title: 'Plano Pro', body: 'R$ 350/mês', imageUrl: 'https://img/pro.jpg', buttons: [{ id: 'PRO', displayText: 'Quero esse' }] }],
  },
});
```

### Matriz de capacidades por provider

Os três providers implementam a mesma interface (`CommunicationProvider`), mas nem toda
operação existe em todo provider — operações genuinamente não suportadas lançam
`UnsupportedProviderOperationException` em vez de simular um comportamento inexistente.

| Operação | Evolution | Z-API | Meta Cloud API |
|---|---|---|---|
| `connect` (instância + QR) | ✅ | ✅ | ⚠️ não há QR — número é provisionado no Meta Business Manager; `connect()` só confirma que está ativo |
| `disconnect` | ✅ | ✅ | ❌ não existe via API |
| `getStatus` | ✅ | ✅ | ⚠️ aproximado |
| `setWebhook` | ✅ | ✅ | ⚠️ só inscreve o app na WABA — a URL de callback precisa ser configurada manualmente no App Dashboard da Meta |
| `checkNumbers` | ✅ | ✅ | ❌ sem endpoint equivalente |
| `sendText` / `sendImage` / `sendAudio` / `sendVideo` / `sendDocument` / `sendLocation` | ✅ | ✅ | ✅ |
| `sendButtons` | ✅ | ✅ | ✅ (máx. 3 botões, título ≤20 chars — validado antes de chamar a API) |
| `sendList` | ✅ (com seções) | ✅ (achata seções numa lista única) | ✅ (máx. 10 seções / 10 linhas — validado) |
| `sendCarousel` | ✅ freeform | ✅ freeform | ⚠️ só via template pré-aprovado — exige `providerOptions.templateName` + `languageCode` |
| `sendReaction` | ✅ | ✅ | ✅ |

### Coexistence (Meta Cloud API)

Recurso exclusivo da Cloud API: o mesmo número continua ativo no app WhatsApp Business
(celular) **e** na Cloud API ao mesmo tempo. `MetaCloudApiProvider` expõe métodos extras
(fora da interface comum, já que não têm equivalente nos outros providers):

```ts
import { MetaCloudApiProvider } from '@sinal/evolution-client';

const meta = new MetaCloudApiProvider({ name: 'meta', phoneNumberId, accessToken, wabaId }, logger);

await meta.getPhoneNumberInfo();  // { isOnBizApp, platformType }
await meta.syncContacts();        // sincronização obrigatória pós-onboarding (até 24h)
await meta.syncHistory();
```

As três chaves de webhook exclusivas de Coexistence (`history`, `smb_app_state_sync`,
`smb_message_echoes`) precisam ser inscritas manualmente no App Dashboard da Meta — não há
chamada de API para isso. Os payloads desses eventos estão tipados em `contracts/dto`
(`HistorySyncWebhookPayload`, `SmbAppStateSyncWebhookPayload`, `SmbMessageEchoWebhookPayload`)
para quem for implementar o endpoint receptor.

### Logger e eventos de domínio

```ts
import { createFlowBridgeClient, type Logger } from '@sinal/evolution-client';

const meuLogger: Logger = {
  debug: (msg, ctx) => minhaLib.debug(msg, ctx),
  info: (msg, ctx) => minhaLib.info(msg, ctx),
  warn: (msg, ctx) => minhaLib.warn(msg, ctx),
  error: (msg, ctx) => minhaLib.error(msg, ctx),
};

const flowBridge = createFlowBridgeClient({
  logger: meuLogger,
  eventPublisher: { publish: (event) => meuBarramento.emit(event.type, event) },
});
```

Eventos publicados hoje: `InstanceConnected`, `InstanceDisconnected`, `QRCodeGenerated`,
`MessageSent`. `MessageReceived`/`MessageDelivered`/`MessageRead` já têm o formato definido em
`core/events`, mas não são emitidos pelo SDK ainda — ele não roda servidor, então não recebe
webhooks inbound; ficam prontos para quando essa camada existir.

### Arquitetura

```
src/
  core/            → CommunicationProvider, entidades, value objects, eventos, exceptions — não conhece HTTP/providers
  contracts/       → dto, requests, responses, events, schemas (zod) — linguagem pública estável
  providers/       → EvolutionProvider, ZApiProvider, MetaCloudApiProvider — cada um implementa CommunicationProvider
  registry/        → ProviderRegistry — único lugar que resolve provider por nome
  application/     → use-cases (um por operação) + FlowBridgeClient (fachada = SDK) + factory
  infrastructure/  → Logger (ConsoleLogger) e o wrapper HTTP compartilhado pelos providers
  config/          → leitura de env vars por provider
  compat/          → EvolutionClient/createEvolutionClient legados (ver seção abaixo)
```

`api/` (HTTP), `infrastructure/` persistente (banco, filas) e o Dashboard Administrativo estão
fora de escopo por enquanto — entram como camada por cima do que já existe, sem tocar em
Core/Providers.

---

## ThrottledSender — disparos seguros em prospecção

```ts
import { ThrottledSender, createFlowBridgeClient } from '@sinal/evolution-client';

const flowBridge = createFlowBridgeClient();
const sender = new ThrottledSender({ minMs: 8_000, maxMs: 15_000 });

const valid = await flowBridge.checkNumbers({ provider: 'evolution', instanceId: 'prospeccao-01', numbers: rawNumbers });

await sender.batch(
  valid,
  (number) => flowBridge.sendText({ provider: 'evolution', instanceId: 'prospeccao-01', to: number, text: mensagem }),
  {
    onSent:  (n, _, i, total) => console.log(`[${i}/${total}] ✓ ${n}`),
    onError: (n, err, i)      => console.error(`[${i}] ✗ ${n}: ${err.message}`),
  },
);
```

**Nunca use delay < 8s em instâncias Baileys (Evolution/Z-API) em produção.**

---

## Testes

```bash
npm test
```

---

## Compatibilidade com `@sinal/evolution-client` (uso legado)

O SINAL e o módulo de prospecção já consomem este pacote hoje via `EvolutionClient` e
`createEvolutionClient`. Essas APIs continuam funcionando exatamente como antes — são uma
fachada independente em `src/compat/`, congelada de propósito para não arriscar mudar
comportamento em produção.

```ts
import { createEvolutionClient } from '@sinal/evolution-client';

const client = createEvolutionClient(); // lê EVOLUTION_API_URL / EVOLUTION_API_KEY do .env
```

```ts
import { EvolutionClient } from '@sinal/evolution-client';

const client = new EvolutionClient({
  baseUrl: 'https://evolution.seudominio.com',
  apiKey: process.env.EVOLUTION_API_KEY!,
  throwOnError: true, // lança EvolutionApiError em 4xx/5xx
});
```

### Referência (API legada)

```ts
await client.createInstance({ instanceName: 'prospeccao-01' });
await client.setWebhook('prospeccao-01', { enabled: true, url: 'https://seuapp.com/webhook/whatsapp', events: ['MESSAGES_UPSERT'] });
await client.getQrCode('prospeccao-01');
await client.getInstanceStatus('prospeccao-01');
await client.deleteInstance('prospeccao-01');

const valid = await client.checkNumbers('prospeccao-01', ['5598999990000', '5511000000000']);
// → ['5598999990000']

await client.sendText('instancia', '5598999990000', 'Olá!');
await client.sendImage('instancia', '5598999990000', 'https://img.url/foto.jpg', 'Legenda');
await client.sendAudio('instancia', '5598999990000', 'https://audio.url/voz.ogg');
await client.sendDocument('instancia', '5598999990000', 'https://url/proposta.pdf', 'proposta.pdf');

await client.sendButtons('instancia', '5598999990000', 'Título', 'Corpo', 'Rodapé', [
  { type: 'reply', displayText: 'Sim', id: 'BTN_SIM' },
  { type: 'reply', displayText: 'Não', id: 'BTN_NAO' },
]);

await client.sendCarousel('instancia', '5598999990000', 'Confira nossos planos:', [
  { title: 'Plano Pro', body: 'R$ 350/mês', footer: 'Mais popular', imageUrl: 'https://img.url/pro.jpg', buttons: [{ type: 'reply', displayText: 'Quero esse', id: 'PLANO_PRO' }] },
]);

await client.sendReaction('instancia', '5598999990000', 'MSG_ID_AQUI', '👍');
```

### Tratamento de erros

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

Com `throwOnError: false` (padrão), erros são logados silenciosamente — mesmo comportamento
do `EvolutionService.php` original do SINAL.

### Como atualizar nos projetos consumidores

```bash
npm install github:sinal-app/evolution-client
```

Ou fixe uma tag de release:

```json
"@sinal/evolution-client": "github:sinal-app/evolution-client#v2.0.0"
```
