// backend/models/solicitacoesModel.js
const db = require('../config/db');
const path = require('path');

const ALLOWED_TIPOS = [
  'ferias','alteracao_dados','consulta_banco_horas','banco_horas',
  'desligamento','reembolso','outros','reajuste_salarial'
];

const SolicitacaoModel = {

  // helper: encontra gestor_id para um usuario_id (por cnpj, tipo_usuario='gestor')
  async _findGestorIdForUsuario(usuarioId, conn = null) {
    if (!usuarioId) return null;
    const poolOrConn = conn || db;
    try {
      const sql = `
        SELECT g.id
        FROM usuario g
        JOIN usuario u ON u.cnpj = g.cnpj
        WHERE u.id = ? AND g.tipo_usuario = 'gestor'
        ORDER BY g.id
        LIMIT 1
      `;
      const [rows] = await poolOrConn.query(sql, [usuarioId]);
      if (rows && rows.length) return rows[0].id;
      return null;
    } catch (err) {
      console.error('Erro em _findGestorIdForUsuario:', err);
      return null;
    }
  },

  /**
   * criar(payload)
   */
  async criar(payload = {}) {
    const {
      usuario_id,
      tipo_solicitacao,
      titulo = null,
      descricao = null,
      data_inicio = null,
      data_fim = null,
      anexos = []
    } = payload;

    if (!usuario_id || !tipo_solicitacao) {
      throw new Error('usuario_id e tipo_solicitacao são obrigatórios');
    }
    if (!ALLOWED_TIPOS.includes(tipo_solicitacao)) {
      throw new Error('tipo_solicitacao inválido: ' + tipo_solicitacao);
    }

    // suporta conexões com pool.getConnection (transação) ou apenas db.query
    let connection = null;
    let useConn = false;
    try {
      if (typeof db.getConnection === 'function') {
        connection = await db.getConnection();
        useConn = true;
        await connection.beginTransaction();
      } else {
        connection = db;
      }

      // determina gestor_id (se houver)
      const gestorId = await this._findGestorIdForUsuario(usuario_id, connection);

      const now = new Date();
      const insertSql = `
        INSERT INTO realizarsolicitacoes
        (usuario_id, tipo_solicitacao, titulo, descricao, data_inicio, data_fim, status, created_at, gestor_id)
        VALUES (?, ?, ?, ?, ?, ?, 'pendente', ?, ?)
      `;
      const params = [usuario_id, tipo_solicitacao, titulo, descricao, data_inicio || null, data_fim || null, now, gestorId || null];
      const [result] = await connection.query(insertSql, params);

      const solicitacaoId = (result && (result.insertId || result.affectedRows)) ? result.insertId : null;

      // inserir anexos
      if (solicitacaoId && Array.isArray(anexos) && anexos.length) {
        const values = anexos.map(a => [
          solicitacaoId,
          a.original_name || a.nome || a.filename || null,
          a.filename || a.path || a.url || null
        ]);
        await connection.query(
          `INSERT INTO solicitacao_anexos (solicitacao_id, nome, path) VALUES ?`,
          [values]
        );
      }

      if (useConn) {
        await connection.commit();
        connection.release();
      }

      return { id: solicitacaoId };
    } catch (err) {
      if (useConn && connection) {
        try { await connection.rollback(); connection.release(); } catch (e) { /* ignore */ }
      }
      console.error('Erro em SolicitacaoModel.criar:', err);
      throw err;
    }
  },

  /**
   * buscarPorId(id)
   */
  async buscarPorId(id) {
    try {
      const [rows] = await db.query(
        `SELECT r.id, r.usuario_id, r.tipo_solicitacao AS tipo, r.titulo, r.descricao, r.status, r.created_at,
                r.data_inicio, r.data_fim, r.observacao_gestor, r.gestor_id,
                u.nome AS colaborador_nome, u.cargo AS colaborador_cargo, u.setor AS colaborador_setor, u.foto AS colaborador_foto,
                ug.nome AS gestor_nome, ug.cargo AS gestor_cargo, ug.setor AS gestor_setor, ug.foto AS gestor_foto
         FROM realizarsolicitacoes r
         LEFT JOIN usuario u ON r.usuario_id = u.id
         LEFT JOIN usuario ug ON r.gestor_id = ug.id
         WHERE r.id = ? LIMIT 1`,
        [id]
      );
      if (!rows || rows.length === 0) return null;
      const item = rows[0];

      const [anexos] = await db.query(
        `SELECT id, nome, path FROM solicitacao_anexos WHERE solicitacao_id = ? ORDER BY id`,
        [id]
      );

      item.anexos = (anexos || []).map(a => ({
        id: a.id,
        nome: a.nome,
        path: a.path,
        filename: a.path ? path.basename(a.path) : null,
        url: a.path ? (a.path.startsWith('/') ? a.path : `/uploads/${path.basename(a.path)}`) : null
      }));

      item.colaborador = {
        id: item.usuario_id,
        nome: item.colaborador_nome,
        cargo: item.colaborador_cargo,
        setor: item.colaborador_setor,
        foto: item.colaborador_foto
      };

      item.gestor = item.gestor_id ? {
        id: item.gestor_id,
        nome: item.gestor_nome,
        cargo: item.gestor_cargo,
        setor: item.gestor_setor,
        foto: item.gestor_foto
      } : null;

      // limpar props redundantes
      delete item.colaborador_nome;
      delete item.colaborador_cargo;
      delete item.colaborador_setor;
      delete item.colaborador_foto;
      delete item.gestor_nome;
      delete item.gestor_cargo;
      delete item.gestor_setor;
      delete item.gestor_foto;

      return item;
    } catch (err) {
      console.error('Erro em SolicitacaoModel.buscarPorId:', err);
      throw err;
    }
  },

  /**
   * listarTodos(options)
   */
  async listarTodos(options = {}) {
    const {
      status,
      setor,
      colaborador,
      q,
      limit = 100,
      offset = 0,
      order = 'r.created_at DESC',
      gestor_id // optional filter by gestor
    } = options;

    const where = [];
    const params = [];

    if (status && status !== 'all') {
      where.push('r.status = ?');
      params.push(status);
    }
    if (setor) {
      where.push('u.setor = ?');
      params.push(setor);
    }
    if (colaborador) {
      where.push('(u.nome LIKE ? OR u.id = ?)');
      params.push(`%${colaborador}%`, colaborador);
    }
    if (q) {
      where.push('(r.titulo LIKE ? OR r.descricao LIKE ? OR u.nome LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (gestor_id) {
      where.push('r.gestor_id = ?');
      params.push(gestor_id);
    }

    const whereSql = where.length ? ('WHERE ' + where.join(' AND ')) : '';

    try {
      const [countRows] = await db.query(
        `SELECT COUNT(*) as total
         FROM realizarsolicitacoes r
         LEFT JOIN usuario u ON r.usuario_id = u.id
         ${whereSql}`,
        params
      );
      const total = (countRows && countRows[0] && countRows[0].total) ? countRows[0].total : 0;

      const [rows] = await db.query(
        `SELECT r.id, r.usuario_id, r.tipo_solicitacao AS tipo, r.titulo, r.descricao, r.status, r.created_at,
                r.gestor_id,
                u.nome AS colaborador_nome, u.cargo AS colaborador_cargo, u.setor AS colaborador_setor, u.foto AS colaborador_foto
         FROM realizarsolicitacoes r
         LEFT JOIN usuario u ON r.usuario_id = u.id
         ${whereSql}
         ORDER BY ${order}
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit, 10), parseInt(offset, 10)]
      );

      const ids = rows.map(r => r.id).filter(Boolean);
      let anexosMap = {};
      if (ids.length) {
        const [anexRows] = await db.query(
          `SELECT solicitacao_id, id, nome, path FROM solicitacao_anexos WHERE solicitacao_id IN (?) ORDER BY id`,
          [ids]
        );
        anexRows.forEach(a => {
          anexosMap[a.solicitacao_id] = anexosMap[a.solicitacao_id] || [];
          anexosMap[a.solicitacao_id].push({
            id: a.id,
            nome: a.nome,
            path: a.path,
            filename: a.path ? path.basename(a.path) : null,
            url: a.path ? (a.path.startsWith('/') ? a.path : `/uploads/${path.basename(a.path)}`) : null
          });
        });
      }

      const items = rows.map(r => ({
        id: r.id,
        tipo: r.tipo,
        titulo: r.titulo,
        descricao: r.descricao,
        status: r.status,
        created_at: r.created_at,
        gestor_id: r.gestor_id,
        colaborador: {
          id: r.usuario_id,
          nome: r.colaborador_nome,
          cargo: r.colaborador_cargo,
          setor: r.colaborador_setor,
          foto: r.colaborador_foto
        },
        anexos: anexosMap[r.id] || []
      }));

      return { total, rows: items };
    } catch (err) {
      console.error('Erro em SolicitacaoModel.listarTodos:', err);
      throw err;
    }
  },

  /**
   * atualizarStatus(id, novoStatus, observacao, gestor_id)
   */
  async atualizarStatus(id, novoStatus, observacao = null, gestor_id = null) {
    try {
      const allowed = ['aprovada', 'reprovada', 'pendente'];
      if (!allowed.includes(novoStatus)) throw new Error('Status inválido');

      // atualiza status e, se gestor_id fornecido e gestor_id atual for null, atualiza gestor_id
      const now = new Date();
      const setFields = [];
      const params = [];

      setFields.push('status = ?'); params.push(novoStatus);
      setFields.push('observacao_gestor = ?'); params.push(observacao);
      setFields.push('updated_at = ?'); params.push(now);

      if (gestor_id) {
        // só sobrescreve se gestor_id atual for NULL
        setFields.push('gestor_id = IFNULL(gestor_id, ?)');
        params.push(gestor_id);
      }

      // define data_aprovacao_rejeicao quando for aprovado/reprovado
      if (novoStatus === 'aprovada' || novoStatus === 'reprovada') {
        setFields.push('data_aprovacao_rejeicao = ?'); params.push(now);
      }

      params.push(id);

      const sql = `UPDATE realizarsolicitacoes SET ${setFields.join(', ')} WHERE id = ?`;
      const [res] = await db.query(sql, params);

      if (gestor_id) {
        await db.query(
          `INSERT INTO solicitacao_log (solicitacao_id, gestor_id, acao, created_at, observacao)
           VALUES (?, ?, ?, ?, ?)`,
          [id, gestor_id, `status:${novoStatus}`, now, observacao]
        );
      } else {
        await db.query(
          `INSERT INTO solicitacao_log (solicitacao_id, acao, created_at, observacao)
           VALUES (?, ?, ?, ?)`,
          [id, `status:${novoStatus}`, now, observacao]
        );
      }

      return { affectedRows: res.affectedRows };
    } catch (err) {
      console.error('Erro em SolicitacaoModel.atualizarStatus:', err);
      throw err;
    }
  },

  /**
   * adicionarAnexos(solicitacaoId, anexosArray)
   */
  async adicionarAnexos(solicitacaoId, anexosArray = []) {
    if (!solicitacaoId) throw new Error('solicitacaoId obrigatório');
    if (!Array.isArray(anexosArray) || anexosArray.length === 0) return [];

    try {
      const values = anexosArray.map(a => [
        solicitacaoId,
        a.original_name || a.nome || a.filename || null,
        a.filename || a.path || a.url || null
      ]);

      const [res] = await db.query(
        `INSERT INTO solicitacao_anexos (solicitacao_id, nome, path) VALUES ?`,
        [values]
      );

      const n = anexosArray.length;
      const [rows] = await db.query(
        `SELECT id, nome, path FROM solicitacao_anexos WHERE solicitacao_id = ? ORDER BY id DESC LIMIT ?`,
        [solicitacaoId, n]
      );

      const inserted = (rows || []).slice().reverse().map(a => ({
        id: a.id,
        nome: a.nome,
        path: a.path,
        filename: a.path ? path.basename(a.path) : null,
        url: a.path ? (a.path.startsWith('/') ? a.path : `/uploads/${path.basename(a.path)}`) : null
      }));

      return inserted;
    } catch (err) {
      console.error('Erro em SolicitacaoModel.adicionarAnexos:', err);
      throw err;
    }
  },

  async buscarAnexoPorId(anexoId) {
    if (!anexoId) return null;
    try {
      const [rows] = await db.query(
        `SELECT id, solicitacao_id, nome, path FROM solicitacao_anexos WHERE id = ? LIMIT 1`,
        [anexoId]
      );
      if (!rows || rows.length === 0) return null;
      const a = rows[0];
      return {
        id: a.id,
        solicitacao_id: a.solicitacao_id,
        nome: a.nome,
        path: a.path,
        filename: a.path ? path.basename(a.path) : null,
        url: a.path ? (a.path.startsWith('/') ? a.path : `/uploads/${path.basename(a.path)}`) : null
      };
    } catch (err) {
      console.error('Erro em SolicitacaoModel.buscarAnexoPorId:', err);
      throw err;
    }
  },

  async removerAnexo(solicitacaoId, anexoIdOrFilename) {
    if (!solicitacaoId || !anexoIdOrFilename) throw new Error('Parâmetros obrigatórios');
    try {
      let query, params;
      if (/^\d+$/.test(String(anexoIdOrFilename))) {
        query = `SELECT id, solicitacao_id, nome, path FROM solicitacao_anexos WHERE id = ? AND solicitacao_id = ? LIMIT 1`;
        params = [anexoIdOrFilename, solicitacaoId];
      } else {
        query = `SELECT id, solicitacao_id, nome, path FROM solicitacao_anexos WHERE solicitacao_id = ? AND (path LIKE ? OR nome = ?) LIMIT 1`;
        params = [solicitacaoId, `%${anexoIdOrFilename}%`, anexoIdOrFilename];
      }

      const [rows] = await db.query(query, params);
      if (!rows || rows.length === 0) return null;
      const anexo = rows[0];

      await db.query(`DELETE FROM solicitacao_anexos WHERE id = ?`, [anexo.id]);

      return {
        id: anexo.id,
        nome: anexo.nome,
        path: anexo.path,
        filename: anexo.path ? path.basename(anexo.path) : null,
        url: anexo.path ? (anexo.path.startsWith('/') ? anexo.path : `/uploads/${path.basename(anexo.path)}`) : null
      };
    } catch (err) {
      console.error('Erro em SolicitacaoModel.removerAnexo:', err);
      throw err;
    }
  },

  /**
   * atualizar(id, campos)
   */
  async atualizar(id, campos = {}) {
    if (!id) throw new Error('ID obrigatório');
    const allowed = ['titulo', 'descricao', 'data_inicio', 'data_fim', 'tipo_solicitacao', 'status'];
    const updates = [];
    const params = [];

    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(campos, k)) {
        updates.push(`${k} = ?`);
        params.push(campos[k]);
      }
    }

    if (!updates.length) throw new Error('Nenhum campo permitido para atualizar');

    params.push(new Date());
    params.push(id);

    const sql = `UPDATE realizarsolicitacoes SET ${updates.join(', ')}, updated_at = ? WHERE id = ?`;
    try {
      const [res] = await db.query(sql, params);
      return { affectedRows: res.affectedRows };
    } catch (err) {
      console.error('Erro em SolicitacaoModel.atualizar:', err);
      throw err;
    }
  },

  /**
   * deletar(id)
   */
  async deletar(id) {
    if (!id) throw new Error('ID obrigatório');
    try {
      const [anexos] = await db.query(
        `SELECT id, nome, path FROM solicitacao_anexos WHERE solicitacao_id = ?`,
        [id]
      );

      await db.query(`DELETE FROM solicitacao_anexos WHERE solicitacao_id = ?`, [id]);

      const [res] = await db.query(`DELETE FROM realizarsolicitacoes WHERE id = ?`, [id]);

      return {
        affectedRows: res.affectedRows,
        anexos: (anexos || []).map(a => ({
          id: a.id,
          nome: a.nome,
          path: a.path,
          filename: a.path ? path.basename(a.path) : null,
          url: a.path ? (a.path.startsWith('/') ? a.path : `/uploads/${path.basename(a.path)}`) : null
        }))
      };
    } catch (err) {
      console.error('Erro em SolicitacaoModel.deletar:', err);
      throw err;
    }
  }

};

module.exports = SolicitacaoModel;
