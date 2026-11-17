import { test } from "node:test";
import assert from "node:assert/strict";
import {
  regraDeTres,
  converterEstrategia,
  ajustarAoPi,
  aplicarTetoPi,
  distribuirProporcional,
  calcularPacing,
  statusRitmo,
  custoPorResultado,
  pctMeta,
  rodarChecklist,
  encontrarChavesProibidas,
  intervaloDatas,
  distribuirMaioresRestos,
  somarIntervalo,
} from "../src/lib/calculos.ts";

const soma = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

test("regra de 3: exemplo do manual (200 bruto / 100 plataforma)", () => {
  assert.equal(regraDeTres(100, 200, 100), 200);
  assert.equal(regraDeTres(25, 200, 100), 50);
});

test("regra de 3: orçamento de plataforma 0 → bruto = gasto", () => {
  assert.equal(regraDeTres(42.5, 15000, 0), 42.5);
});

test("teto da estratégia: overdelivery nunca passa do valor bruto", () => {
  const r = converterEstrategia({
    valorBrutoCent: 20_000, // R$ 200
    orcamentoPlataforma: 100,
    gastosDia: [40, 40, 40], // R$ 120 de plataforma → R$ 240 bruto
    fechado: false,
  });
  assert.equal(r.investidoCent, 20_000);
  assert.equal(soma(r.diasCent), 20_000);
  assert.deepEqual(r.diasCent, [8_000, 8_000, 4_000]); // dia que estoura é reduzido
  assert.equal(r.tetoAtingido, true);
});

test("teto: dias após o estouro ficam em 0", () => {
  const r = converterEstrategia({
    valorBrutoCent: 10_000,
    orcamentoPlataforma: 100,
    gastosDia: [60, 60, 30, 10],
    fechado: false,
  });
  assert.deepEqual(r.diasCent, [6_000, 4_000, 0, 0]);
  assert.equal(soma(r.diasCent), r.investidoCent);
});

test("fechamento em centavos: diferença de arredondamento no último dia veiculado", () => {
  // fator 15000 / 12345.67 gera dízimas
  const gastos = [1234.56, 2345.67, 987.65, 0];
  const r = converterEstrategia({
    valorBrutoCent: 1_500_000,
    orcamentoPlataforma: 12_345.67,
    gastosDia: gastos,
    fechado: false,
  });
  assert.equal(soma(r.diasCent), r.investidoCent, "soma dos dias = investido ao centavo");
  assert.ok(r.diasCent.every((d) => Number.isInteger(d)));
  assert.equal(r.diasCent[3], 0, "dia sem veiculação continua 0");
  const esperado = Math.floor(((1234.56 + 2345.67 + 987.65) * 15000) / 12345.67 * 100 + 1e-6);
  assert.equal(r.investidoCent, esperado);
});

test("finalizada: total = exatamente o valor bruto, proporcional ao gasto real", () => {
  const r = converterEstrategia({
    valorBrutoCent: 1_500_000,
    orcamentoPlataforma: 9_000,
    gastosDia: [1000, 2000, 3333.33, 0],
    fechado: true,
  });
  assert.equal(r.investidoCent, 1_500_000);
  assert.equal(soma(r.diasCent), 1_500_000);
  assert.equal(r.diasCent[3], 0);
  assert.ok(r.diasCent[1] > r.diasCent[0]);
});

test("finalizada sem gasto registrado: distribui igualmente e fecha no total", () => {
  const r = converterEstrategia({ valorBrutoCent: 1001, orcamentoPlataforma: 0, gastosDia: [0, 0, 0], fechado: true });
  assert.equal(soma(r.diasCent), 1001);
});

test("ajuste ao PI: estratégias que não batem são ajustadas proporcionalmente", () => {
  const r = ajustarAoPi([1_000_000, 600_000], 1_500_000);
  assert.equal(r.ajustado, true);
  assert.equal(soma(r.valoresCent), 1_500_000);
  const r2 = ajustarAoPi([1_500_000], 1_500_000);
  assert.equal(r2.ajustado, false);
});

