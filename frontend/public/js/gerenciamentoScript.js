// public/js/gerenciamentoScript.js
console.log("gerenciamentoScript.js carregado");

document.addEventListener("DOMContentLoaded", () => {
  const BACKEND_URL = "http://localhost:3001/api";
  let token = localStorage.getItem("token");

  // ===== ELEMENTOS =====
  const formColaborador = document.getElementById("formColaborador");
  const btnRegistrar = document.getElementById("btnRegistrarColaborador");
  const btnAbrirSetor = document.getElementById("btnCadastrarSetor");

  const modalEl = document.getElementById("modalColaborador");
  const modalColab = modalEl ? new bootstrap.Modal(modalEl) : null;

  const modalSetorEl = document.getElementById("modalSetor");
  const modalSetor = modalSetorEl ? new bootstrap.Modal(modalSetorEl) : null;

  const fotoInput = document.getElementById("foto");
  const previewImage = document.getElementById("previewFoto");

  const setorSelect = document.getElementById("filtroSetor") || document.querySelector(".sidebar select.form-select");
  const listaSetores = document.getElementById("listaSetores");
  const cardRow = document.getElementById("listaColaboradores");

  const overlay = document.getElementById("overlayColaborador");
  const colabSelecionadoContainer = document.getElementById("colabSelecionadoContainer");
  const colabSelecionadoFoto = document.getElementById("colabSelecionadoFoto");
  const colabSelecionadoNome = document.getElementById("colabSelecionadoNome");
  const colabSelecionadoCPF = document.getElementById("colabSelecionadoCPF");
  const colabSelecionadoMatricula = document.getElementById("colabSelecionadoMatricula");
  const colabSelecionadoCargo = document.getElementById("colabSelecionadoCargo");
  const colabSelecionadoSetor = document.getElementById("colabSelecionadoSetor");
  const colabSelecionadoJornada = document.getElementById("colabSelecionadoJornada");
  const colabSelecionadoHoras = document.getElementById("colabSelecionadoHoras");
  const colabSelecionadoSalario = document.getElementById("colabSelecionadoSalario");
  const colabSelecionadoBeneficios = document.getElementById("colabSelecionadoBeneficios");

  const btnExcluirColab = document.getElementById("btnExcluirColab");
  const btnEditarColab = document.getElementById("btnEditarColab");
  const btnFecharColab = document.getElementById("btnFecharColab");

  const buscaInput = document.getElementById("buscaColaborador");
  const inputCargo = document.getElementById("cargo");
  const selectBeneficios = document.getElementById("beneficios");
const formCadastro = document.getElementById("form-cadastro");
  let usuarioAtual = null;
  let colaboradores = [];
  let colaboradorSelecionado = null;

  // ===== HELPERS =====
  const mostrarMensagem = (msg, tipo = "info") => {
    try { alert(msg); } catch { console.log(msg); }
  };

  const tokenValido = (tokenStr) => {
    if (!tokenStr) return false;
    try {
      const payload = JSON.parse(atob(tokenStr.split(".")[1]));
      return payload.exp * 1000 > Date.now();
    } catch { return false; }
  };

  const safeJson = async (res) => {
    try { return await res.json(); } catch { return null; }
  };

  const resetarModalColaborador = () => {
    colaboradorSelecionado = null;
    if (modalColab) modalColab.hide();
    if (overlay) overlay.style.display = "none";
    formColaborador?.reset();
    if (previewImage) previewImage.src = "/img/fundofoda.png";
    const titulo = document.getElementById("tituloModalColaborador");
    if (titulo) titulo.textContent = "Cadastrar Colaborador";
  };

  // ===== TOKEN =====
  if (!tokenValido(token)) {
    alert("Sua sessão expirou. Faça login novamente.");
    localStorage.removeItem("token");
    window.location.href = "/login";
    return;
  }

  // ===== PREVIEW FOTO =====
  if (previewImage) previewImage.src = "/img/fundofoda.png";
  fotoInput?.addEventListener("change", () => {
    const file = fotoInput.files[0];
    if (previewImage) previewImage.src = file ? URL.createObjectURL(file) : "/img/fundofoda.png";
  });

  // ===== FETCH HELPERS =====
  const fetchJSON = async (url, options = {}) => {
    options.headers = { ...options.headers, Authorization: `Bearer ${token}` };
    options.credentials = "include";
    const res = await fetch(url, options);
    const data = await safeJson(res);
    return { ok: res.ok, data };
  };

  // ===== USUÁRIO LOGADO =====
  const pegarUsuario = async () => {
    if (usuarioAtual) return usuarioAtual;
    const { ok, data } = await fetchJSON(`${BACKEND_URL}/gestor/me`);
    usuarioAtual = ok ? (data?.usuario || data?.data) : null;
    return usuarioAtual;
  };

  // ===== CARREGAR SETORES =====
  const carregarSetores = async () => {
    if (!usuarioAtual) await pegarUsuario();
    if (!usuarioAtual || !listaSetores) return;
    const { ok, data } = await fetchJSON(`${BACKEND_URL}/setor/listar?empresa_id=${usuarioAtual.empresa_id}`);
    const setores = Array.isArray(data) ? data : (data?.data || []);
    listaSetores.innerHTML = "";
    setores.forEach(s => {
      const li = document.createElement("li");
      li.textContent = s.nome_setor || s.nome || s;
      listaSetores.appendChild(li);
    });
  };

  // ===== CARREGAR COLABORADORES =====
  const carregarColaboradores = async (setorFiltro = "") => {
    if (!usuarioAtual) await pegarUsuario();
    if (!usuarioAtual) {
      colaboradores = [];
      renderizarColaboradores([]);
      return;
    }

    const url = `${BACKEND_URL}/colaborador/listar?empresa_id=${usuarioAtual.empresa_id}` +
                (setorFiltro ? `&setor=${encodeURIComponent(setorFiltro)}` : "");
    const { ok, data } = await fetchJSON(url);
    colaboradores = Array.isArray(data) ? data : (data?.data || []);
    colaboradores = colaboradores.map(c => {
      if (c && typeof c.salario === "string") {
        const parsed = parseFloat(c.salario);
        c.salario = isNaN(parsed) ? c.salario : parsed;
      }
      return c;
    });
    preencherFiltroSetores(colaboradores);
    renderizarColaboradores();
  };

  // ===== FILTRO DE SETORES =====
  const preencherFiltroSetores = (list) => {
    if (!setorSelect) return;
    const setores = Array.from(new Set(list.map(c => (c.setor || "").toString().trim()).filter(Boolean)));
    setorSelect.innerHTML = `<option value="">Todos os setores</option>`;
    setores.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s; opt.textContent = s;
      setorSelect.appendChild(opt);
    });
  };

  // ===== RENDER COLABORADORES =====
  const renderizarColaboradores = (list = colaboradores) => {
    if (!cardRow) return;
    cardRow.innerHTML = "";

    if (!list || list.length === 0) {
      cardRow.innerHTML = `<p>Nenhum colaborador encontrado.</p>`;
      return;
    }

    const setoresMap = {};
    list.forEach(c => {
      const setor = c.setor || "Sem setor";
      if (!setoresMap[setor]) setoresMap[setor] = [];
      setoresMap[setor].push(c);
    });

    for (const setor in setoresMap) {
      const divSetor = document.createElement("div");
      divSetor.classList.add("setor-container");

      const titulo = document.createElement("h5");
      titulo.textContent = setor;
      titulo.classList.add("setor-titulo");
      divSetor.appendChild(titulo);

      const cardsContainer = document.createElement("div");
      cardsContainer.classList.add("listagem-colaboradores-setor");

      setoresMap[setor].forEach(c => {
        const card = document.createElement("div");
        card.classList.add("item-colaborador", "glass-card");
        const fotoSrc = c.foto ? `/uploads/${c.foto}` : "/img/fundofoda.png";
        const salarioTexto = (typeof c.salario !== "undefined" && c.salario !== null && c.salario !== 0)
          ? Number(c.salario).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
          : "R$ 0,00";

        card.innerHTML = `
          <img src="${fotoSrc}" alt="Foto de ${c.nome}">
          <h6 class="nome">${c.nome}</h6>
          <p class="cargo">${c.cargo || "-"}</p>
          <p class="salario small text-muted">${salarioTexto}</p>
        `;

        card.addEventListener("click", () => selecionarColaborador(c));
        cardsContainer.appendChild(card);
      });

      divSetor.appendChild(cardsContainer);
      cardRow.appendChild(divSetor);
    }
  };

  // ===== SELECIONAR COLABORADOR (overlay) =====
  const selecionarColaborador = (colab) => {
    colaboradorSelecionado = colab;

    colabSelecionadoFoto.src = colab.foto ? "/uploads/" + colab.foto : "/img/fundofoda.png";
    colabSelecionadoNome.textContent = colab.nome;
    colabSelecionadoCPF.textContent = "CPF: " + (colab.cpf || "-");
    colabSelecionadoMatricula.textContent = "Matrícula: " + (colab.numero_registro || "-");
    colabSelecionadoCargo.textContent = "Cargo: " + (colab.cargo || "-");
    colabSelecionadoSetor.textContent = "Setor: " + (colab.setor || "-");
    colabSelecionadoJornada.textContent = "Jornada: " + (colab.tipo_jornada || "-");
    colabSelecionadoHoras.textContent = "Horas diárias: " + (colab.horas_diarias || "-");
    colabSelecionadoSalario.textContent = (colab.salario || colab.salario === 0)
      ? `Salário: ${Number(colab.salario).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}`
      : "Salário: Não definido";

    colabSelecionadoBeneficios.innerHTML = "";
    if (Array.isArray(colab.beneficios) && colab.beneficios.length) {
      colab.beneficios.forEach(b => {
        const li = document.createElement("li");
        li.textContent = `${b.nome_do_beneficio || b.nome || "Benefício"} - ${Number(b.valor_aplicado || b.valor_personalizado || 0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}`;
        colabSelecionadoBeneficios.appendChild(li);
      });
    } else {
      colabSelecionadoBeneficios.innerHTML = "<li>Nenhum benefício cadastrado</li>";
    }

    if (overlay) overlay.style.display = "flex";
  };

  overlay?.addEventListener("click", e => { if(e.target === overlay) resetarModalColaborador(); });
  btnFecharColab?.addEventListener("click", resetarModalColaborador);

  // ===== CARREGAR BENEFÍCIOS POR CARGO =====
