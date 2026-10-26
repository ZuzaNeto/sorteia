// Testes da lógica (sem navegador). Rodar com: npm test  (Node 20 ou superior)
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { inteiroAleatorio, embaralhar, sortearItens, sortearNumeros } from '../js/sorteio.js';
import { lerNomes, validarNomes, validarNumeros, LIMITES } from '../js/validacao.js';
import { carregarHistorico, salvarEntrada, limparHistorico } from '../js/historico.js';

/** localStorage de mentira, só para os testes do histórico. */
function instalarArmazenamentoFalso(valorInicial = null) {
  let valor = valorInicial;
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    writable: true,
    value: {
      getItem: () => valor,
      setItem: (_chave, novo) => { valor = novo; },
      removeItem: () => { valor = null; },
    },
  });
}

// ---------- sorteio.js ----------

test('inteiroAleatorio fica sempre dentro do intervalo', () => {
  for (let i = 0; i < 2000; i++) {
    const n = inteiroAleatorio(7);
    assert.ok(Number.isInteger(n) && n >= 0 && n < 7);
  }
});

test('inteiroAleatorio rejeita limites inválidos', () => {
  assert.throws(() => inteiroAleatorio(0), RangeError);
  assert.throws(() => inteiroAleatorio(1.5), RangeError);
  assert.throws(() => inteiroAleatorio(2 ** 32 + 1), RangeError);
});

test('inteiroAleatorio distribui de forma aproximadamente uniforme', () => {
  const contagem = [0, 0, 0];
  for (let i = 0; i < 3000; i++) contagem[inteiroAleatorio(3)]++;
  contagem.forEach((total) => assert.ok(total > 800 && total < 1200, `contagem fora do esperado: ${contagem}`));
});

test('embaralhar mantém os mesmos itens e não altera a lista original', () => {
  const original = [1, 2, 3, 4, 5];
  const resultado = embaralhar(original);
  assert.deepEqual(original, [1, 2, 3, 4, 5]);
  assert.deepEqual([...resultado].sort(), [1, 2, 3, 4, 5]);
});

test('sortearItens devolve a quantidade pedida, sem repetir', () => {
  const lista = ['Ana', 'Bruno', 'Carla', 'Diego'];
  const sorteados = sortearItens(lista, 3);
  assert.equal(sorteados.length, 3);
  assert.equal(new Set(sorteados).size, 3);
  sorteados.forEach((nome) => assert.ok(lista.includes(nome)));
});

test('sortearItens rejeita quantidade maior que a lista', () => {
  assert.throws(() => sortearItens(['Ana'], 2), RangeError);
});