test("teto do PI no projeto", () => {
  assert.equal(aplicarTetoPi(1_600_000, 1_500_000), 1_500_000);
  assert.equal(aplicarTetoPi(900_000, 1_500_000), 900_000);
  assert.equal(aplicarTetoPi(900_000, null), 900_000);
});

test("distribuição proporcional por criativo fecha no total", () => {
  const partes = distribuirProporcional(123_457, [3, 3, 3]);
  assert.equal(soma(partes), 123_457);
});

test("metas e CPM (números da campanha Micareta)", () => {
  assert.equal(custoPorResultado(15_000, 1_500_000, "CPM"), 10); // CPM bruto contratado R$ 10
  assert.equal(pctMeta(750_000, 1_500_000), 50);
  assert.equal(custoPorResultado(5_000, 400_000, "CPM"), 12.5);
});

test("pacing em bruto", () => {
  const p = calcularPacing(1_500_000, 300_000, "2026-11-16", "2026-11-22", "2026-11-17");
  assert.equal(p.diasTotais, 7);
  assert.equal(p.diasPassados, 2);
  assert.equal(p.diasRestantes, 5);
  assert.equal(p.idealAteHojeCent, Math.floor((1_500_000 * 2) / 7));
  assert.equal(p.restanteCent, 1_200_000);
  assert.equal(p.restantePorDiaCent, 240_000);
  assert.equal(statusRitmo(300_000, p.idealAteHojeCent), "Abaixo");
  assert.equal(statusRitmo(428_000, 428_571), "No ritmo");
});

test("checklist: detecta dados de plataforma no payload e somas quebradas", () => {
  assert.deepEqual(encontrarChavesProibidas({ a: [{ ok: 1 }] }), []);
  const erros = rodarChecklist(
    [{ nome: "X", valorBrutoCent: 100, investidoCent: 120, diasCent: [50], fechado: false, aguardandoDados: false }],
    100,
    { estrategias: [{ orcamento_plataforma: 1 }] },
  );
  assert.ok(erros.some((e) => e.startsWith("[1]")));
  assert.ok(erros.some((e) => e.startsWith("[2]")));
  assert.ok(erros.some((e) => e.startsWith("[3]")));
  assert.ok(erros.some((e) => e.startsWith("[5]")));
});

test("recortes (maiores restos): fecham no total e ficam a < 1 centavo da proporção", () => {
  // custos de plataforma por gênero (reais) da campanha
  const custos = [445.60905, 406.950593, 168.765737];
  const total = 510_752; // investido bruto do período, em centavos
  const partes = distribuirMaioresRestos(total, custos);
  assert.equal(soma(partes), total);
  const somaC = soma(custos);
  partes.forEach((p, i) => assert.ok(Math.abs(p - (total * custos[i]) / somaC) < 1));
  // muitas linhas pequenas (ex.: 1.112 cidades) — nenhuma recebe a sobra inteira
  const muitas = Array.from({ length: 1112 }, (_, i) => 0.001 + (i % 7) * 0.0003);
  const pm = distribuirMaioresRestos(99_999, muitas);
  assert.equal(soma(pm), 99_999);
  const somaM = soma(muitas);
  pm.forEach((p, i) => assert.ok(Math.abs(p - (99_999 * muitas[i]) / somaM) < 1));
});

test("investido do intervalo = soma dos dias brutos (regra 5.4)", () => {
  const r = converterEstrategia({ valorBrutoCent: 1_500_000, orcamentoPlataforma: 3000, gastosDia: [498.74, 522.68], fechado: false });
  const dias = new Map([["2026-11-16", r.diasCent[0]], ["2026-11-17", r.diasCent[1]]]);
  assert.equal(somarIntervalo(dias, "2026-11-16", "2026-11-22"), r.investidoCent);
  assert.equal(somarIntervalo(dias, "2026-11-17", "2026-11-17"), r.diasCent[1]);
  assert.equal(somarIntervalo(dias, "2026-11-18", "2026-11-22"), 0);
});

test("intervalo de datas inclusivo", () => {
  assert.deepEqual(intervaloDatas("2026-11-16", "2026-11-18"), ["2026-11-16", "2026-11-17", "2026-11-18"]);
});
