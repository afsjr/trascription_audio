# Requirements: Transcrição de áudios do WhatsApp

> Identificador: `001-transcricao-whatsapp`
> Data: `2026-11-10`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

🟡 Aplicação web pessoal que recebe áudios exportados do WhatsApp de até 5 minutos, transcreve em português com timestamps, gera um resumo detalhado e permite buscar no histórico. O áudio original é descartado após a transcrição e o acesso é protegido por senha.

## 2. Contexto a partir do legado

🟡 Projeto greenfield: não há legado extraído. As fontes são o PRD e as specs SDD do `/reversa-new`.

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/prd.md#4` | Escopo do MVP: upload, transcrição, resumo, histórico, busca, senha. | 🟡 |
| `_reversa_sdd/prd.md#5` | Não-objetivos: integração automática, multiusuário, busca vetorial, áudio acima de 5 min. | 🟡 |
| `_reversa_sdd/sdd/upload-e-validacao.md#6` | RF-01 a RF-06 de upload e validação. | 🟡 |
| `_reversa_sdd/sdd/transcricao.md#6` | RF-01 a RF-06 de transcrição e fallback. | 🟡 |
| `_reversa_sdd/sdd/resumo-detalhado.md#6` | Seis blocos de resumo e validação de schema. | 🟡 |
| `_reversa_sdd/sdd/historico-e-busca.md#6` | Histórico, busca full-text e destaque. | 🟡 |
| `_reversa_sdd/sdd/acesso-protegido.md#6` | Senha única, cookie e bloqueio por tentativas. | 🟡 |

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| 🟡 Adelino | 🟡 Ler e resumir áudios longos sem ouvir | 🟡 Recebe um áudio de 4 min e quer o conteúdo em texto em segundos |
| 🟡 Prestadora de serviço | 🟡 Registrar o que o cliente combinou por áudio | 🟡 Recebe um áudio de pedido e precisa das ações combinadas |

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** 🟡 Todo áudio deve ter no máximo 300 s; acima disso é rejeitado, sem truncar.
   - Origem: `_reversa_sdd/prd.md#4`
   - Tipo: nova
2. **RN-02:** 🟡 O áudio original é apagado do Blob após a transcrição concluída.
   - Origem: `_reversa_sdd/prd.md#4`
   - Tipo: nova
3. **RN-03:** 🟡 O resumo deve ter seis blocos: temas, decisões, ações, pessoas, riscos e perguntas abertas.
   - Origem: `_reversa_sdd/prd.md#8`
   - Tipo: nova
4. **RN-04:** 🟡 Toda página e rota de API exige sessão válida, exceto o login.
   - Origem: `_reversa_sdd/sdd/acesso-protegido.md#6`
   - Tipo: nova
5. **RN-05:** 🟡 A busca é full-text em português sobre texto e resumo, ordenada por relevância.
   - Origem: `_reversa_sdd/sdd/historico-e-busca.md#6`
   - Tipo: nova

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | O usuário deve poder enviar áudios `.ogg`, `.opus`, `.mp3` e `.m4a` de até 5 minutos | Must | Arquivo válido é aceito e aparece com duração calculada | 🟡 |
| RF-02 | O sistema deve rejeitar áudios acima de 300 s antes de chamar a API de transcrição | Must | Áudio de 5 min 1 s retorna 422 e nenhuma API é chamada | 🟡 |
| RF-03 | O sistema deve transcrever em português com timestamps por segmento | Must | Resposta contém segmentos com início, fim e texto | 🟡 |
| RF-04 | O sistema deve acionar provedor de fallback quando o principal falhar | Must | Com erro 500 no principal, a transcrição termina pelo fallback | 🟡 |
| RF-05 | O sistema deve gerar resumo detalhado em seis blocos validados por schema | Must | JSON persistido contém as seis chaves | 🟡 |
| RF-06 | O sistema deve apagar o áudio do Blob após a transcrição | Must | Consulta ao Blob não encontra o arquivo ao final | 🟡 |
| RF-07 | O sistema deve listar o histórico em ordem decrescente de data | Must | Primeiro item da lista é o mais recente | 🟡 |
| RF-08 | O sistema deve buscar full-text no texto e no resumo, com destaque | Must | Busca por termo retorna registros com o trecho destacado | 🟡 |
| RF-09 | O sistema deve exigir senha única em todas as rotas | Must | Acesso sem cookie recebe 401 ou redireciona ao login | 🟡 |
| RF-10 | O usuário deve poder excluir uma transcrição do histórico | Should | Após confirmação, o registro sai da lista e do banco | 🟡 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Desempenho | transcrição de 5 min em ≤ 120 s | `_reversa_sdd/sdd/transcricao.md#3` | 🟡 |
| Desempenho | busca em ≤ 500 ms para 1 mil registros | `_reversa_sdd/sdd/historico-e-busca.md#3` | 🟡 |
| Segurança | cookie httpOnly, Secure e SameSite Lax | `_reversa_sdd/sdd/acesso-protegido.md#6` | 🟡 |
| Privacidade | áudio não é retido após a transcrição | `_reversa_sdd/prd.md#4` | 🟡 |
| Observabilidade | registrar provedor, latência e tokens sem conteúdo | `_reversa_sdd/sdd/transcricao.md#7` | 🟡 |
| Infraestrutura | Vercel Hobby, função de até 300 s, payload de 4,5 MB | `_reversa_sdd/prd.md#6` | 🟡 |

## 7. Critérios de Aceitação

```gherkin
Cenário: transcrição de áudio válido
  Dado um áudio .ogg de 3 minutos
  Quando o usuário envia o arquivo autenticado
  Então o sistema exibe a transcrição com timestamps e o resumo em seis blocos
  E o arquivo de áudio não existe mais no Blob

Cenário: áudio acima do limite
  Dado um áudio de 5 minutos e 1 segundo
  Quando o usuário tenta enviar
  Então o sistema recusa com a mensagem "Áudio acima de 5 minutos"
  E nenhuma chamada é feita ao provedor de transcrição

Cenário: busca no histórico
  Dado que existe uma transcrição contendo a palavra orçamento
  Quando o usuário busca por orçamento
  Então o registro aparece com o trecho destacado

Cenário: acesso sem sessão
  Dado um navegador sem cookie de sessão
  Quando o usuário abre a página inicial
  Então o sistema redireciona para a tela de senha
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01 a RF-09 | Must | Sem qualquer um deles o MVP não fecha o fluxo principal. |
| RF-10 | Should | Exclusão é útil, mas não bloqueia o uso. |
| Busca em ≤ 500 ms | Should | Alvo de qualidade, ajustável após medição. |

## 9. Esclarecimentos

> Nenhuma sessão de dúvidas registrada. Modo expresso: `/reversa-clarify` foi pulado e as dúvidas remanescentes viram premissas no `roadmap.md`.

## 10. Lacunas

- 🟡 Formato exato do Opus exportado pelo WhatsApp pode exigir transcodificação; tratar como premissa, não como bloqueio.
- 🟡 Alvos numéricos das métricas de uso são provisórios até calibração com uso real.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-11-10 | Versão inicial gerada por `/reversa-requirements` no modo expresso | reversa |
