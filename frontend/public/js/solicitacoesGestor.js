// backend/public/js/solicitacoesGestor.js  (substitua seu arquivo atual por este)
(() => {
  const API_BASE = (typeof BACKEND_URL !== 'undefined' && BACKEND_URL) ? BACKEND_URL : '';

  const ENDPOINT_SOLICITACOES = API_BASE + '/api/solicitacoes';
  const ENDPOINT_ANEXO = API_BASE + '/api/solicitacoes/anexo/'; // + filename
  const CURRENT_USER_ENDPOINTS = [
    API_BASE + '/api/usuario/me',
    API_BASE + '/api/user/me',
    API_BASE + '/api/auth/me',
    '/api/usuario/me',
    '/api/user/me',
    '/api/auth/me'
  ];
  const SETORES_ENDPOINTS = [
    API_BASE + '/api/setores',
    API_BASE + '/api/setores/all',
    API_BASE + '/api/setores/list',
    API_BASE + '/api/empresa/setores',
    API_BASE + '/api/solicitacoes/setores',
    '/api/setores'
  ];
  const COLABORADORES_ENDPOINTS = [
    API_BASE + '/api/usuarios?tipo_usuario=colaborador',
    API_BASE + '/api/usuarios?role=colaborador',
    API_BASE + '/api/usuarios',
    API_BASE + '/api/usuarios/por-gestor',
    API_BASE + '/api/gestor/usuarios',
    API_BASE + '/api/solicitacoes/colaboradores',
    '/api/usuarios'
  ];

  // DOM
  const setoresWrapper = document.getElementById('setoresWrapper');
  const buscaInput = document.getElementById('buscaSolicitacoes');
  const filtrosBtns = document.querySelectorAll('.filtro-btn');
  const btnRefresh = document.getElementById('btnRefreshSolicitacoes');
  const setorFiltersWrap = document.getElementById('setorFilters');
  const btnToggleView = document.getElementById('btnToggleView');
const token = getTokenFromStorage();

  // state
  let CURRENT_USER = null;
  let ALL_SOLICITACOES = []; // raw normalized solicitations BEFORE client filtering
  let VISIBLE_SOLICITACOES = []; // after applying gestor filter
  let AVAILABLE_SETORES = []; // strings
  let AVAILABLE_COLABORADORES = []; // normalized colaboradores
  let CURRENT_STATUS_FILTER = 'all';
  let CURRENT_TEXT_FILTER = '';
  let CURRENT_SETOR_FILTER = null;
  let VIEW_MODE = 'cards'; // 'cards' | 'list'

  // ---------- Helper fetch util ----------
  function getTokenFromStorage() {
  try {
    const t = localStorage.getItem('token');
    if (t) {
      console.debug('[DEBUG] token encontrado em localStorage (primeiros 8 chars):', String(t).slice(0,8) + '…');
    } else {
      console.debug('[DEBUG] token NÃO encontrado em localStorage');
    }
    return t;
  } catch (e) {
    console.debug('[DEBUG] getTokenFromStorage erro', e && e.message);
    return null;
  }
}


  // ---------- Helper fetch util (aceita string ou array de URLs; retorna JSON ou null) ----------
async function tryFetchJson(urlOrArray, opts = {}) {
  const urls = Array.isArray(urlOrArray) ? urlOrArray : [urlOrArray];
  let lastErr = null;
  const token = getTokenFromStorage();

  // construir headers reutilizáveis (merge)
  const baseHeaders = Object.assign({}, opts.headers || {});
  if (token) baseHeaders['Authorization'] = `Bearer ${token}`;

  for (const url of urls) {
    try {
      const res = await fetch(url, Object.assign({ credentials: 'include', headers: baseHeaders }, opts));
      // ler texto de resposta para debug caso não ok
      const text = await res.text();
      let parsed = null;
      try { parsed = text ? JSON.parse(text) : null; } catch (e) { /* não-JSON */ }

      if (!res.ok) {
        const msg = (parsed && (parsed.message || parsed.erro || parsed.error)) || text || `status ${res.status}`;
        lastErr = new Error(`(${res.status}) ${msg} — ${url}`);
        console.debug(`tryFetchJson: resposta não ok ${res.status} -> ${url}`, msg, parsed);
        continue; // tenta próximo fallback
      }

      // sucesso
      if (parsed !== null) {
        console.debug(`tryFetchJson: sucesso JSON em ${url}`);
        return parsed;
      }
      // se body vazio ou não-JSON, retornar texto (caller decide)
      console.debug(`tryFetchJson: sucesso (não-JSON) em ${url}`);
      return text;
    } catch (err) {
      lastErr = err;
      console.debug(`tryFetchJson: falha fetch em ${url}:`, err && err.message);
      continue;
    }
  }
  if (lastErr) throw lastErr;
  return null;
}
  // ---------- Fetch solicitações (usa fallbacks e tolera 404) ----------
async function fetchSolicitacoes(setor = null) {
  if (setoresWrapper) setoresWrapper.setAttribute('aria-busy', 'true');

  try {
    // candidates: tenta várias variações (com e sem API_BASE / nomes alternativos)
    const baseCandidates = [
      (API_BASE ? (API_BASE + '/api/solicitacoes') : '/api/solicitacoes'),
      (API_BASE ? (API_BASE + '/solicitacoes') : '/solicitacoes'),
      (API_BASE ? (API_BASE + '/api/realizarsolicitacoes') : '/api/realizarsolicitacoes'),
      '/api/realizarsolicitacoes',
      '/api/solicitacoes/',
      '/solicitacoes/',
      '/api/realizar-solicitacoes'
    ];

    // montar query string (apenas para a primeira candidate)
    const qs = [];
    if (setor) qs.push('setor=' + encodeURIComponent(setor));
    if (CURRENT_USER && CURRENT_USER.id) qs.push('gestor_id=' + encodeURIComponent(CURRENT_USER.id));
    if (CURRENT_USER && CURRENT_USER.cnpj) qs.push('cnpj=' + encodeURIComponent(CURRENT_USER.cnpj));
    const primary = qs.length ? `${baseCandidates[0]}?${qs.join('&')}` : baseCandidates[0];

    // criar lista priorizada (primary first)
    const urlsToTry = [primary].concat(baseCandidates.filter(u => u !== baseCandidates[0]));

    const json = await tryFetchJson(urlsToTry);
    let rows = null;
    if (Array.isArray(json)) rows = json;
    else if (Array.isArray(json.solicitacoes)) rows = json.solicitacoes;
    else if (Array.isArray(json.rows)) rows = json.rows;
    else if (Array.isArray(json.data)) rows = json.data;
    else if (Array.isArray(json.items)) rows = json.items;
    else if (json && Array.isArray(json.result)) rows = json.result;

    if (!rows) {
      console.warn('fetchSolicitacoes: resposta recebida mas não contém lista reconhecível. Conteúdo:', json);
      rows = [];
    }

    ALL_SOLICITACOES = rows.map(normalizeSolic).filter(Boolean);
    VISIBLE_SOLICITACOES = filterSolicitacoesForGestor(ALL_SOLICITACOES);

    if (!AVAILABLE_COLABORADORES.length) await fetchColaboradores().catch(()=>{});
    if (!AVAILABLE_SETORES.length) await fetchSetores().catch(()=>{});
  } catch (err) {
    console.error('Erro ao buscar solicitações (nenhum endpoint disponível):', err && err.message ? err.message : err);
    ALL_SOLICITACOES = [];
    VISIBLE_SOLICITACOES = [];
  } finally {
    if (setoresWrapper) setoresWrapper.setAttribute('aria-busy', 'false');
  }

  buildSetorFilters();
  renderAll();
}

  // ---------- Fetch current user (gestor) ----------
  async function fetchCurrentUser() {
    for (const url of CURRENT_USER_ENDPOINTS) {
      try {
        const json = await tryFetchJson(url);
        const candidate = (json && (json.usuario || json.user || json)) ? (json.usuario || json.user || json) : null;
        if (candidate && (candidate.id || candidate.usuario_id || candidate.user_id)) {
          CURRENT_USER = normalizeUser(candidate);
          console.debug('usuario logado encontrado via', url, CURRENT_USER);
          return CURRENT_USER;
        }
      } catch (err) {
        continue;
      }
    }
    console.warn('Não foi possível obter usuário logado via endpoints conhecidos.');
    return null;
  }

  function normalizeUser(u) {
    if (!u) return null;
    return {
      id: u.id || u.usuario_id || u.user_id || null,
      nome: u.nome || u.name || u.fullname || '',
      email: u.email || u.login || '',
      tipo_usuario: (u.tipo_usuario || u.type || u.role || '').toString().toLowerCase(),
      setor: u.setor || u.setor_nome || '',
      cargo: u.cargo || '',
      foto: u.foto ? `/uploads/${u.foto}` : '/img/fundofoda.png',
      cnpj: u.cnpj || u.empresa_cnpj || (u.empresa && u.empresa.cnpj) || null,
      empresa_id: u.empresa_id || u.company_id || null
    };
  }

  // ---------- Fetch colaboradores ----------
  async function fetchColaboradores() {
    const tried = new Set();
    for (const raw of COLABORADORES_ENDPOINTS) {
      let url = raw;
      // tentar passar gestor_id quando disponível (alguns endpoints aceitam)
      if (CURRENT_USER && CURRENT_USER.id) {
        if (!url.includes('?')) url = `${url}?gestor=${encodeURIComponent(CURRENT_USER.id)}`;
        else url = `${url}&gestor=${encodeURIComponent(CURRENT_USER.id)}`;
      }
      if (tried.has(url)) continue;
      tried.add(url);

      try {
        const json = await tryFetchJson(url);
        let rows = null;
        if (Array.isArray(json)) rows = json;
        else if (Array.isArray(json.rows)) rows = json.rows;
        else if (Array.isArray(json.data)) rows = json.data;
        else if (Array.isArray(json.users)) rows = json.users;
        else if (Array.isArray(json.usuarios)) rows = json.usuarios;
        else if (Array.isArray(json.items)) rows = json.items;

        if (!rows) continue;
        const cols = rows.map(normalizeColaborador).filter(Boolean);
        if (cols.length) {
          AVAILABLE_COLABORADORES = dedupeById(cols);
          AVAILABLE_SETORES = Array.from(new Set(AVAILABLE_COLABORADORES.map(c => c.setor).filter(Boolean))).sort((a,b)=>a.localeCompare(b));
          buildSetorFilters();
          console.debug('colaboradores carregados via', url);
          return AVAILABLE_COLABORADORES;
        }
      } catch (err) {
        continue;
      }
    }

    // fallback: derive colaboradores a partir de solicitações já carregadas
    const mapa = {};
    ALL_SOLICITACOES.forEach(s => {
      if (s && s.colaborador && s.colaborador.id) mapa[s.colaborador.id] = s.colaborador;
    });
    AVAILABLE_COLABORADORES = Object.values(mapa);
    AVAILABLE_SETORES = Array.from(new Set(AVAILABLE_COLABORADORES.map(c => c.setor).filter(Boolean))).sort((a,b)=>a.localeCompare(b));
    buildSetorFilters();
    return AVAILABLE_COLABORADORES;
  }

  function normalizeColaborador(c) {
    if (!c) return null;
    const id = c.id || c.usuario_id || c.user_id || null;
    return {
      id,
      nome: c.nome || c.name || c.fullname || c.nome_completo || '',
      cargo: c.cargo || c.position || '',
      setor: c.setor || c.setor_nome || c.department || '',
      email: c.email || '',
     foto: c.foto ? `/uploads/${c.foto}` : '/img/fundofoda.png',
      cnpj: c.cnpj || c.usuario_cnpj || c.cnpj_empresa || null
    };
  }

  function dedupeById(arr) { const map = {}; arr.forEach(a => { if (a && a.id) map[a.id] = a; }); return Object.values(map); }

  // ---------- Fetch setores ----------
  async function fetchSetores() {
    for (const url of SETORES_ENDPOINTS) {
      try {
        const json = await tryFetchJson(url);
        let rows = null;
        if (Array.isArray(json)) rows = json;
        else if (Array.isArray(json.setores)) rows = json.setores;
        else if (Array.isArray(json.rows)) rows = json.rows;
        else if (Array.isArray(json.data)) rows = json.data;
        else if (Array.isArray(json.items)) rows = json.items;
        if (!rows) continue;

        const setores = rows.map(r => {
          if (!r) return '';
          if (typeof r === 'string') return r;
          return r.nome_setor || r.nome || r.name || r.setor || '';
        }).filter(Boolean);

        if (setores.length) {
          AVAILABLE_SETORES = Array.from(new Set(setores)).sort((a,b)=>a.localeCompare(b));
          buildSetorFilters();
          console.debug('setores carregados via', url);
          return AVAILABLE_SETORES;
        }
      } catch (err) {
        continue;
      }
    }

    // fallback derive
    if (AVAILABLE_COLABORADORES && AVAILABLE_COLABORADORES.length) {
      AVAILABLE_SETORES = Array.from(new Set(AVAILABLE_COLABORADORES.map(c => c.setor).filter(Boolean))).sort((a,b)=>a.localeCompare(b));
    } else {
      const mapa = groupBySetor(ALL_SOLICITACOES || []);
      AVAILABLE_SETORES = Object.keys(mapa).filter(Boolean).sort((a,b)=>a.localeCompare(b));
    }
    buildSetorFilters();
    return AVAILABLE_SETORES;
  }

  // ---------- Fetch solicitações ----------
  async function fetchSolicitacoes(setor = null) {
    if (setoresWrapper) setoresWrapper.setAttribute('aria-busy', 'true');

    try {
      let url = ENDPOINT_SOLICITACOES;
      const qs = [];
      if (setor) qs.push('setor=' + encodeURIComponent(setor));
      // tenta enviar gestor_id / cnpj para backend que aceite filtro server-side
      if (CURRENT_USER && CURRENT_USER.id) qs.push('gestor_id=' + encodeURIComponent(CURRENT_USER.id));
      if (CURRENT_USER && CURRENT_USER.cnpj) qs.push('cnpj=' + encodeURIComponent(CURRENT_USER.cnpj));

      if (qs.length) url += '?' + qs.join('&');

      const json = await tryFetchJson(url);
      let rows = null;
      if (Array.isArray(json)) rows = json;
      else if (Array.isArray(json.solicitacoes)) rows = json.solicitacoes;
      else if (Array.isArray(json.rows)) rows = json.rows;
      else if (Array.isArray(json.data)) rows = json.data;
      else if (Array.isArray(json.items)) rows = json.items;
      else if (json && Array.isArray(json.result)) rows = json.result;

      if (!rows) rows = [];

      // normalizar
      ALL_SOLICITACOES = rows.map(normalizeSolic).filter(Boolean);

      // aplicar filtro gestor/client-side para garantir segurança: mostrar somente solicitações
      // cujo gestor_id == CURRENT_USER.id ou cujo colaborador.cnpj == CURRENT_USER.cnpj
      VISIBLE_SOLICITACOES = filterSolicitacoesForGestor(ALL_SOLICITACOES);

      // atualizar colaboradores/setores derivadas
      if (!AVAILABLE_COLABORADORES.length) await fetchColaboradores().catch(()=>{});
      if (!AVAILABLE_SETORES.length) await fetchSetores().catch(()=>{});
    } catch (err) {
      console.error('Erro ao buscar solicitações:', err);
      ALL_SOLICITACOES = [];
      VISIBLE_SOLICITACOES = [];
    } finally {
      if (setoresWrapper) setoresWrapper.setAttribute('aria-busy', 'false');
    }

    buildSetorFilters();
    renderAll();
  }

  // ---------- Normalizers ----------
  function normalizeSolic(s) {
    if (!s) return null;
    const item = Object.assign({}, s);
    item.id = item.id || item.solicitacao_id || item.request_id || null;
    item.tipo = item.tipo || item.tipo_solicitacao || item.tipoSolicitacao || item.title || 'outros';
    item.descricao = item.descricao || item.description || item.observacao || item.observacao_gestor || '';
    item.created_at = item.created_at || item.createdAt || item.data_solicitacao || item.criado_em || null;

    // gestor id (pode vir em vários campos)
    item.gestor_id = item.gestor_id || item.gestor || item.gestorId || (item.gestor && item.gestor.id) || null;

    // colaborador
    if (!item.colaborador) {
      item.colaborador = {
        id: item.usuario_id || item.usuario || (item.user && item.user.id) || null,
        nome: item.colaborador_nome || item.nome_colaborador || (item.usuario && item.usuario.nome) || (item.user && item.user.name) || item.nome || '',
        cargo: item.colaborador_cargo || (item.usuario && item.usuario.cargo) || item.cargo || '',
        setor: item.colaborador_setor || (item.usuario && item.usuario.setor) || item.setor || 'Sem setor',
      foto: (() => {
  const f = (item.colaborador && item.colaborador.foto) || item.colaborador_foto || (item.usuario && item.usuario.foto);
  return f ? `/uploads/${f}` : '/img/fundofoda.png';
})(),


        cnpj: (item.usuario && item.usuario.cnpj) || item.colaborador_cnpj || item.cnpj || item.usuario_cnpj || null
      };
    } else {
      item.colaborador.nome = item.colaborador.nome || item.colaborador.nome_completo || '';
      item.colaborador.setor = item.colaborador.setor || '';
      item.colaborador.foto = item.colaborador.foto || '/img/fundofoda.png';
      item.colaborador.cnpj = item.colaborador.cnpj || item.colaborador_cnpj || item.usuario_cnpj || item.cnpj || null;
    }

    // anexos
    item.anexos = Array.isArray(item.anexos) ? item.anexos.map(normalizeAnexo).filter(Boolean) : [];
    if (!item.anexos.length && Array.isArray(item.solicitacao_anexos)) item.anexos = item.solicitacao_anexos.map(normalizeAnexo).filter(Boolean);
    if (!item.anexos.length && Array.isArray(item.anexos_rows)) item.anexos = item.anexos_rows.map(normalizeAnexo).filter(Boolean);

    item.status = (item.status || '').toString().toLowerCase();

    return item;
  }

  function normalizeAnexo(a) {
    if (!a) return null;
    const pathStr = a.path || a.caminho_arquivo || a.filepath || a.url || a.path_file || '';
    const filename = pathStr ? String(pathStr).split('/').pop() : (a.filename || a.nome || a.nome_arquivo || '');
    return {
      id: a.id || null,
      nome: a.nome || a.nome_arquivo || a.original_name || filename || 'Anexo',
      path: pathStr || (filename ? `/uploads/${filename}` : ''),
      filename: filename || ''
    };
  }

  // ---------- Filtragem específica do gestor (garantia cliente-side) ----------
  function filterSolicitacoesForGestor(list) {
    if (!Array.isArray(list)) return [];
    // se não temos usuário atual, retornamos tudo (UI ainda exibirá filtrar/break)
    if (!CURRENT_USER) return list;

    // somente gestores devem ver - se currentUser não for gestor, devolver vazio
    if ((CURRENT_USER.tipo_usuario || '').toString().toLowerCase() !== 'gestor') {
      // Caso queira que admins/others vejam, adapte aqui.
      return [];
    }

    const cnpjUser = (CURRENT_USER.cnpj || '').toString();
    const idUser = String(CURRENT_USER.id);

    return list.filter(s => {
      // se o backend já limitou por gestor_id, respeitar
      if (s.gestor_id && String(s.gestor_id) === idUser) return true;
      // se o colaborador tiver cnpj e for igual ao do gestor, mostrar
      if (s.colaborador && s.colaborador.cnpj && String(s.colaborador.cnpj) === cnpjUser && cnpjUser) return true;
      // alternativa: aceitar quando colaborador.empresa_id === current_user.empresa_id (se disponível)
      if (s.colaborador && (s.colaborador.empresa_id || s.colaborador.empresa) && CURRENT_USER.empresa_id) {
        if (String(s.colaborador.empresa_id || s.colaborador.empresa) === String(CURRENT_USER.empresa_id)) return true;
      }
      return false;
    });
  }

  // ---------- Group & filter ----------
  function groupBySetor(list) {
    const mapa = {};
    (list || []).forEach(s => {
      const setor = (s && s.colaborador && s.colaborador.setor) ? s.colaborador.setor : 'Sem setor';
      if (!mapa[setor]) mapa[setor] = [];
      mapa[setor].push(s);
    });
    return mapa;
  }

  function applyFilters(list) {
    return (list || []).filter(s => {
      if (CURRENT_STATUS_FILTER !== 'all' && (s.status || '') !== CURRENT_STATUS_FILTER) return false;
      if (CURRENT_SETOR_FILTER && !(s.colaborador && s.colaborador.setor === CURRENT_SETOR_FILTER)) return false;
      if (CURRENT_TEXT_FILTER) {
        const t = CURRENT_TEXT_FILTER.toLowerCase();
        const inNome = s.colaborador && s.colaborador.nome && s.colaborador.nome.toLowerCase().includes(t);
        const inTipo = s.tipo && String(s.tipo).toLowerCase().includes(t);
        const inDesc = s.descricao && String(s.descricao).toLowerCase().includes(t);
        if (!(inNome || inTipo || inDesc)) return false;
      }
      return true;
    });
  }

  // ---------- Rendering ----------
  function renderAll() {
    // aplicar filtros sobre VISIBLE_SOLICITACOES (já filtrado por gestor)
    const filtradas = applyFilters(VISIBLE_SOLICITACOES || []);
    if (VIEW_MODE === 'cards') {
      setoresWrapper.classList.remove('list-mode');
      renderCardsView(filtradas);
    } else {
      setoresWrapper.classList.add('list-mode');
      renderListView(filtradas);
    }
  }

 function renderCardsView(list) {
  setoresWrapper.innerHTML = '';
  const grouped = groupBySetor(list);
  const keys = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

  if (!keys.length) {
    setoresWrapper.innerHTML = '<div class="placeholder">Nenhuma solicitação encontrada.</div>';
    return;
  }

  keys.forEach(setorNome => {
    const setorSolics = grouped[setorNome] || [];
    const card = document.createElement('article');
    card.className = 'setor-container';
    card.setAttribute('data-setor', setorNome);

    const header = document.createElement('div');
    header.className = 'setor-header';
    header.innerHTML = `<h3>${escapeHtml(setorNome)}</h3><div class="count">${setorSolics.length} solicitação(s)</div>`;
    card.appendChild(header);

    // Mapear colaboradores
    const colabMap = {};
    setorSolics.forEach(s => {
      const colNome = (s.colaborador && s.colaborador.nome) ? s.colaborador.nome : 'Sem nome';
      if (!colabMap[colNome]) colabMap[colNome] = { info: s.colaborador || {}, solicitacoes: [] };
      colabMap[colNome].solicitacoes.push(s);
    });

    const carousel = document.createElement('div');
    carousel.className = 'colaboradores-carousel';

    Object.entries(colabMap).forEach(([nome, obj]) => {
      const colCard = document.createElement('div');
      colCard.className = 'colab-card';
      colCard.tabIndex = 0;

      // 🔹 Correção do caminho da foto
      const rawFoto = obj.info.foto;
      const fotoPath = rawFoto && !rawFoto.startsWith('/img/') && !rawFoto.startsWith('/uploads/')
        ? `/uploads/${rawFoto}`
        : (rawFoto || '/img/fundofoda.png');

      const cargo = obj.info.cargo || '';

      colCard.innerHTML = `
        <img 
          src="${escapeHtml(fotoPath)}" 
          alt="Foto de ${escapeHtml(nome)}" 
          class="colab-foto" 
          onerror="this.src='/img/fundofoda.png'">
        <div class="nome">${escapeHtml(nome)}</div>
        <div class="cargo">${escapeHtml(cargo)}</div>
        <div class="colab-solicitacoes"></div>
      `;

      // Lista de solicitações do colaborador
      const miniList = colCard.querySelector('.colab-solicitacoes');
      obj.solicitacoes.forEach(solic => {
        const mini = document.createElement('div');
        mini.className = 'solicitacao-mini';
        const resumo = (solic.descricao && solic.descricao.length > 80)
          ? escapeHtml(solic.descricao.slice(0, 80)) + '…'
          : escapeHtml(solic.descricao || '');
        mini.innerHTML = `
          <div class="tipo">${escapeHtml(solic.tipo || 'Outro')}</div>
          <div class="resumo">${resumo}</div>
          <div class="status small">${escapeHtml(solic.status || '')}</div>
        `;
        mini.tabIndex = 0;
        mini.addEventListener('click', (ev) => { ev.stopPropagation(); openModalSolicitacao(solic); });
        mini.addEventListener('keypress', (e) => { if (e.key === 'Enter') openModalSolicitacao(solic); });
        miniList.appendChild(mini);
      });

      colCard.addEventListener('click', (e) => openColabModal(nome, obj));
      carousel.appendChild(colCard);
    });

    card.appendChild(carousel);
    setoresWrapper.appendChild(card);
  });
}

 function renderListView(list) {
  setoresWrapper.innerHTML = '';
  if (!list.length) {
    setoresWrapper.innerHTML = '<div class="placeholder">Nenhuma solicitação encontrada.</div>';
    return;
  }

  const fragment = document.createDocumentFragment();

  list.forEach(solic => {
    const item = document.createElement('div');
    item.className = 'list-solicitacao liquid-glass p-3 mb-3';

    // 🔹 Foto do colaborador com fallback /uploads/
    const rawFoto = solic.colaborador?.foto;
    const fotoPath = rawFoto && !rawFoto.startsWith('/img/') && !rawFoto.startsWith('/uploads/')
      ? `/uploads/${rawFoto}`
      : (rawFoto || '/img/fundofoda.png');

    const nomeColab = escapeHtml(solic.colaborador?.nome || 'Sem nome');
    const cargoColab = escapeHtml(solic.colaborador?.cargo || '');
    const setorColab = escapeHtml(solic.colaborador?.setor || '');
    const tipoSolic = escapeHtml(solic.tipo || '');
    const descricao = escapeHtml(solic.descricao ? (solic.descricao.length > 140 ? solic.descricao.slice(0, 140) + '…' : solic.descricao) : '');
    const dataStr = escapeHtml(solic.created_at || '');
    const anexCount = (solic.anexos || []).length;

    item.innerHTML = `
      <div class="d-flex justify-content-between align-items-start">
        <div class="d-flex gap-3 align-items-start">
          <img src="${fotoPath}" alt="${nomeColab}" style="width:56px;height:56px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.06)" onerror="this.src='/img/fundofoda.png'">
          <div>
            <div style="font-weight:700">${nomeColab}</div>
            <div class="small">${cargoColab} • ${setorColab}</div>
            <div class="mt-2"><strong>${tipoSolic}</strong> — ${descricao}</div>
            <div class="small mt-1">Anexos: ${anexCount}</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div class="small">Solicitado em</div>
          <div style="font-weight:700">${dataStr}</div>
          <div style="margin-top:12px;">
            <button class="btn btn-success btn-sm" data-action="aprovar" data-id="${escapeHtml(solic.id)}">Aprovar</button>
            <button class="btn btn-danger btn-sm" data-action="reprovar" data-id="${escapeHtml(solic.id)}">Reprovar</button>
            <button class="btn btn-outline btn-sm" data-action="detalhes" data-id="${escapeHtml(solic.id)}">Detalhes</button>
          </div>
        </div>
      </div>
    `;

    // 🔹 Eventos dos botões
    item.addEventListener('click', e => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const id = Number(btn.dataset.id);
      if (action === 'aprovar') updateStatusSolicitacao(id, 'aprovada');
      else if (action === 'reprovar') updateStatusSolicitacao(id, 'reprovada');
      else if (action === 'detalhes') openModalSolicitacao(solic);
    });

    fragment.appendChild(item);
  });

  setoresWrapper.appendChild(fragment);
}


  // ---------- Build setor filters ----------
  function buildSetorFilters() {
    if (!setorFiltersWrap) return;
    const setoresList = (AVAILABLE_SETORES && AVAILABLE_SETORES.length) ? AVAILABLE_SETORES : Object.keys(groupBySetor(VISIBLE_SOLICITACOES || []));
    setorFiltersWrap.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.className = 'setor-item btn small';
    allBtn.type = 'button';
    allBtn.innerText = `Todos (${VISIBLE_SOLICITACOES.length})`;
    allBtn.addEventListener('click', () => {
      CURRENT_SETOR_FILTER = null;
      updateSetorActive();
      fetchSolicitacoes(null);
    });
    setorFiltersWrap.appendChild(allBtn);

    setoresList.forEach(s => {
      const count = VISIBLE_SOLICITACOES.filter(x => x.colaborador && x.colaborador.setor === s).length;
      const btn = document.createElement('button');
      btn.className = 'setor-item btn small';
      btn.type = 'button';
      btn.innerText = `${s} (${count})`;
      btn.dataset.setor = s;
      btn.addEventListener('click', () => {
        CURRENT_SETOR_FILTER = s;
        updateSetorActive();
        fetchSolicitacoes(s);
      });
      setorFiltersWrap.appendChild(btn);
    });

    updateSetorActive();
  }

  function updateSetorActive() {
    if (!setorFiltersWrap) return;
    const children = Array.from(setorFiltersWrap.querySelectorAll('.setor-item'));
    children.forEach(ch => {
      if (ch.dataset.setor && ch.dataset.setor === CURRENT_SETOR_FILTER) ch.classList.add('ativo');
      else if (!ch.dataset.setor && !CURRENT_SETOR_FILTER && ch.innerText.startsWith('Todos')) ch.classList.add('ativo');
      else ch.classList.remove('ativo');
    });
  }

  // ---------- Modal & actions ----------
  const modal = new bootstrap.Modal(document.getElementById('modalSolicitacao'));
  function openModalSolicitacao(solic) {
    if (!solic) return;
    document.getElementById('modalSolicitacaoTitulo').innerText = `${solic.tipo || 'Solicitação'} #${solic.id || ''}`;
    document.getElementById('modalSolicitacaoTipo').innerText = solic.tipo || '-';
    document.getElementById('modalSolicitacaoStatus').innerText = (solic.status || '-').toUpperCase();
    document.getElementById('modalSolicitacaoData').innerText = (solic.created_at || solic.data_solicitacao || '-') ;
    document.getElementById('modalSolicitacaoDescricao').innerText = solic.descricao || '-';

    const anexoWrap = document.getElementById('modalSolicitacaoAnexos');
    anexoWrap.innerHTML = '';
    (solic.anexos || []).forEach(a => {
      const filename = a.filename || (a.path ? String(a.path).split('/').pop() : '');
      const url = filename ? (ENDPOINT_ANEXO + encodeURIComponent(filename)) : (a.path || '#');
      const aEl = document.createElement('a');
      aEl.href = url;
      aEl.innerText = a.nome || filename || 'Anexo';
      aEl.target = '_blank';
      aEl.rel = 'noopener noreferrer';
      aEl.className = 'd-block small';
      anexoWrap.appendChild(aEl);
    });
    if (!(solic.anexos || []).length) anexoWrap.innerHTML = '<div class="small">Nenhum anexo</div>';

    const col = solic.colaborador || {};
    document.getElementById('modalSolicitacaoFoto').src = col.foto || '/img/fundofoda.png';
    document.getElementById('modalSolicitacaoColabNome').innerText = col.nome || '-';
    document.getElementById('modalSolicitacaoColabSetor').innerText = col.setor || '-';
    document.getElementById('modalSolicitacaoColabCargo').innerText = col.cargo || '-';

    const btnAprov = document.getElementById('btnAprovar');
    const btnReprov = document.getElementById('btnReprovar');
    btnAprov.onclick = () => updateStatusSolicitacao(solic.id, 'aprovada');
    btnReprov.onclick = () => updateStatusSolicitacao(solic.id, 'reprovada');

    modal.show();
  }

  const modalColab = new bootstrap.Modal(document.getElementById('modalColaboradorGestor'));
function openColabModal(colab) {
  const foto = document.getElementById('colabModalFoto');
  const nome = document.getElementById('colabModalNome');
  const cargoSetor = document.getElementById('colabModalCargoSetor');
  const infoExtra = document.getElementById('colabModalInfoExtra');
  const solicitacoesDiv = document.getElementById('colabModalSolicitacoes');

  if (foto) {
    foto.src = colab.foto ? `${BACKEND_URL}${colab.foto}` : '/img/fundofoda.png';
  }
  if (nome) nome.textContent = colab.nome || '—';
  if (cargoSetor) cargoSetor.textContent = `${colab.cargo || ''} • ${colab.setor || ''}`;
  if (infoExtra) infoExtra.textContent = `Registro: ${colab.numero_registro || ''}`;
  if (solicitacoesDiv) {
    solicitacoesDiv.innerHTML = '';
    if (colab.solicitacoes && colab.solicitacoes.length) {
      colab.solicitacoes.forEach(sol => {
        const item = document.createElement('div');
        item.className = 'colab-solic-item';
        item.textContent = `${sol.tipo} — ${sol.status}`;
        solicitacoesDiv.appendChild(item);
      });
    } else {
      solicitacoesDiv.innerHTML = '<p class="small muted">Nenhuma solicitação recente.</p>';
    }
  }

  const modal = new bootstrap.Modal(document.getElementById('modalColaboradorGestor'));
  modal.show();
}

  // ---------- Update status ----------
  async function updateStatusSolicitacao(id, novoStatus) {
    if (!confirm(`Confirma ${novoStatus} da solicitação #${id}?`)) return;
    try {
      const res = await fetch(`${ENDPOINT_SOLICITACOES}/${encodeURIComponent(id)}/status`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus })
      });
      if (!res.ok) throw new Error('Erro ao atualizar: ' + res.status);
      // atualizar localmente
      const idxAll = ALL_SOLICITACOES.findIndex(x => String(x.id) === String(id));
      if (idxAll >= 0) ALL_SOLICITACOES[idxAll].status = novoStatus;
      const idxVis = VISIBLE_SOLICITACOES.findIndex(x => String(x.id) === String(id));
      if (idxVis >= 0) VISIBLE_SOLICITACOES[idxVis].status = novoStatus;
      renderAll();
      modal.hide();
    } catch (err) {
      alert('Não foi possível atualizar o status. Verifique o console.');
      console.error(err);
    }
  }

  // ---------- Events ----------
  if (buscaInput) {
    buscaInput.addEventListener('input', (e) => {
      CURRENT_TEXT_FILTER = e.target.value.trim();
      renderAll();
    });
  }

  if (filtrosBtns && filtrosBtns.length) {
    filtrosBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filtrosBtns.forEach(b => b.classList.remove('ativo'));
        btn.classList.add('ativo');
        CURRENT_STATUS_FILTER = btn.dataset.status || 'all';
        renderAll();
      });
    });
  }

  if (btnRefresh) btnRefresh.addEventListener('click', () => fetchSolicitacoes(CURRENT_SETOR_FILTER));

  if (btnToggleView) {
    btnToggleView.addEventListener('click', () => {
      VIEW_MODE = (VIEW_MODE === 'cards') ? 'list' : 'cards';
      btnToggleView.innerText = (VIEW_MODE === 'cards') ? 'Lista' : 'Cards';
      renderAll();
    });
    btnToggleView.innerText = (VIEW_MODE === 'cards') ? 'Lista' : 'Cards';
  }

  // ---------- Init ----------
  (async function init() {
    await fetchCurrentUser().catch(()=>{});
    await fetchColaboradores().catch(()=>{});
    await fetchSetores().catch(()=>{});
    await fetchSolicitacoes(CURRENT_SETOR_FILTER);
  })();

  // ---------- Utils ----------
  function escapeHtml(str) {
    if (str === undefined || str === null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

})();
