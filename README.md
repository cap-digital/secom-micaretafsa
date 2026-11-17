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
- `src/lib/municipios.ts` + `src/config/municipios-br.json` — coordenadas dos municípios (base pública IBGE) para o mapa
- `src/components/` — UI (Recharts nos gráficos, react-leaflet no mapa)

Filtro de datas na URL (`?de=AAAA-MM-DD&ate=AAAA-MM-DD`), válido nas duas abas. O investido de um
intervalo é a soma da série diária bruta (regra 5.4); criativos, gênero, idade e praças recebem esse
valor proporcionalmente ao custo de cada linha (maiores restos), fechando ao centavo.

Verificação de fechamento (só em `npm run dev`): `GET /api/interno/fechamento?de=…&ate=…`.

Nenhum valor bruto, meta, data, status ou ID de campanha fica fixo no código.
