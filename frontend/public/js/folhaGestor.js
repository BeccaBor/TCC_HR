// frontend/public/js/folhaGestor.js
(function () {
  "use strict";

  var BACKEND_BASE = "http://localhost:3001"; // ajusta se necessário
  var token = (function(){ try { return localStorage.getItem("token") || sessionStorage.getItem("token"); } catch (e) { return null; } })();

  var setoresContainer = document.getElementById("setores-list");
  var tbody = document.getElementById("employees-tbody");
  var statProximoPagamentoEl = document.getElementById("stat-proximo-pagamento");
  var setorAtual = "Todos";

  var todosColaboradores = [];
  var colaboradoresAtuais = [];
  var configuracoesPagamento = null;

  // candidate paths for resources
  var candidatePaths = {
    setores: ["/api/setor/listar", "/setor/listar", "/api/setores", "/setores"],
    colaboradores: ["/api/colaborador/listar", "/colaborador/listar", "/api/usuarios", "/usuarios"],
    configuracoes: ["/api/folha/configuracoes/pagamento", "/folha/configuracoes/pagamento", "/api/configuracoes/pagamento", "/configuracoes/pagamento", "/api/config_pagamento", "/config_pagamento"]

  };

  async function tryEndpoints(base, paths, opts) {
    opts = opts || {};
    for (var i = 0; i < paths.length; i++) {
      var p = paths[i];
      var urls = [];
      if (p.startsWith("/api/")) urls = [base + p, base + p.replace("/api", "")];
      else urls = [base + p, base + "/api" + p];
      for (var j = 0; j < urls.length; j++) {
        var url = urls[j];
        try {
          var res = await fetch(url, Object.assign({ method: opts.method || "GET", headers: opts.headers || {} }, opts.fetchOptions || {}));
          var text = await res.text();
          var data = null;
          try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
          // prefer res.ok + JSON data
          if (res.ok && data !== null) return { url: url, res: res, data: data, text: text };
          // if 404 -> skip to next url
          if (res.status === 404) continue;
          // if 200 with no JSON (html), skip
          // if 500 etc, still return object (caller can decide)
          if (res.ok && data === null) continue;
        } catch (err) {
          // ignore network error, try next
        }
      }
    }
    return null;
  }

  function escapeHtml(str) {
    if (str === null || typeof str === "undefined") return "";
    return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }
  function obterIniciais(nome) {
    if (!nome) return "";
    var p = nome.trim().split(/\s+/);
    if (p.length === 1) return (p[0].charAt(0) || "").toUpperCase();
    return ((p[0].charAt(0) || "") + (p[p.length-1].charAt(0) || "")).toUpperCase();
  }
  function formatCurrencyBRL(v) {
    try { return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
    catch(e){ return "R$ 0,00"; }
  }

  // payment date helpers (unchanged logic)
  function getNextPaymentDateForDay(diaPagamento, fromDate) {
    fromDate = fromDate || new Date();
    var hoje = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
    var ano = hoje.getFullYear();
    var mes = hoje.getMonth();
    if (hoje.getDate() > diaPagamento) {
      mes = mes + 1;
      if (mes > 11) { mes = 0; ano += 1; }
    }
    var ultimoDia = new Date(ano, mes + 1, 0).getDate();
    var diaReal = Math.min(diaPagamento, ultimoDia);
    return new Date(ano, mes, diaReal);
  }

  function calcularProximoPagamentoText() {
    if (!configuracoesPagamento || !configuracoesPagamento.diaPagamento1) return "Não configurado";
    var hoje = new Date();
    var dia1 = parseInt(configuracoesPagamento.diaPagamento1, 10);
    var qtd = parseInt(configuracoesPagamento.qtdPagamentos || "1", 10);
    var candidates = [];
    if (!isNaN(dia1)) candidates.push(getNextPaymentDateForDay(dia1, hoje));
    if (qtd === 2 && configuracoesPagamento.diaPagamento2) {
      var dia2 = parseInt(configuracoesPagamento.diaPagamento2, 10);
      if (!isNaN(dia2)) candidates.push(getNextPaymentDateForDay(dia2, hoje));
    }
    if (candidates.length === 0) return "Não configurado";
    var best = candidates[0];
    for (var i=1;i<candidates.length;i++) if (candidates[i] < best) best = candidates[i];
    var hojeMid = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    var diffMs = best - hojeMid;
    var diffDias = Math.ceil(diffMs / (1000*60*60*24));
    if (diffDias === 0) return "Hoje";
    if (diffDias === 1) return "1 dia";
    return diffDias + " dias";
  }

  function atualizarProximoPagamento() {
    if (statProximoPagamentoEl) statProximoPagamentoEl.textContent = calcularProximoPagamentoText();
  }

  // carregar configuracoes
  async function carregarConfiguracoesPagamento() {
    var tryRes = await tryEndpoints(BACKEND_BASE, candidatePaths.configuracoes, { headers: token ? { "Authorization": "Bearer " + token } : {} });
    if (tryRes && tryRes.data) configuracoesPagamento = tryRes.data.data ? tryRes.data.data : tryRes.data;
    else configuracoesPagamento = null;
    atualizarProximoPagamento();
    console.log("CONFIG LOAD ->", tryRes ? tryRes.url : "nenhum endpoint de configuracao respondeu JSON");
    return configuracoesPagamento;
  }

  // carregar setores
  async function carregarSetores() {
    if (!setoresContainer) return;
    var empresaId = getEmpresaId();
    var q = empresaId ? "?empresa_id=" + encodeURIComponent(empresaId) : "";
    var tryRes = await tryEndpoints(BACKEND_BASE, candidatePaths.setores, { headers: token ? { "Authorization": "Bearer " + token } : {} , fetchOptions: {} });
    console.log("SETOR TRY ->", tryRes ? tryRes.url : "nenhum endpoint");
    if (!tryRes || !tryRes.data) {
      setoresContainer.innerHTML = "<li><span class='text-muted'>Erro ao carregar setores</span></li>";
      return;
    }
    var setores = Array.isArray(tryRes.data) ? tryRes.data : (tryRes.data && tryRes.data.data ? tryRes.data.data : []);
    setoresContainer.innerHTML = "";
    // add Todos
    var liTodos = document.createElement("li");
    var ac = (setorAtual === "Todos") ? "sidebar-link-active" : "sidebar-link-default";
    liTodos.innerHTML = '<a href="#" data-setor="Todos" class="sidebar-link ' + ac + '"><i class="bi bi-people"></i> Todos</a>';
    setoresContainer.appendChild(liTodos);
    for (var i=0;i<setores.length;i++){
      var s = setores[i];
      var nome = s.nome_setor || s.nome || String(s);
      var li = document.createElement("li");
      var isAct = (setorAtual === nome) ? "sidebar-link-active" : "sidebar-link-default";
      li.innerHTML = '<a href="#" data-setor="' + escapeHtml(nome) + '" class="sidebar-link ' + isAct + '"><i class="bi bi-diagram-3"></i> ' + escapeHtml(nome) + '</a>';
      setoresContainer.appendChild(li);
    }
    var anchors = setoresContainer.querySelectorAll('a[data-setor]');
    for (var j=0;j<anchors.length;j++) (function(a){
      a.addEventListener("click", function(ev){
        ev.preventDefault();
        var all = setoresContainer.querySelectorAll('.sidebar-link');
        for (var k=0;k<all.length;k++) all[k].classList.remove('sidebar-link-active');
        a.classList.add('sidebar-link-active');
        var setor = a.getAttribute("data-setor");
        setorAtual = setor || "Todos";
        carregarColaboradores(setor === "Todos" ? null : setor);
        atualizarProximoPagamento();
      });
    })(anchors[j]);
  }

// ----- carregarColaboradores (substituir a versão antiga) -----
async function carregarColaboradores(setorFiltro) {
  setorFiltro = (typeof setorFiltro === "undefined" || setorFiltro === null) ? "" : setorFiltro;
  if (!tbody) return;

  // API base robusto (usa BACKEND_BASE ou BACKEND_URL se existirem, senão fallback 3001)
  var API_BASE = (typeof BACKEND_BASE !== "undefined") ? BACKEND_BASE : ((typeof BACKEND_URL !== "undefined") ? BACKEND_URL : "http://localhost:3001");

  // tenta obter empresa_id de várias fontes (localStorage.user, função getEmpresaId se existir, ou /auth/me)
  var empresaId = null;
  try {
    if (typeof getEmpresaId === "function") empresaId = getEmpresaId();
  } catch (e) { empresaId = null; }

  if (!empresaId) {
    try {
      var userJSON = localStorage.getItem("user");
      if (userJSON) {
        var u = JSON.parse(userJSON);
        empresaId = u && u.empresa_id ? u.empresa_id : null;
      }
    } catch (e) { empresaId = null; }
  }

  // se ainda não tiver empresaId, tenta autenticar /auth/me (com fallback /api/auth/me)
  if (!empresaId) {
    var authCandidates = ["/api/auth/me", "/auth/me", "/api/usuario/me", "/usuario/me"];
    for (var i = 0; i < authCandidates.length && !empresaId; i++) {
      var url = (API_BASE + authCandidates[i]);
      try {
        var r = await fetch(url, { headers: token ? { "Authorization": "Bearer " + token } : {} });
        var txt = await r.text();
        var parsed = null;
        try { parsed = txt ? JSON.parse(txt) : null; } catch (e) { parsed = null; }
        if (r.ok && parsed && parsed.usuario) {
          empresaId = parsed.usuario.empresa_id || parsed.usuario.empresaId || parsed.usuario.empresa_id;
          break;
        }
      } catch (e) {
        // ignore and try next
      }
    }
  }

  if (!empresaId) {
    // fallback que usaste nos testes: tenta 1 (apenas para debug); se preferir, remove isso
    console.warn("Empresa não encontrada em localStorage/user/auth. Não vou carregar colaboradores automaticamente.");
    tbody.innerHTML = "<tr><td colspan='6' class='text-center'>Empresa não configurada.</td></tr>";
    return;
  }

  // monta URL preferencial que sabemos que funciona
  var candidato = API_BASE + "/api/colaborador/listar?empresa_id=" + encodeURIComponent(empresaId);
  // também tenta sem /api se necessário
  var fallback = API_BASE + "/colaborador/listar?empresa_id=" + encodeURIComponent(empresaId);

  var list = null;
  var usedUrl = null;
  // tentativa 1
  try {
    console.info("Tentando carregar colaboradores em:", candidato);
    var r1 = await fetch(candidato, { headers: token ? { "Authorization": "Bearer " + token } : {} });
    var t1 = await r1.text();
    var p1 = null;
    try { p1 = t1 ? JSON.parse(t1) : null; } catch (e) { p1 = null; }
    if (r1.ok && p1) {
      list = Array.isArray(p1) ? p1 : (Array.isArray(p1.data) ? p1.data : null);
      usedUrl = candidato;
    }
  } catch (e) { /* ignore */ }

  // tentativa 2 (fallback)
  if (!list) {
    try {
      console.info("Tentativa fallback colaboradores em:", fallback);
      var r2 = await fetch(fallback, { headers: token ? { "Authorization": "Bearer " + token } : {} });
      var t2 = await r2.text();
      var p2 = null;
      try { p2 = t2 ? JSON.parse(t2) : null; } catch (e) { p2 = null; }
      if (r2.ok && p2) {
        list = Array.isArray(p2) ? p2 : (Array.isArray(p2.data) ? p2.data : null);
        usedUrl = fallback;
      }
    } catch (e) { /* ignore */ }
  }

  if (!list) {
    tbody.innerHTML = "<tr><td colspan='6' class='text-center'>Nenhum colaborador encontrado ou erro ao carregar.</td></tr>";
    console.warn("Nenhum endpoint de colaboradores respondeu JSON válido.");
    return;
  }

  // normaliza campos (salario, nome, cargo, setor, numero_registro)
  list = list.map(function (c) {
    c = c || {};
    if (typeof c.salario === "string") {
      var parsed = parseFloat(c.salario.replace(",", "."));
      c.salario = isNaN(parsed) ? 0 : parsed;
    } else if (typeof c.salario !== "number") {
      c.salario = 0;
    }
    c.nome = c.nome || c.nome_completo || c.name || "Nome não informado";
    c.cargo = c.cargo || c.funcao || c.role || "Cargo não informado";
    c.setor = c.setor || c.nome_setor || "Setor não informado";
    c.numero_registro = c.numero_registro || c.matricula || c.registro || "";
    return c;
  });

  todosColaboradores = list.slice();
  colaboradoresAtuais = list.slice();

  console.info("Colaboradores carregados via:", usedUrl, " total:", list.length);
  renderizarColaboradores(colaboradoresAtuais);
}



// ----- renderizarColaboradores (agrupando por setor, SEM mostrar nomes dos gestores) -----
// ----- renderizarColaboradores (substituir a versão atual) -----
function renderizarColaboradores(list) {
  list = (typeof list === "undefined" || list === null) ? colaboradoresAtuais : list;
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!list || list.length === 0) {
    tbody.innerHTML = "<tr><td colspan='6' class='text-center'>Nenhum colaborador encontrado.</td></tr>";
    return;
  }

  // helper local: detecta campo de imagem
  function detectAvatarField(obj) {
    if (!obj || typeof obj !== 'object') return null;
    var prefer = ['foto','avatar','avatar_url','imagem','imagem_url','photo','picture','foto_perfil','url_foto','image','profile_image','profile_picture'];
    for (var i=0;i<prefer.length;i++){
      var k = prefer[i];
      if (obj[k] && typeof obj[k] === 'string' && obj[k].trim() !== '') return { key: k, val: obj[k] };
    }
    for (var k2 in obj) {
      try {
        var v = obj[k2];
        if (!v || typeof v !== 'string') continue;
        var s = v.trim();
        if (/^data:image\//i.test(s)) return { key: k2, val: s };
        if (/^https?:\/\//i.test(s)) {
          if (/\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i.test(s)) return { key: k2, val: s };
          return { key: k2, val: s };
        }
        if (/(\/|\\).*\/uploads|uploads[\/\\]/i.test(s)) return { key: k2, val: s };
        if (/\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i.test(s)) return { key: k2, val: s };
      } catch(e){}
    }
    return null;
  }

  // monta URL final presumindo uploads/ quando somente o filename estiver no DB
  function buildAvatarSrc(val) {
    if (!val) return null;
    if (/^data:image\//i.test(val)) return val;
    if (/^https?:\/\//i.test(val)) return val;
    var base = (typeof BACKEND_BASE !== "undefined") ? BACKEND_BASE : ((typeof BACKEND_URL !== "undefined") ? BACKEND_URL : "http://localhost:3001");
    if (/^[^\/\\]+\.(jpe?g|png|gif|webp|svg)$/i.test(val.trim())) {
      return base.replace(/\/$/, '') + '/uploads/' + val.replace(/^\//, '');
    }
    if (val.startsWith('/')) return base.replace(/\/$/, '') + val;
    return base.replace(/\/$/, '') + '/' + val;
  }

  // tenta fetch com Authorization e converte pra objectURL; retorna string objectURL ou null
  async function fetchImageObjectUrl(src) {
    if (!src) return null;
    try {
      var res = await fetch(src, token ? { headers: { "Authorization": "Bearer " + token } } : {});
      if (!res.ok) throw new Error("fetch failed " + res.status);
      var blob = await res.blob();
      // se não for image/*, aborta
      if (!blob || !blob.type || blob.type.indexOf("image/") !== 0) throw new Error("not image blob");
      return URL.createObjectURL(blob);
    } catch (e) {
      // falhou (CORS, 403, 404 ou CORP) -> devolve null para fallback
      return null;
    }
  }

  // monta os grupos por setor
  var grupos = {};
  list.forEach(function (c) {
    var setor = c.setor || c.nome_setor || "Sem setor";
    if (!grupos[setor]) grupos[setor] = [];
    grupos[setor].push(c);
  });

  var frag = document.createDocumentFragment();
  var setoresKeys = Object.keys(grupos).sort(function (a, b) { return a.localeCompare(b); });

  setoresKeys.forEach(function (setor) {
    var headerRow = document.createElement("tr");
    headerRow.className = "setor-header";
    // headerRow.innerHTML = "<td colspan='6' style='background:#2b2f48; color:#fff; padding:12px;'><strong>Setor: " + escapeHtml(setor) + "</strong></td>";
    frag.appendChild(headerRow);

    grupos[setor].forEach(function (c) {
      var row = document.createElement("tr");
      var iniciais = obterIniciais(c.nome);
      var salarioTexto = (c.salario && c.salario > 0) ? formatCurrencyBRL(c.salario) : "R$ 0,00";

      // detecta e cria img com data-src (será preenchida por hydrateImages)
      var detected = detectAvatarField(c);
      var avatarHtml = "";
      if (detected && detected.val) {
        var src = buildAvatarSrc(detected.val);
        avatarHtml = ""
          + "<div class='employee-avatar-wrapper'>"
          +   "<img data-src='" + escapeHtml(src) + "' alt='" + escapeHtml(c.nome || "") + "' class='employee-avatar-img' style='display:none;'/>"
          +   "<div class='employee-avatar-initials' style='display:flex;'>" + escapeHtml(iniciais) + "</div>"
          + "</div>";
      } else {
        avatarHtml = "<div class='employee-avatar'>" + escapeHtml(iniciais) + "</div>";
      }

      row.innerHTML = ""
        + "<td><div class='d-flex align-items-center gap-3'>" + avatarHtml + "<div><span style='font-weight:500;'>" + escapeHtml(c.nome) + "</span><br><small class='text-muted'>" + escapeHtml(c.cargo) + "</small></div></div></td>"
        + "<td>" + escapeHtml(c.numero_registro || "") + "</td>"
        + "<td>" + escapeHtml(setor) + "</td>"
        + "<td>" + salarioTexto + "</td>"
       + "<td><span class='status-badge status-" + escapeHtml(c.status || "ativo") + "'>" + escapeHtml(c.status || "Ativo") + "</span></td>"
+ "<td><div class='btn-group' role='group'><button class='action-icon view' data-id='" + escapeHtml(String(c.id || "")) + "'><i class='bi bi-eye'></i></button><a class='action-icon edit' href='/gestor/folhapaga/" + escapeHtml(String(c.id || "")) + "' data-id='" + escapeHtml(String(c.id || "")) + "'><i class='bi bi-pencil'></i></a></div></td>";
      frag.appendChild(row);
    });
  });

  tbody.appendChild(frag);

  // hydrate images: tenta fetch com token -> objectURL; se falhar, usa src direto como fallback
  (async function hydrateImages() {
    var imgs = Array.from(tbody.querySelectorAll("img[data-src]"));
    for (var i = 0; i < imgs.length; i++) {
      var img = imgs[i];
      var src = img.getAttribute("data-src");
      if (!src) continue;
      var objectUrl = null;
      // 1) tenta fetch + blob -> objectURL (isso evita problemas de política de recurso ao embutir)
      try { objectUrl = await fetchImageObjectUrl(src); } catch (e) { objectUrl = null; }
      if (objectUrl) {
        img.src = objectUrl;
        img.style.display = "block";
        var initials = img.parentNode.querySelector('.employee-avatar-initials');
        if (initials) initials.style.display = "none";
        continue;
      }
      // 2) fallback: define src diretamente e deixa onerror cuidar do fallback das iniciais
      img.src = src;
      img.style.display = "block";
      img.onerror = function () {
        try {
          this.style.display = "none";
          var e = this.parentNode.querySelector('.employee-avatar-initials');
          if (e) e.style.display = "flex";
        } catch (e) { /* ignore */ }
      };
    }
  })();

  // listeners Ver / Editar
  tbody.querySelectorAll(".btn-view").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.getAttribute("data-id");
      if (id) window.location.href = "/gestor/colaborador/" + encodeURIComponent(id);
    });
  });
  tbody.querySelectorAll(".btn-edit").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.getAttribute("data-id");
      if (id) window.location.href = "/gestor/colaborador/editar/" + encodeURIComponent(id);
    });
  });
}



