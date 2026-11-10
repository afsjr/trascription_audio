# Onboarding: testar a feature pela primeira vez

> Identificador: `001-transcricao-whatsapp`
> Data: `2026-11-10`

## 1. Pré-requisitos

- 🟡 Node.js 20 ou superior.
- 🟡 Conta no Vercel (Hobby) com Blob store criado.
- 🟡 Banco Neon Postgres criado.
- 🟡 Chave da Groq e chave da OpenAI.

## 2. Variáveis de ambiente

Crie `web/.env.local` com:

```
BLOB_STORE_ID=...
GROQ_API_KEY=...
OPENAI_API_KEY=...
DATABASE_URL=postgresql://...
APP_PASSWORD=escolha-uma-senha
AUTH_SECRET=uma-string-aleatoria-de-32-bytes
```

🟡 O `VERCEL_OIDC_TOKEN` necessário para o Blob privado não é copiado à mão: rode `vercel link` e `vercel env pull /tmp/dev.env --environment development`, depois adicione `VERCEL_OIDC_TOKEN` ao `web/.env.local`. Ele expira e precisa ser renovado.

## 3. Banco de dados

1. 🟡 Abra o SQL editor do Neon.
2. 🟡 Execute `web/db/migrations/001_init.sql`.
3. 🟡 Confirme que as tabelas `uploads`, `transcripts`, `summaries` e `access_attempts` existem.

## 4. Rodar localmente

1. 🟡 `cd web`
2. 🟡 `npm install`
3. 🟡 `npm run dev`
4. 🟡 Abra `http://localhost:3000`, digite a senha e entre.

## 5. Teste manual do fluxo

1. 🟡 Exporte um áudio de até 5 minutos do WhatsApp.
2. 🟡 Envie o arquivo pela página inicial.
3. 🟡 Confirme a transcrição com timestamps e o resumo em seis blocos.
4. 🟡 Abra o histórico e busque uma palavra que apareça no áudio.
5. 🟡 Confirme que o trecho aparece destacado.
6. 🟡 Envie um áudio com mais de 5 minutos e confirme a rejeição.
7. 🟡 Verifique no painel do Vercel Blob que o áudio foi apagado.

## 6. Deploy

1. 🟡 Crie o projeto no Vercel apontando para o repositório, com Root Directory `web`.
2. 🟡 Conecte o Blob store privado com credenciais OIDC e o Neon pelo marketplace do Vercel.
3. 🟡 Configure as mesmas variáveis de ambiente em Production.
4. 🟡 Faça o deploy e repita o teste manual na URL pública.

## 7. Problemas comuns

| Sintoma | Causa provável | Solução |
|---------|----------------|---------|
| 🟡 503 ao abrir o app | 🟡 `APP_PASSWORD` ou `AUTH_SECRET` ausente | 🟡 Configurar a variável e redeployar |
| 🟡 422 "Áudio acima de 5 minutos" | 🟡 Duração real acima de 300 s | 🟡 Exportar um áudio menor |
| 🟡 Resumo mínimo com aviso | 🟡 LLM retornou JSON inválido duas vezes | 🟡 Tentar novamente ou revisar a transcrição |
| 🟡 Busca sem resultado | 🟡 Migração não rodou | 🟡 Executar `001_init.sql` |
| 🟡 502 no upload | 🟡 Blob/OIDC sem `BLOB_STORE_ID` ou token expirado | 🟡 Reconectar o Blob store e renovar o OIDC |