test('sortearNumeros respeita o intervalo e não repete por padrão', () => {
  const numeros = sortearNumeros(1, 10, 10);
  assert.deepEqual([...numeros].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

test('sortearNumeros com repetição aceita mais números que o intervalo', () => {
  const numeros = sortearNumeros(1, 2, 20, true);
  assert.equal(numeros.length, 20);
  numeros.forEach((n) => assert.ok(n === 1 || n === 2));
});

test('sortearNumeros sem repetição funciona em intervalos enormes', () => {
  const numeros = sortearNumeros(-1_000_000_000, 1_000_000_000, 50);
  assert.equal(new Set(numeros).size, 50);
});

test('sortearNumeros rejeita quantidade maior que o intervalo sem repetição', () => {
  assert.throws(() => sortearNumeros(1, 3, 4), RangeError);
});

// ---------- validacao.js ----------

test('lerNomes ignora linhas vazias, espaços extras e repetidos', () => {
  const nomes = lerNomes('  Ana \n\nana\nBruno   Silva\r\nBruno Silva', true);
  assert.deepEqual(nomes, ['Ana', 'Bruno Silva']);
});

test('lerNomes mantém repetidos quando pedido', () => {
  assert.deepEqual(lerNomes('Ana\nAna', false), ['Ana', 'Ana']);
});

test('validarNomes recusa lista vazia', () => {
  const r = validarNomes({ texto: '   \n  ', qtd: '1', ignorarRepetidos: true });
  assert.equal(r.ok, false);
  assert.equal(r.campo, 'nomes');
});

test('validarNomes recusa quantidade inválida ou maior que a lista', () => {
  assert.equal(validarNomes({ texto: 'Ana', qtd: '', ignorarRepetidos: true }).ok, false);
  assert.equal(validarNomes({ texto: 'Ana', qtd: '0', ignorarRepetidos: true }).ok, false);
  assert.equal(validarNomes({ texto: 'Ana', qtd: '1.5', ignorarRepetidos: true }).ok, false);
  assert.equal(validarNomes({ texto: 'Ana', qtd: '2', ignorarRepetidos: true }).campo, 'qtd-nomes');
});

test('validarNomes recusa nomes longos demais', () => {
  const nomeGigante = 'a'.repeat(LIMITES.MAX_TAM_NOME + 1);
  assert.equal(validarNomes({ texto: nomeGigante, qtd: '1', ignorarRepetidos: true }).ok, false);
});

test('validarNomes aceita entrada correta', () => {
  const r = validarNomes({ texto: 'Ana\nBruno', qtd: '2', ignorarRepetidos: true });
  assert.deepEqual(r, { ok: true, nomes: ['Ana', 'Bruno'], qtd: 2 });
});

test('validarNumeros recusa campos vazios e mínimo maior que máximo', () => {
  assert.equal(validarNumeros({ min: '', max: '10', qtd: '1', repetir: false }).campo, 'num-min');
  assert.equal(validarNumeros({ min: '1', max: '', qtd: '1', repetir: false }).campo, 'num-max');
  assert.equal(validarNumeros({ min: '10', max: '1', qtd: '1', repetir: false }).ok, false);
});

test('validarNumeros recusa quantidade maior que o intervalo sem repetição', () => {
  const r = validarNumeros({ min: '1', max: '3', qtd: '4', repetir: false });
  assert.equal(r.ok, false);
  assert.equal(r.campo, 'qtd-numeros');
  assert.equal(validarNumeros({ min: '1', max: '3', qtd: '4', repetir: true }).ok, true);
});

test('validarNumeros recusa valores acima dos limites', () => {
  const acima = String(LIMITES.MAX_ABS_NUMERO + 1);
  assert.equal(validarNumeros({ min: '1', max: acima, qtd: '1', repetir: false }).ok, false);
  assert.equal(validarNumeros({ min: '1', max: '10', qtd: String(LIMITES.MAX_QTD + 1), repetir: true }).ok, false);
});

// ---------- historico.js ----------

test('carregarHistorico devolve lista vazia quando o JSON está corrompido', () => {
  instalarArmazenamentoFalso('{quebrado');
  assert.deepEqual(carregarHistorico(), []);
});

test('carregarHistorico descarta entradas com formato inesperado', () => {
  const valida = { tipo: 'nomes', resultado: ['Ana'], data: 1 };
  instalarArmazenamentoFalso(JSON.stringify([valida, { tipo: 'x' }, null, 'texto']));
  assert.deepEqual(carregarHistorico(), [valida]);
});

test('salvarEntrada guarda no máximo 10 entradas, a mais recente primeiro', () => {
  instalarArmazenamentoFalso();
  for (let i = 1; i <= 12; i++) salvarEntrada({ tipo: 'numeros', resultado: [i], data: i });
  const historico = carregarHistorico();
  assert.equal(historico.length, 10);
  assert.equal(historico[0].data, 12);
});

test('limparHistorico apaga tudo', () => {
  instalarArmazenamentoFalso();
  salvarEntrada({ tipo: 'nomes', resultado: ['Ana'], data: 1 });
  limparHistorico();
  assert.deepEqual(carregarHistorico(), []);
});