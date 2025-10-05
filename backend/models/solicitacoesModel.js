// backend/models/solicitacoesModel.js
const db = require('../config/db');

const SolicitacaoModel = {
  /**
   * criar(payload)
   * payload: { usuario_id, tipo_solicitacao, descricao, titulo, anexo_nome, anexo_path, data_inicio?, data_fim? }
   */
  async criar(payload = {}) {
    const {
      usuario_id,
      tipo_solicitacao,
      descricao = null,
      titulo = null,
      anexo_nome = null,
      anexo_path = null,
      data_inicio = null,
      data_fim = null
    } = payload || {};

    if (!usuario_id || !tipo_solicitacao) {
      throw new Error('Campos obrigatórios ausentes: usuario_id ou tipo_solicitacao');
    }

    try {
      // Observação: a tabela realizarsolicitacoes atual não possui colunas data_inicio/data_fim.
      // Se quiser persistir essas datas, adicione as colunas e descomente/ajuste a query abaixo.
      const q = `INSERT INTO realizarsolicitacoes
        (usuario_id, tipo_solicitacao, descricao, data_solicitacao, status, titulo, anexo_nome, anexo_path, created_at, updated_at)
        VALUES (?, ?, ?, NOW(), 'pendente', ?, ?, ?, NOW(), NOW())`;

      const params = [usuario_id, tipo_solicitacao, descricao, titulo, anexo_nome, anexo_path];

      // db.query pode retornar [result] (mysql2) ou result (mysql). Normalizamos.
      const result = await db.query(q, params);
      // se mysql2: result = [resultSet, fields] -> pegamos primeiro
      let resObj = result;
      if (Array.isArray(result) && result.length > 0 && result[0] && result[0].insertId !== undefined) {
        resObj = result[0];
      }
      // resObj deve ter insertId em drivers comuns
      const insertId = resObj && (resObj.insertId || resObj.insert_id || null);
      return { insertId, raw: resObj };
    } catch (err) {
      console.error('Erro em SolicitacaoModel.criar:', err);
      throw new Error('Erro ao criar solicitação no banco de dados.');
    }
  },

  async listarPorUsuario(usuarioId) {
    if (!usuarioId) return [];
    try {
      const [rows] = await db.query(
        `SELECT id, usuario_id, tipo_solicitacao, titulo, descricao, data_solicitacao, status, gestor_id, data_aprovacao_rejeicao, observacao_gestor, anexo_nome, anexo_path, created_at
         FROM realizarsolicitacoes WHERE usuario_id = ? ORDER BY created_at DESC`,
        [usuarioId]
      );
      return rows || [];
    } catch (err) {
      console.error('Erro em SolicitacaoModel.listarPorUsuario:', err);
      throw new Error('Erro ao listar solicitações no banco de dados.');
    }
  },

  async buscarPorId(solicitacaoId) {
    if (!solicitacaoId) return null;
    try {
      const [rows] = await db.query(
        `SELECT id, usuario_id, tipo_solicitacao, titulo, descricao, data_solicitacao, status, gestor_id, data_aprovacao_rejeicao, observacao_gestor, anexo_nome, anexo_path, created_at, updated_at
         FROM realizarsolicitacoes WHERE id = ? LIMIT 1`,
        [solicitacaoId]
      );
      return (rows && rows[0]) ? rows[0] : null;
    } catch (err) {
      console.error('Erro em SolicitacaoModel.buscarPorId:', err);
      throw new Error('Erro ao buscar solicitação no banco de dados.');
    }
  },

  async atualizarStatus(solicitacaoId, status, gestor_id = null, observacao = null) {
    if (!solicitacaoId || !status) {
      throw new Error('ID da solicitação e status são obrigatórios para atualizar');
    }
    try {
      const q = `UPDATE realizarsolicitacoes SET status = ?, gestor_id = ?, data_aprovacao_rejeicao = NOW(), observacao_gestor = ? WHERE id = ?`;
      const params = [status, gestor_id, observacao, solicitacaoId];
      const [result] = await db.query(q, params);
      return result;
    } catch (err) {
      console.error('Erro em SolicitacaoModel.atualizarStatus:', err);
      throw new Error('Erro ao atualizar status da solicitação no banco de dados.');
    }
  },

  async listarTodos() {
    try {
      const [rows] = await db.query(
        `SELECT id, usuario_id, tipo_solicitacao, titulo, descricao, data_solicitacao, status, gestor_id, data_aprovacao_rejeicao, observacao_gestor, anexo_nome, anexo_path, created_at
         FROM realizarsolicitacoes ORDER BY created_at DESC`
      );
      return rows || [];
    } catch (err) {
      console.error('Erro em SolicitacaoModel.listarTodos:', err);
      throw new Error('Erro ao listar solicitações no banco de dados.');
    }
  }
};

module.exports = SolicitacaoModel;
