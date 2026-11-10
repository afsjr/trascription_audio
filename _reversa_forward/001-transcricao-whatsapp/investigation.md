# Investigation: Transcrição de áudios do WhatsApp

> Identificador: `001-transcricao-whatsapp`
> Data: `2026-11-10`

## 1. Pesquisa de fundo

🟡 O WhatsApp exporta mensagens de voz como arquivos Opus em contêiner Ogg (`.ogg` ou `.opus`). APIs de transcrição modernas aceitam esse contêiner; ainda assim, a validação com um arquivo real é obrigatória antes de considerar o formato resolvido.

🟡 O Vercel Functions com Fluid compute tem duração máxima de 300 s no plano Hobby e limite de payload de 4,5 MB por request. O limite de payload não afeta o upload porque o arquivo vai direto ao Blob; a função recebe apenas a URL.

## 2. Alternativas avaliadas

| Alternativa | Prós | Contras | Decisão |
|-------------|------|---------|---------|
| 🟡 Whisper local (`faster-whisper`) | 🟡 Privacidade e custo fixo | 🟡 Não roda bem em serverless; exige máquina própria | 🟡 Descartada |
| 🟡 Groq `whisper-large-v3-turbo` | 🟡 Rápido, barato, aceita Ogg | 🟡 Dependência externa e limite de quota | 🟡 Adotada como padrão |
| 🟡 OpenAI `gpt-4o-transcribe` | 🟡 Boa precisão | 🟡 Custo maior | 🟡 Adotada como fallback |
| 🟡 Busca vetorial (pgvector) | 🟡 Busca semântica | 🟡 Custo de embeddings e complexidade | 🟡 Fora do MVP |
| 🟡 Full-text do Postgres | 🟡 Simples, sem serviço extra | 🟡 Não entende sinônimos | 🟡 Adotada |

## 3. Padrões aplicáveis

- 🟡 Upload direto ao storage com URL assinada, para fugir do limite de payload.
- 🟡 Saída estruturada de LLM validada por schema, com retry corretivo.
- 🟡 Sessão stateless assinada por HMAC, verificável no middleware sem consulta ao banco.

## 4. Fontes externas

- 🟡 Documentação do Vercel Functions (limites de duração e payload).
- 🟡 Documentação da API de transcrição do Groq e da OpenAI.
- 🟡 Documentação do Vercel Blob (client upload).
- 🟡 Documentação do Neon (driver serverless).
