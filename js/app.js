/**
 * app.js — camada de interface do Sorteia.
 * Lê os campos da página, chama a lógica de sorteio e mostra o resultado.
 * Todo texto dinâmico entra na página com textContent (nunca innerHTML).
 */

import { sortearItens, sortearNumeros } from './sorteio.js';
import { validarNomes, validarNumeros } from './validacao.js';
import { carregarHistorico, salvarEntrada, limparHistorico } from './historico.js';

const $ = (id) => document.getElementById(id);

const el = {
  form: $('form-sorteio'),
  nomes: $('nomes'),
  qtdNomes: $('qtd-nomes'),
  ignorarRepetidos: $('ignorar-repetidos'),
  botoesModo: document.querySelectorAll('.modo'),
  camposNomes: $('campos-nomes'),
  camposNumeros: $('campos-numeros'),
  min: $('num-min'),
  max: $('num-max'),
  qtdNumeros: $('qtd-numeros'),
  permitirRepetidos: $('permitir-repetidos'),
  msgResultado: $('msg-resultado'),
  listaResultado: $('lista-resultado'),
  listaHistorico: $('lista-historico'),
  historicoVazio: $('historico-vazio'),
  btnLimparHistorico: $('btn-limpar-historico'),
};

const MENSAGEM_INICIAL = 'Preencha os campos e clique em “Sortear”.';

let modo = 'nomes'; // 'nomes' ou 'numeros'

/** Singular ou plural conforme a quantidade. */
function plural(quantidade, singular, pluralForma) {
  return quantidade === 1 ? singular : pluralForma;
}

/** Mostra um texto na área de resultado (aviso ou erro) e esconde a lista. */
function mostrarMensagem(texto, ehErro = false) {
  el.msgResultado.textContent = texto;
  el.msgResultado.classList.toggle('erro', ehErro);
  el.listaResultado.hidden = true;
  el.listaResultado.replaceChildren();
}

/** Cria um <li> com o valor sorteado. textContent evita injeção de HTML. */
function criarItem(valor, indice) {
  const item = document.createElement('li');
  item.textContent = String(valor);
  item.style.setProperty('--i', indice); // atraso da animação, um bilhete após o outro
  return item;
}

/** Mostra a descrição e a lista de sorteados. */
function mostrarResultado(itens, descricao) {
  el.msgResultado.textContent = descricao;
  el.msgResultado.classList.remove('erro');
  el.listaResultado.replaceChildren(...itens.map(criarItem));
  el.listaResultado.hidden = false;
}

/** Volta a área de resultado ao estado inicial. */
function limparResultado() {
  mostrarMensagem(MENSAGEM_INICIAL);
}

/** Alterna entre sorteio de nomes e de números. */
function trocarModo(novoModo) {
  modo = novoModo;
  el.camposNomes.hidden = modo !== 'nomes';
  el.camposNumeros.hidden = modo !== 'numeros';
  el.botoesModo.forEach((botao) => {
    botao.setAttribute('aria-pressed', String(botao.dataset.modo === modo));
  });
  limparResultado();
}

/** Lê o formulário de nomes e faz o sorteio. */
function sortearNomes() {
  const dados = validarNomes({
    texto: el.nomes.value,
    qtd: el.qtdNomes.value,
    ignorarRepetidos: el.ignorarRepetidos.checked,
  });
  if (!dados.ok) return dados;

  const itens = sortearItens(dados.nomes, dados.qtd);
  const total = dados.nomes.length;
  return {
    ok: true,
    itens,
    descricao: `${itens.length} ${plural(itens.length, 'sorteado', 'sorteados')} entre ${total} ${plural(total, 'nome', 'nomes')}.`,
  };
}

/** Lê o formulário de números e faz o sorteio. */
function sortearNumerosDoForm() {
  const dados = validarNumeros({
    min: el.min.value,
    max: el.max.value,
    qtd: el.qtdNumeros.value,
    repetir: el.permitirRepetidos.checked,
  });
  if (!dados.ok) return dados;

  const itens = sortearNumeros(dados.min, dados.max, dados.qtd, dados.repetir);
  return {
    ok: true,
    itens,
    descricao: `${itens.length} ${plural(itens.length, 'número sorteado', 'números sorteados')} entre ${dados.min} e ${dados.max}.`,
  };
}

/** Formata o horário do sorteio para o histórico. */
function formatarData(milissegundos) {
  return new Date(milissegundos).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

/** Monta um item do histórico. Tudo entra com textContent. */
function criarItemHistorico(entrada) {
  const item = document.createElement('li');

  const meta = document.createElement('span');
  meta.className = 'historico-meta';
  meta.textContent = `${formatarData(entrada.data)} — ${entrada.tipo === 'nomes' ? 'Nomes' : 'Números'}`;

  const valores = document.createElement('span');
  valores.className = 'historico-valores';
  valores.textContent = entrada.resultado.join(', ');

  item.append(meta, valores);
  return item;
}

/** Redesenha a lista do histórico a partir do que está salvo. */
function renderizarHistorico() {
  const entradas = carregarHistorico();
  el.listaHistorico.replaceChildren(...entradas.map(criarItemHistorico));
  el.historicoVazio.hidden = entradas.length > 0;
  el.btnLimparHistorico.hidden = entradas.length === 0;
}

/** Guarda o sorteio no histórico e atualiza a lista na tela. */
function registrarNoHistorico(tipo, itens) {
  salvarEntrada({ tipo, resultado: itens, data: Date.now() });
  renderizarHistorico();
}

/** Trata o clique em "Sortear" (envio do formulário). */
function tratarEnvio(evento) {
  evento.preventDefault();
  const resultado = modo === 'nomes' ? sortearNomes() : sortearNumerosDoForm();

  if (!resultado.ok) {
    mostrarMensagem(resultado.erro, true);
    $(resultado.campo)?.focus();
    return;
  }

  mostrarResultado(resultado.itens, resultado.descricao);
  registrarNoHistorico(modo, resultado.itens);
}

el.form.addEventListener('submit', tratarEnvio);

el.botoesModo.forEach((botao) => {
  botao.addEventListener('click', () => trocarModo(botao.dataset.modo));
});

el.btnLimparHistorico.addEventListener('click', () => {
  limparHistorico();
  renderizarHistorico();
});

renderizarHistorico();