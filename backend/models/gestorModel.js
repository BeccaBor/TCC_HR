// backend/models/gerenciarPontoModel.js
const db = require('../config/db');

const gerenciarPontoModel = {
  /**
   * Registra um ponto
   */
  async registrar({ nome, setor, tipo_usuario, tipo_registro, horas, cnpj }) {
    if (!nome || !tipo_registro || !cnpj) {
      throw new Error('Campos obrigatórios ausentes.');
    }

    try {
      const [result] = await db.query(
        `INSERT INTO pontos (nome, setor, tipo_usuario, tipo_registro, horas, cnpj, data_registro)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [nome, setor || null, tipo_usuario || 'colaborador', tipo_registro, horas || 0, cnpj]
      );

      return {
        id: result.insertId,
        nome,
        setor: setor || null,
        tipo_usuario: tipo_usuario || 'colaborador',
        tipo_registro,
        horas: horas || 0,
        cnpj
      };
    } catch (err) {
      console.error('Erro em gerenciarPontoModel.registrar:', err);
      throw err;
    }
  },

  /**
   * Busca registros de uma empresa
   */
  async getRecent(cnpj, limit = 20) {
    if (!cnpj) return [];

    try {
      const [rows] = await db.query(
        `SELECT id, nome, setor, tipo_usuario, tipo_registro, horas, cnpj, data_registro
         FROM pontos
         WHERE cnpj = ?
         ORDER BY data_registro DESC
         LIMIT ?`,
        [cnpj, Number(limit)]
      );
      return rows || [];
    } catch (err) {
      console.error('Erro em gerenciarPontoModel.getRecent:', err);
      return [];
    }
  }
};

module.exports = gerenciarPontoModel;
