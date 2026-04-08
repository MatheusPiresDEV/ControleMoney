// Dados globais
let salario = { mensal: 0, extras: 0, historico: [] };
let gastos = [];
let investimentos = { cdi: [], fiis: [] };
let metas = [];
let cartao = [];
let limitesCartao = { Alimentacao: 500, Transporte: 300, Lazer: 200, Saude: 400, Outros: 300 };
let categoriasPersonalizadas = ['Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Mercado'];
let taxaCDIPersonalizada = 10;

// Funções de localStorage
function salvarDados() {
    localStorage.setItem('salario', JSON.stringify(salario));
    localStorage.setItem('gastos', JSON.stringify(gastos));
    localStorage.setItem('investimentos', JSON.stringify(investimentos));
    localStorage.setItem('metas', JSON.stringify(metas));
    localStorage.setItem('cartao', JSON.stringify(cartao));
    localStorage.setItem('limitesCartao', JSON.stringify(limitesCartao));
    localStorage.setItem('categoriasPersonalizadas', JSON.stringify(categoriasPersonalizadas));
    localStorage.setItem('taxaCDIPersonalizada', taxaCDIPersonalizada);
}

function carregarDados() {
    const salarioData = localStorage.getItem('salario');
    if (salarioData) salario = JSON.parse(salarioData);

    const gastosData = localStorage.getItem('gastos');
    if (gastosData) gastos = JSON.parse(gastosData);

    const investimentosData = localStorage.getItem('investimentos');
    if (investimentosData) investimentos = JSON.parse(investimentosData);

    const metasData = localStorage.getItem('metas');
    if (metasData) metas = JSON.parse(metasData);

    const cartaoData = localStorage.getItem('cartao');
    if (cartaoData) cartao = JSON.parse(cartaoData);

    const limitesData = localStorage.getItem('limitesCartao');
    if (limitesData) limitesCartao = JSON.parse(limitesData);

    const categoriasData = localStorage.getItem('categoriasPersonalizadas');
    if (categoriasData) categoriasPersonalizadas = JSON.parse(categoriasData);

    const taxaCDIData = localStorage.getItem('taxaCDIPersonalizada');
    if (taxaCDIData) taxaCDIPersonalizada = parseFloat(taxaCDIData);
}

// Funções utilitárias
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function formatarData(data) {
    return new Date(data).toLocaleDateString('pt-BR');
}

function exportarCSV(dados, nomeArquivo) {
    const csv = dados.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    a.click();
    URL.revokeObjectURL(url);
}

// Buscar taxa CDI da API do Banco Central
async function buscarTaxaCDI() {
    try {
        const response = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.4390/dados?formato=json');
        const data = await response.json();
        const ultimaTaxa = data[data.length - 1].valor;
        return parseFloat(ultimaTaxa);
    } catch (error) {
        console.error('Erro ao buscar taxa CDI:', error);
        return 0.1; // Valor padrão
    }
}

// Simular busca de cotação FII (em produção, usar API real)
async function buscarCotacaoFII(nome) {
    // Simulado
    return Math.random() * 20 + 5;
}

function adicionarCategoria() {
    const novaCategoria = prompt('Digite o nome da nova categoria:');
    if (novaCategoria && novaCategoria.trim() !== '') {
        const categoriaTrimmed = novaCategoria.trim();
        if (!categoriasPersonalizadas.includes(categoriaTrimmed)) {
            categoriasPersonalizadas.push(categoriaTrimmed);
            salvarDados();
            atualizarSelectCategorias();
            alert(`Categoria "${categoriaTrimmed}" adicionada com sucesso!`);
        } else {
            alert('Esta categoria já existe!');
        }
    }
}

// Salário e Receitas
document.getElementById('salarioForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const mensal = parseFloat(document.getElementById('salarioMensal').value);
    const extras = parseFloat(document.getElementById('receitasExtras').value);
    salario.mensal = mensal;
    salario.extras = extras;
    salario.historico.push({ mes: new Date().toISOString().slice(0,7), mensal, extras });
    atualizarHistoricoSalario();
    atualizarResumo();
    salvarDados();
    this.reset();
});

function atualizarHistoricoSalario() {
    const historicoDiv = document.getElementById('historicoSalario');
    if (!historicoDiv) return;
    historicoDiv.innerHTML = '<h3>Histórico de Salários</h3><button onclick="exportarSalarioCSV()" class="btn">Exportar CSV</button><table style="margin-top: 1rem; width: 100%; border-collapse: collapse;"><thead><tr style="background: #f2f2f2;"><th style="padding: 0.5rem; border: 1px solid #ddd;">Mês</th><th style="padding: 0.5rem; border: 1px solid #ddd;">Salário Mensal</th><th style="padding: 0.5rem; border: 1px solid #ddd;">Receitas Extras</th><th style="padding: 0.5rem; border: 1px solid #ddd;">Total</th><th style="padding: 0.5rem; border: 1px solid #ddd;">Ações</th></tr></thead><tbody id="historicoSalarioBody"></tbody></table>';
    const tbody = document.getElementById('historicoSalarioBody');
    salario.historico.forEach((item, index) => {
        tbody.innerHTML += `<tr><td style="padding: 0.5rem; border: 1px solid #ddd;">${item.mes}</td><td style="padding: 0.5rem; border: 1px solid #ddd;">${formatarMoeda(item.mensal)}</td><td style="padding: 0.5rem; border: 1px solid #ddd;">${formatarMoeda(item.extras)}</td><td style="padding: 0.5rem; border: 1px solid #ddd;">${formatarMoeda(item.mensal + item.extras)}</td><td style="padding: 0.5rem; border: 1px solid #ddd;"><button type="button" onclick="editarSalario(${index})" class="btn btn-edit" style="margin: 0.2rem;">Editar</button><button type="button" onclick="excluirSalario(${index})" class="btn btn-delete" style="margin: 0.2rem;">Deletar</button></td></tr>`;
    });
}

function editarSalario(index) {
    const item = salario.historico[index];
    const novoMensal = prompt('Novo salário mensal:', item.mensal);
    if (novoMensal && !isNaN(novoMensal)) {
        salario.historico[index].mensal = parseFloat(novoMensal);
        salario.mensal = parseFloat(novoMensal);
        atualizarHistoricoSalario();
        atualizarResumo();
        salvarDados();
    }
}

function excluirSalario(index) {
    if (confirm('Deseja realmente deletar este salário?')) {
        salario.historico.splice(index, 1);
        atualizarHistoricoSalario();
        atualizarResumo();
        salvarDados();
    }
}

function exportarSalarioCSV() {
    const dados = [['Mês', 'Salário Mensal', 'Receitas Extras', 'Total']];
    salario.historico.forEach(item => {
        dados.push([item.mes, item.mensal, item.extras, item.mensal + item.extras]);
    });
    exportarCSV(dados, 'historico_salario.csv');
}

