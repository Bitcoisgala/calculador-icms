const zipInput = document.getElementById("zipInput");
const fileList = document.getElementById("fileList");
const content = document.getElementById("content");
const summary = document.getElementById("summary");
const manualIcmsInput = document.getElementById("manualIcmsInput");
const manualIcmsButton = document.getElementById("manualIcmsButton");

let totalICMS = 0; // acumular o valor do ICMS de todos os arquivos enviados

let chavesProcessadas = new Set(); // guarda a chave para evitar duplicidade
let arquivosProcessados = 0;
let totalArquivos = 0;

zipInput.addEventListener("change", function(event) { // detecta quando um ou mais arquivos ZIP são selecionados
    const files = Array.from(event.target.files);
    if (!files.length) return;

    if (content.textContent.trim() === "Nenhum arquivo selecionado.") {
        content.textContent = ""; // limpa mensagem inicial apenas uma vez
    }

    files.forEach(function(file) {
        JSZip.loadAsync(file).then(function(zip) { // lê o ZIP
            let xmlCountInZip = 0; // conta quantos XMLs existem dentro do ZIP

            zip.forEach(function(path) {
                if (path.split(".").pop().toLowerCase() === "xml") {
                    xmlCountInZip++;
                }
            });

            totalArquivos += xmlCountInZip;

            content.textContent += `--- ZIP: ${file.name} - ${xmlCountInZip} XML(s) ---\n`;

            if (xmlCountInZip === 0) {
                content.textContent += "Nenhum XML encontrado neste arquivo ZIP.\n\n";
                return;
            }

            zip.forEach(function(path, zipEntry) {
                if (path.split(".").pop().toLowerCase() !== "xml") {
                    return;
                }

                let li = document.createElement("li");
                li.textContent = `${file.name} > ${path}`;
                fileList.appendChild(li);

                zipEntry.async("string").then(function(text) { // lê o conteúdo do arquivo XML como texto
                    const parser = new DOMParser(); // converte o texto em um documento XML
                    const xmlDoc = parser.parseFromString(text, "text/xml");

                    // Verificar se o XML é bem formado
                    if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
                        content.textContent += `XML malformado ignorado: ${path}\n\n`;
                        arquivosProcessados++;
                        if (arquivosProcessados === totalArquivos) {
                            content.textContent += `\n${'='.repeat(40)}\n`;
                            content.textContent += `Total de ICMS: R$ ${totalICMS.toFixed(2)}\n`;
                            content.textContent += `${'='.repeat(40)}\n`;
                            summary.textContent = `Total de ICMS: R$ ${totalICMS.toFixed(2)}`;
                        }
                        return;
                    }

                    const chaveTag = xmlDoc.getElementsByTagName("chNFe")[0];
                    if (!chaveTag) {
                        content.textContent += `Chave da NFe ausente ignorada: ${path}\n\n`;
                        arquivosProcessados++;
                        if (arquivosProcessados === totalArquivos) {
                            content.textContent += `\n${'='.repeat(40)}\n`;
                            content.textContent += `Total de ICMS: R$ ${totalICMS.toFixed(2)}\n`;
                            content.textContent += `${'='.repeat(40)}\n`;
                            summary.textContent = `Total de ICMS: R$ ${totalICMS.toFixed(2)}`;
                        }
                        return;
                    }
                    let chave = chaveTag.textContent.trim();
                    if (!/^\d{44}$/.test(chave)) {
                        content.textContent += `Chave da NFe inválida (não 44 dígitos) ignorada: ${path}\n\n`;
                        arquivosProcessados++;
                        if (arquivosProcessados === totalArquivos) {
                            content.textContent += `\n${'='.repeat(40)}\n`;
                            content.textContent += `Total de ICMS: R$ ${totalICMS.toFixed(2)}\n`;
                            content.textContent += `${'='.repeat(40)}\n`;
                            summary.textContent = `Total de ICMS: R$ ${totalICMS.toFixed(2)}`;
                        }
                        return;
                    }

                    if (chave && chavesProcessadas.has(chave)) {
                        content.textContent += `Arquivo repetido ignorado: ${path}\n\n`;
                        arquivosProcessados++;
                        if (arquivosProcessados === totalArquivos) {
                            content.textContent += `\n${'='.repeat(40)}\n`;
                            content.textContent += `Total de ICMS: R$ ${totalICMS.toFixed(2)}\n`;
                            content.textContent += `${'='.repeat(40)}\n`;
                            summary.textContent = `Total de ICMS: R$ ${totalICMS.toFixed(2)}`;
                        }
                        return;
                    }
                    chavesProcessadas.add(chave);

                    const cStatTag = xmlDoc.getElementsByTagName("cStat")[0];
                    if (!cStatTag || cStatTag.textContent.trim() !== "100") {
                        content.textContent += `Nota não autorizada (cStat != 100) ignorada: ${path}\n\n`;
                        arquivosProcessados++;
                        if (arquivosProcessados === totalArquivos) {
                            content.textContent += `\n${'='.repeat(40)}\n`;
                            content.textContent += `Total de ICMS: R$ ${totalICMS.toFixed(2)}\n`;
                            content.textContent += `${'='.repeat(40)}\n`;
                            summary.textContent = `Total de ICMS: R$ ${totalICMS.toFixed(2)}`;
                        }
                        return;
                    }

                    const tag = xmlDoc.getElementsByTagName("tpNF")[0];
                    if (!tag) {
                        content.textContent += `Tipo de NF ausente ignorado: ${path}\n\n`;
                        arquivosProcessados++;
                        if (arquivosProcessados === totalArquivos) {
                            content.textContent += `\n${'='.repeat(40)}\n`;
                            content.textContent += `Total de ICMS: R$ ${totalICMS.toFixed(2)}\n`;
                            content.textContent += `${'='.repeat(40)}\n`;
                            summary.textContent = `Total de ICMS: R$ ${totalICMS.toFixed(2)}`;
                        }
                        return;
                    }
                    let valor = tag.textContent.trim();
                    if (valor !== "0" && valor !== "1") {
                        content.textContent += `Tipo de NF inválido ignorado: ${path}\n\n`;
                        arquivosProcessados++;
                        if (arquivosProcessados === totalArquivos) {
                            content.textContent += `\n${'='.repeat(40)}\n`;
                            content.textContent += `Total de ICMS: R$ ${totalICMS.toFixed(2)}\n`;
                            content.textContent += `${'='.repeat(40)}\n`;
                            summary.textContent = `Total de ICMS: R$ ${totalICMS.toFixed(2)}`;
                        }
                        return;
                    }

                    const tagICMS = xmlDoc.getElementsByTagName("vICMS")[0];
                    if (!tagICMS) {
                        content.textContent += `Valor ICMS ausente ignorado: ${path}\n\n`;
                        arquivosProcessados++;
                        if (arquivosProcessados === totalArquivos) {
                            content.textContent += `\n${'='.repeat(40)}\n`;
                            content.textContent += `Total de ICMS: R$ ${totalICMS.toFixed(2)}\n`;
                            content.textContent += `${'='.repeat(40)}\n`;
                            summary.textContent = `Total de ICMS: R$ ${totalICMS.toFixed(2)}`;
                        }
                        return;
                    }
                    let valorICMS = parseFloat(tagICMS.textContent.trim());
                    if (isNaN(valorICMS) || valorICMS < 0) {
                        content.textContent += `Valor ICMS inválido ignorado: ${path}\n\n`;
                        arquivosProcessados++;
                        if (arquivosProcessados === totalArquivos) {
                            content.textContent += `\n${'='.repeat(40)}\n`;
                            content.textContent += `Total de ICMS: R$ ${totalICMS.toFixed(2)}\n`;
                            content.textContent += `${'='.repeat(40)}\n`;
                            summary.textContent = `Total de ICMS: R$ ${totalICMS.toFixed(2)}`;
                        }
                        return;
                    }

                    // Processar o XML válido
                    let resultado = "Não encontrado";
                    if (valor === "0") {
                        resultado = "🔴Devolução";
                        totalICMS -= valorICMS;
                    } else if (valor === "1") {
                        resultado = "🟢Venda";
                        totalICMS += valorICMS;
                    }

                    content.textContent += `Arquivo: ${path}\n`;
                    content.textContent += `Tipo: ${resultado}\n`;
                    content.textContent += `ICMS: R$ ${valorICMS.toFixed(2)}\n`;
                    content.textContent += "\n";

                    arquivosProcessados++;
                    if (arquivosProcessados === totalArquivos) {
                        content.textContent += `\n${'='.repeat(40)}\n`;
                        content.textContent += `Total de ICMS: R$ ${totalICMS.toFixed(2)}\n`;
                        content.textContent += `${'='.repeat(40)}\n`;
                        summary.textContent = `Total de ICMS: R$ ${totalICMS.toFixed(2)}`;
                    }
                });
            });
        });
    });

    zipInput.value = ""; // permite enviar o mesmo arquivo novamente se desejado
});

manualIcmsButton.addEventListener("click", function() {
    let value = manualIcmsInput.value.trim();
    if (!value) return;

    value = value.replace(",", ".");
    const amount = parseFloat(value);
    if (isNaN(amount) || amount <= 0) return;

    totalICMS -= amount; // compras diminuem o total de ICMS
    content.textContent += `ICMS manual (compra): -R$ ${amount.toFixed(2)}\n\n`;
    summary.textContent = `Total de ICMS: R$ ${totalICMS.toFixed(2)}`;
    manualIcmsInput.value = "";
});



/* 

Tags de identificação das notas:
Vendas: <tpNF>1</tpNF> +
Devoluções: <tpNF>0</tpNF> -
Inutilizadas: <cStat>102</cStat>
Cancelamento: <tpEvento>110111</tpEvento>

<cStat>100</cStat> significa que a nota está autorizada e pode ser usada no calculo

<chNFe> </chNFe> é a chave única da nota, é uma sequência de exatamente 44 números

<vICMS> </vICMS> essa é a tag que deve ser utilizada para o icms, ela mostra exatamente o valor 

*/

// comente usando // para um linha e /* */ para blocos