# Manual — Dashboard de Projetos CAP (API por projeto)

Este documento é a especificação do dashboard. Siga as regras ao pé da letra.
Regra-mãe: **o cliente só vê valor BRUTO.** Nenhum número exibido pode divergir do bruto contratado.

---

## 1. De onde vêm os dados

Cada projeto do cap-manager tem um token próprio (1 token = 1 projeto). Um dashboard pode
usar um ou vários projetos — um token para cada.

**URL de produção (fixa para todos os dashboards):**

```
GET https://capmanager.capdigital.company/api/public/projeto
Authorization: Bearer <token do projeto>
```

(também aceita `?token=<token>`, mas prefira o header).

### Como conseguir o token de um projeto

Os tokens não ficam visíveis no sistema. Peça ao admin do cap-manager informando o **ID do projeto**
(está na URL do projeto: `/projetos_midia/<id>`). O admin consulta no Supabase:

```sql
SELECT p.id, p.nome, t.tipo, t.token
FROM public.cap_manager_projetos_api_tokens t
JOIN public.cap_manager_projetos p ON p.id = t.projeto_id
WHERE p.id IN (<ids>) AND t.ativo;
```

Todo projeto novo já nasce com token. Para revogar o acesso de um dashboard: `ativo = false`.

### Modelo de `.env` do dashboard

```bash
# URL do cap-manager (igual para todos os dashboards)
CAP_MANAGER_URL=https://capmanager.capdigital.company

# Um token por projeto — nomeie pelo projeto, nunca prefixe com NEXT_PUBLIC_
CAP_TOKEN_<NOME_DO_PROJETO>=<token>
# ex.: CAP_TOKEN_LIDERANCA=...   (projeto 214)
#      CAP_TOKEN_FEEDBACK=...    (projeto 215)
```

### Modelo de chamada (servidor, Next.js)

```ts
// lib/cap-manager.ts — só importar em código de servidor
export async function getProjetoCap(token: string) {
  const res = await fetch(`${process.env.CAP_MANAGER_URL}/api/public/projeto`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 300 }, // dashboard vivo: no máximo 5 min de cache
  })
  if (!res.ok) throw new Error(`cap-manager ${res.status}: ${await res.text()}`)
  return res.json()
}
```

### Erros possíveis

| Status | Resposta | Significado |
|---|---|---|
| 401 | `token obrigatório` | não mandou o token |
| 403 | `token inválido` | token errado ou revogado (`ativo = false`) |
| 404 | `projeto não encontrado` | token sem projeto (projeto apagado) — avise o admin |
| 500 | `erro ao ...` | falha no cap-manager — mostre o último dado válido e tente de novo |

### Segurança

A API já não envia margem, líquido, %, coeficiente nem gasto de plataforma.
O único dado interno que vem é `orcamento_plataforma` (necessário para a regra de 3).
Mesmo assim: **chame a API no servidor do dashboard**, com o token em variável de ambiente,
e envie ao browser apenas os campos brutos da seção 6. `orcamento_plataforma`, `id_conta`
e `campaign_id` nunca vão para o browser.

### Atualização ("dashboard vivo")

Valor bruto, metas de entrega, datas e status mudam no FUP a qualquer momento.
- **Nunca** salve nem fixe valor bruto, meta ou data no dashboard. Sempre leia da API.
- Cache máximo de 5 minutos (ex.: `revalidate: 300`, ou `no-store`).
- Todo cálculo é refeito a cada leitura com os valores atuais.

---

## 2. Formato da resposta

```jsonc
{
  "tipo": "td" | "fee",
  "projeto": {
    "id": 214, "nome": "...", "status": "...", "tipo_cobranca": "td",
    "data_inicio": "2026-10-21", "data_fim": "2026-11-20",
    "cliente": { "id": 1, "nome": "..." },
    "agencia": { "id": 1, "nome": "..." }
  },
  "pi": {                      // só quando tipo = "td"; null em fee
    "id": 64,
    "identificador": "PI - 64399",
    "valor_bruto": 3092.78     // TETO ABSOLUTO do projeto
  },
  "resumo": {
    "total_estrategias": 2,
    "valor_bruto_estrategias": 3092.78,
    "falta_dados_conta_anuncio": true
  },
  "estrategias": [ { ...ver seção 3... } ]
}
```

---

## 3. Campos da estratégia

