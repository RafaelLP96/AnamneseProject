// * ================ VERIFICAR AUTENTICAÇÃO ================ */
if (!localStorage.getItem('token')) {
  //window.location.href = 'index.html';
}

/* ================ VARIÁVEIS GLOBAIS ================ */
let menuAberto = false;
let usuarioLogado = localStorage.getItem('usuarioAtual') || localStorage.getItem('usuario')?.nome || 'Usuário';

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

function salvarFormulario(e) {
  e.preventDefault();
  
  const form = e.target;
  const formData = new FormData(form);
  const formObj = Object.fromEntries(formData.entries());
  
  formObj.id = Date.now().toString();
  formObj.dataCriacao = new Date().toISOString();
  formObj.pacienteNome = formObj.nome_social || formObj.nome_registro || 'Paciente sem nome';
  
  let formsSalvos = JSON.parse(localStorage.getItem('formularios_' + usuarioLogado) || '[]');
  formsSalvos.push(formObj);
  
  localStorage.setItem('formularios_' + usuarioLogado, JSON.stringify(formsSalvos));
  
  mostrarNotificacao('Prontuário salvo com sucesso!', 'sucesso');
  form.reset();
  const contentDiv = document.querySelector('.content');
  if (contentDiv) contentDiv.scrollTop = 0;
  mudarPagina(1);
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
          <div class="form-item-title">${form.pacienteNome}</div>
          <div class="form-item-date">Enviado em: ${formatarData(form.dataCriacao)}</div>
          <div class="form-item-status">Salvo</div>
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

function dispararAlerta(nivel, mensagem) {
  const prefixo = nivel === 'vermelho' ? '🔴 ALERTA VERMELHO:\n' : '🟡 ALERTA AMARELO:\n';
  setTimeout(() => alert(prefixo + mensagem), 100);
}

function configurarAlertasInstantaneos() {
  
  // Função para calcular meses entre datas
  const calcularMeses = (dataString) => {
    if (!dataString) return 0;

    // Parse manualmente para evitar diferenças de fuso horário em datas no formato yyyy-mm-dd
    const partes = dataString.split('-');
    if (partes.length !== 3) return 0;

    const ano = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1;
    const dia = parseInt(partes[2], 10);

    const dataExame = new Date(ano, mes, dia);
    if (Number.isNaN(dataExame.getTime())) return 0;

    const hoje = new Date();
    let meses = (hoje.getFullYear() - dataExame.getFullYear()) * 12 + (hoje.getMonth() - dataExame.getMonth());

    if (hoje.getDate() < dataExame.getDate()) {
      meses--;
    }
    return meses;
  };

  const verificarRegras = (e) => {
    const target = e.target;
    if (!target || !target.name) return;
    const name = target.name.toLowerCase();
    const value = target.value;

    // 1. MONITORAMENTO HEPÁTICO
    if (name.includes('tgo') || name.includes('tgp') || name.includes('ggt') || name.includes('bili')) {
      const inputs = {
        tgo: parseFloat(document.querySelector('input[name*="lab_tgo_res" i]')?.value || 0),
        tgp: parseFloat(document.querySelector('input[name*="lab_tgp_res" i]')?.value || 0),
        biliTotal: parseFloat(document.querySelector('input[name="lab_bilirrubina_res" i]')?.value || 0),
        biliDir: parseFloat(document.querySelector('input[name*="lab_bilirrubina_direta_res" i]')?.value || 0),
        biliIndir: parseFloat(document.querySelector('input[name*="lab_bilirrubina_indireta_res" i]')?.value || 0),
        ggt: parseFloat(document.querySelector('input[name*="lab_ggt_res" i]')?.value || 0)
      };

      // Alerta Vermelho: TGO/TGP > 3x o limite (assumindo >120 para TGO ou >168 para TGP) ou Bili Total > 2.0
      if (inputs.tgo > 120 || inputs.tgp > 168 || inputs.biliTotal > 2.0) {
        dispararAlerta('vermelho', 'Alteração Hepática Grave identificada!\nTGO/TGP > 3x limite ou Bilirrubina Total > 2.0 mg/dL.\nNecessária avaliação médica imediata.');
      }
      // Alerta Amarelo: Alteração leve
      else if (inputs.tgo > 40 || inputs.tgp > 56 || inputs.ggt > 32) {
        dispararAlerta('amarelo', 'Alteração leve de enzimas hepáticas detectada. Monitorar função hepática conforme protocolo de hormonioterapia.');
      }

      // Alertas independentes para Bilirrubina
      if (inputs.biliTotal > 1.2 && inputs.biliTotal <= 2.0) {
        dispararAlerta('amarelo', 'Bilirrubina Total elevada (> 1.2 mg/dL). Monitorar função hepática conforme protocolo de hormonioterapia.');
      }

      else if (inputs.biliTotal > 2.0) {
        dispararAlerta('vermelho', 'Bilirrubina Total elevada (> 2.0 mg/dL). alteração hepatica grave.');
      }

      if (inputs.biliDir > 0.3) {
        dispararAlerta('amarelo', 'Bilirrubina Direta elevada (> 0.3 mg/dL). Monitorar função hepática conforme protocolo de hormonioterapia.');
      }

      if (inputs.biliIndir > 0.8) {
        dispararAlerta('amarelo', 'Bilirrubina Indireta elevada (> 0.8 mg/dL). Monitorar função hepática conforme protocolo de hormonioterapia.');
      }
    }

    // 2. PREVENTIVOS (MAMOGRAFIA)
    if (name.includes('mamografia_data')) {
      const meses = calcularMeses(value);
      if (meses >= 24) {
        dispararAlerta('amarelo', 'Mamografia de rastreamento em atraso (> 24 meses).');
      }
    }

    // 3. PREVENTIVOS (PAPANICOLAU)
    if (name.includes('papanicolau_data')) {
      const meses = calcularMeses(value);
      if (meses >= 12) { // Alerta para ausência > 12 meses
        dispararAlerta('amarelo', 'Papanicolau preventivo sem atualização nos últimos 12 meses.');
      }
    }
    
    // Alerta de Resultados Anormais (Citologia)
    if (name.includes('citologia_resultado') || name.includes('papanicolau_resultado')) {
      const res = String(value).toUpperCase();
      if (['ASC-US', 'LSIL', 'HSIL', 'NIC I', 'NIC II', 'NIC III'].includes(res)) {
        dispararAlerta('vermelho', 'Resultado de citologia alterado (' + res + ').\nNecessita avaliação especializada urgente.');
      }
    }

    // 4. PSA
    if (name.includes('psa')) {
      const psaValue = parseFloat(value || 0);
      if (psaValue > 10.0) {
        dispararAlerta('vermelho', 'PSA Total > 10 ng/mL.\nAlteração prostática grave. Encaminhar para avaliação especializada.');
      } else if (psaValue > 4.0) {
        dispararAlerta('amarelo', 'PSA Total elevado entre 4 e 10 ng/mL. Necessita monitoramento.');
      }
    }
  };

  document.addEventListener('change', verificarRegras);
}