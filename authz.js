/* ===================================================================
   authz.js  —  ADICIONADO

   Camada de identificação do usuário logado (admin / funcionario) e
   de verificação de permissões no frontend.

   NÃO substitui auth.js. auth.js continua responsável por bloquear
   páginas quando não existe 'empresa' no localStorage. Este arquivo
   apenas adiciona a distinção entre tipos de usuário em cima dessa
   estrutura já existente.

   IMPORTANTE: estas funções servem para controlar a INTERFACE
   (mostrar/esconder botões, redirecionar telas). Elas NÃO são o
   mecanismo de segurança real — a autorização de verdade é garantida
   pelas policies e triggers adicionados em controle_acesso_migration.sql.
   =================================================================== */

function getUsuarioAtual() {
  try {
    return JSON.parse(localStorage.getItem('usuario'))
  } catch (e) {
    return null
  }
}

function getEmpresaAtual() {
  try {
    return JSON.parse(localStorage.getItem('empresa'))
  } catch (e) {
    return null
  }
}

function isAuthenticated() {
  return !!getEmpresaAtual()
}

function isAdmin() {
  const usuario = getUsuarioAtual()
  return !!usuario && usuario.tipo === 'admin'
}

function isFuncionario() {
  const usuario = getUsuarioAtual()
  return !!usuario && usuario.tipo === 'funcionario'
}

function canManageEmployees() {
  return isAdmin()
}

function canAccessAdmin() {
  return isAdmin()
}

/* Bloqueia páginas marcadas como administrativas.
   Uma página vira "administrativa" adicionando ao <body>:
   <body data-admin-only="true">
   Funcionário que tentar abrir a URL diretamente é redirecionado. */
function protegerPaginaAdmin() {
  const precisaAdmin =
    document.body && document.body.dataset.adminOnly === 'true'

  if (!precisaAdmin) return

  if (!isAuthenticated()) {
    window.location.href = 'login.html'
    return
  }

  if (!isAdmin()) {
    alert('Você não possui permissão para acessar esta página.')
    window.location.href = 'index-novo.html'
  }
}

/* Mostra/esconde elementos marcados com data-requires-admin="true"
   conforme o tipo do usuário logado (ex.: link "Funcionários" no menu). */
function aplicarVisibilidadeAdmin() {
  const elementos = document.querySelectorAll('[data-requires-admin="true"]')
  elementos.forEach(function (el) {
    el.style.display = isAdmin() ? '' : 'none'
  })
}

protegerPaginaAdmin()
document.addEventListener('DOMContentLoaded', aplicarVisibilidadeAdmin)
