/**
 * sorteio.js — lógica de sorteio, sem acesso ao DOM.
 * Usa crypto.getRandomValues em vez de Math.random: o resultado é
 * imprevisível e, com o descarte abaixo, sem viés.
 */

const FAIXA_32_BITS = 2 ** 32;

/**
 * Devolve um inteiro aleatório de 0 a limite - 1, todos com a mesma chance.
 * Valores sorteados acima do maior múltiplo de "limite" são descartados;
 * sem isso, os primeiros restos da divisão sairiam um pouco mais (viés de módulo).
 */
export function inteiroAleatorio(limite) {
  if (!Number.isInteger(limite) || limite < 1 || limite > FAIXA_32_BITS) {
    throw new RangeError('O limite deve ser um inteiro entre 1 e 2^32.');
  }
  const corte = FAIXA_32_BITS - (FAIXA_32_BITS % limite);
  const buffer = new Uint32Array(1);
  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= corte);
  return buffer[0] % limite;
}

/** Embaralha uma cópia da lista (Fisher-Yates). A lista original não muda. */
export function embaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = inteiroAleatorio(i + 1);
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}