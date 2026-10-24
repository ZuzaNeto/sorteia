/**
 * validacao.js — confere e normaliza o que o usuário digitou.
 * Não mexe no DOM. Cada função devolve { ok: true, ...dados } ou
 * { ok: false, erro, campo }, onde "campo" é o id do campo que deve receber o foco.
 */

const erro = (mensagem, campo) => ({ ok: false, erro: mensagem, campo });

/** Limites para o navegador não travar com entradas gigantes. */
export const LIMITES = {
  MAX_QTD: 1000,
  MAX_NOMES: 10000,
  MAX_TAM_NOME: 100,
  MAX_ABS_NUMERO: 1_000_000_000,
};

/** Converte o texto de um campo em inteiro. Devolve NaN se não for um inteiro. */
function lerInteiro(valor) {
  const texto = String(valor).trim();
  if (texto === '') return NaN;
  const numero = Number(texto);
  return Number.isInteger(numero) ? numero : NaN;
}

/** Quebra o texto em linhas, tira espaços, ignora linhas vazias e (opcional) repetidos. */
export function lerNomes(texto, ignorarRepetidos = true) {
  const linhas = texto
    .split(/\r?\n/)
    .map((linha) => linha.replace(/\s+/g, ' ').trim())
    .filter((linha) => linha !== '');

  if (!ignorarRepetidos) return linhas;

  const vistos = new Set();
  return linhas.filter((nome) => {
    const chave = nome.toLocaleLowerCase('pt-BR');
    if (vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  });
}

function validarQuantidade(valor, campo) {
  const quantidade = lerInteiro(valor);
  if (Number.isNaN(quantidade) || quantidade < 1) {
    return erro('Informe uma quantidade válida (inteiro a partir de 1).', campo);
  }
  if (quantidade > LIMITES.MAX_QTD) {
    return erro(`A quantidade máxima por sorteio é ${LIMITES.MAX_QTD}.`, campo);
  }
  return { ok: true, valor: quantidade };
}

export function validarNomes({ texto, qtd, ignorarRepetidos }) {
  const nomes = lerNomes(texto, ignorarRepetidos);
  if (nomes.length === 0) return erro('Digite pelo menos um nome para sortear.', 'nomes');
  if (nomes.length > LIMITES.MAX_NOMES) {
    return erro(`A lista pode ter no máximo ${LIMITES.MAX_NOMES} nomes.`, 'nomes');
  }
  if (nomes.some((nome) => nome.length > LIMITES.MAX_TAM_NOME)) {
    return erro(`Cada nome pode ter no máximo ${LIMITES.MAX_TAM_NOME} caracteres.`, 'nomes');
  }

  const quantidade = validarQuantidade(qtd, 'qtd-nomes');
  if (!quantidade.ok) return quantidade;

  if (quantidade.valor > nomes.length) {
    return erro(
      `Você pediu ${quantidade.valor} sorteados, mas a lista tem só ${nomes.length} ${nomes.length === 1 ? 'nome' : 'nomes'}.`,
      'qtd-nomes',
    );
  }

  return { ok: true, nomes, qtd: quantidade.valor };
}

export function validarNumeros({ min, max, qtd, repetir }) {
  const minimo = lerInteiro(min);
  const maximo = lerInteiro(max);
  if (Number.isNaN(minimo)) return erro('Informe um número inteiro como mínimo.', 'num-min');
  if (Number.isNaN(maximo)) return erro('Informe um número inteiro como máximo.', 'num-max');

  const limiteTexto = LIMITES.MAX_ABS_NUMERO.toLocaleString('pt-BR');
  if (Math.abs(minimo) > LIMITES.MAX_ABS_NUMERO) {
    return erro(`Use um mínimo entre -${limiteTexto} e ${limiteTexto}.`, 'num-min');
  }
  if (Math.abs(maximo) > LIMITES.MAX_ABS_NUMERO) {
    return erro(`Use um máximo entre -${limiteTexto} e ${limiteTexto}.`, 'num-max');
  }
  if (minimo > maximo) return erro('O mínimo não pode ser maior que o máximo.', 'num-min');

  const quantidade = validarQuantidade(qtd, 'qtd-numeros');
  if (!quantidade.ok) return quantidade;

  const intervalo = maximo - minimo + 1;
  if (!repetir && quantidade.valor > intervalo) {
    return erro(
      `Só existem ${intervalo} ${intervalo === 1 ? 'número' : 'números'} entre ${minimo} e ${maximo}. Reduza a quantidade ou permita repetidos.`,
      'qtd-numeros',
    );
  }

  return { ok: true, min: minimo, max: maximo, qtd: quantidade.valor, repetir: Boolean(repetir) };
}