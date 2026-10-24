/**
 * historico.js — guarda os últimos sorteios no localStorage do navegador.
 * Formato de cada entrada: { tipo: 'nomes' | 'numeros', resultado: [...], data: <ms> }
 */

const CHAVE = 'sorteia:historico';
const MAX_ENTRADAS = 10;

/** O localStorage pode ser editado por qualquer pessoa: confere o formato antes de usar. */
function entradaValida(entrada) {
  return (
    entrada !== null &&
    typeof entrada === 'object' &&
    (entrada.tipo === 'nomes' || entrada.tipo === 'numeros') &&
    Array.isArray(entrada.resultado) &&
    Number.isFinite(entrada.data)
  );
}

/** Lê o histórico salvo (mais recente primeiro). Dados corrompidos viram lista vazia. */
export function carregarHistorico() {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return [];
    const dados = JSON.parse(bruto);
    return Array.isArray(dados) ? dados.filter(entradaValida) : [];
  } catch {
    return [];
  }
}

/** Adiciona uma entrada no início e mantém só as últimas MAX_ENTRADAS. */
export function salvarEntrada(entrada) {
  const novoHistorico = [entrada, ...carregarHistorico()].slice(0, MAX_ENTRADAS);
  try {
    localStorage.setItem(CHAVE, JSON.stringify(novoHistorico));
  } catch {
    // Armazenamento cheio ou bloqueado: o app segue funcionando, só sem histórico.
  }
  return novoHistorico;
}

export function limparHistorico() {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    // Nada a fazer se o navegador bloquear o armazenamento.
  }
}