// ===== CARREGAR BENEFÍCIOS POR CARGO =====
const carregarBeneficiosPorCargo = async (cargo) => {
  const container = document.getElementById("containerBeneficios");
  if (!container) return;
  container.innerHTML = "";

  if (!cargo) {
    const p = document.createElement("p");
    p.className = "text-muted";
    p.textContent = "Digite o cargo para listar benefícios disponíveis.";
    container.appendChild(p);
    return [];
  }

  if (!usuarioAtual) await pegarUsuario();
  if (!usuarioAtual) return [];

  try {
    const res = await fetch(`${BACKEND_URL}/colaborador/beneficios/cargo?cargo=${encodeURIComponent(cargo)}&usuario_id=${colaboradorSelecionado?.id || ""}`, {      headers: { Authorization: `Bearer ${token}` },
      credentials: "include"
    });

    if (!res.ok) throw new Error("Falha ao listar benefícios");

    const data = await safeJson(res);
    const beneficios = Array.isArray(data) ? data : (data?.data || []);

    if (!beneficios.length) {
      const p = document.createElement("p");
      p.className = "text-muted";
      p.textContent = "Nenhum benefício disponível para este cargo.";
      container.appendChild(p);
      return [];
    }

    // ids ou nomes dos benefícios já selecionados (caso de edição)
    const selecionados = new Set();
    if (Array.isArray(colaboradorSelecionado?.beneficios)) {
      colaboradorSelecionado.beneficios.forEach(b => {
        if (b.beneficio_id) selecionados.add(String(b.beneficio_id));
      });
    }

    beneficios.forEach(b => {
      const id = b.id ?? b.beneficio_id ?? JSON.stringify(b);
      const nome = b.nome_do_beneficio || b.nome || "Benefício";
      const valor = Number(b.valor_aplicado ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

      const div = document.createElement("div");
      div.classList.add("form-check");

      const input = document.createElement("input");
      input.type = "checkbox";
      input.classList.add("form-check-input");
      input.id = "beneficio_" + id;
      input.value = id;
      input.checked = selecionados.has(String(id));
      input.dataset.valor = b.valor_aplicado ?? 0;

      const label = document.createElement("label");
      label.classList.add("form-check-label");
      label.setAttribute("for", input.id);
      label.textContent = `${nome} - ${valor}`;

      div.appendChild(input);
      div.appendChild(label);
      container.appendChild(div);
    });

    return beneficios;
  } catch (err) {
    console.error("Erro ao carregar benefícios por cargo:", err);
    const p = document.createElement("p");
    p.className = "text-muted";
    p.textContent = "Erro ao carregar benefícios.";
    container.appendChild(p);
    return [];
  }
};

// ===== EVENTO AO DIGITAR/ALTERAR CARGO =====
// inputCargo?.addEventListener("input", async () => {
//   const cargo = inputCargo.value.trim();
//   await carregarBeneficiosPorCargo(cargo);
// });


  // ===== ATUALIZA BENEFÍCIOS AO DIGITAR/ALTERAR CARGO =====
inputCargo?.addEventListener("input", async () => {
  const cargo = inputCargo.value.trim();
  const containerBeneficios = document.getElementById("containerBeneficios");
  if (!containerBeneficios) return;

  containerBeneficios.innerHTML = ""; // limpa container

  if (!cargo) {
    const p = document.createElement("p");
    p.className = "text-muted";
    p.textContent = "Digite o cargo para listar benefícios disponíveis.";
    containerBeneficios.appendChild(p);
    return;
  }

  if (!usuarioAtual) await pegarUsuario();
  if (!usuarioAtual) return;

  try {
    const res = await fetch(`${BACKEND_URL}/colaborador/beneficios/cargo?cargo=${encodeURIComponent(cargo)}&usuario_id=${colaboradorSelecionado?.id || ""}`,  {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include"
    });

    if (!res.ok) throw new Error("Falha ao listar benefícios");

    const data = await safeJson(res);
    const beneficios = Array.isArray(data) ? data : (data?.data || []);

    if (!beneficios.length) {
      const p = document.createElement("p");
      p.className = "text-muted";
      p.textContent = "Nenhum benefício disponível para este cargo.";
      containerBeneficios.appendChild(p);
      return;
    }

    // ids ou nomes dos benefícios já selecionados (no caso de edição)
    const selecionados = new Set();
    if (Array.isArray(colaboradorSelecionado?.beneficios)) {
      colaboradorSelecionado.beneficios.forEach(b => {
        if (b.id) selecionados.add(String(b.id));
        if (b.nome_do_beneficio) selecionados.add(String(b.nome_do_beneficio).trim());
      });
    }

    beneficios.forEach(b => {
      const id = b.id ?? b.nome_do_beneficio ?? JSON.stringify(b);
      const nome = b.nome_do_beneficio || b.nome || "Benefício";
      const valor = Number(b.valor_aplicado || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

      const div = document.createElement("div");
      div.classList.add("form-check");

      const input = document.createElement("input");
      input.type = "checkbox";
      input.classList.add("form-check-input");
      input.id = "beneficio_" + id;
      input.value = id;
      if (selecionados.has(String(id))) input.checked = true;

      const label = document.createElement("label");
      label.classList.add("form-check-label");
      label.setAttribute("for", input.id);
      label.textContent = `${nome} - ${valor}`;

      div.appendChild(input);
      div.appendChild(label);
      containerBeneficios.appendChild(div);
    });

  } catch (err) {
    console.error("Erro ao carregar benefícios:", err);
    const p = document.createElement("p");
    p.className = "text-muted";
    p.textContent = "Erro ao carregar benefícios.";
    containerBeneficios.appendChild(p);
  }
});


  // ===== ABRIR MODAL CADASTRO =====
  btnRegistrar?.addEventListener("click", async () => {
    if (!usuarioAtual) await pegarUsuario();
    if (!usuarioAtual) return;

    resetarModalColaborador();
    const titulo = document.getElementById("tituloModalColaborador");
    if (titulo) titulo.textContent = "Cadastrar Colaborador";
    modalColab?.show();

    try {
      const { ok, data } = await fetchJSON(`${BACKEND_URL}/colaborador/nextRegistro?empresa_id=${usuarioAtual.empresa_id}`);
      if (ok) document.getElementById("numero_registro").value = data?.proximoRegistro || "C001";
    } catch (err) { console.error("Erro nextRegistro:", err); }
  });

  // ===== BOTÃO EDITAR =====
// ===== BOTÃO EDITAR / CARREGAR BENEFÍCIOS COMO CHECKBOXES =====
// ===== BOTÃO EDITAR (abre modal e pré-preenche) =====
// ===== BOTÃO EDITAR (abre modal e pré-preenche) =====
// ===== BOTÃO EDITAR (abre modal e pré-preenche) =====
// ===== CARREGAR BENEFÍCIOS DO USUÁRIO NO EDIT =====
// ===== CARREGAR BENEFÍCIOS DO USUÁRIO =====
const carregarBeneficiosUsuario = async (usuarioId) => {
  const container = document.getElementById("containerBeneficios");
  if (!container) return;
  container.innerHTML = "";

  try {
    const res = await fetch(`${BACKEND_URL}/colaborador/${usuarioId}/beneficios`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include"
    });

    if (!res.ok) throw new Error("Falha ao carregar benefícios");

    const data = await res.json();
    const beneficios = Array.isArray(data) ? data : (data?.data || []);

    if (!beneficios.length) {
      const p = document.createElement("p");
      p.className = "text-muted";
      p.textContent = "Nenhum benefício cadastrado para este usuário.";
      container.appendChild(p);
      return [];
    }

    beneficios.forEach(b => {
      const id = b.beneficio_id;
      const nome = b.nome_do_beneficio || "Benefício";
      const valor = Number(b.valor_personalizado ?? 0)
                    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

      const div = document.createElement("div");
      div.classList.add("form-check");

      const input = document.createElement("input");
      input.type = "checkbox";
      input.classList.add("form-check-input");
      input.id = "beneficio_" + id;
      input.value = id;
      input.checked = true;
      input.dataset.valor = b.valor_personalizado ?? 0;

      const label = document.createElement("label");
      label.classList.add("form-check-label");
      label.setAttribute("for", input.id);
      label.textContent = `${nome} - ${valor}`;

      div.appendChild(input);
      div.appendChild(label);
      container.appendChild(div);
    });

    return beneficios;
  } catch (err) {
    console.error("Erro ao carregar benefícios do usuário:", err);
    const p = document.createElement("p");
    p.className = "text-muted";
    p.textContent = "Erro ao carregar benefícios do usuário";
    container.appendChild(p);
    return [];
  }
};

// ===== ABRIR MODAL PARA EDIÇÃO =====
// btnEditarColab?.addEventListener("click", async () => {
//   if (!colaboradorSelecionado) return;
//   if (overlay) overlay.style.display = "none";

//   const campos = ["numero_registro", "nome", "cpf", "cargo", "setor", "tipo_jornada", "horas_diarias", "salario"];
//   campos.forEach(campo => {
//     const el = document.getElementById(campo);
//     if (el) el.value = colaboradorSelecionado[campo] ?? "";
//   });

//   if (previewImage) {
//     previewImage.src = colaboradorSelecionado.foto ? `/uploads/${colaboradorSelecionado.foto}` : "/img/fundofoda.png";
//   }

//   const titulo = document.getElementById("tituloModalColaborador");
//   if (titulo) titulo.textContent = "Editar Colaborador";

//   // Carregar benefícios do usuário
//   await carregarBeneficiosUsuario(colaboradorSelecionado.id);

//   modalColab?.show();
// });

// ===== SUBMIT UNIFICADO PARA CADASTRO/EDIÇÃO =====
// ===== SUBMIT UNIFICADO PARA CADASTRO/EDIÇÃO =====
formColaborador?.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!usuarioAtual) await pegarUsuario();
  if (!usuarioAtual) return mostrarMensagem("❌ Gestor não autenticado.", "danger");

  // === Benefícios selecionados ===
  const containerBeneficios = document.getElementById("containerBeneficios");
  const checkboxes = containerBeneficios?.querySelectorAll("input[type='checkbox']:checked") || [];
  
  // Mapear todos os dados necessários
  const beneficiosSelecionados = Array.from(checkboxes).map(cb => ({
    beneficio_id: cb.value,
    nome_do_beneficio: cb.dataset.nome || cb.dataset.label || "",
    descricao: cb.dataset.descricao || "",
    valor_personalizado: parseFloat(cb.dataset.valor) || 0
  }));

  // === FormData ===
  const formData = new FormData(formColaborador);
  formData.append("empresa_id", usuarioAtual.empresa_id);
  formData.append("cnpj", usuarioAtual.cnpj || "");
  formData.append("beneficios", JSON.stringify(beneficiosSelecionados));

  const salarioVal = document.getElementById("salario")?.value;
  if (salarioVal !== undefined) formData.append("salario", salarioVal);

  if (colaboradorSelecionado) formData.append("id", colaboradorSelecionado.id);
  if (!fotoInput.files[0]) formData.append("foto", ""); // garante envio mesmo sem foto

  try {
    const url = colaboradorSelecionado
      ? `${BACKEND_URL}/colaborador/atualizar`
      : `${BACKEND_URL}/colaborador/register`;
    const method = colaboradorSelecionado ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
      credentials: "include"
    });

    let data = null;
    try { data = await res.json(); } catch {}

    if (!res.ok) {
      console.error("Erro ao salvar colaborador:", res.status, data);
      return mostrarMensagem("❌ " + (data?.message || "Erro ao salvar colaborador"), "danger");
    }

    // === SUCESSO ===
    mostrarMensagem(colaboradorSelecionado
      ? "✅ Colaborador atualizado!"
      : "✅ Colaborador cadastrado!", "success");

    resetarModalColaborador();
    await carregarSetores();
    await carregarColaboradores(setorSelect?.value || "");
  } catch (err) {
    console.error("Erro de conexão ao salvar colaborador:", err);
    mostrarMensagem("Erro de conexão com servidor.", "danger");
  }
});


