// console.log("setorScript.js carregado");

// document.addEventListener("DOMContentLoaded", () => {
//   const BACKEND_URL = "http://localhost:3001";
//   const token = localStorage.getItem("token");

//   const formSetor = document.getElementById("formSetor");
//   const listaSetores = document.getElementById("listaSetores");

//   if (formSetor) {
//     formSetor.addEventListener("submit", async (e) => {
//       e.preventDefault();

//       const nome = document.getElementById("nome_setor").value.trim();
//       const descricao = document.getElementById("descricao_setor").value.trim();

//       if (!nome) return alert("❌ O nome do setor é obrigatório.");

//       try {
//         const response = await fetch(`${BACKEND_URL}/setor/register`, {
//           method: "POST",
//           headers: {
//             "Authorization": `Bearer ${token}`,
//             "Content-Type": "application/json"
//           },
//           body: JSON.stringify({ nome, descricao }),
//           credentials: "include"
//         });

//         const data = await response.json();

//         if (response.ok) {
//           alert("✅ Setor cadastrado com sucesso!");
//           formSetor.reset();
//           carregarSetores();
//         } else {
//           alert(`❌ Erro ao cadastrar setor: ${data.message || "Tente novamente."}`);
//         }
//       } catch (err) {
//         console.error("Erro de conexão ao cadastrar setor:", err);
//         alert("❌ Erro de conexão ao cadastrar setor.");
//       }
//     });
//   }

//   async function carregarSetores() {
//     if (!listaSetores) return;
//     try {
//       const response = await fetch(`${BACKEND_URL}/setor/listar`, {
//         headers: { "Authorization": `Bearer ${token}` }
//       });
//       const setores = await response.json();

//       if (!response.ok) {
//         alert(`❌ Erro ao listar setores: ${setores.message || "Tente novamente."}`);
//         return;
//       }

//       listaSetores.innerHTML = "";
//       setores.forEach(setor => {
//         const li = document.createElement("li");
//         li.classList.add("list-group-item");
//         li.textContent = `${setor.nome} - ${setor.descricao || "Sem descrição"}`;
//         listaSetores.appendChild(li);
//       });
//     } catch (err) {
//       console.error("Erro ao listar setores:", err);
//       alert("❌ Erro de conexão ao listar setores.");
//     }
//   }

//   carregarSetores();
// });
