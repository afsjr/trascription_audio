# Interface: API interna e Vercel Blob

> Identificador: `001-transcricao-whatsapp`
> Data: `2026-11-10`

## 1. POST /api/login

**Request**

```json
{ "password": "string" }
```

**Response 200**

```json
{ "ok": true }
```

**Erros**

| Status | Condição |
|--------|----------|
| 🟡 401 | Senha incorreta |
| 🟡 429 | Bloqueio por tentativas |
| 🟡 503 | Senha não configurada no ambiente |

**Efeitos:** 🟡 define cookie `sessao` httpOnly, Secure, SameSite Lax, validade de 7 dias.

## 2. POST /api/logout

**Response 200**

```json
{ "ok": true }
```

**Efeitos:** 🟡 apaga o cookie de sessão.

## 3. POST /api/upload

**Request:** `multipart/form-data`

- 🟡 `file`: arquivo `.ogg`, `.opus`, `.mp3` ou `.m4a`
- 🟡 `clientDurationSeconds` (opcional): duração lida no navegador

**Response 200**

```json
{
  "transcriptId": "uuid",
  "text": "texto completo",
  "segments": [{ "start": 0, "end": 3.2, "text": "..." }],
  "summary": {
    "temas": ["..."],
    "decisoes": ["..."],
    "acoes": ["..."],
    "pessoas": ["..."],
    "riscos": ["..."],
    "perguntasAbertas": ["..."]
  }
}
```

**Erros**

| Status | Condição |
|--------|----------|
| 🟡 400 | Payload inválido |
| 🟡 401 | Sem sessão válida |
| 🟡 413 | Arquivo acima de 4 MB |
| 🟡 415 | Formato não suportado |
| 🟡 422 | Duração acima de 300 s ou áudio ilegível |
| 🟡 502 | Falha no storage, na transcrição ou no resumo |

**Storage:** 🟡 o arquivo é gravado em Blob privado no servidor via OIDC e apagado ao final.

**Timeout:** 🟡 a rota usa o limite da função (300 s no Hobby).

## 4. GET /api/transcripts?page=1

**Response 200**

```json
{
  "items": [
    {
      "id": "uuid",
      "filename": "audio.ogg",
      "durationSeconds": 180,
      "createdAt": "2026-11-10T12:00:00Z",
      "summaryPreview": "..."
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 42
}
```

**Erros:** 🟡 401 sem sessão.

## 5. GET /api/transcripts/{id}

**Response 200**

```json
{
  "id": "uuid",
  "filename": "audio.ogg",
  "text": "...",
  "segments": [],
  "summary": {},
  "provider": "groq",
  "createdAt": "2026-11-10T12:00:00Z"
}
```

**Erros:** 🟡 401 sem sessão; 🟡 404 para id inexistente.

## 6. DELETE /api/transcripts/{id}

**Response 200**

```json
{ "ok": true }
```

**Erros:** 🟡 401 sem sessão; 🟡 404 para id inexistente ou já removido.

## 7. GET /api/search?q=termo

**Response 200**

```json
{
  "items": [
    {
      "id": "uuid",
      "filename": "audio.ogg",
      "createdAt": "2026-11-10T12:00:00Z",
      "headline": "... trecho com <mark>termo</mark> ...",
      "rank": 0.42
    }
  ]
}
```

**Erros:** 🟡 400 para consulta acima de 200 caracteres; 🟡 401 sem sessão.

## 8. Vercel Blob (privado, OIDC)

- 🟡 O upload acontece no servidor com `put(..., { access: "private" })` via OIDC (`BLOB_STORE_ID` + `VERCEL_OIDC_TOKEN`).
- 🟡 Não há token estático de leitura/escrita no cliente nem na aplicação.
- 🟡 Após a transcrição, `del(blobUrl)` remove o arquivo em qualquer caminho, inclusive de erro.
