// frontend/public/js/pontoScript.js
console.log("pontoScript.js carregado");

document.addEventListener("DOMContentLoaded", () => {
  const BACKEND_URL = "http://localhost:3001";
  const formPonto = document.getElementById("formPonto");

  const nomeInput = document.getElementById("nome");
  const setorInput = document.getElementById("setor");
  const tipoInput = document.getElementById("tipo_usuario");
  const mensagemEl = document.getElementById("alertPopup");

  const listaUltimosPontosEl = document.getElementById("listaUltimosPontos");
// Container principal da tabela (fora da sidebar)
const tabelaRegistrosEl = document.getElementById("tabelaRegistros"); // deve estar no main-panel


  let usuarioAtual = null;

  function mostrarMensagem(msg, tipo = "info") {
    if (!mensagemEl) return;
    mensagemEl.textContent = msg;
    mensagemEl.className = `alert alert-${tipo} mt-2`;
    mensagemEl.style.display = "block";
    mensagemEl.classList.remove("d-none");
  }

  function limparMensagem() {
    if (!mensagemEl) return;
    mensagemEl.textContent = "";
    mensagemEl.style.display = "none";
    mensagemEl.classList.add("d-none");
  }

  async function pegarUsuario() {
    limparMensagem();
    const token = localStorage.getItem("token");
    if (!token) {
      mostrarMensagem("❌ Usuário não autenticado.", "danger");
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/ponto/me`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        mostrarMensagem("❌ " + (data.message || "Erro ao obter dados do usuário."), "danger");
        return;
      }

      usuarioAtual = data.usuario;

      if (nomeInput) nomeInput.value = usuarioAtual.nome || "N/D";
      if (setorInput) setorInput.value = usuarioAtual.setor || "N/D";
      if (tipoInput) tipoInput.value = usuarioAtual.tipo_usuario || "N/D";

      // Carrega ambos os registros
      carregarUltimosPontos();
      carregarUltimosPontosEmpresa();
      carregarQuadroJornada();

    } catch (err) {
      console.error(err);
      mostrarMensagem("Erro de conexão ao buscar dados do usuário.", "danger");
    }
  }

  async function carregarUltimosPontos() {
    if (!usuarioAtual) return;
    const token = localStorage.getItem("token");
    const el = listaUltimosPontosEl;
    if (!el) return;

    el.innerHTML = '<tr><td colspan="3">Carregando...</td></tr>';

    const endpoint = usuarioAtual.tipo_usuario === "gestor"
      ? `${BACKEND_URL}/api/gestor/ponto/ultimos`
      : `${BACKEND_URL}/api/ponto/recentes`;

    try {
      const res = await fetch(endpoint, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });

      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } 
      catch(err) {
        console.error("Resposta não é JSON:", text);
        el.innerHTML = `<tr><td colspan="3">Erro ao carregar pontos.</td></tr>`;
        return;
      }

      if (!res.ok) {
        el.innerHTML = `<tr><td colspan="3">Erro: ${data.message || "Não foi possível carregar os pontos."}</td></tr>`;
        return;
      }

      const registros = data.registros || [];
      if (registros.length === 0) {
        el.innerHTML = `<tr><td colspan="3">Nenhum ponto registrado.</td></tr>`;
        return;
      }

      el.innerHTML = registros.map(reg => `
        <tr>
          <td>${reg.tipo_registro}</td>
          <td>${reg.horas}</td>
          <td>${new Date(reg.data_registro).toLocaleString()}</td>
        </tr>
      `).join("");

    } catch(err) {
      console.error("Erro ao carregar últimos pontos do usuário:", err);
      el.innerHTML = `<tr><td colspan="3">Erro de conexão com o servidor.</td></tr>`;
    }
  }

  // Últimos pontos da empresa (excluindo o usuário atual)
 async function carregarUltimosPontosEmpresa() {
  if (!usuarioAtual) return;
  const token = localStorage.getItem("token");
  const el = tabelaRegistrosEl;
  if (!el) return;

  // Conteúdo inicial
  el.innerHTML = '<div class="placeholder">Carregando...</div>';

  const endpoint = usuarioAtual.tipo_usuario === "gestor"
    ? `${BACKEND_URL}/api/gestor/ponto/registros`
    : `${BACKEND_URL}/api/ponto/empresa`;

  try {
    const res = await fetch(endpoint, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } 
    catch(err) {
      console.error("Resposta não é JSON:", text);
      el.innerHTML = `<div class="placeholder">Erro ao carregar registros da empresa.</div>`;
      return;
    }

    if (!res.ok) {
      el.innerHTML = `<div class="placeholder">Erro: ${data.message || "Não foi possível carregar registros da empresa."}</div>`;
      return;
    }

    // Filtra registros do próprio usuário
    const registros = (data.registros || []).filter(r => r.usuario_id !== usuarioAtual.id);

    if (registros.length === 0) {
      el.innerHTML = `<div class="placeholder">Nenhum ponto registrado por outros colaboradores.</div>`;
      return;
    }

    // Renderiza tabela fora da sidebar
    el.innerHTML = `
      <div class="registros-section">
        <h4>Últimos pontos da empresa</h4>
        <table class="tabela-ultimos-pontos">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Horas</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            ${registros.map(reg => `
              <tr>
                <td>${reg.nome}</td>
                <td>${reg.tipo_registro}</td>
                <td>${reg.horas}</td>
                <td>${new Date(reg.data_registro).toLocaleString()}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

  } catch(err) {
    console.error("Erro ao carregar últimos pontos da empresa:", err);
    el.innerHTML = `<div class="placeholder">Erro de conexão com o servidor.</div>`;
  }
}

  // Modal de ponto
  const modalEl = document.getElementById("modalPonto");
  if (modalEl) modalEl.addEventListener('show.bs.modal', pegarUsuario);

  // Botões tipo e hora
  document.querySelectorAll(".tipo-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tipo-btn").forEach(b => b.classList.remove("ativo"));
      btn.classList.add("ativo");
      document.getElementById("tipo_registro").value = btn.dataset.tipo;
    });
  });

  document.querySelectorAll(".hora-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".hora-btn").forEach(b => b.classList.remove("ativo"));
      btn.classList.add("ativo");
      document.getElementById("inputHoras").value = btn.dataset.horas;
    });
  });
/* ===== INÍCIO: QUADRO DE JORNADA (SETORES + COLABORADORES + RESUMO) ===== */

/**
 * Observações:
 * - Usa os mesmos endpoints padrão do backend (mesmo host usado no arquivo).
 * - Se o endpoint específico para pontos de um colaborador no mês não existir,
 *   o código faz fallback para buscar todos os registros da empresa e filtrar localmente.
 */

async function carregarQuadroJornada() {
  if (!usuarioAtual) return;
  const token = localStorage.getItem("token");
  const jornadaTagsEl = document.querySelector(".jornada-tags");
  if (!jornadaTagsEl) return;

  jornadaTagsEl.innerHTML = `<div class="tag">Carregando setores...</div>`;

  try {
    // Busca colaboradores (usamos /api/colaborador/listar?empresa_id=...)
    const url = `${BACKEND_URL}/api/colaborador/listar?empresa_id=${usuarioAtual.empresa_id}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }});
    const data = await res.json();
    const colaboradores = Array.isArray(data) ? data : (data?.data || []);
    if (!colaboradores.length) {
      jornadaTagsEl.innerHTML = `<div class="tag">Nenhum setor/colaborador cadastrado</div>`;
      return;
    }

    // Agrupa por setor
    const setoresMap = {};
    colaboradores.forEach(c => {
      const s = (c.setor || "Sem setor").trim();
      if (!setoresMap[s]) setoresMap[s] = [];
      setoresMap[s].push(c);
    });

    // Renderiza tags (botões)
    jornadaTagsEl.innerHTML = "";
    Object.keys(setoresMap).forEach(setorNome => {
      const btn = document.createElement("button");
      btn.className = "tag btn-setor";
      btn.type = "button";
      btn.dataset.setor = setorNome;
      btn.innerHTML = `${setorNome} <span class="badge">${setoresMap[setorNome].length}</span>`;
      btn.addEventListener("click", () => abrirModalSetor(setorNome, setoresMap[setorNome]));
      jornadaTagsEl.appendChild(btn);
    });

    // Atualiza indicadores gerais (soma das horas do mês e faltantes)
    await atualizarIndicadoresGlobais(colaboradores);

  } catch (err) {
    console.error("Erro ao carregar quadro de jornada:", err);
    const jornadaTagsEl = document.querySelector(".jornada-tags");
    if (jornadaTagsEl) jornadaTagsEl.innerHTML = `<div class="tag">Erro ao carregar setores</div>`;
  }
}

function ensureModalQuadroSetor() {
  if (document.getElementById("modalQuadroSetor")) return;
  const html = `
    <div class="modal fade" id="modalQuadroSetor" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="modalQuadroSetorTitulo">Setor</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
          </div>
          <div class="modal-body">
            <div id="modalQuadroSetorBody">
              <!-- conteúdo dinâmico -->
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", html);
}

function abrirModalSetor(setorNome, colaboradoresDoSetor) {
  ensureModalQuadroSetor();
  const tituloEl = document.getElementById("modalQuadroSetorTitulo");
  const bodyEl = document.getElementById("modalQuadroSetorBody");
  tituloEl.textContent = `Setor: ${setorNome} (${colaboradoresDoSetor.length})`;

  // Monta lista de colaboradores do setor
  bodyEl.innerHTML = colaboradoresDoSetor.map(c => {
    const foto = c.foto ? `/uploads/${c.foto}` : "/img/fundofoda.png";
    const jornada = c.tipo_jornada || "-";
    const horasDiarias = c.horas_diarias ?? "-";
    return `
      <div class="colab-row d-flex align-items-center mb-2" style="gap:1rem; border-bottom:1px solid rgba(255, 255, 255, 0.06); padding-bottom:0.5rem;">
        <img src="${foto}" style="width:56px;height:56px;border-radius:50%;object-fit:cover;border:1px solid rgba(0,0,0,0.08);">
        <div style="flex:1;">
          <div style="font-weight:600;">${c.nome}</div>
          <div class="small text-muted">${c.cargo || ""} • Jornada: ${jornada} • ${horasDiarias}h/dia</div>
        </div>
        <div style="min-width:220px;text-align:right;">
          <button class="btn btn-sm btn-outline-primary btn-ver-resumo" data-id="${c.id}">Ver resumo do mês</button>
        </div>
      </div>
    `;
  }).join("");

  // abre modal e associa eventos nos botões 'Ver resumo do mês'
  const modal = new bootstrap.Modal(document.getElementById("modalQuadroSetor"));
  modal.show();

  // adiciona listeners para botões (depois que o HTML foi inserido)
  bodyEl.querySelectorAll(".btn-ver-resumo").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = btn.dataset.id;
      const colaborador = colaboradoresDoSetor.find(x => String(x.id) === String(id));
      if (!colaborador) return alert("Colaborador não encontrado");
      await abrirResumoColaborador(colaborador);
    });
  });
}

async function abrirResumoColaborador(colaborador) {
  // abre um segundo modal com detalhes (reaproveita modalQuadroSetor ou cria outro)
  const id = colaborador.id;
  const { year, month } = getCurrentYearMonth();
  // tenta endpoint específico, senão faz fallback
  const token = localStorage.getItem("token");

  // cria modal de detalhes se necessário
  if (!document.getElementById("modalResumoColaborador")) {
    document.body.insertAdjacentHTML("beforeend", `
      <div class="modal fade" id="modalResumoColaborador" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="modalResumoColaboradorTitulo">Resumo</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
            </div>
            <div class="modal-body" id="modalResumoColaboradorBody"></div>
          </div>
        </div>
      </div>
    `);
  }

  const bodyEl = document.getElementById("modalResumoColaboradorBody");
  const tituloEl = document.getElementById("modalResumoColaboradorTitulo");
  tituloEl.textContent = `${colaborador.nome} — ${month}/${year}`;

  bodyEl.innerHTML = `<div>Carregando resumo...</div>`;
  const modal = new bootstrap.Modal(document.getElementById("modalResumoColaborador"));
  modal.show();

  try {
    // 1) tenta endpoint específico (convenção usada aqui)
    let pontos = [];
    let triedSpecific = false;
    try {
      const endpointEspecifico = `${BACKEND_URL}/api/gestor/ponto/colaborador/${id}?ano=${year}&mes=${month}`;
      const r = await fetch(endpointEspecifico, { headers: { Authorization: `Bearer ${token}` }});
      if (r.ok) {
        const j = await r.json();
        pontos = Array.isArray(j) ? j : (j?.registros || j?.data || []);
        triedSpecific = true;
      }
    } catch(e) { /* segue para fallback */ }

    // 2) fallback: buscar todos os registros do gestor/empresa e filtrar por usuario_id + mês
    if (!triedSpecific || !pontos.length) {
      const fallbackEndpoint = `${BACKEND_URL}/api/gestor/ponto/registros`;
      const r2 = await fetch(fallbackEndpoint, { headers: { Authorization: `Bearer ${token}` }});
      const j2 = await r2.json();
      const todos = Array.isArray(j2) ? j2 : (j2?.registros || j2?.data || []);
      pontos = (todos || []).filter(p => String(p.usuario_id) === String(id) && isDateInMonth(new Date(p.data_registro), year, month));
    }

    // calcula total de horas no mês e últimos registros
    const totalHoras = pontos.reduce((s, p) => s + (parseFloat(p.horas) || 0), 0);
    const ultimos = pontos.sort((a,b)=> new Date(b.data_registro) - new Date(a.data_registro)).slice(0,6);

    // calcula jornada esperada e faltante
    const expected = calcularHorasEsperadasMes(colaborador, year, month);
    const faltam = Math.max(0, (expected - totalHoras).toFixed(2));

    // monta HTML do resumo
    bodyEl.innerHTML = `
      <div class="mb-3">
        <strong>Total de horas lançadas no mês:</strong> ${Number(totalHoras).toFixed(2)} h
      </div>
      <div class="mb-3">
        <strong>Horas esperadas (estimadas):</strong> ${Number(expected).toFixed(2)} h
      </div>
      <div class="mb-3">
        <strong>Horas faltantes:</strong> ${faltam} h
      </div>
      <hr/>
      <h6>Últimos registros:</h6>
      <div id="ultimosPontosList">
        ${ultimos.length ? ultimos.map(p => `
          <div style="padding:.4rem 0;border-bottom:1px dashed rgba(0,0,0,0.06);">
            <div><strong>${p.tipo_registro}</strong> — ${p.horas} h</div>
            <div class="small text-muted">${new Date(p.data_registro).toLocaleString()}</div>
          </div>
        `).join("") : `<div>Nenhum registro encontrado neste mês.</div>`}
      </div>
    `;
  } catch (err) {
    console.error("Erro ao montar resumo do colaborador:", err);
    bodyEl.innerHTML = `<div class="text-danger">Erro ao carregar resumo.</div>`;
  }
}

function getCurrentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 }; // mês 1-12
}

function isDateInMonth(dateObj, year, month) {
  return dateObj.getFullYear() === Number(year) && (dateObj.getMonth() + 1) === Number(month);
}

function diasDoMes(year, month) {
  return new Date(year, month, 0).getDate(); // month 1-12
}

function contarDiasUteisNoMes(year, month) {
  let count = 0;
  const days = diasDoMes(year, month);
  for (let d = 1; d <= days; d++) {
    const dt = new Date(year, month - 1, d);
    const day = dt.getDay(); // 0-dom,6-sab
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

function contarDiasExcetoDomingos(year, month) {
  let count = 0;
  const days = diasDoMes(year, month);
  for (let d = 1; d <= days; d++) {
    const dt = new Date(year, month - 1, d);
    if (dt.getDay() !== 0) count++;
  }
  return count;
}

/**
 * Estima horas esperadas no mês a partir do colaborador:
 * - se tipo_jornada == '5x2' => conta dias úteis (seg-sex)
 * - se '6x1' => conta todos os dias exceto domingos
 * - se '4x3' => usa proporção 4/7 * dias do mês
 * - se 'flexivel' ou indefinido => assume dias úteis (fallback)
 */
function calcularHorasEsperadasMes(colab, year, month) {
  const horasDiarias = parseFloat(colab.horas_diarias) || 0;
  if (!horasDiarias) return 0;
  const tipo = (colab.tipo_jornada || "").toLowerCase();
  const diasMes = diasDoMes(year, month);

  let diasTrabalhoEstimados = 0;
  if (tipo.includes("5x2")) {
    diasTrabalhoEstimados = contarDiasUteisNoMes(year, month);
  } else if (tipo.includes("6x1")) {
    diasTrabalhoEstimados = contarDiasExcetoDomingos(year, month);
  } else if (tipo.includes("4x3")) {
    diasTrabalhoEstimados = Math.round(diasMes * 4 / 7);
  } else {
    // flexível ou outros -> fallback para dias úteis
    diasTrabalhoEstimados = contarDiasUteisNoMes(year, month);
  }

  return diasTrabalhoEstimados * horasDiarias;
}

/**
 * Atualiza os indicadores #qtrTotal e #qtrFaltante (soma de todos os colaboradores)
 */
async function atualizarIndicadoresGlobais(colaboradoresList) {
  if (!Array.isArray(colaboradoresList)) colaboradoresList = [];
  const { year, month } = getCurrentYearMonth();
  const token = localStorage.getItem("token");

  // tenta otimizar: se houver endpoint que retorne agregados, use-o.
  // Aqui fazemos fallback a calcular por cada colaborador chamando o endpoint de pontos.
  let totalLançado = 0;
  let totalEsperado = 0;

  // buscamos registros da empresa uma vez para reduzir requisições (fallback)
  let registrosEmpresa = null;
  try {
    const r = await fetch(`${BACKEND_URL}/api/gestor/ponto/registros`, { headers: { Authorization: `Bearer ${token}` }});
    const j = await r.json();
    registrosEmpresa = Array.isArray(j) ? j : (j?.registros || j?.data || []);
  } catch (e) {
    registrosEmpresa = null;
  }

  for (const c of colaboradoresList) {
    // total do colaborador (filtra registrosEmpresa se disponível)
    let pontosCol = [];
    if (Array.isArray(registrosEmpresa)) {
      pontosCol = registrosEmpresa.filter(p => String(p.usuario_id) === String(c.id) && isDateInMonth(new Date(p.data_registro), year, month));
    } else {
      // tenta endpoint específico por colaborador
      try {
        const r2 = await fetch(`${BACKEND_URL}/api/gestor/ponto/colaborador/${c.id}?ano=${year}&mes=${month}`, { headers: { Authorization: `Bearer ${token}` }});
        const j2 = await r2.json();
        pontosCol = Array.isArray(j2) ? j2 : (j2?.registros || j2?.data || []);
      } catch(e) { pontosCol = []; }
    }
    const soma = pontosCol.reduce((s, p) => s + (parseFloat(p.horas) || 0), 0);
    totalLançado += soma;
    totalEsperado += calcularHorasEsperadasMes(c, year, month);
  }

  const qtrTotalEl = document.getElementById("qtrTotal");
  const qtrFaltanteEl = document.getElementById("qtrFaltante");
  if (qtrTotalEl) qtrTotalEl.textContent = Number(totalLançado).toFixed(2);
  if (qtrFaltanteEl) qtrFaltanteEl.textContent = Number(Math.max(0, totalEsperado - totalLançado)).toFixed(2);
}

/* ===== FIM: QUADRO DE JORNADA ===== */

/* ===== LOCAL: chamar carregarQuadroJornada() ao final de pegarUsuario() =====
   Dentro da função pegarUsuario(), após:
     carregarUltimosPontos();
     carregarUltimosPontosEmpresa();
   adicione:
     carregarQuadroJornada();
*/

  // Submit do formulário de ponto
  formPonto?.addEventListener("submit", async (e) => {
    e.preventDefault();
    limparMensagem();

    const token = localStorage.getItem("token");
    if (!token) return mostrarMensagem("❌ Usuário não autenticado.", "danger");
    if (!usuarioAtual) return mostrarMensagem("❌ Dados do usuário não carregados.", "danger");

    const tipo = document.getElementById("tipo_registro").value;
    const horas = document.getElementById("inputHoras").value;
    if (!tipo || !horas) return mostrarMensagem("❌ Selecione tipo e horas.", "warning");

    const bodyData = { tipo_registro: tipo, horas: parseFloat(horas) };

    try {
      const res = await fetch(`${BACKEND_URL}/api/ponto/registrar`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bodyData)
      });

      const data = await res.json();
      if (res.ok) {
        mostrarMensagem("✅ Ponto registrado com sucesso!", "success");
        const modal = bootstrap.Modal.getInstance(modalEl);
        setTimeout(() => modal.hide(), 1200);
        carregarUltimosPontos();
        carregarUltimosPontosEmpresa();
      } else {
        mostrarMensagem("❌ " + (data.message || "Falha ao registrar ponto."), "danger");
      }
    } catch (err) {
      console.error(err);
      mostrarMensagem("Erro de conexão com servidor.", "danger");
    }
  });

  // Botão de atualizar manualmente
  document.getElementById("btnAtualizar")?.addEventListener("click", () => {
    carregarUltimosPontos();
    carregarUltimosPontosEmpresa();
  });

  // Carrega ao abrir a página
  pegarUsuario();
});
