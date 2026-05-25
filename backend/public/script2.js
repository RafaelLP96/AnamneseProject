// * ================ VERIFICAR AUTENTICAÇÃO ================ */
if (!localStorage.getItem('token')) {
  //window.location.href = 'index.html';
}

/* ================ VARIÁVEIS GLOBAIS ================ */
let menuAberto = false;
let usuarioLogado = localStorage.getItem('usuarioAtual') || localStorage.getItem('usuario')?.nome || 'Usuário';

// Guarda notificações já exibidas para evitar repetição lateral
let shownNotificacoes = new Set();

if (typeof usuarioLogado === 'string' && usuarioLogado.startsWith('{')) {
  try {
    usuarioLogado = JSON.parse(usuarioLogado).nome;
  } catch (e) {
    usuarioLogado = 'Usuário';
  }
}

/* ================ INICIALIZAÇÃO ================ */
document.addEventListener('DOMContentLoaded', function() {
  atualizarNomeUsuario();

  const menuToggle = document.getElementById('menuToggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', toggleMenu);
    // Sincroniza estado inicial do botão com o estado atual da sidebar
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      const inicialAberto = window.innerWidth > 768 ? !sidebar.classList.contains('collapsed') : sidebar.classList.contains('open');
      menuToggle.classList.toggle('active', inicialAberto);
      menuAberto = inicialAberto;
    }
  }

  const form = document.getElementById('prontuarioForm');
  if (form) {
    form.addEventListener('submit', salvarFormulario);
  }

  document.addEventListener('click', function(e) {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    if (window.innerWidth <= 768) {
      if (sidebar && menuToggle && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
        if (sidebar.classList.contains('open')) {
          sidebar.classList.remove('open');
          menuToggle.classList.remove('active');
          menuAberto = false;
        }
      }
    }
  });

  const modal = document.getElementById('formsModal');
  if (modal) {
    window.addEventListener('click', function(e) {
      if (e.target === modal) {
        fecharFormulariosEnviados();
      }
    });
  }

  // Inicializa os monitores de digitação para os alertas instantâneos
  configurarAlertasInstantaneos();
});

// Guarda HTML dos alertas antes de limpar para possibilidade de restauração
let previousAlertasHTML = '';

/* ================ TOGGLE DO MENU ================ */
function toggleMenu() {
  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menuToggle');
  
  if(!sidebar || !menuToggle) return;
  // Alterna o estado da sidebar e garante que o botão reflita o estado real
  if (window.innerWidth > 768) {
    sidebar.classList.toggle('collapsed');
    const aberto = !sidebar.classList.contains('collapsed');
    menuToggle.classList.toggle('active', aberto);
    menuAberto = aberto;
  } else {
    sidebar.classList.toggle('open');
    const aberto = sidebar.classList.contains('open');
    menuToggle.classList.toggle('active', aberto);
    menuAberto = aberto;
  }
}

/* ================ MUDAR DE PÁGINA ================ */
function mudarPagina(numeroPagina) {
  const paginas = document.querySelectorAll('.page');
  paginas.forEach(pagina => {
    pagina.classList.remove('active');
  });

  const botoes = document.querySelectorAll('.nav-btn');
  botoes.forEach(botao => {
    botao.classList.remove('active');
  });

  const paginaDesejada = document.getElementById('pagina' + numeroPagina);
  if (paginaDesejada) {
    paginaDesejada.classList.add('active');
  }

  if (botoes[numeroPagina - 1]) {
    botoes[numeroPagina - 1].classList.add('active');
  }

  const contentDiv = document.querySelector('.content');
  if (contentDiv) contentDiv.scrollTop = 0;

  if (window.innerWidth <= 768) {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    if(sidebar) sidebar.classList.remove('open');
    if(menuToggle) menuToggle.classList.remove('active');
    menuAberto = false;
  }
}

function atualizarNomeUsuario() {
  const nomeElement = document.getElementById('usuarioNome');
  if (nomeElement) {
    nomeElement.textContent = usuarioLogado;
  }
}

