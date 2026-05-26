// ================ VERIFICAR AUTENTICAÇÃO ================
if (!localStorage.getItem('token')) {
  // Usuário não autenticado, redirecionar
  // window.location.href = 'index.html';
}

// ================ VARIÁVEIS GLOBAIS ================
let menuAberto = false;
let usuarioLogado = localStorage.getItem('usuarioAtual') || JSON.parse(localStorage.getItem('usuario') || '{}')?.nome || 'Usuário';
let shownNotificacoes = new Set();

// ================ OBTER TOKEN ================
function obterToken() {
  return localStorage.getItem('token');
}

// ================ INICIALIZAÇÃO ================
document.addEventListener('DOMContentLoaded', function() {
  atualizarNomeUsuario();

  const menuToggle = document.getElementById('menuToggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', toggleMenu);
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

  // Fechar modal ao clicar fora
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

  // Carregar para edição apenas após a página terminar de inicializar
  const params = new URLSearchParams(window.location.search);
  const editId = params.get('id');
  if (editId) {
    carregarProntuarioParaEdicao(editId);
  }

  // Configurar alertas automáticos
  configurarAlertasInstantaneos();
});

// ================ NOTIFICAÇÕES ================
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

// ================ TOGGLE DO MENU ================
function toggleMenu() {
  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menuToggle');
  
  if(!sidebar || !menuToggle) return;
  
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

// ================ MUDAR DE PÁGINA ================
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

// ================ ATUALIZAR NOME DO USUÁRIO ================
function atualizarNomeUsuario() {
  const nomeElement = document.getElementById('usuarioNome');
  if (nomeElement) {
    nomeElement.textContent = usuarioLogado;
  }
}

// ================ FORMATAR DATA ================
function formatarData(dataISO) {
  const data = new Date(dataISO);
  return data.toLocaleDateString('pt-BR') + ' às ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// ================ SALVAR FORMULÁRIO ================
async function salvarFormulario(e) {
  e.preventDefault();

  const token = obterToken();
  const form = e.target;
  const formData = new FormData(form);

  // Build dados object
  const dados = {};
  const numericKeys = [
    'mamas_resultado', 'mamografia_resultado', 'papanicolau_resultado', 'psa_resultado',
    'hepatica_resultado', 'lab_tgo_res', 'lab_tgp_res', 'lab_ggt_res',
    'lab_bilirrubina_total_res', 'lab_bilirrubina_direta_res', 'lab_bilirrubina_indireta_res',
    'lab_psa_total_res', 'lab_psa_livre_perc'
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

  // Agrupar pares data/resultado
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
    const isUpdate = !!editingId;
    const endpoint = isUpdate ? `${window.location.origin}/prontuarios/${editingId}` : `${window.location.origin}/prontuarios`;
    const method = isUpdate ? 'PUT' : 'POST';
    const res = await fetch(endpoint, {
      method,
      headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: `Bearer ${token}` } : {}),
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.erro || 'Erro ao salvar prontuário no servidor');
    }

    const prontuario = await res.json();

    // Fazer upload de todas as fotos encontradas no formulário
    try {
      const fileInputs = form.querySelectorAll('input[type="file"]');
      for (const input of fileInputs) {
        for (let i = 0; i < input.files.length; i++) {
          const file = input.files[i];
          const uploadForm = new FormData();
          uploadForm.append('foto', file);
          // enviar nome do campo como descrição para facilitar identificação
          uploadForm.append('descricao', input.name || 'foto');

          const upRes = await fetch(`${window.location.origin}/prontuarios/${prontuario.id}/fotos`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: uploadForm
          });

          if (!upRes.ok) {
            console.warn('Upload da foto falhou para', input.name, file.name);
          }
        }
      }
    } catch (err) {
      console.warn('Erro ao enviar fotos:', err);
    }

    if (isUpdate) {
      mostrarNotificacao('Prontuário atualizado com sucesso.', 'sucesso');
      // limpar estado de edição e remover id da URL para evitar confusão
      editingId = null;
      try { history.replaceState(null, '', window.location.pathname); } catch (e) {}
    } else {
      mostrarNotificacao('Prontuário enviado com sucesso.', 'sucesso');
    }

    form.reset();
    const contentDiv = document.querySelector('.content');
    if (contentDiv) contentDiv.scrollTop = 0;
    mudarPagina(1);
  } catch (err) {
    console.error(err);
    mostrarNotificacao(err.message || 'Erro ao enviar formulário.', 'erro');
  }
}