// Gastos Mensais
document.getElementById('gastosForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    let categoria = document.getElementById('categoriaGasto').value;
    
    if (categoria === 'Outro' || categoria === '') {
        const novaCategoria = prompt('Qual é a categoria "Outro"?');
        if (!novaCategoria || novaCategoria.trim() === '') {
            alert('Você deve informar uma categoria!');
            return;
        }
        categoria = novaCategoria.trim();
        if (!categoriasPersonalizadas.includes(categoria)) {
            categoriasPersonalizadas.push(categoria);
            atualizarSelectCategorias();
            salvarDados();
        }
    }
    
    const gasto = {
        data: document.getElementById('dataGasto').value,
        categoria: categoria,
        descricao: document.getElementById('descricaoGasto').value,
        valor: parseFloat(document.getElementById('valorGasto').value),
        formaPagamento: document.getElementById('formaPagamento').value
    };
    
    gastos.push(gasto);
    atualizarTabelaGastos();
    atualizarTotalGastos();
    atualizarGraficosGastos();
    atualizarResumo();
    atualizarDashboard();
    document.getElementById('categoriaGasto').focus();
    salvarDados();
    this.reset();
});

function atualizarTabelaGastos() {
    const tbody = document.querySelector('#tabelaGastos tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const filtroCategoria = document.getElementById('filtroCategoria')?.value || '';
    const filtroPagamento = document.getElementById('filtroPagamento')?.value || '';
    const gastosFiltrados = gastos.filter(g => (!filtroCategoria || g.categoria === filtroCategoria) && (!filtroPagamento || g.formaPagamento === filtroPagamento));
    gastosFiltrados.forEach((g, index) => {
        const indexReal = gastos.indexOf(g);
        tbody.innerHTML += `
            <tr>
                <td>${formatarData(g.data)}</td>
                <td>${g.categoria}</td>
                <td>${g.descricao}</td>
                <td>${formatarMoeda(g.valor)}</td>
                <td>${g.formaPagamento}</td>
                <td>
                    <button type="button" onclick="editarGasto(${indexReal})" class="btn btn-edit">Editar</button>
                    <button type="button" onclick="removerGasto(${indexReal})" class="btn btn-delete">Deletar</button>
                </td>
            </tr>
        `;
    });
}

function editarGasto(index) {
    const g = gastos[index];
    const novoValor = prompt('Novo valor:', g.valor);
    if (novoValor && !isNaN(novoValor)) {
        gastos[index].valor = parseFloat(novoValor);
        atualizarTabelaGastos();
        atualizarTotalGastos();
        atualizarGraficosGastos();
        atualizarResumo();
        salvarDados();
    }
}

function removerGasto(index) {
    if (confirm('Deseja realmente deletar este gasto?')) {
        gastos.splice(index, 1);
        atualizarTabelaGastos();
        atualizarTotalGastos();
        atualizarGraficosGastos();
        atualizarResumo();
        salvarDados();
    }
}

function atualizarTotalGastos() {
    const totalDiv = document.getElementById('totalGastos');
    if (!totalDiv) return;
    const total = gastos.reduce((sum, g) => sum + g.valor, 0);
    totalDiv.innerHTML = `<p>Total de Gastos: ${formatarMoeda(total)}</p><button onclick="exportarGastosCSV()">Exportar CSV</button>`;
}

function exportarGastosCSV() {
    const dados = [['Data', 'Categoria', 'Descrição', 'Valor', 'Forma de Pagamento']];
    gastos.forEach(g => {
        dados.push([g.data, g.categoria, g.descricao, g.valor, g.formaPagamento]);
    });
    exportarCSV(dados, 'gastos.csv');
}

function atualizarGraficosGastos() {
    const ctxPizza = document.getElementById('graficoPizza');
    if (ctxPizza) {
        const categorias = {};
        gastos.forEach(g => categorias[g.categoria] = (categorias[g.categoria] || 0) + g.valor);
        desenharGraficoPizza(ctxPizza.getContext('2d'), categorias);
    }

    const ctxBarras = document.getElementById('graficoBarras');
    if (ctxBarras) {
        const dias = {};
        gastos.forEach(g => {
            const dia = new Date(g.data).getDate();
            dias[dia] = (dias[dia] || 0) + g.valor;
        });
        desenharGraficoBarras(ctxBarras.getContext('2d'), dias);
    }
}

function desenharGraficoPizza(ctx, data) {
    const cores = ['#ff6384', '#36a2eb', '#cc65fe', '#ffce56', '#ff9f40'];
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    if (total === 0) {
        ctx.fillStyle = '#999';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Sem dados', 200, 200);
        return;
    }
    let anguloAtual = 0;
    let i = 0;
    ctx.clearRect(0, 0, 400, 400);
    
    // Desenhar pizza
    for (const [key, value] of Object.entries(data)) {
        const angulo = (value / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(200, 200);
        ctx.arc(200, 200, 120, anguloAtual, anguloAtual + angulo);
        ctx.closePath();
        ctx.fillStyle = cores[i % cores.length];
        ctx.fill();
        
        // Desenhar label no meio do slice
        const anguloMeio = anguloAtual + angulo / 2;
        const labelX = 200 + Math.cos(anguloMeio - Math.PI/2) * 80;
        const labelY = 200 + Math.sin(anguloMeio - Math.PI/2) * 80;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        const percentual = ((value / total) * 100).toFixed(0);
        ctx.fillText(percentual + '%', labelX, labelY);
        
        anguloAtual += angulo;
        i++;
    }
    
    // Desenhar legenda
    let legendaY = 20;
    const legendaX = 250;
    ctx.fillStyle = '#333';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'left';
    i = 0;
    for (const [key, value] of Object.entries(data)) {
        ctx.fillStyle = cores[i % cores.length];
        ctx.fillRect(legendaX, legendaY, 12, 12);
        ctx.fillStyle = '#333';
        ctx.fillText(key.substring(0, 12), legendaX + 18, legendaY + 10);
        legendaY += 18;
        i++;
    }
}

function desenharGraficoProjecoes(ctx, data) {
    const canvas = ctx.canvas;
    const width = canvas.width || 400;
    const height = canvas.height || 250;
    
    ctx.clearRect(0, 0, width, height);
    
    if (!data || data.length === 0) {
        ctx.fillStyle = '#999';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Sem dados para projeção', width / 2, height / 2);
        return;
    }
    
    const max = Math.max(...data.map(d => d.total));
    const padding = 40;
    const plotWidth = width - (padding * 2);
    const plotHeight = height - (padding * 2);
    const barWidth = Math.max(4, Math.floor(plotWidth / (data.length * 1.5)));
    const spacing = Math.max(2, Math.floor((plotWidth - (barWidth * data.length)) / data.length));
    
    let x = padding;
    const cores = ['#27ae60', '#3498db'];
    
    // Desenhar linhas de grade
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = padding + (plotHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }
    
    // Desenhar barras
    data.forEach((d, index) => {
        const height1 = (d.cdi / max) * plotHeight;
        const height2 = (d.fii / max) * plotHeight;
        
        // CDI
        ctx.fillStyle = cores[0];
        ctx.fillRect(x, padding + plotHeight - height1, barWidth / 2 - 1, height1);
        
        // FII
        ctx.fillStyle = cores[1];
        ctx.fillRect(x + barWidth / 2, padding + plotHeight - height2, barWidth / 2 - 1, height2);
        
        // Label
        if (index % Math.max(1, Math.floor(data.length / 6)) === 0) {
            ctx.fillStyle = '#333';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            const label = d.mes === 0 ? 'Hoje' : `M${d.mes}`;
            ctx.fillText(label, x + barWidth / 2, padding + plotHeight + 20);
        }
        
        x += barWidth + spacing;
    });
    
    // Legenda
    ctx.font = '11px Arial';
    ctx.fillStyle = cores[0];
    ctx.fillRect(width - 120, 15, 12, 12);
    ctx.fillStyle = '#333';
    ctx.textAlign = 'left';
    ctx.fillText('CDI', width - 100, 24);
    
    ctx.fillStyle = cores[1];
    ctx.fillRect(width - 120, 32, 12, 12);
    ctx.fillStyle = '#333';
    ctx.fillText('FII', width - 100, 41);
}

function desenharGraficoProjecaoCDI(ctx, data) {
    const canvas = ctx.canvas;
    const width = canvas.width || 400;
    const height = canvas.height || 250;
    
    ctx.clearRect(0, 0, width, height);
    
    if (!data || data.length === 0) {
        ctx.fillStyle = '#999';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Sem dados de projeção', width / 2, height / 2);
        return;
    }
    
    const max = Math.max(...data.map(d => d.valor));
    const padding = 40;
    const plotWidth = width - (padding * 2);
    const plotHeight = height - (padding * 2);
    
    // Desenhar linha de grade
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = padding + (plotHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }
    
    // Calcular pontos da linha
    const pontos = data.map((d, index) => ({
        x: padding + (index / (data.length - 1 || 1)) * plotWidth,
        y: padding + plotHeight - (d.valor / max) * plotHeight
    }));
    
    // Desenhar linha
    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = 3;
    ctx.beginPath();
    pontos.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
    
    // Desenhar pontos
    pontos.forEach((p, i) => {
        ctx.fillStyle = '#27ae60';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Labels
    const step = Math.max(1, Math.floor(data.length / 6));
    data.forEach((d, i) => {
        if (i % step === 0) {
            ctx.fillStyle = '#333';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            const label = d.mes === 0 ? 'Hoje' : `M${d.mes}`;
            const x = padding + (i / (data.length - 1 || 1)) * plotWidth;
            ctx.fillText(label, x, padding + plotHeight + 20);
        }
    });
    
    // Título
    ctx.fillStyle = '#27ae60';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('CDI', padding + 5, padding - 5);
}

function desenharGraficoProjecaoFII(ctx, data) {
    const canvas = ctx.canvas;
    const width = canvas.width || 400;
    const height = canvas.height || 250;
    
    ctx.clearRect(0, 0, width, height);
    
    if (!data || data.length === 0) {
        ctx.fillStyle = '#999';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Sem dados de projeção', width / 2, height / 2);
        return;
    }
    
    const maxPatrimonio = Math.max(...data.map(d => d.patrimonio));
    const padding = 40;
    const plotWidth = width - (padding * 2);
    const plotHeight = height - (padding * 2);
    
    // Desenhar linhas de grade
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = padding + (plotHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }
    
    // Calcular pontos da linha de patrimônio
    const pontosPatrimonio = data.map((d, index) => ({
        x: padding + (index / (data.length - 1 || 1)) * plotWidth,
        y: padding + plotHeight - (d.patrimonio / maxPatrimonio) * plotHeight
    }));
    
    // Desenhar linha de patrimônio
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 3;
    ctx.beginPath();
    pontosPatrimonio.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
    
    // Desenhar pontos
    pontosPatrimonio.forEach((p, i) => {
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Labels
    const step = Math.max(1, Math.floor(data.length / 6));
    data.forEach((d, i) => {
        if (i % step === 0) {
            ctx.fillStyle = '#333';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            const label = d.mes === 0 ? 'Hoje' : `M${d.mes}`;
            const x = padding + (i / (data.length - 1 || 1)) * plotWidth;
            ctx.fillText(label, x, padding + plotHeight + 20);
        }
    });
    
    // Legenda
    ctx.font = '11px Arial';
    ctx.fillStyle = '#3498db';
    ctx.fillRect(padding + 5, 15, 12, 12);
    ctx.fillStyle = '#333';
    ctx.textAlign = 'left';
    ctx.fillText('Patrimônio', padding + 20, 24);
    
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(padding + 5, 32, 12, 12);
    ctx.fillStyle = '#333';
    ctx.fillText('Dividendos', padding + 20, 41);
}

function desenharGraficoDiasSemana(ctx, dados) {
    const canvas = ctx.canvas;
    const width = canvas.width || 400;
    const height = canvas.height || 250;
    
    ctx.clearRect(0, 0, width, height);
    
    if (!dados || Object.keys(dados).length === 0) {
        ctx.fillStyle = '#999';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Sem dados', width / 2, height / 2);
        return;
    }
    
    const valores = Object.values(dados);
    const max = Math.max(...valores);
    const padding = 50;
    const plotWidth = width - (padding * 2);
    const plotHeight = height - (padding * 2);
    const barWidth = plotWidth / (valores.length || 1) * 0.7;
    const spacing = (plotWidth - (barWidth * valores.length)) / (valores.length + 1);
    
    // Cores degradê
    const cores = [
        '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b'
    ];
    
    // Desenhar linhas de grade
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = padding + (plotHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }
    
    // Desenhar barras
    let x = padding + spacing;
    const labels = Object.keys(dados);
    
    labels.forEach((label, index) => {
        const valor = dados[label];
        const barHeight = (valor / max) * plotHeight;
        
        // Gradient da barra
        const gradient = ctx.createLinearGradient(x, padding + plotHeight - barHeight, x, padding + plotHeight);
        gradient.addColorStop(0, cores[index % cores.length]);
        gradient.addColorStop(1, cores[(index + 1) % cores.length]);
        
        ctx.fillStyle = gradient;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 3;
        ctx.fillRect(x, padding + plotHeight - barHeight, barWidth, barHeight);
        ctx.shadowColor = 'transparent';
        
        // Label do dia
        ctx.fillStyle = '#333';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + barWidth / 2, padding + plotHeight + 25);
        
        // Valor na barra
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        const textoValor = formatarMoeda(valor);
        ctx.fillText(textoValor, x + barWidth / 2, padding + plotHeight - barHeight + 18);
        
        x += barWidth + spacing;
    });
    
    // Título
    ctx.fillStyle = '#333';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Gastos por Dia da Semana', padding, 20);
}

function desenharGraficoBarras(ctx, data) {
    const canvas = ctx.canvas;
    const width = canvas.width || 400;
    const height = canvas.height || 250;
    
    ctx.clearRect(0, 0, width, height);
    
    const values = Object.values(data);
    if (values.length === 0) {
        ctx.fillStyle = '#999';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Sem dados', width / 2, height / 2);
        return;
    }
    
    const max = Math.max(...values);
    const padding = 40;
    const plotWidth = width - (padding * 2);
    const plotHeight = height - (padding * 2);
    const barWidth = Math.max(8, Math.floor(plotWidth / (values.length * 1.3)));
    const spacing = Math.floor((plotWidth - (barWidth * values.length)) / (values.length - 1 || 1));
    
    let x = padding;
    let i = 0;
    const cores = ['#667eea', '#764ba2', '#27ae60', '#e74c3c', '#f39c12', '#3498db'];
    
    // Desenhar linhas de grade
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    for (let j = 0; j <= 5; j++) {
        const y = padding + (plotHeight / 5) * j;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }
    
    for (const [label, valor] of Object.entries(data)) {
        const barHeight = (valor / max) * plotHeight;
        
        ctx.fillStyle = cores[i % cores.length];
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillRect(x, padding + plotHeight - barHeight, barWidth, barHeight);
        ctx.shadowColor = 'transparent';
        
        // Label
        ctx.fillStyle = '#333';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        const labelText = String(label).substring(0, 10);
        ctx.save();
        ctx.translate(x + barWidth / 2, padding + plotHeight + 20);
        ctx.rotate(-Math.PI / 6);
        ctx.fillText(labelText, 0, 0);
        ctx.restore();
        
        // Valor na barra
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(formatarMoeda(valor), x + barWidth / 2, padding + plotHeight - barHeight + 15);
        
        x += barWidth + spacing;
        i++;
    }
}

// Resumo Financeiro
function atualizarResumo() {
    const receita = salario.mensal + salario.extras;
    const gastosTotais = gastos.reduce((sum, g) => sum + g.valor, 0);
    const saldo = receita - gastosTotais;
    const economia = receita > 0 ? (saldo / receita) * 100 : 0;
    const tbody = document.querySelector('#tabelaResumo tbody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td>${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</td>
                <td>${formatarMoeda(receita)}</td>
                <td>${formatarMoeda(gastosTotais)}</td>
                <td style="color: ${saldo >= 0 ? 'green' : 'red'}">${formatarMoeda(saldo)}</td>
                <td>${economia.toFixed(2)}%</td>
            </tr>
        `;
    }
    const ctx = document.getElementById('graficoResumo');
    if (ctx) {
        desenharGraficoBarrasComparacao(ctx.getContext('2d'), { Receita: receita, Despesas: gastosTotais });
    }
    atualizarVisaoGeral();
}

function desenharGraficoBarrasComparacao(ctx, data) {
    const canvas = ctx.canvas;
    const width = canvas.width || 400;
    const height = canvas.height || 200;
    ctx.clearRect(0, 0, width, height);
    const values = Object.values(data);
    if (values.length === 0) {
        ctx.fillStyle = '#999';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Sem dados', width / 2, height / 2);
        return;
    }
    const max = Math.max(...values);
    const barWidth = (width - 80) / values.length;
    let x = 40;
    let i = 0;
    const cores = ['#27ae60', '#e74c3c', '#3498db', '#f39c12'];
    for (const [key, value] of Object.entries(data)) {
        const barHeight = (value / max) * (height - 60);
        ctx.fillStyle = cores[i % cores.length];
        ctx.fillRect(x, height - 40 - barHeight, barWidth - 10, barHeight);
        
        // Label e valor
        ctx.fillStyle = '#000';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(key, x + (barWidth - 10) / 2, height - 20);
        ctx.font = '10px Arial';
        ctx.fillText(formatarMoeda(value), x + (barWidth - 10) / 2, height - 6);
        
        x += barWidth;
        i++;
    }
}

// Investimentos
document.getElementById('cdiForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const valor = parseFloat(document.getElementById('valorCDI').value);
    const cdi = {
        data: document.getElementById('dataCDI').value,
        valor,
        taxa: taxaCDIPersonalizada,
        id: Date.now()
    };
    investimentos.cdi.push(cdi);
    atualizarTabelaCDI();
    atualizarPatrimonio();
    salvarDados();
    this.reset();
});

function atualizarTaxaCDI() {
    const taxa = parseFloat(document.getElementById('taxaCDIAtual').value);
    if (!isNaN(taxa) && taxa > 0) {
        taxaCDIPersonalizada = taxa;
        salvarDados();
        alert('Taxa CDI atualizada para ' + taxa + '% a.a.');
        atualizarTabelaCDI();
        atualizarPatrimonio();
    }
}

function atualizarTabelaCDI() {
    const tbody = document.querySelector('#tabelaCDI tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    investimentos.cdi.forEach((c, index) => {
        const rendimento = c.valor * (c.taxa / 100) / 12; // Mensal
        tbody.innerHTML += `
            <tr>
                <td>${formatarData(c.data)}</td>
                <td>${formatarMoeda(c.valor)}</td>
                <td>${c.taxa}%</td>
                <td>${formatarMoeda(rendimento)}</td>
                <td>
                    <button type="button" onclick="editarCDI(${index})" class="btn btn-edit">Editar</button>
                    <button type="button" onclick="excluirCDI(${index})" class="btn btn-delete">Deletar</button>
                </td>
            </tr>
        `;
    });
}

function editarCDI(index) {
    const cdi = investimentos.cdi[index];
    const novoValor = prompt('Novo valor aplicado:', cdi.valor);
    if (novoValor && !isNaN(novoValor)) {
        investimentos.cdi[index].valor = parseFloat(novoValor);
        atualizarTabelaCDI();
        atualizarPatrimonio();
        salvarDados();
    }
}

function excluirCDI(index) {
    if (confirm('Deseja realmente deletar este CDI?')) {
        investimentos.cdi.splice(index, 1);
        atualizarTabelaCDI();
        atualizarPatrimonio();
        salvarDados();
    }
}

document.getElementById('fiiForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const nome = document.getElementById('nomeFII').value;
    const valorAtual = await buscarCotacaoFII(nome);
    const fii = {
        data: document.getElementById('dataFII').value,
        nome,
        qtd: parseInt(document.getElementById('qtdCotas').value),
        precoMedio: parseFloat(document.getElementById('precoMedio').value),
        valorAtual,
        dividendos: 0
    };
    investimentos.fiis.push(fii);
    atualizarTabelaFII();
    atualizarPatrimonio();
    salvarDados();
    this.reset();
});

function atualizarTabelaFII() {
    const tbody = document.querySelector('#tabelaFII tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    investimentos.fiis.forEach((f, index) => {
        const patrimonio = f.qtd * f.valorAtual;
        tbody.innerHTML += `
            <tr>
                <td>${formatarData(f.data)}</td>
                <td>${f.nome}</td>
                <td>${f.qtd}</td>
                <td>${formatarMoeda(f.precoMedio)}</td>
                <td>${formatarMoeda(f.valorAtual)}</td>
                <td>${formatarMoeda(patrimonio)}</td>
                <td>${formatarMoeda(f.dividendos)}</td>
                <td>
                    <button type="button" onclick="editarFII(${index})" class="btn btn-edit">Editar</button>
                    <button type="button" onclick="excluirFII(${index})" class="btn btn-delete">Deletar</button>
                </td>
            </tr>
        `;
    });
}

function editarFII(index) {
    const f = investimentos.fiis[index];
    const novoValor = prompt('Novo valor da cota:', f.valorAtual);
    if (novoValor && !isNaN(novoValor)) {
        investimentos.fiis[index].valorAtual = parseFloat(novoValor);
        atualizarTabelaFII();
        atualizarPatrimonio();
        salvarDados();
    }
}

function excluirFII(index) {
    if (confirm('Deseja realmente deletar este FII?')) {
        investimentos.fiis.splice(index, 1);
        atualizarTabelaFII();
        atualizarPatrimonio();
        salvarDados();
    }
}

function atualizarPatrimonio() {
    const cdiTotal = investimentos.cdi.reduce((sum, c) => sum + c.valor + (c.valor * (c.taxa / 100) / 12), 0);
    const fiiTotal = investimentos.fiis.reduce((sum, f) => sum + (f.qtd * f.valorAtual), 0);
    const patrimonioDiv = document.getElementById('patrimonioTotal');
    if (patrimonioDiv) {
        patrimonioDiv.innerHTML = `<p>Patrimônio Total: ${formatarMoeda(cdiTotal + fiiTotal)}</p><button onclick="exportarInvestimentosCSV()">Exportar CSV</button>`;
    }
}

function exportarInvestimentosCSV() {
    const dados = [['Tipo', 'Data', 'Valor', 'Taxa/Rendimento']];
    investimentos.cdi.forEach(c => dados.push(['CDI', c.data, c.valor, c.taxa]));
    investimentos.fiis.forEach(f => dados.push(['FII', f.data, f.nome, f.qtd * f.precoMedio]));
    exportarCSV(dados, 'investimentos.csv');
}

// Projeções
document.getElementById('projecaoForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const meses = parseInt(document.getElementById('mesesProjecao').value);
    const tipo = document.getElementById('tipoProjecao').value;
    const aporteCDI = parseFloat(document.getElementById('aporteCDI').value) || 0;
    const aporteFII = parseFloat(document.getElementById('aporteFII').value) || 0;
    const taxaCDI = parseFloat(document.getElementById('taxaCDI').value) / 100 / 12;
    const taxaFII = parseFloat(document.getElementById('rentabilidadeFII').value) / 100 / 12;
    const dividendosFII = parseFloat(document.getElementById('dividendosFII').value) / 100;
    
    calcularProjecoes(meses, tipo, aporteCDI, aporteFII, taxaCDI, taxaFII, dividendosFII);
});

function calcularProjecoes(meses, tipo, aporteCDI, aporteFII, taxaCDI, taxaFII, dividendosFII) {
    // Recuperar investimentos atuais
    let cdiInicial = investimentos.cdi.reduce((sum, c) => sum + c.valor, 0);
    let fiiInicial = investimentos.fiis.reduce((sum, f) => sum + (f.qtd * f.valorAtual), 0);
    
    // Projeção CDI
    if (tipo === 'cdi' || tipo === 'ambos') {
        const tbodyCDI = document.querySelector('#tabelaProjecoesCDI tbody');
        if (tbodyCDI) {
            tbodyCDI.innerHTML = '';
            let cdiAcum = cdiInicial;
            
            for (let i = 1; i <= meses; i++) {
                const rendimento = cdiAcum * taxaCDI;
                cdiAcum = cdiAcum + aporteCDI + rendimento;
                
                tbodyCDI.innerHTML += `
                    <tr>
                        <td>Mês ${i}</td>
                        <td>${formatarMoeda(aporteCDI)}</td>
                        <td>${formatarMoeda(rendimento)}</td>
                        <td>${formatarMoeda(cdiAcum)}</td>
                    </tr>
                `;
            }
            
            // Gráfico CDI
            const ctxCDI = document.getElementById('graficoProjecoesCDI');
            if (ctxCDI) {
                const dataGrafico = [];
                let tempCdi = cdiInicial;
                dataGrafico.push({ mes: 0, valor: tempCdi });
                
                for (let i = 1; i <= Math.min(meses, 60); i++) {
                    const rendimento = tempCdi * taxaCDI;
                    tempCdi = tempCdi + aporteCDI + rendimento;
                    dataGrafico.push({ mes: i, valor: tempCdi });
                }
                
                desenharGraficoProjecaoCDI(ctxCDI.getContext('2d'), dataGrafico);
            }
        }
    } else {
        const tbodyCDI = document.querySelector('#tabelaProjecoesCDI tbody');
        if (tbodyCDI) tbodyCDI.innerHTML = '';
    }
    
    // Projeção FII
    if (tipo === 'fii' || tipo === 'ambos') {
        const tbodyFII = document.querySelector('#tabelaProjecoesFII tbody');
        if (tbodyFII) {
            tbodyFII.innerHTML = '';
            let fiiAcum = fiiInicial;
            let dividendosAcumFII = 0;
            
            for (let i = 1; i <= meses; i++) {
                const valorizacao = fiiAcum * taxaFII;
                const dividendosMes = fiiAcum * dividendosFII;
                dividendosAcumFII += dividendosMes;
                fiiAcum = fiiAcum + aporteFII + valorizacao + dividendosMes;
                
                tbodyFII.innerHTML += `
                    <tr>
                        <td>Mês ${i}</td>
                        <td>${formatarMoeda(aporteFII)}</td>
                        <td>${formatarMoeda(valorizacao)}</td>
                        <td>${formatarMoeda(dividendosMes)}</td>
                        <td>${formatarMoeda(fiiAcum)}</td>
                    </tr>
                `;
            }
            
            // Gráfico FII
            const ctxFII = document.getElementById('graficoProjecoesFII');
            if (ctxFII) {
                const dataGrafico = [];
                let tempFii = fiiInicial;
                let tempDividendos = 0;
                dataGrafico.push({ mes: 0, patrimonio: tempFii, dividendos: tempDividendos });
                
                for (let i = 1; i <= Math.min(meses, 60); i++) {
                    const valorizacao = tempFii * taxaFII;
                    const dividendosMes = tempFii * dividendosFII;
                    tempDividendos += dividendosMes;
                    tempFii = tempFii + aporteFII + valorizacao + dividendosMes;
                    dataGrafico.push({ mes: i, patrimonio: tempFii, dividendos: tempDividendos });
                }
                
                desenharGraficoProjecaoFII(ctxFII.getContext('2d'), dataGrafico);
            }
        }
    } else {
        const tbodyFII = document.querySelector('#tabelaProjecoesFII tbody');
        if (tbodyFII) tbodyFII.innerHTML = '';
    }
    
    // Projeção Consolidada
    if (tipo === 'ambos') {
        const tbodyTotal = document.querySelector('#tabelaProjecoes tbody');
        if (tbodyTotal) {
            tbodyTotal.innerHTML = '';
            let cdiAcum = cdiInicial;
            let fiiAcum = fiiInicial;
            
            for (let i = 1; i <= meses; i++) {
                const rendimentoCDI = cdiAcum * taxaCDI;
                cdiAcum = cdiAcum + aporteCDI + rendimentoCDI;
                
                const valorizacaoFII = fiiAcum * taxaFII;
                const dividendosMes = fiiAcum * dividendosFII;
                fiiAcum = fiiAcum + aporteFII + valorizacaoFII + dividendosMes;
                
                const total = cdiAcum + fiiAcum;
                
                tbodyTotal.innerHTML += `
                    <tr>
                        <td>Mês ${i}</td>
                        <td>${formatarMoeda(cdiAcum)}</td>
                        <td>${formatarMoeda(fiiAcum)}</td>
                        <td>${formatarMoeda(total)}</td>
                    </tr>
                `;
            }
            
            // Gráfico Consolidado
            const ctx = document.getElementById('graficoProjecoes');
            if (ctx) {
                const dataGrafico = [];
                let tempCdi = cdiInicial;
                let tempFii = fiiInicial;
                
                dataGrafico.push({ mes: 0, cdi: tempCdi, fii: tempFii, total: tempCdi + tempFii });
                
                for (let i = 1; i <= Math.min(meses, 60); i++) {
                    const rendimentoCDI = tempCdi * taxaCDI;
                    tempCdi = tempCdi + aporteCDI + rendimentoCDI;
                    
                    const valorizacaoFII = tempFii * taxaFII;
                    const dividendosMes = tempFii * dividendosFII;
                    tempFii = tempFii + aporteFII + valorizacaoFII + dividendosMes;
                    
                    dataGrafico.push({ mes: i, cdi: tempCdi, fii: tempFii, total: tempCdi + tempFii });
                }
                
                desenharGraficoProjecoes(ctx.getContext('2d'), dataGrafico);
            }
        }
    } else {
        const tbodyTotal = document.querySelector('#tabelaProjecoes tbody');
        if (tbodyTotal) tbodyTotal.innerHTML = '';
    }
}

// Metas
document.getElementById('metaForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const meta = {
        nome: document.getElementById('nomeMeta').value,
        alvo: parseFloat(document.getElementById('valorAlvo').value),
        prazo: parseInt(document.getElementById('prazoMeta').value)
    };
    meta.mensalNecessario = meta.alvo / meta.prazo;
    metas.push(meta);
    atualizarTabelaMetas();
    salvarDados();
    this.reset();
});

function atualizarTabelaMetas() {
    const tbody = document.querySelector('#tabelaMetas tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    metas.forEach((m, index) => {
        const receitaMensal = salario.mensal + salario.extras;
        const gastosMensais = gastos.reduce((sum, g) => sum + g.valor, 0);
        const economia = receitaMensal - gastosMensais;
        const mesesParaAtigir = economia > 0 ? Math.ceil(m.alvo / economia) : 0;
        const situacao = m.alvo <= 0 ? 'Alcançada' : (mesesParaAtigir <= m.prazo ? 'No prazo' : 'Atrasada');
        const corSituacao = m.alvo <= 0 ? 'green' : (mesesParaAtigir <= m.prazo ? 'orange' : 'red');
        tbody.innerHTML += `
            <tr>
                <td>${m.nome}</td>
                <td>${formatarMoeda(m.alvo)}</td>
                <td>${m.prazo} meses</td>
                <td>${formatarMoeda(m.mensalNecessario)}</td>
                <td>${mesesParaAtigir} meses</td>
                <td style="color: ${corSituacao}">${situacao}</td>
                <td>
                    <button type="button" onclick="editarMeta(${index})" class="btn btn-edit">Editar</button>
                    <button type="button" onclick="excluirMeta(${index})" class="btn btn-delete">Deletar</button>
                </td>
            </tr>
        `;
    });
}

function editarMeta(index) {
    const m = metas[index];
    const novoValor = prompt('Novo valor alvo:', m.alvo);
    if (novoValor && !isNaN(novoValor)) {
        metas[index].alvo = parseFloat(novoValor);
        metas[index].mensalNecessario = metas[index].alvo / metas[index].prazo;
        atualizarTabelaMetas();
        salvarDados();
    }
}

function excluirMeta(index) {
    if (confirm('Deseja realmente deletar esta meta?')) {
        metas.splice(index, 1);
        atualizarTabelaMetas();
        salvarDados();
    }
}

// Cartão de Crédito
document.getElementById('cartaoForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const compra = {
        data: document.getElementById('dataCompra').value,
        categoria: document.getElementById('categoriaCompra').value,
        descricao: document.getElementById('descricaoCompra').value,
        valor: parseFloat(document.getElementById('valorCompra').value),
        cartao: document.getElementById('cartaoUtilizado').value,
        parcela: parseInt(document.getElementById('parcela').value)
    };
    compra.valorParcela = compra.valor / compra.parcela;
    cartao.push(compra);
    atualizarTabelaCartao();
    atualizarLimitesCartao();
    salvarDados();
    this.reset();
});

function atualizarTabelaCartao() {
    const tbody = document.querySelector('#tabelaCartao tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    cartao.forEach((c, index) => {
        tbody.innerHTML += `
            <tr>
                <td>${formatarData(c.data)}</td>
                <td>${c.categoria}</td>
                <td>${c.descricao}</td>
                <td>${formatarMoeda(c.valor)}</td>
                <td>${c.cartao}</td>
                <td>${c.parcela}</td>
                <td>${formatarMoeda(c.valorParcela)}</td>
                <td>
                    <button type="button" onclick="editarCompraCartao(${index})" class="btn btn-edit">Editar</button>
                    <button type="button" onclick="excluirCompraCartao(${index})" class="btn btn-delete">Deletar</button>
                </td>
            </tr>
        `;
    });
}

function editarCompraCartao(index) {
    const c = cartao[index];
    const novoValor = prompt('Novo valor de compra:', c.valor);
    if (novoValor && !isNaN(novoValor)) {
        cartao[index].valor = parseFloat(novoValor);
        cartao[index].valorParcela = cartao[index].valor / cartao[index].parcela;
        atualizarTabelaCartao();
        atualizarLimitesCartao();
        salvarDados();
    }
}

function excluirCompraCartao(index) {
    if (confirm('Deseja realmente deletar esta compra?')) {
        cartao.splice(index, 1);
        atualizarTabelaCartao();
        atualizarLimitesCartao();
        salvarDados();
    }
}

function atualizarLimitesCartao() {
    const gastosPorCategoria = {};
    cartao.forEach(c => gastosPorCategoria[c.categoria] = (gastosPorCategoria[c.categoria] || 0) + c.valor);
    const limitesDiv = document.getElementById('limitesCartao');
    if (limitesDiv) {
        limitesDiv.innerHTML = '<h3>Limites por Categoria</h3><button onclick="exportarCartaoCSV()">Exportar CSV</button>';
        for (const [cat, limite] of Object.entries(limitesCartao)) {
            const gasto = gastosPorCategoria[cat] || 0;
            const diferenca = limite - gasto;
            const status = diferenca >= 0 ? 'OK' : 'Excedido';
            limitesDiv.innerHTML += `<p>${cat}: Limite ${formatarMoeda(limite)}, Gasto ${formatarMoeda(gasto)}, Diferença ${formatarMoeda(diferenca)}, Status: <span style="color: ${status === 'OK' ? 'green' : 'red'}">${status}</span></p>`;
        }
    }
}

function exportarCartaoCSV() {
    const dados = [['Data', 'Categoria', 'Descrição', 'Valor', 'Cartão', 'Parcela', 'Valor Parcela']];
    cartao.forEach(c => {
        dados.push([c.data, c.categoria, c.descricao, c.valor, c.cartao, c.parcela, c.valorParcela]);
    });
    exportarCSV(dados, 'cartao.csv');
}

// Histórico
// Histórico com múltiplos períodos
function atualizarHistorico() {
    const tbody = document.querySelector('#tabelaHistorico tbody');
    if (!tbody) return;
    
    const periodo = document.getElementById('periodoHistorico')?.value || 'mes';
    tbody.innerHTML = '';
    
    let dados = [];
    
    if (periodo === 'mes') {
        // Por mês
        const mesesMap = {};
        salario.historico.forEach(s => {
            if (!mesesMap[s.mes]) {
                mesesMap[s.mes] = { receita: 0, gastos: 0 };
            }
            mesesMap[s.mes].receita = s.mensal + s.extras;
        });
        
        gastos.forEach(g => {
            const mes = g.data.substring(0, 7);
            if (!mesesMap[mes]) {
                mesesMap[mes] = { receita: 0, gastos: 0 };
            }
            mesesMap[mes].gastos += g.valor;
        });
        
        // Adicionar mês atual
        const mesAtual = new Date().toISOString().substring(0, 7);
        if (!mesesMap[mesAtual]) {
            mesesMap[mesAtual] = { receita: salario.mensal + salario.extras, gastos: gastos.reduce((sum, g) => sum + g.valor, 0) };
        }
        
        dados = Object.entries(mesesMap).sort().map(([mes, data]) => ({
            periodo: mes,
            receita: data.receita,
            gastos: data.gastos,
            saldo: data.receita - data.gastos
        }));
        
    } else if (periodo === 'semana') {
        // Por semana
        const semanasMap = {};
        const getWeek = (dateStr) => {
            const date = new Date(dateStr);
            const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
            const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
            return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        };
        
        gastos.forEach(g => {
            const ano = g.data.substring(0, 4);
            const semana = getWeek(g.data);
            const key = `${ano}-S${semana}`;
            if (!semanasMap[key]) semanasMap[key] = { receita: 0, gastos: 0 };
            semanasMap[key].gastos += g.valor;
        });
        
        dados = Object.entries(semanasMap).sort().map(([semana, data]) => ({
            periodo: semana,
            receita: data.receita,
            gastos: data.gastos,
            saldo: data.receita - data.gastos
        }));
        
    } else if (periodo === 'dia') {
        // Por dia
        const diasMap = {};
        gastos.forEach(g => {
            if (!diasMap[g.data]) {
                diasMap[g.data] = { receita: 0, gastos: 0 };
            }
            diasMap[g.data].gastos += g.valor;
        });
        
        dados = Object.entries(diasMap).sort().map(([dia, data]) => ({
            periodo: dia,
            receita: data.receita,
            gastos: data.gastos,
            saldo: data.receita - data.gastos
        }));
    }
    
    // Renderizar tabela
    dados.forEach(item => {
        tbody.innerHTML += `
            <tr>
                <td>${item.periodo}</td>
                <td>${formatarMoeda(item.receita)}</td>
                <td>${formatarMoeda(item.gastos)}</td>
                <td style="color: ${item.saldo >= 0 ? 'green' : 'red'}">${formatarMoeda(item.saldo)}</td>
            </tr>
        `;
    });
    
    // Renderizar gráfico
    const ctx = document.getElementById('graficoHistorico');
    if (ctx && dados.length > 0) {
        const dataGrafico = {};
        dados.forEach(item => {
            dataGrafico[item.periodo.substring(0, 10)] = item.saldo;
        });
        desenharGraficoBarras(ctx.getContext('2d'), dataGrafico);
    }
}

// Dashboard
function atualizarDashboard() {
    // Atualizar Cards de Indicadores
    const receita = salario.mensal + salario.extras;
    const gastosTotais = gastos.reduce((sum, g) => sum + g.valor, 0);
    const saldo = receita - gastosTotais;
    const patrimonio = investimentos.cdi.reduce((sum, c) => sum + c.valor, 0) + 
                       investimentos.fiis.reduce((sum, f) => sum + (f.qtd * f.valorAtual), 0);
    
    const dashReceita = document.getElementById('dashReceita');
    const dashGastos = document.getElementById('dashGastos');
    const dashSaldo = document.getElementById('dashSaldo');
    const dashPatrimonio = document.getElementById('dashPatrimonio');
    
    if (dashReceita) dashReceita.textContent = formatarMoeda(receita);
    if (dashGastos) dashGastos.textContent = formatarMoeda(gastosTotais);
    if (dashSaldo) {
        dashSaldo.textContent = formatarMoeda(saldo);
        dashSaldo.parentElement.style.background = saldo >= 0 
            ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
            : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)';
    }
    if (dashPatrimonio) dashPatrimonio.textContent = formatarMoeda(patrimonio);
    
    // Gráficos
    const ctx1 = document.getElementById('dashGastosCategoria');
    if (ctx1) {
        const categorias = {};
        gastos.forEach(g => categorias[g.categoria] = (categorias[g.categoria] || 0) + g.valor);
        desenharGraficoPizza(ctx1.getContext('2d'), categorias);
    }

    const ctx2 = document.getElementById('dashReceitaDespesa');
    if (ctx2) {
        desenharGraficoBarrasComparacao(ctx2.getContext('2d'), { Receita: receita, Despesa: gastosTotais });
    }

    const ctx3 = document.getElementById('dashInvestimentos');
    if (ctx3) {
        const cdiTotal = investimentos.cdi.reduce((sum, c) => sum + c.valor, 0);
        const fiiTotal = investimentos.fiis.reduce((sum, f) => sum + (f.qtd * f.valorAtual), 0);
        desenharGraficoBarrasComparacao(ctx3.getContext('2d'), { CDI: cdiTotal, FII: fiiTotal });
    }

    const ctx4 = document.getElementById('dashMetas');
    if (ctx4) {
        const metasData = {};
        metas.forEach(m => metasData[m.nome] = m.alvo);
        if (Object.keys(metasData).length === 0) {
            const c = ctx4.getContext('2d');
            c.fillStyle = '#999';
            c.font = '14px Arial';
            c.textAlign = 'center';
            c.fillText('Nenhuma meta definida', ctx4.width / 2, ctx4.height / 2);
        } else {
            desenharGraficoBarras(ctx4.getContext('2d'), metasData);
        }
    }

    const ctx5 = document.getElementById('dashCartao');
    if (ctx5) {
        const cartaoData = {};
        cartao.forEach(c => cartaoData[c.categoria] = (cartaoData[c.categoria] || 0) + c.valor);
        if (Object.keys(cartaoData).length === 0) {
            const c = ctx5.getContext('2d');
            c.fillStyle = '#999';
            c.font = '14px Arial';
            c.textAlign = 'center';
            c.fillText('Nenhuma compra registrada', ctx5.width / 2, ctx5.height / 2);
        } else {
            desenharGraficoPizza(ctx5.getContext('2d'), cartaoData);
        }
    }

    const ctx6 = document.getElementById('dashComparacaoMeses');
    if (ctx6) {
        const mesesData = {};
        salario.historico.forEach(s => mesesData[s.mes] = s.mensal + s.extras);
        if (Object.keys(mesesData).length === 0) {
            mesesData['Atual'] = salario.mensal + salario.extras;
        }
        desenharGraficoBarras(ctx6.getContext('2d'), mesesData);
    }

    const ctx7 = document.getElementById('dashDiasGastos');
    if (ctx7) {
        const dias = {};
        const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
        
        gastos.forEach(g => {
            const diaSemana = new Date(g.data).getDay();
            const nomeDia = diasSemana[diaSemana];
            dias[nomeDia] = (dias[nomeDia] || 0) + g.valor;
        });
        
        if (Object.keys(dias).length === 0) {
            const c = ctx7.getContext('2d');
            c.fillStyle = '#999';
            c.font = '14px Arial';
            c.textAlign = 'center';
            c.fillText('Sem gastos registrados', ctx7.width / 2, ctx7.height / 2);
        } else {
            // Ordenar dias da semana
            const diasOrdenados = {};
            diasSemana.forEach(dia => {
                if (dias[dia]) {
                    diasOrdenados[dia] = dias[dia];
                }
            });
            desenharGraficoDiasSemana(ctx7.getContext('2d'), diasOrdenados);
        }
    }

    const ctx8 = document.getElementById('dashSalario');
    if (ctx8) {
        let salarioData = {};
        salario.historico.forEach(s => salarioData[s.mes] = s.mensal + s.extras);
        if (Object.keys(salarioData).length === 0) {
            salarioData['Atual'] = salario.mensal + salario.extras;
        }
        desenharGraficoBarras(ctx8.getContext('2d'), salarioData);
    }

    const ctx9 = document.getElementById('dashHistorico');
    if (ctx9) {
        const historicoData = { Faturamento: receita, Gastos: gastosTotais };
        desenharGraficoBarrasComparacao(ctx9.getContext('2d'), historicoData);
    }
}

// Visão geral na página inicial
function atualizarVisaoGeral() {
    const receitaSpan = document.getElementById('receitaTotal');
    const gastosSpan = document.getElementById('gastosTotais');
    const saldoSpan = document.getElementById('saldo');
    if (receitaSpan && gastosSpan && saldoSpan) {
        const receita = salario.mensal + salario.extras;
        const gastosTotais = gastos.reduce((sum, g) => sum + g.valor, 0);
        const saldo = receita - gastosTotais;
        receitaSpan.textContent = formatarMoeda(receita);
        gastosSpan.textContent = formatarMoeda(gastosTotais);
        saldoSpan.textContent = formatarMoeda(saldo);
        saldoSpan.style.color = saldo >= 0 ? 'green' : 'red';
    }
}

// Menu Hamburger - Melhorado
function toggleMenu() {
    const navMenu = document.getElementById('nav-menu');
    if (navMenu) {
        navMenu.classList.toggle('closed');
    }
}

// Fechar menu ao clicar em um link
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            const navMenu = document.getElementById('nav-menu');
            if (navMenu && window.innerWidth <= 768) {
                navMenu.classList.add('closed');
            }
        });
    });
});

// Atualizar Select de Categorias
function atualizarSelectCategorias() {
    const selects = document.querySelectorAll('#categoriaGasto, #filtroCategoria, #categoriaCartao');
    selects.forEach(select => {
        const valorAtual = select.value;
        let html = '<option value="">Selecione uma categoria</option>';
        
        categoriasPersonalizadas.forEach(cat => {
            html += `<option value="${cat}">${cat}</option>`;
        });
        
        if (!categoriasPersonalizadas.includes('Outro')) {
            html += '<option value="Outro">Outro</option>';
        }
        
        select.innerHTML = html;
        if (valorAtual) select.value = valorAtual;
    });
}

// Marcar link ativo no menu
function marcarMenuAtivo() {
    const links = document.querySelectorAll('nav a');
    const paginaAtual = window.location.pathname.split('/').pop() || 'index.html';
    
    links.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href === paginaAtual || (paginaAtual === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    carregarDados();
    marcarMenuAtivo();
    atualizarVisaoGeral();
    atualizarHistorico();
    atualizarDashboard();
    atualizarSelectCategorias();

    // Adicionar event listeners condicionais
    const filtroCategoria = document.getElementById('filtroCategoria');
    if (filtroCategoria) filtroCategoria.addEventListener('change', atualizarTabelaGastos);

    const filtroPagamento = document.getElementById('filtroPagamento');
    if (filtroPagamento) filtroPagamento.addEventListener('change', atualizarTabelaGastos);

    // Atualizar dados nas páginas específicas
    if (document.getElementById('salarioForm')) atualizarHistoricoSalario();
    if (document.getElementById('gastosForm')) {
        atualizarTabelaGastos();
        atualizarTotalGastos();
        atualizarGraficosGastos();
    }
    if (document.querySelector('#tabelaResumo')) atualizarResumo();
    if (document.querySelector('#tabelaCDI')) atualizarTabelaCDI();
    if (document.querySelector('#tabelaFII')) atualizarTabelaFII();
    if (document.getElementById('patrimonioTotal')) atualizarPatrimonio();
    if (document.querySelector('#tabelaMetas')) atualizarTabelaMetas();
    if (document.querySelector('#tabelaCartao')) atualizarTabelaCartao();
    if (document.getElementById('limitesCartao')) atualizarLimitesCartao();
    
    // Evento para filtro de período do histórico
    const periodoHistorico = document.getElementById('periodoHistorico');
    if (periodoHistorico) {
        periodoHistorico.addEventListener('change', atualizarHistorico);
    }
    
    // Evento para tipo de projeção
    const tipoProjecao = document.getElementById('tipoProjecao');
    if (tipoProjecao) {
        tipoProjecao.addEventListener('change', function() {
            const tipo = this.value;
            const colCDI = document.querySelector('h3:nth-of-type(1)')?.nextElementSibling;
            const colFII = document.querySelector('h3:nth-of-type(2)')?.nextElementSibling;
            const colTotal = document.querySelector('h3:nth-of-type(3)')?.nextElementSibling;
            
            if (tipo === 'cdi') {
                if (colCDI) colCDI.style.display = 'table';
                if (colFII) colFII.style.display = 'none';
                if (colTotal) colTotal.style.display = 'none';
            } else if (tipo === 'fii') {
                if (colCDI) colCDI.style.display = 'none';
                if (colFII) colFII.style.display = 'table';
                if (colTotal) colTotal.style.display = 'none';
            } else {
                if (colCDI) colCDI.style.display = 'table';
                if (colFII) colFII.style.display = 'table';
                if (colTotal) colTotal.style.display = 'table';
            }
        });
    }
});