/* ================ NOTIFICAÇÕES ================ */
function mostrarNotificacao(mensagem, tipo = 'info') {
  let container = document.getElementById('notificacoes-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notificacoes-container';
    container.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10000; max-width: 400px;
    `;
    document.body.appendChild(container);
  }

  const notif = document.createElement('div');
  notif.style.cssText = `
    background-color: ${tipo === 'sucesso' ? '#d4edda' : tipo === 'erro' ? '#f8d7da' : '#d1ecf1'};
    color: ${tipo === 'sucesso' ? '#155724' : tipo === 'erro' ? '#721c24' : '#0c5460'};
    padding: 15px 20px; border-radius: 6px; margin-bottom: 10px;
    border-left: 4px solid ${tipo === 'sucesso' ? '#28a745' : tipo === 'erro' ? '#dc3545' : '#17a2b8'};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); display: flex; align-items: center; gap: 10px;
    animation: slideIn 0.3s ease forwards;
  `;

  notif.innerHTML = `
    <div style="flex-grow: 1;">${mensagem}</div>
    <button style="background: none; border: none; color: inherit; cursor: pointer; font-size: 16px;">&times;</button>
  `;

  notif.querySelector('button').onclick = () => notif.remove();
  container.appendChild(notif);

  setTimeout(() => {
    if (container.contains(notif)) {
      notif.style.animation = 'fadeOut 0.3s ease forwards';
      setTimeout(() => { if (container.contains(notif)) notif.remove(); }, 300);
    }
  }, 4000);
}

const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
`;
document.head.appendChild(style);

/* ================ FORMULÁRIOS SALVOS ================ */
function formatarData(dataISO) {
  const data = new Date(dataISO);
  return data.toLocaleDateString('pt-BR') + ' às ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

async function salvarFormulario(e) {
  e.preventDefault();

  const token = localStorage.getItem('token');
  const form = e.target;
  const formData = new FormData(form);

  // Build dados object (exclude File objects)
  const dados = {};
  const numericKeys = [
    'mamas_resultado',
    'mamografia_resultado',
    'papanicolau_resultado',
    'psa_resultado',
    'hepatica_resultado',
    'lab_tgo_res',
    'lab_tgp_res',
    'lab_ggt_res',
    'lab_bilirrubina_total_res',
    'lab_bilirrubina_direta_res',
    'lab_bilirrubina_indireta_res',
    'lab_psa_total_res',
    'lab_psa_livre_perc'
  ];

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) continue;

    let storedValue = value;
    if (numericKeys.includes(key) && typeof value === 'string' && value.trim() !== '') {
      const parsed = parseFloat(value.replace(',', '.'));
      if (!Number.isNaN(parsed)) storedValue = parsed;
    }

    if (dados[key] !== undefined) {
      if (Array.isArray(dados[key])) dados[key].push(storedValue);
      else dados[key] = [dados[key], storedValue];
    } else {
      dados[key] = storedValue;
    }
  }

  const payload = {
    nome_social: dados.nome_social || dados.nome_civil || '',
    identidade_genero: dados.identidade || dados.identidade_genero || '',
    data_consulta: dados.data_consulta || '',
    data_proxima_consulta: dados.data_proxima_consulta || '',
    dados: { ...dados }
  };

  delete payload.dados.nome_social;
  delete payload.dados.nome_civil;
  delete payload.dados.identidade;
  delete payload.dados.identidade_genero;
  delete payload.dados.data_consulta;
  delete payload.dados.data_proxima_consulta;

  // Agrupa pares data/resultado em objetos `{ valor, data }` para envio mais estruturado
  const keys = Object.keys(payload.dados);
  for (const key of keys) {
    if (key.endsWith('_res')) {
      const base = key.slice(0, -4);
      const dataKey = base + '_data';
      if (payload.dados[dataKey] !== undefined) {
        payload.dados[base] = { valor: payload.dados[key], data: payload.dados[dataKey] };
        delete payload.dados[key];
        delete payload.dados[dataKey];
      }
    }
    if (key.endsWith('_resultado')) {
      const base = key.slice(0, -10);
      const dataKey = base + '_data';
      if (payload.dados[dataKey] !== undefined) {
        payload.dados[base] = { valor: payload.dados[key], data: payload.dados[dataKey] };
        delete payload.dados[key];
        delete payload.dados[dataKey];
      }
    }
  }

  if (!payload.nome_social || !payload.data_consulta) {
    mostrarNotificacao('Nome social e data da consulta são obrigatórios.', 'erro');
    return;
  }

  try {
    const endpoint = `${window.location.origin}/prontuarios`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: `Bearer ${token}` } : {}),
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.erro || 'Erro ao salvar prontuário no servidor');
    }

    const prontuario = await res.json();

    // If there is a photo field, upload it to /prontuarios/:id/fotos
    const fileInput = form.querySelector('input[type="file"]');
    if (fileInput && fileInput.files.length > 0) {
      const uploadForm = new FormData();
      uploadForm.append('foto', fileInput.files[0]);
      const upRes = await fetch(`${window.location.origin}/prontuarios/${prontuario.id}/fotos`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: uploadForm
      });
      if (!upRes.ok) {
        console.warn('Upload da foto falhou');
      }
    }

    mostrarNotificacao('Prontuário enviado com sucesso.', 'sucesso');
    form.reset();
    const contentDiv = document.querySelector('.content'); if (contentDiv) contentDiv.scrollTop = 0;
    mudarPagina(1);
  } catch (err) {
    console.error(err);
    mostrarNotificacao(err.message || 'Erro ao enviar formulário.', 'erro');
  }
}

