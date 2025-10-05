// frontend/public/js/verificarLogin.js
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🔍 verificarLogin.js carregado. Verificando autenticação..."); // LOG

  // Pegar token do LocalStorage, SessionStorage ou cookie
  let token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token && document.cookie.includes("token=")) {
    const match = document.cookie.match(/token=([^;]+)/);
    if (match) token = match[1];
  }

  console.log("🔑 Token encontrado?", token ? `${token.substring(0, 20)}...` : "Não"); // LOG parcial

  // CORRIGIDO: Se não houver token, não faz nada (não redireciona nem remove – só loga)
  if (!token) {
    console.warn("⚠️ Nenhum token encontrado. Página acessível sem autenticação (ex: home)."); // LOG
    localStorage.removeItem("token"); // Limpa se houver resquícios
    sessionStorage.removeItem("token");
    return; // Não redireciona – permite acesso público
  }

  // CORRIGIDO: BACKEND_URL padronizado para 3000 + /api
  const BACKEND_URL = "http://localhost:3000";
  const urlValidacao = `${BACKEND_URL}/api/auth/me`; // CORRIGIDO: Adicionado /api
  console.log("🌐 Validando token em:", urlValidacao); // LOG

  try {
    const res = await fetch(urlValidacao, {
      method: "GET", // Específico para GET
      headers: { "Authorization": `Bearer ${token}` }
    });

    const data = await res.json();
    console.log("📥 Resposta de /api/auth/me:", data, "Status:", res.status); // LOG

    // CORRIGIDO: Só remove token em 401 (inválido/expirado). Em outros erros (ex: 500, rede), mantém
    if (res.status === 401) {
      console.warn("❌ Token inválido (401). Removendo..."); // LOG
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      // Opcional: Redireciona para home se em página protegida
      if (window.location.pathname !== "/" && window.location.pathname !== "/home") {
        window.location.href = "/";
      }
      return;
    }

    if (!res.ok || !data.success || !data.usuario) {
      console.warn("⚠️ Validação falhou (não 200 ou sem dados). Mantendo token, mas sem redirecionamento."); // LOG
      return; // Não remove token – pode ser erro temporário
    }

    const tipo = data.usuario.tipo_usuario?.toLowerCase();
    console.log("✅ Token válido. Tipo de usuário:", tipo); // LOG

    // Redirecionamento condicional apenas se estiver na página errada
    const path = window.location.pathname;
    console.log("📍 Página atual:", path); // LOG

    if (tipo === "gestor" && !path.startsWith("/gestor")) {
      console.log("🔄 Redirecionando gestor para /gestor/documentacao"); // LOG
      window.location.href = "/gestor/documentacao";
    } else if (tipo === "colaborador" && !path.startsWith("/colaborador")) {
      console.log("🔄 Redirecionando colaborador para /colaborador/holerites"); // LOG
      window.location.href = "/colaborador/holerites";
    } else {
      console.log("✅ Usuário na página correta. Sem redirecionamento."); // LOG
    }
  } catch (err) {
    console.error("❌ Erro ao validar token (rede/fetch):", err); // LOG
    // CORRIGIDO: NÃO remove token em erro de rede – só loga
    console.warn("⚠️ Erro de conexão. Mantendo token para tentativas futuras.");
    // Opcional: Se quiser ser mais estrito, remova só se for erro específico
  }
});