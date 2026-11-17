# SECOM – Micareta de Feira 2026 · Dashboard

Dashboard de veiculação (Google Ads – Rede de Display) do projeto 229 do cap-manager.
Especificação: `docs/prompt-micareta-fsa.md` e `docs/manual-dashboard-api-projetos.md`.

## Rodar

```bash
cp .env.example .env.local   # preencha as variáveis
npm install
npm run dev                  # http://localhost:3000
npm run check                # testes das regras de cálculo
```

## Estrutura

- `src/lib/cap-manager.ts` — API do cap-manager (só servidor, cache ≤ 5 min)
- `src/lib/google-ads.ts` — Google Ads REST (OAuth refresh token + MCC, cache ≤ 5 min)
- `src/lib/calculos.ts` — regra de 3, tetos, centavos, pacing, checklist (puro, testado)
- `src/lib/dashboard.ts` — orquestração; monta o payload só com valores BRUTOS
- `src/lib/cores.ts` — paleta e degradês Micareta em HEX (cores críticas e dinâmicas sempre inline)
- `src/components/charts/` — gráficos Bklit UI (registry `@bklit` via shadcn, `npx shadcn add @bklit/<nome>`);
  `value-labels.tsx` é da CAP (veio do dashboard Embasa El Niño), adaptado com `fontSize`/`labelKey`
- `src/components/` — UI do dashboard

O dashboard mostra sempre a campanha inteira (início da estratégia até hoje, ou até
`data_fim`). A série diária segue a regra 5.4; criativos, gênero e idade recebem o
investido proporcionalmente ao custo de cada linha (maiores restos), fechando ao centavo.

Layout: a partir de 1024px as páginas ocupam exatamente a tela (sem scroll vertical), com grid em `fr`
e tipografia/espaços em `clamp()` (1280×720 a 2560×1440). Abaixo de 1024px, scroll vertical normal.

Nenhum valor bruto, meta, data, status ou ID de campanha fica fixo no código.

Verificação de fechamento (só em `npm run dev`): `GET /api/interno/fechamento`.