function mostrarFormulariosEnviados() {
  const modal = document.getElementById('formsModal');
  const modalBody = document.getElementById('formsModalBody');
  
  if (!modal || !modalBody) return;

  const formsSalvos = JSON.parse(localStorage.getItem('formularios_' + usuarioLogado) || '[]');

  if (formsSalvos.length === 0) {
    modalBody.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
          <polyline points="13 2 13 9 20 9"></polyline>
        </svg>
        <p>Nenhum formulário salvo ainda.</p>
        <p style="font-size: 12px; margin-top: 5px;">Os formulários que você preencher aparecerão aqui.</p>
      </div>
    `;
  } else {
    formsSalvos.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
    
    let html = '<div class="forms-list">';
    formsSalvos.forEach(form => {
      html += `
        <div class="form-item" onclick="visualizarFormulario('${form.id}')">
          <div class="form-item-header">
            <div class="form-item-info">
              <div class="form-item-title">${form.pacienteNome}</div>
              <div class="form-item-date">Enviado em: ${formatarData(form.dataCriacao)}</div>
              <div class="form-item-status">Salvo</div>
            </div>
            <div class="form-item-actions">
              <button class="form-action-btn print-btn" onclick="imprimirProntuario('${form.id}', event)" title="Imprimir">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 6 2 18 2 18 9"></polyline>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                  <rect x="6" y="14" width="12" height="8"></rect>
                </svg>
              </button>
              <button class="form-action-btn pdf-btn" onclick="baixarPDF('${form.id}', event)" title="Baixar PDF">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                  <polyline points="13 2 13 9 20 9"></polyline>
                </svg>
              </button>
              <button class="form-action-btn delete-btn" onclick="deletarProntuario('${form.id}', event)" title="Deletar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';
    modalBody.innerHTML = html;
  }

  modal.classList.add('show');
  
  if (window.innerWidth <= 768) {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    if(sidebar) sidebar.classList.remove('open');
    if(menuToggle) menuToggle.classList.remove('active');
    menuAberto = false;
  }
}

function fecharFormulariosEnviados() {
  const modal = document.getElementById('formsModal');
  if (modal) {
    modal.classList.remove('show');
  }
}

function visualizarFormulario(id) {
  alert('Funcionalidade de visualização completa do formulário ' + id + ' em desenvolvimento.');
}

