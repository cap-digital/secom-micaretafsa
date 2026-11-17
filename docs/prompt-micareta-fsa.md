Vamos construir o dashboard **SECOM – Micareta de Feira 2026** neste projeto (`secom-micaretafsa`, Next.js já criado). Trabalhe em modo Auto, faça tudo de uma vez e termine com um resumo do que foi feito, do que ficou pendente e de quais variáveis de ambiente preciso preencher.

Antes de codar, leia o `AGENTS.md` do projeto: esta é a versão 16 do Next.js com Cache Components ligado, então use a API de cache/revalidação dessa versão (consulte os docs em `node_modules/next/dist/docs/` se existirem), não a do Next 14.

## 1. Contexto da campanha

- Cliente: SECOM Bahia (Governo da Bahia), via agência Leiaute
- Projeto no cap-manager: **ID 229** — "MICARETA DE FEIRA 2026"
- PI: **PI - 106637**, valor bruto **R$ 15.000,00**
- Período: 16/11/2026 a 22/11/2026
- Só **Google Ads – Rede de Display** (conta TD - SECOM, customer `9601422074`, sob o MCC CAP DIGITAL 2)
- Estratégia: Alcance (demográfico + sitelist), praça Feira de Santana e região, público AS 18+ ABCDE
- KPI: **CPM**, CPM bruto contratado R$ 10,00, meta **1.500.000 impressões**

Esses números servem só para você conferir se a integração está certa. **Nada disso pode ficar fixo no código**: valor bruto, meta, datas, status e `campaign_id` vêm sempre da API do cap-manager.

## 2. Regras de dados — siga o manual ao pé da letra

O manual completo está em `~/Downloads/manual-dashboard-api-projetos.md` (se o nome for outro, procure em `~/Downloads` por "manual-dashboard"). Copie para `docs/manual-dashboard-api-projetos.md` no projeto e siga cada regra. Resumo do que não pode falhar:

1. **O cliente só vê valor BRUTO.** O gasto de plataforma (`metrics.cost_micros`) nunca vai para a tela nem para o browser.
2. A API do cap-manager (`GET ${CAP_MANAGER_URL}/api/public/projeto`, com `Authorization: Bearer ${CAP_TOKEN_MICARETA}`) é chamada **só no servidor**. Para o browser vão apenas os campos brutos da seção 6 do manual. `orcamento_plataforma`, `id_conta` e `campaign_id` nunca saem do servidor.
3. Use a regra de 3 por estratégia: `bruto = gasto_plataforma × valor_bruto ÷ orcamento_plataforma` (se `orcamento_plataforma` for 0, `bruto = gasto`). Aplique os tetos: `min(bruto, valor_bruto)` na estratégia e o teto do PI (`pi.valor_bruto`) no projeto. Se a soma das estratégias não bater com o PI, faça o ajuste proporcional e registre um alerta interno.
4. Série diária: trabalhe em centavos inteiros (arredonde para baixo) e coloque a diferença de arredondamento no último dia veiculado. Se o teto for atingido, os dias seguintes ficam em 0. Estratégia `finalizada` ou projeto encerrado (`hoje > data_fim`): total = exatamente `valor_bruto`, distribuído proporcionalmente ao gasto real de cada dia.
5. Metas: % da meta = `impressões ÷ entrega_contratada`. CPM bruto contratado = `valor_bruto ÷ (meta ÷ 1000)`. CPM bruto realizado = `investido_bruto ÷ (impressões ÷ 1000)`. Entregas (impressões, cliques) aparecem como a plataforma reporta; só o dinheiro é convertido.
6. Pacing em bruto, conforme a seção 5.6 do manual.
7. Estratégias `cancelada` são ignoradas. Se `falta_dados_conta_anuncio = true`, a estratégia aparece com o bruto contratado e a entrega como "aguardando dados", sem consultar o Google.
8. **Dashboard vivo:** cache de no máximo 5 minutos (nos dados do cap-manager e nos do Google). Todo cálculo é refeito a cada leitura.
9. Antes de exibir, rode o checklist da seção 7 do manual (soma dos dias = investido; investido ≤ contratado; soma ≤ PI; finalizado = contratado; payload sem dados de plataforma). Se algo falhar, mostre o último valor válido e registre o erro no log do servidor.

Crie um teste simples (script `npm run check` ou testes unitários) cobrindo a regra de 3, os tetos, o fechamento em centavos e o caso "finalizada".

## 3. Google Ads API

- Busque pelo `campaign_id` e pelo `id_conta` que vêm do cap-manager (não fixe IDs no código).
- Use a API REST, versão **v25**. Autenticação por **service account com Domain-Wide Delegation**: use `google-auth-library`, com um JWT cujo `subject` é o e-mail impersonado e o escopo `https://www.googleapis.com/auth/adwords`. Passe o header `login-customer-id` = MCC CAP DIGITAL 2.
- Queries GAQL:
  - **Por dia** (`segments.date`, desde `data_inicio` da estratégia até hoje ou `data_fim`, o que vier antes): `cost_micros`, `impressions`, `clicks`, `active_view_impressions` (se disponível) e alcance/frequência, se a API retornar para Display.
  - **Por anúncio** (`ad_group_ad`), para a aba Criativos: id, nome, tipo, status, URLs das imagens/assets (image ad ou responsive display: `ad.image_ad.image_url` e os assets de `responsive_display_ad.marketing_images`, resolvendo `asset.image_asset.full_size.url`), dimensões quando houver, e as métricas `impressions`, `clicks`, `ctr` e `cost_micros`.