// ===== BOTÃO EDITAR =====
btnEditarColab?.addEventListener("click", async () => {
  if (!colaboradorSelecionado) return;
  if (overlay) overlay.style.display = "none";

  document.getElementById("numero_registro").value = colaboradorSelecionado.numero_registro || "";
  document.getElementById("nome").value = colaboradorSelecionado.nome || "";
  document.getElementById("cpf").value = colaboradorSelecionado.cpf || "";
  document.getElementById("cargo").value = colaboradorSelecionado.cargo || "";
  document.getElementById("setor").value = colaboradorSelecionado.setor || "";
  document.getElementById("tipo_jornada").value = colaboradorSelecionado.tipo_jornada || "";
  document.getElementById("horas_diarias").value = colaboradorSelecionado.horas_diarias || "";
  document.getElementById("salario").value = colaboradorSelecionado.salario ?? "";

  if (previewImage) {
    previewImage.src = colaboradorSelecionado.foto ? `/uploads/${colaboradorSelecionado.foto}` : "/img/fundofoda.png";
  }

  const titulo = document.getElementById("tituloModalColaborador");
  if (titulo) titulo.textContent = "Editar Colaborador";

  // Carregar benefícios do usuário
  await carregarBeneficiosUsuario(colaboradorSelecionado.id);

  modalColab?.show();
});

