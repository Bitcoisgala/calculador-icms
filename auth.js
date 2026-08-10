const empresa = JSON.parse(
  localStorage.getItem('empresa')
)



/* BLOQUEIA ACESSO */

if (!empresa) {

  window.location.href = 'login.html'
}



/* MOSTRA NOME DA EMPRESA */

const nomeEmpresa =
  document.getElementById('empresaNome')

if (nomeEmpresa) {

  nomeEmpresa.innerText =
    empresa.razao_social
}



/* LOGOUT */

function logout() {

  localStorage.removeItem('empresa')

  localStorage.removeItem('usuario')

  window.location.href = 'login.html'
}