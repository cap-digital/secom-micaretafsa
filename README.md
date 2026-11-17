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
- `src/components/` — UI (Recharts nos gráficos)

Nenhum valor bruto, meta, data, status ou ID de campanha fica fixo no código.