// ===== SUBMIT DO FORMULARIO =====
// formColaborador?.addEventListener("submit", async (e) => {
//   e.preventDefault();
//   if (!usuarioAtual) await pegarUsuario();
//   if (!usuarioAtual) return mostrarMensagem("❌ Gestor não autenticado.", "danger");

//   const containerBeneficios = document.getElementById("containerBeneficios");
//   const checkboxes = containerBeneficios?.querySelectorAll("input[type='checkbox']:checked") || [];
//   const beneficiosSelecionados = Array.from(checkboxes).map(cb => ({
//     beneficio_id: cb.value,
//     valor_personalizado: cb.dataset.valor || 0
//   }));

//   const formData = new FormData(formColaborador);
//   formData.append("empresa_id", usuarioAtual.empresa_id);
//   formData.append("cnpj", usuarioAtual.cnpj || "");
//   formData.append("beneficios", JSON.stringify(beneficiosSelecionados));

//   if (colaboradorSelecionado) formData.append("id", colaboradorSelecionado.id);
//   if (!fotoInput.files[0]) formData.append("foto", "");

//   try {
//     const url = colaboradorSelecionado ? `${BACKEND_URL}/colaborador/atualizar` : `${BACKEND_URL}/colaborador/register`;
//     const method = colaboradorSelecionado ? "PUT" : "POST";

