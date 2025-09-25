// backend/models/pontoModel.js
const db = require('../config/db');

const pontoModel = {
  /**
   * Registra um ponto
   */
  async registrar({ usuarioId, nome, setor, tipo_usuario, tipo_registro, horas, cnpj }) {
    if (!usuarioId || !tipo_registro || !cnpj) {
      throw new Error('Campos obrigatórios ausentes.');
    }

    try {
      const [result] = await db.query(
        `INSERT INTO pontos (usuario_id, nome, setor, tipo_usuario, tipo_registro, horas, cnpj, data_registro)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [usuarioId, nome, setor || null, tipo_usuario, tipo_registro, horas || 0, cnpj]
      );

      return {
        id: result.insertId,
        usuario_id: usuarioId,
        nome,
        setor,
        tipo_usuario,
        tipo_registro,
        horas,
        cnpj,
        data_registro: new Date()
      };
    } catch (err) {
      console.error('Erro em pontoModel.registrar:', err);
      throw err;
    }
  },

  /**
   * Lista registros do colaborador/gestor logado
   */
  async getByUsuario(usuarioId, cnpj, limit = 20) {
    try {
      const [rows] = await db.query(
        `SELECT id, usuario_id, nome, setor, tipo_usuario, tipo_registro, horas, data_registro
         FROM pontos
         WHERE usuario_id = ? AND cnpj = ?
         ORDER BY data_registro DESC
         LIMIT ?`,
        [usuarioId, cnpj, Number(limit)]
      );
      return rows;
    } catch (err) {
      console.error('Erro em pontoModel.getByUsuario:', err);
      return [];
    }
  },

  /**
   * Lista registros da empresa (somente gestores)
   */
  async getByEmpresa(cnpj, limit = 100) {
    try {
      const [rows] = await db.query(
        `SELECT id, usuario_id, nome, setor, tipo_usuario, tipo_registro, horas, data_registro
         FROM pontos
         WHERE cnpj = ?
         ORDER BY data_registro DESC
         LIMIT ?`,
        [cnpj, Number(limit)]
      );
      return rows;
    } catch (err) {
      console.error('Erro em pontoModel.getByEmpresa:', err);
      return [];
    }
  }
};

module.exports = pontoModel;