function imprimirProntuario(id, event) {
  event.stopPropagation();
  const formsSalvos = JSON.parse(localStorage.getItem('formularios_' + usuarioLogado) || '[]');
  const form = formsSalvos.find(f => f.id === id);
  
  if (!form) {
    mostrarNotificacao('Prontuário não encontrado.', 'erro');
    return;
  }

  const printWindow = window.open('', '_blank');
  let conteudo = `
    <html>
      <head>
        <title>Prontuário - ${form.pacienteNome}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #0163a1; border-bottom: 2px solid #0163a1; padding-bottom: 10px; }
          h2 { color: #014d7e; margin-top: 20px; }
          .info-box { background-color: #f0f7ff; padding: 15px; border-radius: 6px; margin: 10px 0; border-left: 4px solid #0163a1; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #0163a1; color: white; }
          .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>Prontuário Eletrônico de Enfermagem</h1>
        <div class="info-box">
          <strong>Paciente:</strong> ${form.pacienteNome}<br>
          <strong>Enviado em:</strong> ${formatarData(form.dataCriacao)}<br>
          <strong>Status:</strong> Salvo
        </div>
        <h2>Dados do Prontuário</h2>
        <pre style="background-color: #f5f5f5; padding: 15px; border-radius: 6px; overflow-x: auto;">
${JSON.stringify(form.dados || {}, null, 2)}
        </pre>
        <div class="footer">
          <p>Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </body>
    </html>
  `;
  printWindow.document.write(conteudo);
  printWindow.document.close();
  
  setTimeout(() => {
    printWindow.print();
  }, 250);
  
  mostrarNotificacao('Abrindo preview para impressão...', 'sucesso');
}

function baixarPDF(id, event) {
  event.stopPropagation();
  mostrarNotificacao('Funcionalidade de download PDF em desenvolvimento.', 'info');
  // Aqui será implementado o download em PDF com uma biblioteca como jsPDF
}

function deletarProntuario(id, event) {
  event.stopPropagation();
  
  const formsSalvos = JSON.parse(localStorage.getItem('formularios_' + usuarioLogado) || '[]');
  const form = formsSalvos.find(f => f.id === id);
  
  if (!form) {
    mostrarNotificacao('Prontuário não encontrado.', 'erro');
    return;
  }

  if (confirm(`Tem certeza que deseja deletar o prontuário de ${form.pacienteNome}? Esta ação não pode ser desfeita.`)) {
    const novaLista = formsSalvos.filter(f => f.id !== id);
    localStorage.setItem('formularios_' + usuarioLogado, JSON.stringify(novaLista));
    mostrarNotificacao('Prontuário deletado com sucesso.', 'sucesso');
    mostrarFormulariosEnviados();
  }
}

