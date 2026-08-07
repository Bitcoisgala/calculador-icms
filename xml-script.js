const painelPage = document.getElementById('val-compras') !== null;
const xmlPage = document.getElementById('input-arquivo') !== null;

// Elementos do XML page
const inputArquivo = xmlPage ? document.getElementById('input-arquivo') : null;
const xmlListaNotas = xmlPage ? document.getElementById('xml-lista-notas') : null;
const xmlResultado = xmlPage ? document.getElementById('xml-resultado') : null;

// Variáveis de processamento de XML
let chavesProcessadas = new Set();
let arquivosProcessados = 0;
let totalArquivos = 0;
let notasProcessadas = [];

// Dados do painel
let dadosNotas = {
    compras:      { valor: 0, quantidade: 0 },
    vendas:       { valor: 0, quantidade: 0 },
    cancelamentos:{ valor: 0, quantidade: 0 },
    devolucoes:   { valor: 0, quantidade: 0 }
};
let barChart = null;

// Carrega dados do localStorage para manter o painel e a página de XML sincronizados
function carregarDadosLocais() {
    if (!window.localStorage) return;
    const raw = window.localStorage.getItem('dadosNotas');
    if (!raw) return;
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
            dadosNotas = {
                compras:      parsed.compras || dadosNotas.compras,
                vendas:       parsed.vendas || dadosNotas.vendas,
                cancelamentos:parsed.cancelamentos || dadosNotas.cancelamentos,
                devolucoes:   parsed.devolucoes || dadosNotas.devolucoes
            };
        }
    } catch (error) {
        console.warn('Não foi possível carregar dados locais:', error);
    }
}

function salvarDadosLocais() {
    if (!window.localStorage) return;
    window.localStorage.setItem('dadosNotas', JSON.stringify(dadosNotas));
}

