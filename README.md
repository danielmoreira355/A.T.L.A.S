# A.T.L.A.S — Advanced Tactical Life & Automation System

Sistema estratégico pessoal de Daniel Moreira.

## O que esta versão faz

- Mantém a interface original do A.T.L.A.S.
- Lê `atlas-core.md`.
- Lê `atlas-memory.json`.
- Lê e grava `atlas-conversation-memory.json`.
- Injeta memórias relevantes no prompt antes de responder.
- Salva histórico da conversa.
- Salva memórias importantes automaticamente.
- Adiciona endpoint de status da memória.

## Arquivos principais

- `server.js` — servidor principal atualizado.
- `server.original.js` — backup do servidor original.
- `atlas-core.md` — núcleo de comportamento do A.T.L.A.S.
- `atlas-memory.json` — memória fixa do Daniel, Mewtly e regras centrais.
- `atlas-conversation-memory.json` — memórias dinâmicas e histórico.
- `env.example` — variáveis de ambiente necessárias.

## Variáveis de ambiente

Configure no Railway:

```env
OPENAI_API_KEY=sua_chave_openai
ATLAS_PASSWORD=sua_senha_de_acesso
PORT=3000
```

## Testes rápidos

Abra:

```text
/
```

Status da memória:

```text
/atlas-memory-status
```

Mensagem para testar:

```text
Salve na memória que estamos configurando a memória persistente do A.T.L.A.S.
```

Depois abra `/atlas-memory-status` e confira se uma nova memória apareceu.

## Atenção

Esta versão usa JSON local. Em plataformas como Railway, arquivos locais podem não ser permanentes depois de redeploy/restart. Para memória profissional de longo prazo, o próximo passo é migrar para Supabase.