| Campo | Uso | Pode exibir? |
|---|---|---|
| `id` | chave da estratégia | não precisa |
| `plataforma` | `meta`, `google`, `tiktok`, `linkedin`, `spotify`, `programatica`, `outro`… | sim |
| `id_conta` | ID da conta de anúncio (Meta: sem `act_`; Google: customer id) | não |
| `campaign_id` | ID da campanha na plataforma — base para buscar conjuntos/anúncios | não |
| `business_id` | Business Manager (Meta) | não |
| `estrategia` | nome da estratégia (ex.: "Tráfego") | sim |
| `kpi` | `CPM`, `CPC`, `CPV`, `CPL`, … | sim |
| `status` | `planejada`, `em_aprovacao`, `aguardando_material`, `ativa`, `pausada`, `finalizada`, `cancelada` | sim |
| `data_inicio` | início da estratégia | sim |
| **`valor_bruto`** | **investimento contratado bruto da estratégia** | **sim — é o único investimento exibível** |
| **`entrega_contratada`** | **meta de entrega (no KPI da estratégia)** | **sim** |
| `orcamento_plataforma` | orçamento real na plataforma (em fee = `valor_bruto`) — usado só na regra de 3 | **NÃO** |
| `plataforma_custom`, `nome_conta`, `updated_at` | apoio | opcional |
| `falta_dados_conta_anuncio` | `true` = falta `id_conta` ou `campaign_id` | não ao cliente (alerta interno) |

Estratégias com `status = "cancelada"` são ignoradas em tudo.

---

## 4. Buscar os dados na plataforma

O cap-manager **não** fornece acesso às plataformas: as credenciais do Meta (token de sistema do
Business Manager) e do Google Ads (developer token + OAuth, com login pela MCC da CAP) ficam no
`.env` do próprio dashboard, também só no servidor.

Para cada estratégia com `falta_dados_conta_anuncio = false`:

- **Meta**: conta `act_<id_conta>`, campanha `campaign_id`. Insights com `level=campaign` (e `adset`/`ad` filtrando pela campanha) e `time_increment=1` (dia a dia), de `data_inicio` da estratégia até hoje (ou `projeto.data_fim`, o que vier antes). Use `spend` e a métrica de entrega do KPI.
- **Google Ads**: customer `id_conta`, `campaign.id = campaign_id`, `segments.date` dia a dia. Custo = `metrics.cost_micros / 1_000_000`.
- Conjuntos de anúncios e anúncios são descobertos pela própria API da plataforma, a partir do `campaign_id`.
- Se `falta_dados_conta_anuncio = true`: não consulta a plataforma, mostra a estratégia com investimento bruto contratado e entrega "aguardando dados" (e um alerta só no painel interno).

O gasto que a plataforma devolve é **gasto de plataforma (líquido)**. Ele nunca vai para a tela.

---

## 5. Regras de cálculo (regra de 3)

Não use coeficiente. Use regra de 3 direta, por estratégia, sempre com os valores atuais da API.

### 5.1 Converter gasto de plataforma em bruto

```
orcamento_plataforma (contratado na plataforma) →  valor_bruto (contratado bruto)
gasto_plataforma (o que a plataforma mostra) →  X (bruto exibido)

X = gasto_plataforma × valor_bruto ÷ orcamento_plataforma
```

Exemplo: estratégia com `valor_bruto = 200` e `orcamento_plataforma = 100`. A plataforma mostra R$ 100 gastos → o cliente vê **R$ 200**. Plataforma mostra R$ 25 → cliente vê **R$ 50**.

Se `orcamento_plataforma` vier 0: `X = gasto_plataforma`. Em fee a API já manda `orcamento_plataforma = valor_bruto`, então a conta dá 1 para 1.

### 5.2 Teto — o bruto nunca passa do contratado

```
investido_bruto_estrategia = min(X, valor_bruto)
```

Mesmo se a plataforma gastar a mais (overdelivery de orçamento), o cliente vê no máximo o `valor_bruto` da estratégia.

### 5.3 Teto do PI (só TD)

O `pi.valor_bruto` é o teto absoluto do projeto:

```
total_bruto_projeto = soma(investido_bruto_estrategia) — nunca maior que pi.valor_bruto
```

- O investimento contratado exibido no projeto é **sempre `pi.valor_bruto`**, não a soma das estratégias.
- Se a soma das estratégias (`resumo.valor_bruto_estrategias`) for diferente de `pi.valor_bruto`, ajuste proporcionalmente cada estratégia para fechar no PI: `valor_bruto_ajustado = valor_bruto × pi.valor_bruto ÷ soma_estrategias`, e registre um alerta interno ("estratégias não batem com o PI").

### 5.4 Investimento por dia — a soma fecha exatamente

Para a série diária (gráfico/tabela por dia) de cada estratégia:

