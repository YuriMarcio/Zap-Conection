# 🌉 FlowBridge Vision

> **Build once. Connect everywhere.**

Version: 1.0

---

# Nossa Missão

FlowBridge é uma **Communication Platform**.

Seu propósito é fornecer uma camada única, consistente e extensível para integração entre aplicações e diferentes plataformas de comunicação.

O objetivo não é substituir provedores.

O objetivo é eliminar o acoplamento entre aplicações e provedores.

Uma aplicação deve conhecer apenas o FlowBridge.

Nunca a implementação de um provider.

---

# O Problema

Hoje, integrar aplicações com plataformas de comunicação é um processo repetitivo.

Cada provider possui:

- APIs diferentes
- Modelos de autenticação diferentes
- Payloads diferentes
- Eventos diferentes
- Webhooks diferentes
- Limitações diferentes
- Formatos diferentes

Isso faz com que cada sistema precise ser adaptado sempre que um provider muda.

O resultado é:

- alto acoplamento
- baixa reutilização
- manutenção cara
- migrações complexas

---

# Nossa Solução

FlowBridge será a camada responsável por abstrair toda essa complexidade.

```
                Sua Aplicação
                       │
                       ▼
                 FlowBridge
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   Evolution      Meta Cloud      Telegram
```

A aplicação conversa apenas com o FlowBridge.

O FlowBridge conversa com qualquer provider.

---

# Nossa Visão

Queremos que comunicação seja tratada como infraestrutura.

Da mesma forma que um desenvolvedor utiliza um ORM sem conhecer detalhes do banco de dados, ele deve utilizar o FlowBridge sem conhecer detalhes do provider.

Trocar um provider nunca deve exigir alterações na regra de negócio.

Adicionar um novo canal nunca deve quebrar aplicações existentes.

---

# O que o FlowBridge é

FlowBridge é uma plataforma responsável por:

- Gerenciar conexões
- Abstrair providers
- Padronizar eventos
- Padronizar contratos
- Gerenciar sessões
- Expor APIs
- Publicar SDKs
- Publicar eventos
- Gerenciar comunicação entre aplicações e plataformas

---

# O que o FlowBridge NÃO é

FlowBridge nunca será responsável por regras de negócio.

Ele não conhece conceitos específicos de mercado.

Nunca implementaremos funcionalidades como:

- Marketplace
- Delivery
- CRM
- ERP
- Pedidos
- Checkout
- Financeiro
- Automação Comercial
- Atendimento específico
- Fluxos personalizados de clientes

Essas responsabilidades pertencem às aplicações que utilizam o FlowBridge.

---

# Nosso Primeiro Canal

O primeiro canal suportado será o WhatsApp.

Isso não significa que a arquitetura foi criada para WhatsApp.

Ela foi criada para comunicação.

WhatsApp é apenas o primeiro Adapter.

---

# Nossa Arquitetura

Toda arquitetura deve seguir alguns princípios.

## Core independente

O Core nunca conhece:

- APIs HTTP
- Banco de Dados
- Providers
- Frameworks
- Filas
- Cache

O domínio deve permanecer puro.

---

## Contratos antes de implementações

Os contratos representam a linguagem da plataforma.

As implementações representam detalhes técnicos.

Implementações mudam.

Contratos permanecem.

Por isso existe uma camada exclusiva:

```
contracts/
```

Ela contém:

- DTOs
- Requests
- Responses
- Schemas
- Eventos públicos
- Tipos compartilhados

Nenhuma aplicação deve depender diretamente de implementações concretas.

---

## Adapters são descartáveis

Providers são apenas adaptadores.

Hoje:

- Evolution

Amanhã:

- Meta
- Telegram
- Messenger
- Discord

Nenhum Adapter pode influenciar a arquitetura do Core.

---

# Nossos Princípios

## Simplicidade

Sempre escolher a solução mais simples que resolva o problema.

---

## Baixo Acoplamento

Nenhum módulo deve conhecer detalhes internos de outro módulo.

Tudo deve acontecer através de contratos.

---

## Alta Coesão

Cada módulo possui apenas uma responsabilidade.

---

## Extensibilidade

Adicionar um novo Adapter deve exigir apenas uma nova implementação.

Nunca alterações no Core.

---

## SDK First

Toda integração oficial acontece através dos SDKs.

A API existe para os SDKs.

Os SDKs existem para os desenvolvedores.

---

## Developer Experience

A experiência do desenvolvedor é prioridade.

Toda API deve ser:

- intuitiva
- previsível
- tipada
- consistente
- documentada

Se algo gera dúvida, a API precisa ser melhorada.

---

## Open Source First

O projeto deve ser simples de entender.

Simples de contribuir.

Simples de evoluir.

Toda decisão arquitetural deve facilitar contribuições futuras.

---

# Comunicação Baseada em Eventos

Eventos representam fatos.

Exemplos:

- MessageReceived
- MessageDelivered
- InstanceConnected
- InstanceDisconnected
- QRCodeGenerated

Eventos nunca representam regras de negócio.

---

# Nossa Estrutura

O projeto será organizado em módulos independentes.

```
src/

api/

application/

core/

contracts/

infrastructure/

adapters/

registry/

shared/

config/
```

Cada camada possui uma responsabilidade clara.

---

# Pensando no Futuro

Hoje o FlowBridge suporta apenas WhatsApp.

No futuro poderá suportar:

- Telegram
- Instagram
- Messenger
- Discord
- Slack
- SMS
- Email
- RCS

Sem alterar aplicações consumidoras.

Apenas adicionando novos Adapters.

---

# Nosso Compromisso

Nunca prender usuários a um provider.

Nunca criar dependências desnecessárias.

Nunca adicionar regras de negócio ao Core.

Nunca permitir que um Adapter dite a arquitetura da plataforma.

---

# Como Tomamos Decisões

Antes de qualquer implementação, responda:

Esta funcionalidade pertence ao domínio da comunicação?

Ela pode ser utilizada por qualquer aplicação?

Ela melhora a plataforma como um todo?

Ela reduz acoplamento?

Ela melhora a experiência do desenvolvedor?

Se qualquer resposta for "não", a implementação deve ser reavaliada.

---

# O Futuro

Queremos que FlowBridge se torne para comunicação o que Prisma se tornou para bancos de dados.

Uma camada única.

Uma API consistente.

Múltiplas implementações.

Liberdade de escolha.

---

# Nosso Norte

FlowBridge existe para que aplicações se preocupem apenas com comunicação.

Nunca com providers.

Nunca com protocolos.

Nunca com detalhes de implementação.

A plataforma deve esconder toda a complexidade, oferecendo uma experiência simples, consistente e preparada para evoluir ao longo dos anos.