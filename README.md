# OpenCode Chat

Interface pessoal de chat para operar o OpenCode por conversa. O projeto usa o SDK oficial `@opencode-ai/sdk` e conecta a um servidor OpenCode persistente.

## Requisitos

- Node.js 20.9+
- Um servidor OpenCode persistente acessível por HTTPS privado
- Provedor/modelo configurado no OpenCode
- Banco/armazenamento externos para produção multi-dispositivo (o protótipo atual salva histórico visual no navegador)

## Rodar localmente

```bash
npm install
cp .env.example .env.local
# Edite OPENCODE_SERVER_URL e OPENCODE_SERVER_PASSWORD
npm run dev
```

Abra http://localhost:3000.

## Arquitetura de produção

**Vercel:** interface Next.js e rotas curtas de controle.  
**Executor:** instância persistente do OpenCode em VM/container isolado, com diretório de workspace persistente.  
**Arquivos:** armazenamento S3 compatível (R2, S3 ou similar), upload multipart direto do navegador.  
**Estado:** PostgreSQL para usuários, conversas, mapeamento chatID→OpenCode sessionID, tarefas, uploads e eventos.

Não execute trabalhos de longa duração dentro de uma função serverless do Vercel. O executor precisa sobreviver a reinícios da página e manter o processo de programação vivo. Para vários chats em paralelo, provisionar workspace isolado por sessão/projeto.

## Limitações deliberadas deste primeiro scaffold

- A tela e a integração básica de sessão/prompt estão implementadas.
- O histórico da interface está no `localStorage`; para sincronização entre dispositivos, substituir por PostgreSQL.
- O envio de anexos aparece na interface, mas o upload real de arquivos ainda precisa ser conectado ao armazenamento multipart e depois disponibilizado ao workspace do executor.
- O SDK pode retornar uma resposta após o prompt; streaming de eventos, atualização de status em tempo real e retomada de jobs devem ser conectados ao serviço persistente.
- O token de acesso é um bloqueio básico de protótipo. Para publicação real, implementar autenticação robusta, proteção CSRF/rate limit e segredos apenas no servidor.
- O ID do chat da interface e o ID de sessão do OpenCode devem ser mapeados em banco na versão de produção; este scaffold demonstra o fluxo básico e não é uma implementação final multiusuário.

## Deploy

Importe o repositório no Vercel, configure as variáveis de ambiente e mantenha `OPENCODE_SERVER_URL` apontando para o executor privado. Não exponha diretamente a porta do OpenCode à internet. Coloque o executor atrás de proxy autenticado/TLS e restrinja acesso de rede.
