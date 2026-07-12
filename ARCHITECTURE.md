# 🏗️ FlowBridge Architecture

> Universal Communication Platform

Version: 1.0

---

# Objetivo

FlowBridge foi projetado para ser uma plataforma de comunicação independente de providers.

Seu propósito é desacoplar aplicações das APIs de comunicação, oferecendo uma interface única, consistente e extensível.

A aplicação nunca deve conhecer detalhes do provider utilizado.

Todo acesso a plataformas externas acontece através dos Providers.

---

# Princípios Arquiteturais

Toda decisão arquitetural deve seguir estes princípios:

- Simplicidade
- Modularidade
- Baixo acoplamento
- Alta coesão
- Escalabilidade
- Extensibilidade
- Testabilidade

A arquitetura sempre deve favorecer contratos em vez de implementações.

---

# Arquitetura Geral

```
                     Client Application
                              │
                              │
                     FlowBridge SDK
                              │
                              ▼
                      REST / WebSocket
                              │
                              ▼
                        FlowBridge API
                              │
                              ▼
                       Application Layer
                              │
                              ▼
                           Contracts
                              │
                              ▼
                              Core
                              │
                              ▼
                     Provider Registry
                              │
          ┌───────────────────┼────────────────────┐
          ▼                   ▼                    ▼
  EvolutionProvider    MetaProvider      ZApiProvider
                              │
                              ▼
                    External Communication APIs
```

---

# Estrutura do Projeto

```
src/

api/
│
├── controllers/
├── routes/
├── middlewares/
└── server.ts

application/
│
├── handlers/
├── services/
├── use-cases/
└── factories/

contracts/
│
├── dto/
├── requests/
├── responses/
├── events/
├── schemas/
└── types/

core/
│
├── entities/
├── interfaces/
├── value-objects/
├── events/
├── exceptions/
└── enums/

providers/
│
├── evolution/
├── meta/
├── zapi/
└── telegram/

infrastructure/
│
├── database/
├── cache/
├── queue/
├── logger/
└── storage/

registry/
│
└── provider-registry.ts

shared/
│
├── constants/
├── helpers/
├── utils/
└── errors/

config/

tests/
```

---

# Responsabilidade das Camadas

## API

Responsável por:

- HTTP
- WebSocket
- Autenticação
- Rate Limit
- Documentação
- Serialização

Nunca implementa regra de negócio.

---

## Application

Responsável pelos casos de uso.

Exemplos:

- SendMessage
- ConnectInstance
- DisconnectInstance
- CreateInstance
- ReceiveWebhook

A camada Application orquestra o fluxo da plataforma.

---

## Contracts

Contracts representam a linguagem pública do sistema.

Essa camada contém apenas estruturas compartilhadas.

Exemplos:

- DTOs
- Requests
- Responses
- Eventos públicos
- Tipos
- Schemas

Os contratos devem permanecer estáveis sempre que possível.

---

## Core

Core representa o domínio da plataforma.

Contém apenas:

- Entities
- Interfaces
- Value Objects
- Domain Events
- Exceptions

O Core nunca conhece:

- HTTP
- Fastify
- Banco
- Redis
- RabbitMQ
- Prisma
- Providers
- SDK

---

## Infrastructure

Infrastructure contém detalhes técnicos.

Exemplos:

- Banco
- Cache
- Storage
- Logger
- Queue

Nunca implementa regras de negócio.

---

## Providers

Providers implementam integrações com plataformas externas.

Cada Provider deve implementar exatamente o mesmo contrato.

Exemplo:

```
CommunicationProvider
        ▲
        │
 ┌──────┼──────────────┐
 │      │              │
Evolution Meta      Telegram
```

Providers são descartáveis.

Trocar um Provider nunca deve exigir alterações no Core.

---

# Fluxo de Envio

```
Client

↓

SDK

↓

API

↓

Application

↓

Provider Registry

↓

Provider

↓

External API
```

---

# Fluxo de Recebimento

```
Webhook

↓

Provider

↓

Application

↓

Events

↓

Consumers
```

---

# Provider Registry

O Provider Registry é responsável por resolver qual Provider será utilizado.

Exemplo:

```ts
const provider = providerRegistry.resolve(instance.provider);

await provider.sendText(request);
```

Nunca utilizar condicionais como:

```ts
if (provider === "evolution") {

}
```

Toda seleção deve acontecer através do Registry.

---

# Interface dos Providers

Todos os Providers implementam a mesma interface.

Exemplo:

```ts
export interface CommunicationProvider {
  connect(): Promise<void>;

  disconnect(): Promise<void>;

  sendText();

  sendImage();

  sendAudio();

  sendVideo();

  sendDocument();

  sendLocation();

  sendButtons();

  sendList();

  sendCarousel();
}
```

O restante da aplicação conhece apenas essa interface.

---

# Dependency Rule

As dependências sempre apontam para o Core.

```
API

↓

Application

↓

Core
```

Infrastructure depende do Core.

Providers dependem do Core.

Core nunca depende de nenhuma implementação.

---

# Eventos

Toda ação importante deve gerar um evento.

Exemplos:

- MessageReceived
- MessageSent
- MessageDelivered
- MessageRead
- QRCodeGenerated
- InstanceConnected
- InstanceDisconnected

Eventos representam fatos.

Nunca regras de negócio.

---

# Escalabilidade

A arquitetura deve suportar:

- milhares de instâncias
- milhões de mensagens
- múltiplos Providers
- múltiplos nós
- execução distribuída
- deploy horizontal

Nenhuma implementação deve assumir uma única instância da aplicação.

---

# Como adicionar um novo Provider

Criar uma nova pasta em:

```
providers/

novo-provider/
```

Implementar `CommunicationProvider`.

Registrar no `ProviderRegistry`.

Nenhuma outra alteração deve ser necessária.

Se for preciso alterar o Core para adicionar um Provider, a arquitetura deve ser revisada.

---

# Regras Arquiteturais

Sempre:

- Programar contra interfaces.
- Manter Providers isolados.
- Utilizar Contracts para comunicação entre camadas.
- Escrever código fortemente tipado.
- Criar módulos pequenos e independentes.
- Priorizar composição em vez de herança.

Nunca:

- Acoplar o Core a Providers.
- Colocar regra de negócio na API.
- Duplicar lógica entre Providers.
- Criar condicionais para diferenciar Providers.
- Expor detalhes internos de implementação.

---

# Objetivo Final

FlowBridge deve permitir que qualquer aplicação troque de provider alterando apenas uma configuração.

A regra de negócio da aplicação nunca deve depender da tecnologia utilizada para comunicação.

Esse princípio deve orientar todas as decisões arquiteturais do projeto.