//     const res = await fetch(url, {
//       method,
//       headers: { Authorization: `Bearer ${token}` },
//       body: formData,
//       credentials: "include"
//     });

//     const data = await safeJson(res);
//     if (!res.ok) {
//       console.error("Erro ao salvar colaborador:", res.status, data);
//       return mostrarMensagem("❌ " + (data?.message || "Erro ao salvar colaborador"), "danger");
//     }

//     mostrarMensagem(colaboradorSelecionado ? "✅ Colaborador atualizado!" : "✅ Colaborador cadastrado!", "success");

//     resetarModalColaborador();
//     await carregarSetores();
//     await carregarColaboradores(setorSelect?.value || "");
//   } catch (err) {
//     console.error("Erro ao salvar colaborador:", err);
//     mostrarMensagem("Erro de conexão com servidor.", "danger");
//   }
// });

  // ===== FILTRO SETOR =====
  setorSelect?.addEventListener("change",()=>carregarColaboradores(setorSelect?.value||""));

  // ===== BUSCA =====
  buscaInput?.addEventListener("input",()=>{
    const texto=(buscaInput.value||"").toLowerCase();
    const filtrados=colaboradores.filter(c=>
      (c.nome||"").toLowerCase().includes(texto)||
      (c.cpf||"").includes(texto)||
      (c.numero_registro||"").includes(texto)
    );
    renderizarColaboradores(filtrados);
  });

  // ===== EXCLUIR COLABORADOR =====
  btnExcluirColab?.addEventListener("click", async ()=>{
    if(!colaboradorSelecionado) return;
    if(!confirm(`Deseja realmente excluir ${colaboradorSelecionado.nome}?`)) return;
    try{
      const { ok } = await fetchJSON(`${BACKEND_URL}/colaborador/${colaboradorSelecionado.id}`, {method:"DELETE"});
      if(!ok) throw new Error("Erro ao excluir");
      mostrarMensagem(`✅ Colaborador ${colaboradorSelecionado.nome} excluído`,"success");
      resetarModalColaborador();
      await carregarColaboradores(setorSelect?.value||"");
    } catch(err){ console.error(err); mostrarMensagem("Erro ao excluir colaborador","danger"); }
  });

  // ===== INICIALIZAÇÃO =====
  (async ()=>{
    await pegarUsuario();
    await carregarSetores();
    await carregarColaboradores();
  })();
});