// --- FIM: renderizarColaboradores agrupando por gestor ---

// --- setup do modal de configurações (abre e faz submit) ---
// function setupConfigModal() {
//   var modalEl = document.getElementById("modalConfigPagamento");
//   var btnConfig = document.getElementById("btn-config");
//   var formConfig = document.getElementById("formConfig");

//   // fallback simples caso bootstrap não exista: toggles .show class
//   var bsModalInstance = null;
//   if (modalEl && window.bootstrap && window.bootstrap.Modal) {
//     try { bsModalInstance = new bootstrap.Modal(modalEl); } catch (e) { bsModalInstance = null; }
//   }

//   function showModal() {
//     if (bsModalInstance && typeof bsModalInstance.show === "function") bsModalInstance.show();
//     else if (modalEl) modalEl.classList.add("show");
//   }
//   function hideModal() {
//     if (bsModalInstance && typeof bsModalInstance.hide === "function") bsModalInstance.hide();
//     else if (modalEl) modalEl.classList.remove("show");
//   }

//   if (btnConfig) {
//     btnConfig.addEventListener("click", async function (e) {
//       e.preventDefault();
//       // garante que carregamos as configs antes de abrir
//       if (typeof carregarConfiguracoesPagamento === "function") {
//         await carregarConfiguracoesPagamento();
//       }
//       var cfg = configuracoesPagamento || { qtdPagamentos: '1', diaPagamento1: '', diaPagamento2: '' };

