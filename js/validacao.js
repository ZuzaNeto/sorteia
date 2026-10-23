/**
 * validacao.js — confere e normaliza o que o usuário digitou.
 * Não mexe no DOM. Cada função devolve { ok: true, ...dados } ou
 * { ok: false, erro, campo }, onde "campo" é o id do campo que deve receber o foco.
 */

const erro = (mensagem, campo) => ({ ok: false, erro: mensagem, campo });

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
  return { ok: true, valor: quantidade };
}

export function validarNomes({ texto, qtd, ignorarRepetidos }) {
  const nomes = lerNomes(texto, ignorarRepetidos);
  if (nomes.length === 0) return erro('Digite pelo menos um nome para sortear.', 'nomes');

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