function formatarValor(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function atualizarTela() {
    if (!painelPage) return;

    const compras = dadosNotas.compras;
    const vendas = dadosNotas.vendas;
    const devolucoes = dadosNotas.devolucoes;
    const credito = compras.valor + devolucoes.valor - vendas.valor;

    document.getElementById('val-compras').textContent = formatarValor(compras.valor);
    document.getElementById('meta-compras').textContent = compras.quantidade + ' nota(s)';

    document.getElementById('val-vendas').textContent = formatarValor(vendas.valor);
    document.getElementById('meta-vendas').textContent = vendas.quantidade + ' nota(s)';

    document.getElementById('val-cancel').textContent = formatarValor(devolucoes.valor);
    document.getElementById('meta-cancel').textContent = devolucoes.quantidade + ' nota(s)';

    document.getElementById('val-credito').textContent = formatarValor(credito);
    atualizarGrafico();
}

function atualizarGrafico() {
    if (!painelPage) return;

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

    const dataset = [dadosNotas.compras.valor, dadosNotas.vendas.valor, dadosNotas.devolucoes.valor, dadosNotas.cancelamentos.valor];
    if (!barChart) {
        barChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Compras', 'Vendas', 'Devoluções', 'Cancelamentos'],
                datasets: [{
                    label: 'Valor (R$)',
                    data: dataset,
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
        barChart.data.datasets[0].data = dataset;
        barChart.update();
    }
}

function limparDados() {
    dadosNotas = {
        compras:      { valor: 0, quantidade: 0 },
        vendas:       { valor: 0, quantidade: 0 },
        cancelamentos:{ valor: 0, quantidade: 0 },
        devolucoes:   { valor: 0, quantidade: 0 }
    };
    salvarDadosLocais();
    if (barChart) {
        barChart.destroy();
        barChart = null;
    }
    atualizarTela();
}

function adicionarNotaLocal(tipo, valor) {
    if (!dadosNotas[tipo]) return;
    dadosNotas[tipo].valor += valor;
    dadosNotas[tipo].quantidade += 1;
    salvarDadosLocais();
    atualizarTela();
}

window.adicionarNota = function(tipo, valor) {
    adicionarNotaLocal(tipo, valor);
};

function setActive(botao) {
    document.querySelectorAll('.nav-item').forEach(function(item) {
        item.classList.remove('active');
    });
    if (botao) {
        botao.classList.add('active');
    }
}

function irParaXML() {
    window.location.href = 'xml-novo.html';
}

function processarArquivos(files) {
    if (!files || !files.length) return;

    if (xmlListaNotas) {
        xmlListaNotas.innerHTML = '';
    }
    if (xmlResultado) {
        xmlResultado.style.display = 'block';
    }

    chavesProcessadas = new Set();
    arquivosProcessados = 0;
    totalArquivos = 0;

    Array.from(files).forEach(function(file) {
        const ext = file.name.split('.').pop().toLowerCase();
        if (ext === 'zip') {
            processarZip(file);
        } else if (ext === 'xml') {
            totalArquivos++;
            processarXml(file, file.name);
        }
    });

    if (inputArquivo) {
        inputArquivo.value = '';
    }
}

function processarZip(file) {
    JSZip.loadAsync(file).then(function(zip) {
        let xmlCountInZip = 0;
        zip.forEach(function(path) {
            if (path.split('.').pop().toLowerCase() === 'xml') {
                xmlCountInZip++;
            }
        });
        totalArquivos += xmlCountInZip;

        if (xmlCountInZip === 0) {
            adicionarMensagem(`Nenhum XML encontrado em ${file.name}`);
            return;
        }

        zip.forEach(function(path, zipEntry) {
            if (path.split('.').pop().toLowerCase() !== 'xml') return;
            zipEntry.async('string').then(function(text) {
                processarXmlContent(text, `${file.name} > ${path}`);
            });
        });
    });
}

function processarXml(file, name) {
    const reader = new FileReader();
    reader.onload = function(e) {
        processarXmlContent(e.target.result, name);
    };
    reader.readAsText(file);
}

function processarXmlContent(text, path) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');

    if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
        adicionarMensagem(`XML malformado ignorado: ${path}`);
        verificarFim();
        return;
    }

    const chaveTag = xmlDoc.getElementsByTagName('chNFe')[0];
    if (!chaveTag) {
        adicionarMensagem(`Chave da NFe ausente ignorada: ${path}`);
        verificarFim();
        return;
    }
    const chave = chaveTag.textContent.trim();
    if (!/^\d{44}$/.test(chave)) {
        adicionarMensagem(`Chave da NFe inválida (não 44 dígitos) ignorada: ${path}`);
        verificarFim();
        return;
    }

    if (chavesProcessadas.has(chave)) {
        adicionarMensagem(`Arquivo repetido ignorado: ${path}`);
        verificarFim();
        return;
    }
    chavesProcessadas.add(chave);

    const cStatTag = xmlDoc.getElementsByTagName('cStat')[0];
    if (!cStatTag || cStatTag.textContent.trim() !== '100') {
        adicionarMensagem(`Nota não autorizada (cStat != 100) ignorada: ${path}`);
        verificarFim();
        return;
    }

    const tpNFTag = xmlDoc.getElementsByTagName('tpNF')[0];
    if (!tpNFTag) {
        adicionarMensagem(`Tipo de NF ausente ignorado: ${path}`);
        verificarFim();
        return;
    }
    const tipoNF = tpNFTag.textContent.trim();
    if (tipoNF !== '0' && tipoNF !== '1') {
        adicionarMensagem(`Tipo de NF inválido ignorado: ${path}`);
        verificarFim();
        return;
    }

    const tagICMS = xmlDoc.getElementsByTagName('vICMS')[0];
    if (!tagICMS) {
        adicionarMensagem(`Valor ICMS ausente ignorado: ${path}`);
        verificarFim();
        return;
    }
    const valorICMS = parseFloat(tagICMS.textContent.trim().replace(',', '.'));
    if (isNaN(valorICMS) || valorICMS < 0) {
        adicionarMensagem(`Valor ICMS inválido ignorado: ${path}`);
        verificarFim();
        return;
    }

    const tipo = tipoNF === '0' ? 'devolucoes' : 'vendas';
    const nota = {
        caminho: path,
        tipo: tipo,
        tipoLabel: tipo === 'vendas' ? 'Venda' : 'Devolução',
        icms: valorICMS,
        chave: chave,
        cStat: cStatTag.textContent.trim(),
        tpNF: tipoNF
    };

    const empresa = JSON.parse(
  localStorage.getItem('empresa')
)

await banco
  .from('nfe_chaves')
  .insert([
    {
      chave: chave,

      empresa_id: empresa.id,

      tipo:
        tipo === 'vendas'
          ? 'venda'
          : 'devolucao',

      valor: valorICMS,

      valor_icms: valorICMS
    }
  ])

    notasProcessadas.push(nota);
    if (window.adicionarNota) {
        window.adicionarNota(nota.tipo, nota.icms);
    }
    adicionarNotaLista(nota);
    verificarFim();
}

function adicionarMensagem(msg) {
    if (!xmlListaNotas) return;
    const div = document.createElement('div');
    div.textContent = msg;
    div.style.color = 'red';
    xmlListaNotas.appendChild(div);
}

function adicionarNotaLista(nota) {
    if (!xmlListaNotas) return;
    const div = document.createElement('div');
    let tipoLabel = nota.tipoLabel;
    if (nota.tipo === 'compras') {
        tipoLabel = 'Compra';
    } else if (nota.tipo === 'devolucoes') {
        tipoLabel = 'Devolução';
    } else if (nota.tipo === 'vendas') {
        tipoLabel = 'Venda';
    } else if (nota.tipo === 'cancelamentos') {
        tipoLabel = 'Cancelamento';
    }

    div.innerHTML = `
        <strong>${nota.caminho}</strong><br>
        Tipo: ${tipoLabel}<br>
        ICMS: R$ ${nota.icms.toFixed(2)}<br>
        Chave: ${nota.chave}
    `;
    xmlListaNotas.appendChild(div);
}

function verificarFim() {
    arquivosProcessados++;
}

function receberArquivo(event) {
    event.preventDefault();
    if (!event.dataTransfer) return;
    processarArquivos(event.dataTransfer.files);
}

function trocarAba(qual) {
    let abaXML = document.getElementById('aba-xml');
    let abaManual = document.getElementById('aba-manual');
    let painelXML = document.getElementById('painel-xml');
    let painelManual = document.getElementById('painel-manual');

    if (qual === 'xml') {
        abaXML.classList.add('ativa');
        abaManual.classList.remove('ativa');
        painelXML.style.display = 'block';
        painelManual.style.display = 'none';
    } else {
        abaManual.classList.add('ativa');
        abaXML.classList.remove('ativa');
        painelManual.style.display = 'block';
        painelXML.style.display = 'none';
    }
}

function salvarNotaManual() {
    const numeroNota = document.getElementById('numero-nota');
    const dataEmissao = document.getElementById('data-emissao');
    const valorTotal = document.getElementById('valor-total');
    const valorIcms = document.getElementById('valor-icms');

    if (!numeroNota || !dataEmissao || !valorTotal || !valorIcms) return;

    const valorIcmsNumero = parseFloat(valorIcms.value.toString().replace(',', '.'));
    if (isNaN(valorIcmsNumero) || valorIcmsNumero < 0) {
        alert('Informe um valor de ICMS válido.');
        return;
    }

    if (window.adicionarNota) {
        window.adicionarNota('compras', valorIcmsNumero);
    }

    const empresa = JSON.parse(
  localStorage.getItem('empresa')
)

await banco
  .from('nfe_chaves')
  .insert([
    {
      chave: Date.now().toString().padEnd(44, '0'),

      empresa_id: empresa.id,

      tipo: 'compra',

      valor: valorIcmsNumero,

      valor_icms: valorIcmsNumero
    }
  ])

    adicionarMensagem(`Nota manual salva: ${numeroNota.value || 'sem número'} - ICMS R$ ${valorIcmsNumero.toFixed(2)}`);

    numeroNota.value = '';
    dataEmissao.value = '';
    valorTotal.value = '';
    valorIcms.value = '';
}

if (painelPage) {
    carregarDadosLocais();
    atualizarTela();
}

if (xmlPage && inputArquivo) {
    inputArquivo.addEventListener('change', function(event) {
        processarArquivos(event.target.files);
    });
}