//       // preenche campos do formulário de forma segura (procura por name)
//       if (formConfig) {
//         var f = formConfig;
//         var elQtd = f.querySelector('[name="qtdPagamentos"]');
//         var elDia1 = f.querySelector('[name="diaPagamento1"]');
//         var elDia2 = f.querySelector('[name="diaPagamento2"]');
//         if (elQtd) elQtd.value = (cfg.qtdPagamentos || '1');
//         if (elDia1) elDia1.value = (cfg.diaPagamento1 || '');
//         if (elDia2) elDia2.value = (cfg.diaPagamento2 || '');
//       }

//       showModal();
//     });
//   }

//   if (formConfig) {
//     formConfig.addEventListener("submit", async function (ev) {
//       ev.preventDefault();
//       var f = formConfig;
//       var payload = {
//         qtdPagamentos: (f.querySelector('[name="qtdPagamentos"]') || { value: '1' }).value,
//         diaPagamento1: (f.querySelector('[name="diaPagamento1"]') || { value: '' }).value,
//         diaPagamento2: (f.querySelector('[name="diaPagamento2"]') || { value: '' }).value
//       };
//       try {
//         // tenta enviar para rota esperada; aceita /api/folha/... e /api/...
//         var endpoints = [
//           (BACKEND_URL || "") + "/api/folha/configuracoes/pagamento",
//           (BACKEND_URL || "") + "/folha/configuracoes/pagamento",
//           (BACKEND_URL || "") + "/api/configuracoes/pagamento",
//           (BACKEND_URL || "") + "/configuracoes/pagamento"
//         ];
//         var saved = false;
//         for (var i = 0; i < endpoints.length; i++) {
//           try {
//             var res = await fetch(endpoints[i], {
//               method: "POST",
//               headers: Object.assign({ "Content-Type": "application/json" }, token ? { "Authorization": "Bearer " + token } : {}),
//               body: JSON.stringify(payload)
//             });
//             if (res.ok) { saved = true; break; }
//           } catch (err) { /* try next */ }
//         }
//         if (saved) {
//           // recarrega configurações e atualiza o cartão de próximo pagamento
//           if (typeof carregarConfiguracoesPagamento === "function") await carregarConfiguracoesPagamento();
//           atualizarProximoPagamento();
//         } else {
//           alert("Não foi possível salvar as configurações. Tente novamente ou verifique o servidor.");
//         }
//       } catch (e) {
//         console.error("Erro ao enviar configurações:", e);
//         alert("Erro ao salvar configurações.");
//       } finally {
//         hideModal();
//       }
//     });
//   }
// }

// // chama a função de setup no init (coloca isto onde tem o setup inicial)
// if (typeof setupConfigModal === "function") {
//   try { setupConfigModal(); } catch (e) { console.warn("setupConfigModal falhou:", e); }
// }


  function getEmpresaId() {
    try {
      var u = localStorage.getItem("user");
      if (!u) return null;
      var obj = JSON.parse(u);
      return obj.empresa_id || null;
    } catch (e) { return null; }
  }

  async function init() {
    await carregarConfiguracoesPagamento();
    await carregarSetores();
    await carregarColaboradores();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
window.todosColaboradores = todosColaboradores;
window.colaboradoresAtuais = colaboradoresAtuais;
})();

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
