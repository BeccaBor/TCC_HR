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
  async getByUsuarioId(usuarioId, limit = 20) {
    try {
      const [rows] = await db.query(
        `SELECT id, usuario_id, nome, setor, tipo_usuario, tipo_registro, horas, data_registro
         FROM pontos
         WHERE usuario_id = ?
         ORDER BY data_registro DESC
         LIMIT ?`,
        [usuarioId, Number(limit)]
      );
      return rows;
    } catch (err) {
      console.error('Erro em pontoModel.getByUsuarioId:', err);
      return [];
    }
  },

  /**
   * Lista registros da empresa (somente gestores)
   */
  async getByEmpresaId(empresaId, limit = 100) {
    try {
      const [rows] = await db.query(
        `SELECT p.id, p.usuario_id, p.nome, p.setor, p.tipo_usuario, p.tipo_registro, p.horas, p.data_registro
         FROM pontos p
         JOIN usuario u ON p.usuario_id = u.id
         WHERE u.empresa_id = ?
         ORDER BY p.data_registro DESC
         LIMIT ?`,
        [empresaId, Number(limit)]
      );
      return rows;
    } catch (err) {
      console.error('Erro em pontoModel.getByEmpresaId:', err);
      return [];
    }
  }
};

module.exports = pontoModel;