// ================ LISTAR FORMULÁRIOS ENVIADOS ================
async function mostrarFormulariosEnviados() {
  const modal = document.getElementById('formsModal');
  const modalBody = document.getElementById('formsModalBody');
  
  if (!modal || !modalBody) return;

  modal.style.display = 'flex';
  modalBody.innerHTML = '<div class="loading">Carregando seus formulários...</div>';

  try {
    const token = obterToken();
    console.log('Carregando prontuários com token:', token ? 'Sim' : 'Não');
    
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const resposta = await fetch('/prontuarios', { method: 'GET', headers });

    console.log('Status da resposta:', resposta.status);
    
    const prontuarios = await resposta.json();
    console.log('Prontuários recebidos:', prontuarios);

    if (!resposta.ok) {
      throw new Error(prontuarios.erro || `Erro ${resposta.status}`);
    }

    if (!Array.isArray(prontuarios) || prontuarios.length === 0) {
      modalBody.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 40px; color: #999;">
          <p>Nenhum formulário salvo ainda.</p>
          <p style="font-size: 12px; margin-top: 5px;">Os formulários que você preencher aparecerão aqui.</p>
        </div>
      `;
      return;
    }

    let html = '<div class="forms-list">';
    prontuarios.forEach(p => {
      const dataConsulta = new Date(p.data_consulta).toLocaleDateString('pt-BR');
      const dataProxima = p.data_proxima_consulta ? new Date(p.data_proxima_consulta).toLocaleDateString('pt-BR') : '—';
      const dataCriacao = new Date(p.criado_em).toLocaleDateString('pt-BR');
      
      html += `
        <div class="form-item" data-id="${p.id}" style="border: 1px solid #ddd; border-radius: 6px; padding: 15px; margin-bottom: 10px;">
          <div class="form-item-header" style="display: flex; justify-content: space-between; align-items: center;">
            <div class="form-item-info">
              <div class="form-item-title" data-id="${p.id}" style="font-weight: bold; color: #0163a1;">${p.nome_social}</div>
              <div class="form-item-date" style="font-size: 12px; color: #999;">Consulta: ${dataConsulta}</div>
              <div class="form-item-date" style="font-size: 12px; color: #999;">Próxima: ${dataProxima}</div>
              <div class="form-item-date" style="font-size: 12px; color: #999;">Salvo em: ${dataCriacao}</div>
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
              <div class="form-item-identity" style="text-align: right; font-size: 12px; color: #666; margin-right:8px;">
                ${p.identidade_genero ? `<div>${p.identidade_genero}</div>` : ''}
              </div>
              <div class="form-item-actions">
                <button class="form-action-btn print-btn" data-id="${p.id}" title="Imprimir">🖨️</button>
                <button class="form-action-btn pdf-btn" data-id="${p.id}" title="Baixar PDF">📄</button>
                <button class="form-action-btn delete-btn" data-id="${p.id}" title="Excluir">🗑️</button>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';
    modalBody.innerHTML = html;

    // adicionar click nos títulos para abrir no formulário para edição
    modalBody.querySelectorAll('.form-item-title').forEach(el => {
      el.style.cursor = 'pointer';
      el.addEventListener('click', (e) => {
        const id = el.dataset.id;
        if (id) window.location.href = `/formulario.html?id=${id}`;
      });
    });

    // adicionar handlers para os botões de ação
    modalBody.querySelectorAll('.print-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        try {
          const token = obterToken();
          const res = await fetch(`/prontuarios/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
          if (!res.ok) throw new Error('Não foi possível obter prontuário');
          const data = await res.json();
          // abrir visualização amigável em nova aba para impressão
          const win = window.open(`/visualizacao.html?id=${id}`, '_blank');
          if (!win) { mostrarNotificacao('Bloqueador de popups impediu a abertura da visualização.', 'erro'); return; }
        } catch (err) {
          console.error(err);
          mostrarNotificacao('Erro ao preparar impressão.', 'erro');
        }
      });
    });

    modalBody.querySelectorAll('.pdf-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        try {
          const token = obterToken();
          const res = await fetch(`/prontuarios/${id}/pdf`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
          if (!res.ok) throw new Error('Não foi possível obter PDF');
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `prontuario-${id}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        } catch (err) {
          console.error(err);
          mostrarNotificacao('Erro ao gerar PDF.', 'erro');
        }
      });
    });

    modalBody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        if (!confirm('Excluir este prontuário? Esta ação não pode ser desfeita.')) return;
        try {
          const token = obterToken();
          const res = await fetch(`/prontuarios/${id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} });
          if (!res.ok) throw new Error('Falha ao excluir');
          // remover elemento do DOM
          const el = modalBody.querySelector(`.form-item[data-id="${id}"]`);
          if (el) el.remove();
          mostrarNotificacao('Prontuário excluído.', 'sucesso');
        } catch (err) {
          console.error(err);
          mostrarNotificacao('Erro ao excluir prontuário.', 'erro');
        }
      });
    });
  } catch (erro) {
    console.error('Erro completo:', erro);
    modalBody.innerHTML = `<p style="color: red; text-align: center;">Erro ao carregar formulários: ${erro.message}</p>`;
  }

  if (window.innerWidth <= 768) {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    if(sidebar) sidebar.classList.remove('open');
    if(menuToggle) menuToggle.classList.remove('active');
    menuAberto = false;
  }
}

// ================ FECHAR MODAL ================
function fecharFormulariosEnviados() {
  const modal = document.getElementById('formsModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// ================ LOGOUT ================
function fazerLogout() {
  if (confirm('Tem certeza que deseja sair do sistema?')) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    
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

// ================ ALERTAS AUTOMÁTICOS ================
let previousAlertasHTML = '';

function dispararAlerta(nivel, mensagem, categoria) {
  const tipo = nivel === 'vermelho' ? 'erro' : 'info';
  const chave = `${nivel}:${mensagem}`;
  
  if (!shownNotificacoes.has(chave)) {
    mostrarNotificacao(mensagem.replace(/\n/g, '<br>'), tipo);
    shownNotificacoes.add(chave);
  }

  if (categoria) {
    const container = document.getElementById('alertas_topico10');
    if (container) {
      const alerta = document.createElement('div');
      alerta.className = `inline-alert inline-alert-${nivel}`;
      alerta.style.cssText = nivel === 'vermelho' ? 
        'background:#f8d7da;color:#721c24;padding:8px;border-radius:6px;margin-bottom:6px;border:1px solid #f5c6cb;' : 
        'background:#fff3cd;color:#856404;padding:8px;border-radius:6px;margin-bottom:6px;border:1px solid #ffeeba;';
      alerta.innerHTML = `<strong>${categoria}:</strong> ${mensagem.replace(/\n/g,'<br>')}`;
      container.appendChild(alerta);
    }
  }
}

function configurarAlertasInstantaneos() {
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
      previousAlertasHTML = container.innerHTML;
      container.innerHTML = '';
    }
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
    const psa = toNumber('input[name="lab_psa_total_res"]') || toNumber('input[name="psa_resultado"]');

    const identidade = document.querySelector('input[name="identidade"]:checked')?.value || '';
    const ggtUpper = identidade === 'homem_trans' ? 48 : 32;

    const hormonio = (document.querySelector('input[name="tempo_hormonio"]')?.value || document.querySelector('input[name="med_hormonio_tempo"]')?.value || '').trim();
    const hormonioAtivo = hormonio.length > 0;

    // Critérios hepáticos
    if (tgo && tgo > 120) red.push('TGO muito elevado (>120 U/L) — possível alteração hepática grave.');
    if (tgp && tgp > 168) red.push('TGP muito elevado (>168 U/L) — possível alteração hepática grave.');
    if (biliTotal && biliTotal > 2.0) red.push('Bilirrubina Total > 2.0 mg/dL — alteração hepática grave.');

    if (red.length === 0) {
      if (tgo && tgo > 40) yellow.push('TGO > 40 U/L (elevação leve).');
      if (tgp && tgp > 56) yellow.push('TGP > 56 U/L (elevação leve).');
      if (ggt && ggt > ggtUpper) yellow.push(`GGT > ${ggtUpper} U/L (elevação leve).`);
      if (biliTotal && biliTotal > 1.2) yellow.push('Bilirrubina Total elevada (>1.2 mg/dL).');
    }

    if (hormonioAtivo && yellow.length > 0 && red.length === 0) {
      yellow.push('Monitorar mais frequentemente devido a hormonioterapia ativa.');
    }

    // PSA
    if (psa && psa > 10) red.push('PSA total > 10 ng/mL (Alerta vermelho).');
    else if (psa && psa > 4) yellow.push('PSA entre 4 e 10 ng/mL (Alerta amarelo).');

    const container = document.getElementById('alertas_topico10');
    if (!container) return;

    if (red.length > 0) {
      const msg = red.join(' / ') + (yellow.length > 0 ? ' / Observações adicionais: ' + yellow.join(' / ') : '');
      dispararAlerta('vermelho', msg, 'Tópico 10');
    } else if (yellow.length > 0) {
      const msg = yellow.join(' / ');
      dispararAlerta('amarelo', msg, 'Tópico 10');
    }
  }

  const debouncedAvaliar = debounce(avaliarAlarmesCombinados, 300);
  document.addEventListener('change', function (e) {
    debouncedAvaliar();
  });
}
async function baixarPDF() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const token = obterToken();

  try {
    const res = await fetch(`/prontuarios/${id}/pdf`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Falha ao gerar PDF');

    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `prontuario-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

  } catch (err) {
    alert('Erro ao baixar PDF: ' + err.message);
  }
}

