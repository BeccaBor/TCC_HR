
// folhaPagamento_sistema/frontend/public/js/folhaGestor.js
// Script para popular setores e colaboradores na página folhadepagamento

document.addEventListener('DOMContentLoaded', () => {
  const setoresContainer = document.getElementById('setores-list') || document.getElementById('lista-setores') || document.getElementById('setores-list');
  const tbody = document.getElementById('employees-tbody');
  const inputBusca = document.getElementById('input-busca') || document.querySelector('.glass-input');
  const statTotal = document.getElementById('stat-total-func');

  let colaboradores = []; // cache carregado do servidor

  // Helper: faz escape de texto para evitar XSS
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"'`]/g, (s) => {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' })[s];
    });
  }

  function formatCurrency(v) {
    if (v == null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v));
  }

  function initials(nome) {
    if (!nome) return '';
    return nome.split(' ').map(p => p[0]?.toUpperCase()).slice(0,2).join('');
  }

  // Busca setores do backend
  async function fetchSetores() {
    try {
      const res = await fetch('/api/gestor/setores', { credentials: 'same-origin' });
      const data = await res.json();
      const setores = Array.isArray(data) ? data : (data.setores || []);
      renderSetores(setores);
    } catch (err) {
      console.error('Erro ao buscar setores:', err);
      renderSetores([{ id: 0, nome_setor: 'Todos' }]);
    }
  }

  function renderSetores(setores) {
    if (!setoresContainer) return;
    setoresContainer.innerHTML = '';
    // garantir opção "Todos"
    const opcTodos = document.createElement('li');
    opcTodos.innerHTML = `<a href="#" data-setor="Todos" class="sidebar-link sidebar-link-active"><i class="bi bi-people"></i> Todos</a>`;
    setoresContainer.appendChild(opcTodos);

    setores.forEach(s => {
      const nome = s.nome_setor || s.nome || s.name || '';
      const li = document.createElement('li');
      li.innerHTML = `<a href="#" data-setor="${escapeHtml(nome)}" class="sidebar-link sidebar-link-default"><i class="bi bi-diagram-3"></i> ${escapeHtml(nome)}</a>`;
      setoresContainer.appendChild(li);
    });

    // listeners para filtro por setor
    setoresContainer.querySelectorAll('a[data-setor]').forEach(a => {
      a.addEventListener('click', async (ev) => {
        ev.preventDefault();
        // atualiza classe ativa
        setoresContainer.querySelectorAll('a').forEach(x => x.classList.remove('sidebar-link-active'));
        a.classList.add('sidebar-link-active');

        const setor = a.getAttribute('data-setor');
        await loadColaboradores(setor === 'Todos' ? null : setor);
      });
    });
  }

  // Busca colaboradores do backend (opcionalmente por setor)
  async function fetchColaboradores(setor = null) {
    try {
      const url = setor ? `/api/gestor/colaboradores?setor=${encodeURIComponent(setor)}` : '/api/gestor/colaboradores';
      const res = await fetch(url, { credentials: 'same-origin' });
      const data = await res.json();
      let rows = [];
      if (Array.isArray(data)) rows = data;
      else if (data.colaboradores) rows = data.colaboradores;
      else if (data.success && data.colaboradores) rows = data.colaboradores;
      else if (data.success && Array.isArray(data.data)) rows = data.data;
      else rows = data.rows || [];
      return rows;
    } catch (err) {
      console.error('Erro ao buscar colaboradores:', err);
      return [];
    }
  }

  // Carrega e renderiza colaboradores (com cache)
  async function loadColaboradores(setor = null) {
    colaboradores = await fetchColaboradores(setor);
    renderColaboradores(colaboradores);
    if (statTotal) statTotal.textContent = colaboradores.length;
  }

  // Renderiza linhas na tabela exatamente no formato requerido
  function renderColaboradores(list) {
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!list || list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="color: rgba(255,255,255,0.6);">Nenhum funcionário encontrado.</td></tr>`;
      return;
    }

    list.forEach(u => {
      const id = u.id || u.usuario_id || u.user_id;
      const nome = u.nome || u.name || '';
      const cargo = u.cargo || u.role || '';
      const salario = u.salario != null ? u.salario : (u.salario_bruto || 0);
      const status = u.status || (u.situacao ? u.situacao : 'Ativo');

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="d-flex align-items-center gap-3">
            <div class="employee-avatar">${escapeHtml(initials(nome))}</div>
            <span style="font-weight: 500;">${escapeHtml(nome)}</span>
          </div>
        </td>
        <td style="color: rgba(255,255,255,0.7);">${escapeHtml(cargo)}</td>
        <td style="font-weight: 500;">${formatCurrency(salario)}</td>
        <td><span class="status-badge ${escapeHtml(status.toLowerCase()).includes('férias') || escapeHtml(status.toLowerCase()).includes('ferias') ? 'status-vacation' : 'status-active'}">${escapeHtml(status)}</span></td>
        <td>
          <div class="d-flex gap-2">
            <button class="action-icon btn-view" data-userid="${id}" title="Ver"><i class="bi bi-eye"></i></button>
            <a href="/gestor/folhapaga?usuarioId=${id}">
              <button class="action-icon btn-edit" data-userid="${id}" title="Editar"><i class="bi bi-pencil"></i></button>
            </a>
            <button class="action-icon btn-delete" data-userid="${id}" title="Excluir"><i class="bi bi-trash"></i></button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // listeners: view (eye) - redireciona para página de visualização/edição ou modal
    tbody.querySelectorAll('.btn-view').forEach(b => {
      b.addEventListener('click', (ev) => {
        const id = ev.currentTarget.getAttribute('data-userid');
        window.location.href = `/gestor/folhapaga?usuarioId=${id}`;
      });
    });

    // delete (chama endpoint padrão /api/usuario/:id DELETE se existir)
    tbody.querySelectorAll('.btn-delete').forEach(b => {
      b.addEventListener('click', async (ev) => {
        const id = ev.currentTarget.getAttribute('data-userid');
        if (!confirm('Confirma exclusão deste colaborador?')) return;
        try {
          const resp = await fetch(`/api/usuario/${id}`, { method: 'DELETE', credentials: 'same-origin' });
          const json = await resp.json();
          if (json && (json.success || json.affectedRows)) {
            const activeSetorEl = setoresContainer?.querySelector('a.sidebar-link-active');
            const setor = activeSetorEl?.getAttribute('data-setor') || null;
            await loadColaboradores(setor === 'Todos' ? null : setor);
          } else {
            alert('Não foi possível excluir (verifique console).');
            console.warn('Resposta exclusão:', json);
          }
        } catch (err) {
          console.error('Erro ao excluir:', err);
          alert('Erro ao excluir colaborador.');
        }
      });
    });
  }

  // Filtro local por busca
  if (inputBusca) {
    inputBusca.addEventListener('input', (ev) => {
      const q = ev.target.value.trim().toLowerCase();
      if (!q) return renderColaboradores(colaboradores);
      const filtered = colaboradores.filter(u => {
        const nome = (u.nome || u.name || '').toLowerCase();
        const cargo = (u.cargo || u.role || '').toLowerCase();
        return nome.includes(q) || cargo.includes(q);
      });
      renderColaboradores(filtered);
    });
  }

  // inicial
  (async () => {
    await fetchSetores();
    await loadColaboradores(null); // carrega todos inicialmente
  })();
});
