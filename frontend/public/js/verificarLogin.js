document.addEventListener("DOMContentLoaded", async () => {
  // Pegar token do LocalStorage, SessionStorage ou cookie
  let token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token && document.cookie.includes("token=")) {
    const match = document.cookie.match(/token=([^;]+)/);
    if (match) token = match[1];
  }

  const BACKEND = window.BACKEND_URL || "http://localhost:3001";

  // Se não houver token, apenas limpa e não redireciona
  if (!token) {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    return;
  }

  try {
    const res = await fetch(`${BACKEND}/auth/me`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      return;
    }

    const data = await res.json();
    const tipo = data.usuario.tipo_usuario?.toLowerCase();

    // Redirecionamento condicional apenas se estiver na página errada
    const path = window.location.pathname;

    if (tipo === "gestor" && !path.startsWith("/gestor")) {
      window.location.href = "/gestor/documentacao";
    } else if (tipo === "colaborador" && !path.startsWith("/colaborador")) {
      window.location.href = "/colaborador/holerites";
    }
  } catch (err) {
    console.error("Erro ao validar token:", err);
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
  }
});