let editingId = null;

async function carregarProntuarioParaEdicao(id) {
  try {
    const token = obterToken();
    const res = await fetch(`/prontuarios/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) throw new Error('Não foi possível obter prontuário para edição');
    const data = await res.json();

    editingId = id;
    console.log('carregarProntuarioParaEdicao: editingId set to', editingId);

    const form = document.getElementById('prontuarioForm');
    if (!form) return;

    // Preencher campos simples
    form.querySelector('[name="nome_social"]').value = data.nome_social || '';
    if (form.querySelector('[name="nome_civil"]')) form.querySelector('[name="nome_civil"]').value = data.dados?.nome_civil || '';
    if (form.querySelector('[name="pronome"]')) form.querySelector('[name="pronome"]').value = data.dados?.pronome || '';
    if (form.querySelector('[name="identidade"]')) {
      const radios = form.querySelectorAll('[name="identidade"]');
      radios.forEach(r => { r.checked = (data.identidade_genero === r.value || data.dados?.identidade === r.value); });
    }
    if (form.querySelector('[name="idade"]')) form.querySelector('[name="idade"]').value = data.dados?.idade || '';
    if (form.querySelector('[name="contato"]')) form.querySelector('[name="contato"]').value = data.dados?.contato || '';
    if (form.querySelector('[name="profissional"]')) form.querySelector('[name="profissional"]').value = data.dados?.profissional || '';
    if (form.querySelector('[name="data_consulta"]')) form.querySelector('[name="data_consulta"]').value = data.data_consulta ? new Date(data.data_consulta).toISOString().slice(0,10) : '';
    if (form.querySelector('[name="data_proxima_consulta"]')) form.querySelector('[name="data_proxima_consulta"]').value = data.data_proxima_consulta ? new Date(data.data_proxima_consulta).toISOString().slice(0,10) : '';

    // Campos de texto maiores
    if (form.querySelector('[name="queixa_principal"]')) form.querySelector('[name="queixa_principal"]').value = data.dados?.queixa_principal || '';
    if (form.querySelector('[name="hda"]')) form.querySelector('[name="hda"]').value = data.dados?.hda || '';
    if (form.querySelector('[name="tempo_hormonio"]')) form.querySelector('[name="tempo_hormonio"]').value = data.dados?.tempo_hormonio || '';

    // alterar texto do botão enviar
    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Atualizar prontuário';

    console.log('Prontuário carregado para edição:', id);
    mostrarNotificacao('Prontuário carregado para edição.', 'sucesso');

  } catch (err) {
    console.error('Erro ao carregar prontuário para edição:', err);
    mostrarNotificacao('Não foi possível carregar prontuário para edição.', 'erro');
  }
}