function fazerLogout() {
  if (confirm('Tem certeza que deseja sair do sistema?')) {
    localStorage.removeItem('token');
    
    document.body.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #f0f7ff;">
        <h2>Saindo do sistema...</h2>
        <p>Aguarde um momento.</p>
      </div>
    `;
    
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);
  }
}

/* ================ ALERTAS AUTOMÁTICOS (ROBUSTOS) ================ */

function dispararAlerta(nivel, mensagem, categoria) {
  const tipo = nivel === 'vermelho' ? 'erro' : 'amarelo';
  const chave = `${nivel}:${mensagem}`;
  // mostrar notificação lateral apenas uma vez por mensagem até os alertas serem limpos
  if (!shownNotificacoes.has(chave)) {
    mostrarNotificacao(mensagem.replace(/\n/g, '<br>'), tipo === 'erro' ? 'erro' : 'info');
    shownNotificacoes.add(chave);
  }

  // inserir no container do tópico 10 quando categoria for passada
  if (categoria) {
    const container = document.getElementById('alertas_topico10');
    if (container) {
      const alerta = document.createElement('div');
      alerta.className = `inline-alert inline-alert-${nivel}`;
      alerta.style.cssText = nivel === 'vermelho' ? 'background:#f8d7da;color:#721c24;padding:8px;border-radius:6px;margin-bottom:6px;border:1px solid #f5c6cb;' : 'background:#fff3cd;color:#856404;padding:8px;border-radius:6px;margin-bottom:6px;border:1px solid #ffeeba;';
      alerta.innerHTML = `<strong>${categoria}:</strong> ${mensagem.replace(/\n/g,'<br>')}`;
      container.appendChild(alerta);
    }
  }
}

function configurarAlertasInstantaneos() {
  // Função para calcular meses entre datas (reutilizada)
  const calcularMeses = (dataString) => {
    if (!dataString) return 0;
    const partes = dataString.split('-');
    if (partes.length !== 3) return 0;
    const ano = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1;
    const dia = parseInt(partes[2], 10);
    const dataExame = new Date(ano, mes, dia);
    if (Number.isNaN(dataExame.getTime())) return 0;
    const hoje = new Date();
    let meses = (hoje.getFullYear() - dataExame.getFullYear()) * 12 + (hoje.getMonth() - dataExame.getMonth());
    if (hoje.getDate() < dataExame.getDate()) meses--;
    return meses;
  };

  function debounce(fn, wait = 250) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
  }

  function limparAlertasTopico10() {
    const container = document.getElementById('alertas_topico10');
    if (container) {
      // salva o conteúdo atual para possível restauração
      previousAlertasHTML = container.innerHTML;
      container.innerHTML = '';
    }
    // permitir que notificações voltem a aparecer após limpeza
    if (typeof shownNotificacoes !== 'undefined') shownNotificacoes.clear();
  }

  function avaliarAlarmesCombinados() {
    limparAlertasTopico10();
    const red = [];
    const yellow = [];

    const toNumber = (sel) => parseFloat(document.querySelector(sel)?.value || 0);

    const tgo = toNumber('input[name="lab_tgo_res"]');
    const tgp = toNumber('input[name="lab_tgp_res"]');
    const ggt = toNumber('input[name="lab_ggt_res"]');
    const biliTotal = toNumber('input[name="lab_bilirrubina_total_res"]') || toNumber('input[name="lab_bilirrubina_res"]');
    const biliDir = toNumber('input[name="lab_bilirrubina_direta_res"]');
    const biliIndir = toNumber('input[name="lab_bilirrubina_indireta_res"]');
    const psa = toNumber('input[name="lab_psa_total_res"]') || toNumber('input[name="psa_resultado"]');

    const tgoDate = document.querySelector('input[name="lab_tgo_data"]')?.value;
    const tgpDate = document.querySelector('input[name="lab_tgp_data"]')?.value;
    const ggtDate = document.querySelector('input[name="lab_ggt_data"]')?.value;
    const biliTotalDate = document.querySelector('input[name="lab_bilirrubina_total_data"]')?.value;
    const biliDirDate = document.querySelector('input[name="lab_bilirrubina_direta_data"]')?.value;
    const biliIndirDate = document.querySelector('input[name="lab_bilirrubina_indireta_data"]')?.value;
    const psaDate = document.querySelector('input[name="psa_data"]')?.value;
    const hepaticaDate = document.querySelector('input[name="hepatica_data"]')?.value;

    const identidade = document.querySelector('input[name="identidade"]:checked')?.value || '';
    // Map identity to GGT upper limit: male 48, female 32 (fallback female)
    const ggtUpper = identidade === 'homem_trans' ? 48 : 32;

    // Hormonoterapia detectada?
    const hormonio = (document.querySelector('input[name="tempo_hormonio"]')?.value || document.querySelector('input[name="med_hormonio_tempo"]')?.value || '').trim();
    const hormonioAtivo = hormonio.length > 0;

    // Critérios hepáticos (seguindo ReferenciaLiteratura.pdf) - mensagens separadas por parâmetro
    if (tgo && tgo > 120) red.push('TGO muito elevado (>120 U/L) — possível alteração hepática grave.');
    if (tgp && tgp > 168) red.push('TGP muito elevado (>168 U/L) — possível alteração hepática grave.');
    if (biliTotal && biliTotal > 2.0) red.push('Bilirrubina Total > 2.0 mg/dL — alteração hepática grave.');

    // Se não há alerta vermelho específico, verificar alterações leves
    if (red.length === 0) {
      if (tgo && tgo > 40) yellow.push('TGO > 40 U/L (elevação leve).');
      if (tgp && tgp > 56) yellow.push('TGP > 56 U/L (elevação leve).');
      if (ggt && ggt > ggtUpper) yellow.push(`GGT > ${ggtUpper} U/L (elevação leve).`);
      if (biliTotal && biliTotal > 1.2) yellow.push('Bilirrubina Total elevada (>1.2 mg/dL).');
      if (biliDir && biliDir > 0.3) yellow.push('Bilirrubina Direta elevada (>0.3 mg/dL).');
      if (biliIndir && biliIndir > 0.8) yellow.push('Bilirrubina Indireta elevada (>0.8 mg/dL).');
    }

    // Se hormonoterapia ativa e alguma alteração hepática leve, considerar alerta amarelo adicional
    if (hormonioAtivo && yellow.length > 0 && red.length === 0) {
      yellow.push('Monitorar mais frequentemente devido a hormonioterapia ativa.');
    }

    // PSA
    if (psa && psa > 10) red.push('PSA total > 10 ng/mL (Alerta vermelho).');
    else if (psa && psa > 4) yellow.push('PSA entre 4 e 10 ng/mL (Alerta amarelo).');

    // Preventivos: mamografia/papanicolau
    const mamaDate = document.querySelector('input[name="mamografia_data"]')?.value;
    if (mamaDate) {
      const meses = calcularMeses(mamaDate);
      if (meses >= 24) yellow.push('Mamografia de rastreamento em atraso (>24 meses).');
    }

    const papanicoDate = document.querySelector('input[name="papanicolau_data"]')?.value;
    if (papanicoDate) {
      const meses = calcularMeses(papanicoDate);
      if (meses >= 12) yellow.push('Papanicolau sem atualização nos últimos 12 meses.');
    }

    if (psaDate) {
      const meses = calcularMeses(psaDate);
      if (meses >= 12) yellow.push('PSA sem atualização nos últimos 12 meses.');
    }

    if (tgoDate) {
      const meses = calcularMeses(tgoDate);
      if (meses >= 6) yellow.push('TGO/TGP sem atualização nos últimos 6 meses.');
    } else if (hepaticaDate) {
      const meses = calcularMeses(hepaticaDate);
      if (meses >= 6) yellow.push('Avaliação hepática sem atualização nos últimos 6 meses.');
    }

    if (ggtDate) {
      const meses = calcularMeses(ggtDate);
      if (meses >= 6) yellow.push('GGT sem atualização nos últimos 6 meses.');
    }
    if (biliTotalDate) {
      const meses = calcularMeses(biliTotalDate);
      if (meses >= 6) yellow.push('Bilirrubina Total sem atualização nos últimos 6 meses.');
    }
    if (biliDirDate) {
      const meses = calcularMeses(biliDirDate);
      if (meses >= 6) yellow.push('Bilirrubina Direta sem atualização nos últimos 6 meses.');
    }
    if (biliIndirDate) {
      const meses = calcularMeses(biliIndirDate);
      if (meses >= 6) yellow.push('Bilirrubina Indireta sem atualização nos últimos 6 meses.');
    }

    const citologia = (document.querySelector('input[name="citologia_resultado"]')?.value || document.querySelector('input[name="papanicolau_resultado"]')?.value || '').toUpperCase();
    if (['ASC-US', 'LSIL', 'HSIL', 'NIC I', 'NIC II', 'NIC III'].includes(citologia)) {
      red.push('Resultado de citologia alterado (' + citologia + '): acompanhamento urgente.');
    }

    // Build aggregated message
    const container = document.getElementById('alertas_topico10');
    if (!container) return;

    if (red.length > 0) {
      // Se Bilirrubina Total gerou alerta vermelho, restaura alertas anteriores e adiciona o novo
      const hasBiliTotalRed = red.some(r => r.toLowerCase().includes('bilirrubina total'));
      if (hasBiliTotalRed && previousAlertasHTML) {
        container.innerHTML = previousAlertasHTML;
        previousAlertasHTML = '';
      }
      const msg = red.join(' / ') + (yellow.length > 0 ? ' / Observações adicionais: ' + yellow.join(' / ') : '');
      dispararAlerta('vermelho', msg, 'Tópico 10');
    } else if (yellow.length > 0) {
      const msg = yellow.join(' / ');
      dispararAlerta('amarelo', msg, 'Tópico 10');
    }
  }

  const debouncedAvaliar = debounce(avaliarAlarmesCombinados, 300);

  // Simples listener que chama a avaliação combinada quando campos mudarem
  document.addEventListener('change', function (e) {
    debouncedAvaliar();
  });
}