- O dinheiro por criativo também é convertido para bruto: distribua o investido bruto da estratégia proporcionalmente ao `cost_micros` de cada anúncio, em centavos, fechando exatamente no total.

## 4. Variáveis de ambiente

Crie `.env.local` (fora do git) e `.env.example` (versionado, sem valores) com:

```bash
# cap-manager
CAP_MANAGER_URL=https://capmanager.capdigital.company
CAP_TOKEN_MICARETA=            # token do projeto 229

# Google Ads (service account + DWD, MCC CAP DIGITAL 2)
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_LOGIN_CUSTOMER_ID=6186752286
GOOGLE_ADS_IMPERSONATE_EMAIL=pedrofreitas@capdigital.company
GOOGLE_ADS_SA_KEY_BASE64=      # JSON da service account em base64, numa linha só
GOOGLE_ADS_API_VERSION=v25
```

- Nenhuma variável com prefixo `NEXT_PUBLIC_`.
- Ao decodificar a chave base64, remova quebras de linha antes (`.replace(/\s/g, '')`); o `base64` do macOS quebra linhas e isso já truncou chave antes.
- Confira se o `.gitignore` cobre `.env*` (mantendo o `.env.example` versionado).
- Se faltar alguma variável, o dashboard não pode quebrar: mostre um estado vazio elegante e escreva no log do servidor qual variável está faltando.

Para pegar o token do cap-manager, deixe esta query pronta no resumo final (vou rodar no Supabase):

```sql
SELECT p.id, p.nome, t.tipo, t.token
FROM public.cap_manager_projetos_api_tokens t
JOIN public.cap_manager_projetos p ON p.id = t.projeto_id
WHERE p.id = 229 AND t.ativo;
```

## 5. Identidade visual

Os criativos estão em `~/Downloads`: procure os arquivos com "MICARETA" no nome, por exemplo `126955---BNI-300x250px-MICARETA-DE-FEIRA-SEADES26.gif` e `126955---BNI-160x600px-MICARETA-DE-FEIRA-SEADES26.gif`, e qualquer outro formato que existir lá.

1. Copie todos para `public/criativos/` com nomes limpos (ex.: `300x250.gif`).
2. Abra as imagens e extraia a paleta real a partir delas. A referência é:
   - fundo roxo/violeta vibrante com listras diagonais em magenta;
   - amarelo-limão nos blocos de texto;
   - preto nas tipografias de destaque;
   - acentos laranja, rosa e verde-água do logo "Micareta de Feira";
   - verde-lima de apoio;
   - assinatura "Governo da Bahia" em preto sobre branco.
3. Tipografia: sans display pesada, condensada e em caixa alta nos títulos e KPIs (ex.: Anton, Bebas Neue ou Archivo Black via `next/font`), com uma sans limpa no corpo.
4. Clima de carnaval/festa, mas legível e institucional (é governo). Use as listras diagonais como textura discreta no header ou nos cards de destaque, sem poluir os números.
5. No header, use o crop do logo "Micareta de Feira 2026" tirado do GIF 160x600. Se não der para recortar com qualidade, recrie em texto estilizado.

## 6. Layout e páginas

Siga o padrão CAP: **sem scroll vertical em desktop** (tudo cabe em 100vh), responsivo e com scroll liberado no mobile. Em vez de sidebar, use uma **topbar** com só duas abas:

### Visão Geral
- Cabeçalho com o nome do projeto, o cliente, o PI (identificador), o período e o status, mais um selo "Atualizado há X min".
- KPIs, todos em bruto: **Investimento contratado (valor bruto do PI)**, **Investido**, **Restante**, **Impressões**, **CPM bruto realizado vs contratado**, **Cliques / CTR**.
- **Componente "Progresso da Meta"** (destaque principal, reutilizável):
  - barra ou anel de impressões entregues vs meta (1.500.000, lida da API), com %;
  - barra de investimento investido vs contratado;
  - marcador de pacing (ideal até hoje vs realizado), com status "No ritmo", "Acima" ou "Abaixo";
  - dias restantes e investimento bruto por dia necessário.
- Gráfico diário: investimento bruto (barras) e impressões (linha), do início até `data_fim`, com os dias futuros vazios.
- Card da estratégia: plataforma (Google Display), nome, KPI, status, segmentação em texto curto.

### Criativos
- Grid com cada anúncio/criativo: preview (imagem da API do Google; se não houver, usar a de `public/criativos/` com o mesmo tamanho), formato/dimensão, impressões, cliques, CTR, investido bruto e CPM bruto.
- Destaque para o criativo com melhor CTR.
- Os formatos verticais (160x600) não podem estourar a altura: use cards com `object-contain` e altura fixa.

Use Recharts para os gráficos. Os componentes ficam em `components/`, a lógica de cálculo em `lib/` (`lib/cap-manager.ts`, `lib/google-ads.ts`, `lib/calculos.ts`) e todo o fetch em Server Components ou route handlers.

## 7. Git

- `git config user.name "CAP Digital"` e `git config user.email "dados@capdigital.company"` (local, só neste repo).
- Trabalhe na `main`. Faça commits locais por etapa, mas **não faça push nem crie o repositório remoto**: eu faço isso depois.

## 8. Resumo final

Termine com:
- o que foi construído;
- as variáveis que preciso preencher;
- a query SQL do token;
- como rodar o `npm run check`;
- qualquer suposição que você fez.
