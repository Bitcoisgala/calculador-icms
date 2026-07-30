// aqui guardo os dados de todas as notas que foram adicionadas
let dadosNotas = {
  compras:      { valor: 0, quantidade: 0 },
  vendas:       { valor: 0, quantidade: 0 },
  cancelamentos:{ valor: 0, quantidade: 0 },
  devolucoes:   { valor: 0, quantidade: 0 }
};

let barChart; // variável para o gráfico


// formata um número pra aparecer como R$ na tela
function formatarValor(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}


// atualiza todos os cards com os valores atuais
function atualizarTela() {
  let compras       = dadosNotas.compras;
  let vendas        = dadosNotas.vendas;
  let cancelamentos = dadosNotas.cancelamentos;

  // crédito = diferença entre compras e vendas
  let credito = compras.valor - vendas.valor;

  document.getElementById('val-compras').textContent  = formatarValor(compras.valor);
  document.getElementById('meta-compras').textContent = compras.quantidade + ' nota(s)';

  document.getElementById('val-vendas').textContent   = formatarValor(vendas.valor);
  document.getElementById('meta-vendas').textContent  = vendas.quantidade + ' nota(s)';

  document.getElementById('val-cancel').textContent   = formatarValor(cancelamentos.valor);
  document.getElementById('meta-cancel').textContent  = cancelamentos.quantidade + ' nota(s)';

  document.getElementById('val-credito').textContent  = formatarValor(credito);

  atualizarGrafico();
}


// atualiza o gráfico
function atualizarGrafico() {
  const ctx = document.getElementById('barChart');
  const emptyBar = document.getElementById('empty-bar');

  const hasData = dadosNotas.compras.quantidade > 0 || dadosNotas.vendas.quantidade > 0 || dadosNotas.cancelamentos.quantidade > 0 || dadosNotas.devolucoes.quantidade > 0;

  if (!hasData) {
    emptyBar.style.display = 'flex';
    ctx.style.display = 'none';
    return;
  }

  emptyBar.style.display = 'none';
  ctx.style.display = 'block';

  if (!barChart) {
    barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Compras', 'Vendas', 'Devoluções', 'Cancelamentos'],
        datasets: [{
          label: 'Valor (R$)',
          data: [dadosNotas.compras.valor, dadosNotas.vendas.valor, dadosNotas.devolucoes.valor, dadosNotas.cancelamentos.valor],
          backgroundColor: ['#1458ce', '#147a3a', '#bb1a1a', '#582dbc']
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  } else {
    barChart.data.datasets[0].data = [dadosNotas.compras.valor, dadosNotas.vendas.valor, dadosNotas.devolucoes.valor, dadosNotas.cancelamentos.valor];
    barChart.update();
  }
}


// zera tudo quando o usuário clicar em "Limpar"
function limparDados() {
  dadosNotas = {
    compras:      { valor: 0, quantidade: 0 },
    vendas:       { valor: 0, quantidade: 0 },
    cancelamentos:{ valor: 0, quantidade: 0 },
    devolucoes:   { valor: 0, quantidade: 0 }
  };
  atualizarTela();
  if (barChart) {
    barChart.destroy();
    barChart = null;
  }
}


// marca o botão clicado como ativo e remove dos outros
function setActive(botao) {
  document.querySelectorAll('.nav-item').forEach(function(item) {
    item.classList.remove('active');
  });
  botao.classList.add('active');
}


// adiciona uma nota fiscal — vai ser chamada pelas outras telas
window.adicionarNota = function(tipo, valor) {
  if (dadosNotas[tipo] == undefined) return; // tipo inválido, ignora

  dadosNotas[tipo].valor      += valor;
  dadosNotas[tipo].quantidade += 1;

  atualizarTela();
};

// comentar sobre sobre a diferença entre href direto e a function
// leva o usuário para a tela de envio de XMLs
function irParaXML() {
  window.location.href = 'xml-novo.html';
}


// inicializa a tela com tudo zerado
atualizarTela();