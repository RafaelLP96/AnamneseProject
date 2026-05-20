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