1. Pegue o gasto de plataforma de cada dia: `g1, g2, …, gn`.
2. Converta cada dia com a mesma regra de 3: `bruto_dia = g_dia × valor_bruto ÷ orcamento_plataforma`.
3. Trabalhe em **centavos inteiros** (multiplique por 100 e arredonde para baixo).
4. A diferença de arredondamento entre a soma dos dias e o total bruto calculado em 5.1/5.2 vai **no último dia veiculado**.
5. Se o acumulado bater o teto (`valor_bruto`), os dias seguintes mostram 0 e o dia que estourou é reduzido para fechar exatamente no teto.

**Estratégia finalizada** (`status = "finalizada"`) ou projeto encerrado (`hoje > projeto.data_fim`): o total exibido é **exatamente o `valor_bruto`** contratado, e os dias são distribuídos proporcionalmente ao gasto real:

```
bruto_dia = valor_bruto × g_dia ÷ soma(g)
```

com o mesmo ajuste de centavos no último dia. Assim, soma dos dias = valor bruto contratado, ao centavo.

### 5.5 Metas de entrega (por estratégia)

- Meta = `entrega_contratada` da estratégia (relida a cada consulta — pode mudar).
- `% da meta = entregue_plataforma ÷ entrega_contratada × 100`
- Custo bruto por resultado contratado: `valor_bruto ÷ entrega_contratada` (se `kpi = "CPM"`: `valor_bruto ÷ (entrega_contratada ÷ 1000)`).
- Custo bruto por resultado realizado: `investido_bruto ÷ entregue` (CPM: `investido_bruto ÷ (entregue ÷ 1000)`).
- Meta do projeto = soma das metas das estratégias de mesmo KPI. Nunca some KPIs diferentes.
- Entregas (impressões, cliques, views, leads) são exibidas como a plataforma reporta — só o **dinheiro** é convertido.

### 5.6 Ritmo (pacing), em bruto

```
dias_totais  = projeto.data_fim − estrategia.data_inicio + 1
dias_passados = hoje − estrategia.data_inicio + 1   (limitado a dias_totais)
investimento_ideal_ate_hoje = valor_bruto × dias_passados ÷ dias_totais
restante_bruto = valor_bruto − investido_bruto
restante_por_dia_bruto = restante_bruto ÷ dias_restantes
```

---

## 6. O que vai para a tela do cliente

Somente:
- Nome do projeto, cliente, PI (identificador) e **valor bruto do PI**.
- Por estratégia: plataforma, nome, KPI, status, datas, **valor bruto contratado**, **investido bruto**, **restante bruto**, meta de entrega, entregue, % da meta, custo bruto por resultado.
- Série diária em bruto (regra 5.4).

Nunca: `orcamento_plataforma`, gasto de plataforma, IDs de conta/campanha.

---

## 7. Checklist de validação (rodar sempre antes de exibir)

1. `soma(dias da estratégia) == investido_bruto_estrategia` (ao centavo).
2. `investido_bruto_estrategia <= valor_bruto` da estratégia.
3. TD: `soma(investido_bruto das estratégias) <= pi.valor_bruto`.
4. Estratégia finalizada/projeto encerrado: `investido_bruto == valor_bruto` (ao centavo).
5. `orcamento_plataforma` e gasto de plataforma ausentes do payload enviado ao browser.

Se qualquer item falhar, não exiba o número quebrado: mostre o último valor válido e registre o erro no painel interno.

---

## 8. Repositório e deploy do dashboard

- Todo dashboard fica na organização **`cap-digital`** do GitHub, em repositório **privado**
  (ex.: `cap-digital/sesi2026_feedback_lideranca`).
- **Commit e push SEMPRE com a conta do GitHub da CAP** (`cap-digital`, e-mail `dados@capdigital.company`),
  nunca com conta pessoal:

  ```bash
  git config user.name  "CAP Digital"
  git config user.email "dados@capdigital.company"
  # push/criação de repo autenticado na conta cap-digital
  gh auth switch --user cap-digital
  gh repo create cap-digital/<nome-do-dashboard> --private --source . --push
  ```

- Trabalho direto na `main` (sem branches/PRs); a Vercel builda a `main`.
- `.env` nunca vai para o git (tokens de projeto e credenciais Meta/Google). Configure as variáveis
  na Vercel do projeto.
- Depois de publicar, cadastre o link no cap-manager: **Editar Projeto → "Link do Dashboard"**. Ele entra
  sozinho em Projetos de Inteligência e no botão "Acessar Dashboard" do projeto.
