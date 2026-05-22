function mudarPagina(numeroPagina) {
  // 1. Seleciona todas as páginas e remove a classe 'active'
  const paginas = document.querySelectorAll('.page');
  paginas.forEach(pagina => {
    pagina.classList.remove('active');
  });

  // 2. Seleciona todos os botões do menu lateral e remove a classe 'active'
  const botoes = document.querySelectorAll('.nav-btn');
  botoes.forEach(botao => {
    botao.classList.remove('active');
  });

  // 3. Adiciona a classe 'active' na página que queremos mostrar
  const paginaDesejada = document.getElementById('pagina' + numeroPagina);
  if (paginaDesejada) {
    paginaDesejada.classList.add('active');
  }

  // 4. Adiciona a classe 'active' no botão que foi clicado (baseado no índice)
  // O array de botões começa no índice 0, por isso usamos (numeroPagina - 1)
  if (botoes[numeroPagina - 1]) {
    botoes[numeroPagina - 1].classList.add('active');
  }
  
  // 5. Rola o conteúdo da tela de volta para o topo a cada troca de página
  document.querySelector('.content').scrollTop = 0;
}

const form = document.getElementById('prontuarioForm')

form.addEventListener('submit', async(event) => {
  event.preventDefault()
  const formData = new FormData(form)

  const dados = Object.fromEntries(formData.entries())
  console.log(dados)

  const resposta = await fetch('/', {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body:JSON.stringify(dados)
  })
  const resultado = await resposta.json()
  console.log(resultado)
})


// Redireciona para login se não tiver token
const token = localStorage.getItem('token');
if (!token) window.location.href = 'index.html';

// Exibe o nome do usuário logado no topbar
const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
const spanUsuario = document.querySelector('.user-info span');
if (spanUsuario && usuario.nome) spanUsuario.textContent = usuario.nome;

// Envia o formulário
document.getElementById('prontuarioForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const form    = e.target;
  const inputs  = form.querySelectorAll('input, textarea, select');
  const formData = {};

  inputs.forEach(input => {
    if (!input.name) return;
    if (input.type === 'radio') {
      if (input.checked) formData[input.name] = input.value;
    } else {
      formData[input.name] = input.value;
    }
  });

  // Campos fixos do banco
  const nome_social           = formData.nome_social;
  const identidade_genero     = formData.identidade || null;
  const data_consulta         = formData.data_consulta;
  const data_proxima_consulta = formData.data_proxima_consulta || null;

  if (!nome_social || !data_consulta) {
    alert('Nome social e data da consulta são obrigatórios.');
    return;
  }

  // Tudo vai dentro de dados como JSONB
  const payload = {
    nome_social,
    identidade_genero,
    data_consulta,
    data_proxima_consulta,
    dados: formData  // o form inteiro como JSON
  };

  try {
    const res = await fetch('/prontuarios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      alert('Erro ao salvar: ' + (data.erro || 'Erro desconhecido'));
      return;
    }

    alert('Prontuário salvo com sucesso!');
    form.reset();

  } catch (err) {
    alert('Erro de conexão com o servidor.');
    console.error(err);
  }
});