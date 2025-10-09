const db = require("../config/db");

const setorController = {
  // ==============================
  // CADASTRAR SETOR
  // ==============================
  async register(req, res) {
    try {
      const { nome, descricao } = req.body;
      const empresa_id = req.user?.empresa_id; // vem do token do gestor

      if (!empresa_id || !nome) {
        return res.status(400).json({
          success: false,
          message: "Campos obrigatórios faltando (empresa_id ou nome)."
        });
      }

      const [result] = await db.query(
        "INSERT INTO setores (empresa_id, nome_setor, descricao) VALUES (?, ?, ?)",
        [empresa_id, nome, descricao || ""]
      );

      return res.status(201).json({
        success: true,
        message: "Setor cadastrado com sucesso.",
        id: result.insertId
      });
    } catch (err) {
      console.error("Erro no register setor:", err);
      return res.status(500).json({
        success: false,
        message: "Erro interno ao cadastrar setor."
      });
    }
  },

  // ==============================
  // LISTAR SETORES
  // ==============================
  async listar(req, res) {
    try {
      const empresa_id = req.user?.empresa_id; // vem do token do gestor

      if (!empresa_id) {
        return res.status(400).json({
          success: false,
          message: "empresa_id não encontrado no token."
        });
      }

      const [rows] = await db.query(
        "SELECT * FROM setores WHERE empresa_id = ? ORDER BY nome_setor",
        [empresa_id]
      );

      return res.json({
        success: true,
        data: rows
      });
    } catch (err) {
      console.error("Erro no listar setores:", err);
      return res.status(500).json({
        success: false,
        message: "Erro interno ao listar setores."
      });
    }
  }
};

module.exports = setorController;
