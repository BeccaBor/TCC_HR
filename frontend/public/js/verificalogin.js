// // verificarLogin.js
// document.addEventListener("DOMContentLoaded", () => {
//     const token = localStorage.getItem("token") || sessionStorage.getItem("token");

//     // Se não houver token, redireciona imediatamente para a página de login
//     if (!token) {
//         window.location.href = "/";
//         return;
//     }
    
//     // Agora, faça uma requisição para uma rota protegida para validar o token no servidor
//     // A rota /colaborador/dados é perfeita, pois ela apenas verifica e retorna um JSON
//     fetch("http://localhost:3001/colaborador/dados", {
//         headers: {
//             "Authorization": `Bearer ${token}`
//         }
//     })
//     .then(res => {
//         if (!res.ok) {
//             // Se a resposta não for OK (token inválido/expirado), remove o token
//             localStorage.removeItem("token");
//             sessionStorage.removeItem("token");
//             window.location.href = "/";
//         }
//     })
//     .catch(() => {
//         // Se a requisição falhar (erro de rede), também redireciona
//         localStorage.removeItem("token");
//         sessionStorage.removeItem("token");
//         window.location.href = "/";
//     });
// });