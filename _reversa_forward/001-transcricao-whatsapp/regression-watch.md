# Regression Watch: Transcrição de áudios do WhatsApp

> Identificador: `001-transcricao-whatsapp`
> Data: 2026-11-10
> Cenário: greenfield, sem regras 🟢 extraídas de código existente.

## Watch principal

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|----|-------------------------|-----------------------------|---------------------|-------------------|
| - | - | - | - | - |

## Observações

🟡 Requisitos implementados que ganham peso de regressão quando uma extração `/reversa` futura os confirmar como 🟢:

- RF-01 a RF-06 de `_reversa_sdd/sdd/upload-e-validacao.md`: formatos aceitos, limite de 300 s, limite de 10 MB, multiupload, duração exibida e remoção do Blob.
- RF-01 a RF-06 de `_reversa_sdd/sdd/transcricao.md`: transcrição, timestamps, fallback, duração, retentativa e idempotência.
- RF-01 a RF-06 de `_reversa_sdd/sdd/resumo-detalhado.md`: seis blocos, schema, idioma, pessoas, limite de 400 palavras e registro de tokens.
- RF-01 a RF-06 de `_reversa_sdd/sdd/historico-e-busca.md`: lista, busca, destaque, paginação, detalhe e exclusão.
- RF-01 a RF-06 de `_reversa_sdd/sdd/acesso-protegido.md`: senha em todas as rotas, comparação em tempo constante, cookie httpOnly, logout, bloqueio e expiração.

## Histórico de re-extrações

| Data | Extração | Resultado |
|------|----------|-----------|
| - | - | - |

## Arquivadas

| ID | Motivo | Data |
|----|--------|------|
| - | - | - |
