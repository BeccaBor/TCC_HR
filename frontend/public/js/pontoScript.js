document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formPonto');
  const tipoRegistroHidden = document.getElementById('tipo_registro');
  const horasHidden = document.getElementById('horas');
  const setorInput = document.getElementById('setor');
  const tipoUsuarioInput = document.getElementById('tipo_usuario');
  const listaUltimosPontos = document.getElementById('listaUltimosPontos');

  // Pop-up
  const overlay = document.getElementById('overlay');
  const abrirPopup = document.getElementById('abrirPopup');
  const fecharPopup = document.getElementById('fecharPopup');

  abrirPopup.addEventListener('click', () => overlay.style.display = 'flex');
  fecharPopup.addEventListener('click', () => overlay.style.display = 'none');
  window.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.style.display = 'none';
  });

  // Pegar token
  let token = localStorage.getItem('token') || sessionStorage.getItem('token');

  if (!token) {
    alert('Sessão expirada. Faça login novamente.');
    return;
  }

  let tipoUsuario = null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    tipoUsuario = payload.tipo_usuario?.toLowerCase() || payload.tipo?.toLowerCase();
    tipoUsuarioInput.value = tipoUsuario || 'colaborador';
  } catch {
    alert('Token inválido. Faça login novamente.');
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    return;
  }

  const baseUrl = tipoUsuario === 'gestor' ? '/gestor/ponto' : '/colaborador/ponto';

  // Função para carregar últimos pontos
  async function carregarUltimosPontos() {
    try {
      const res = await fetch(`${baseUrl}/ultimos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Não autorizado');

      const data = await res.json();
      listaUltimosPontos.innerHTML = '';

      if (!data.registros || data.registros.length === 0) {
        listaUltimosPontos.innerHTML = '<div class="placeholder">Sem registros ainda.</div>';
        return;
      }

      data.registros.forEach(r => {
        const div = document.createElement('div');
        div.textContent = `${r.tipo_registro} - ${r.horas}h - ${new Date(r.data_registro).toLocaleString()} - ${r.setor || ''}`;
        listaUltimosPontos.appendChild(div);
      });
    } catch (err) {
      console.error('Erro ao carregar últimos pontos:', err);
      listaUltimosPontos.innerHTML = '<div class="placeholder">Erro ao carregar registros.</div>';
    }
  }

  // Função para gerenciar seleção de botão
  function ativarBotao(grupoClass, hiddenInput) {
    const botoes = document.querySelectorAll(`.${grupoClass}`);
    botoes.forEach(btn => {
      btn.addEventListener('click', () => {
        botoes.forEach(b => b.classList.remove('ativo'));
        btn.classList.add('ativo');

        // Atualiza valor do input hidden
        if (grupoClass === 'tipo-btn') {
          hiddenInput.value = btn.textContent.trim();
        } else if (grupoClass === 'hora-btn') {
          hiddenInput.value = btn.textContent.trim().split(' ')[0];
        }
      });
    });
  }

  ativarBotao('tipo-btn', tipoRegistroHidden);
  ativarBotao('hora-btn', horasHidden);

  // Submit do formulário
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const tipo_registro = tipoRegistroHidden.value;
    const horas = horasHidden.value;
    const setor = setorInput.value;

    if (!tipo_registro || !horas || !setor) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }

    try {
      const res = await fetch(`${baseUrl}/marcar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tipo_registro, horas, setor })
      });

      if (!res.ok) throw new Error('Não autorizado');

      const data = await res.json();
      alert('Ponto registrado com sucesso!');

      // Reset formulário e botões ativos
      form.reset();
      document.querySelectorAll('.tipo-btn, .hora-btn').forEach(btn => btn.classList.remove('ativo'));

      overlay.style.display = 'none';
      carregarUltimosPontos();
    } catch (err) {
      console.error(err);
      alert('Erro ao registrar ponto.');
    }
  });

  carregarUltimosPontos();
});
