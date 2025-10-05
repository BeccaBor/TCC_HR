// models/usuariosBeneficiosModel.js
const db = require("../config/db");

/**
 * Model unificado para:
 * - Templates de benefícios (tabela `gerenciarbeneficios`)
 * - Benefícios atribuídos a usuários (tabela `usuario_beneficios`)
 *
 * Expectativa: `db` é um pool mysql2 com .query(...) e, idealmente, .getConnection() para transações.
 */

function formatDateToSQL(d) {
  if (!d) return null;
  if (typeof d === "string") {
    // tenta normalizar "YYYY-MM-DD" ou string já válida
    return d;
  }
  const date = new Date(d);
  if (isNaN(date)) return null;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toNumberSafe(v) {
  if (v === null || typeof v === "undefined" || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const UsuarioBeneficiosModel = {
  // ======================
  // = TEMPLATES (gerenciarbeneficios)
  // ======================

  // Cria um template de benefício (gestor cria um tipo de benefício)
  async createTemplate({
    gestor_id,
    usuario_id = null,
    cargo = null,
    nome_do_beneficio,
    descricao_beneficio = null,
    valor_aplicado = null,
    data_inicio = null,
    data_fim = null,
    ativo = 1
  }) {
    if (!nome_do_beneficio) throw new Error("nome_do_beneficio é obrigatório");

    const valor = toNumberSafe(valor_aplicado);
    const di = formatDateToSQL(data_inicio) || formatDateToSQL(new Date());
    const df = formatDateToSQL(data_fim);

    const [result] = await db.query(
      `INSERT INTO gerenciarbeneficios
        (gestor_id, usuario_id, cargo, nome_do_beneficio, descricao_beneficio, valor_aplicado, data_inicio, data_fim, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [gestor_id || null, usuario_id || null, cargo || null, nome_do_beneficio, descricao_beneficio || null, valor, di, df, ativo ? 1 : 0]
    );

    return this.findTemplateById(result.insertId);
  },

  // Atualiza template por id
  async updateTemplate(id, { nome_do_beneficio, descricao_beneficio, valor_aplicado, data_inicio, data_fim, ativo, cargo }) {
    if (!id) throw new Error("id é obrigatório");

    const [rows] = await db.query(`SELECT * FROM gerenciarbeneficios WHERE id = ?`, [id]);
    if (!rows || rows.length === 0) throw new Error("Template de benefício não encontrado");

    const atual = rows[0];
    const dados = {
      nome_do_beneficio: nome_do_beneficio ?? atual.nome_do_beneficio,
      descricao_beneficio: descricao_beneficio ?? atual.descricao_beneficio,
      valor_aplicado: typeof valor_aplicado !== "undefined" ? toNumberSafe(valor_aplicado) : atual.valor_aplicado,
      data_inicio: typeof data_inicio !== "undefined" ? formatDateToSQL(data_inicio) : atual.data_inicio,
      data_fim: typeof data_fim !== "undefined" ? formatDateToSQL(data_fim) : atual.data_fim,
      ativo: typeof ativo !== "undefined" ? (ativo ? 1 : 0) : atual.ativo,
      cargo: typeof cargo !== "undefined" ? cargo : atual.cargo
    };

    await db.query(
      `UPDATE gerenciarbeneficios
         SET nome_do_beneficio = ?, descricao_beneficio = ?, valor_aplicado = ?, data_inicio = ?, data_fim = ?, ativo = ?, cargo = ?
       WHERE id = ?`,
      [dados.nome_do_beneficio, dados.descricao_beneficio, dados.valor_aplicado, dados.data_inicio, dados.data_fim, dados.ativo, dados.cargo, id]
    );

    return this.findTemplateById(id);
  },

  // Buscar template por id
  async findTemplateById(id) {
    if (!id) return null;
    const [rows] = await db.query(`SELECT * FROM gerenciarbeneficios WHERE id = ?`, [id]);
    return rows[0] || null;
  },

  // Listar templates por cargo (ativos)
  async findTemplatesByCargo(cargo, { apenasAtivos = true } = {}) {
    if (!cargo) return [];
    const sql = `SELECT * FROM gerenciarbeneficios WHERE cargo = ?` + (apenasAtivos ? ` AND ativo = 1` : ``) + ` ORDER BY nome_do_beneficio`;
    const [rows] = await db.query(sql, [cargo]);
    return rows;
  },

  // (opcional) buscar todos templates ativos (por gestor/empresa) — utilidade dependendo do app
  async listAllTemplates({ gestor_id = null, apenasAtivos = true } = {}) {
    const params = [];
    let sql = `SELECT * FROM gerenciarbeneficios WHERE 1=1`;
    if (gestor_id) {
      sql += ` AND gestor_id = ?`;
      params.push(gestor_id);
    }
    if (apenasAtivos) {
      sql += ` AND ativo = 1`;
    }
    sql += ` ORDER BY nome_do_beneficio`;
    const [rows] = await db.query(sql, params);
    return rows;
  },

  // ======================
  // = USUARIO_BENEFICIOS (associação)
  // ======================

  // Atribui um beneficio (instância) a um usuário (insere em usuario_beneficios)
  // aceita: beneficio_id (template) e valor_personalizado opcional
  async addBeneficioToUsuario({
    usuario_id,
    beneficio_id,
    valor_personalizado = null,
    data_inicio = null,
    data_fim = null
  }) {
    if (!usuario_id) throw new Error("usuario_id é obrigatório");
    if (!beneficio_id) throw new Error("beneficio_id (template) é obrigatório");

    const valor = toNumberSafe(valor_personalizado);
    const di = formatDateToSQL(data_inicio) || formatDateToSQL(new Date());
    const df = formatDateToSQL(data_fim);

    const [result] = await db.query(
      `INSERT INTO usuario_beneficios (usuario_id, beneficio_id, valor_personalizado, data_inicio, data_fim)
       VALUES (?, ?, ?, ?, ?)`,
      [usuario_id, beneficio_id, valor, di, df]
    );

    // retorna objeto enriquecido (join com template)
    return this.findById(result.insertId);
  },

  // Remove (hard delete) um registro de usuario_beneficios
  async removeBeneficio(usuario_beneficio_id) {
    if (!usuario_beneficio_id) throw new Error("id é obrigatório");
    await db.query(`DELETE FROM usuario_beneficios WHERE id = ?`, [usuario_beneficio_id]);
    return true;
  },

  // Atualiza registro de usuario_beneficios
  async updateUsuarioBeneficio(id, { valor_personalizado, data_inicio, data_fim }) {
    if (!id) throw new Error("id é obrigatório");

    const [rows] = await db.query(`SELECT * FROM usuario_beneficios WHERE id = ?`, [id]);
    if (!rows || rows.length === 0) throw new Error("Registro usuario_beneficios não encontrado");

    const atual = rows[0];
    const dados = {
      valor_personalizado: typeof valor_personalizado !== "undefined" ? toNumberSafe(valor_personalizado) : atual.valor_personalizado,
      data_inicio: typeof data_inicio !== "undefined" ? formatDateToSQL(data_inicio) : atual.data_inicio,
      data_fim: typeof data_fim !== "undefined" ? formatDateToSQL(data_fim) : atual.data_fim
    };

    await db.query(
      `UPDATE usuario_beneficios
         SET valor_personalizado = ?, data_inicio = ?, data_fim = ?
       WHERE id = ?`,
      [dados.valor_personalizado, dados.data_inicio, dados.data_fim, id]
    );

    return this.findById(id);
  },

  // Busca benefícios atribuídos a um usuário (retorna dados do template + instancia)
  async findByUsuario(usuario_id) {
    if (!usuario_id) return [];

    const [rows] = await db.query(
      `SELECT ub.id as usuario_beneficio_id,
              ub.usuario_id,
              ub.beneficio_id,
              ub.valor_personalizado,
              ub.data_inicio as usuario_data_inicio,
              ub.data_fim as usuario_data_fim,
              gb.nome_do_beneficio,
              gb.descricao_beneficio,
              gb.valor_aplicado as valor_template,
              gb.data_inicio as template_data_inicio,
              gb.data_fim as template_data_fim,
              gb.cargo as template_cargo,
              gb.ativo as template_ativo
       FROM usuario_beneficios ub
       LEFT JOIN gerenciarbeneficios gb ON gb.id = ub.beneficio_id
       WHERE ub.usuario_id = ?
       ORDER BY ub.data_inicio DESC`,
      [usuario_id]
    );

    return rows.map(r => ({
      usuario_beneficio_id: r.usuario_beneficio_id,
      usuario_id: r.usuario_id,
      beneficio_id: r.beneficio_id,
      nome_do_beneficio: r.nome_do_beneficio,
      descricao_beneficio: r.descricao_beneficio,
      valor_template: r.valor_template,
      valor_personalizado: r.valor_personalizado,
      data_inicio: r.usuario_data_inicio || r.template_data_inicio,
      data_fim: r.usuario_data_fim || r.template_data_fim,
      cargo: r.template_cargo,
      template_ativo: r.template_ativo
    }));
  },

  // Busca por id (usuario_beneficios.id) com join
  async findById(id) {
    if (!id) return null;
    const [rows] = await db.query(
      `SELECT ub.id as usuario_beneficio_id,
              ub.usuario_id,
              ub.beneficio_id,
              ub.valor_personalizado,
              ub.data_inicio as usuario_data_inicio,
              ub.data_fim as usuario_data_fim,
              gb.nome_do_beneficio,
              gb.descricao_beneficio,
              gb.valor_aplicado as valor_template,
              gb.cargo as template_cargo,
              gb.ativo as template_ativo
       FROM usuario_beneficios ub
       LEFT JOIN gerenciarbeneficios gb ON gb.id = ub.beneficio_id
       WHERE ub.id = ? LIMIT 1`,
      [id]
    );
    if (!rows || rows.length === 0) return null;
    const r = rows[0];
    return {
      usuario_beneficio_id: r.usuario_beneficio_id,
      usuario_id: r.usuario_id,
      beneficio_id: r.beneficio_id,
      nome_do_beneficio: r.nome_do_beneficio,
      descricao_beneficio: r.descricao_beneficio,
      valor_template: r.valor_template,
      valor_personalizado: r.valor_personalizado,
      data_inicio: r.usuario_data_inicio,
      data_fim: r.usuario_data_fim,
      cargo: r.template_cargo,
      template_ativo: r.template_ativo
    };
  },

  // ======================
  // = BULK (substituir benefícios do usuário)
  // ======================
  /**
   * Substitui os benefícios de um usuário (remove antigos e insere novos).
   * - beneficios: array de objetos, cada item pode ser:
   *    { beneficio_id }  OR
   *    { beneficio_id, valor_personalizado, data_inicio, data_fim }
   * Retorna true se ok.
   */
  async bulkReplaceForUsuario(usuario_id, beneficios = []) {
    if (!usuario_id) throw new Error("usuario_id é obrigatório");

    const items = Array.isArray(beneficios) ? beneficios : [];

    // usa transação se possível
    if (typeof db.getConnection === "function") {
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        // remove registros antigos (hard delete) — alternativa: soft-delete via data_fim
        await conn.query(`DELETE FROM usuario_beneficios WHERE usuario_id = ?`, [usuario_id]);

        for (const b of items) {
          const beneficio_id = b.beneficio_id || b.id || null;
          if (!beneficio_id) continue;
          const valor = toNumberSafe(b.valor_personalizado ?? b.valor);
          const di = formatDateToSQL(b.data_inicio) || formatDateToSQL(new Date());
          const df = formatDateToSQL(b.data_fim) || null;

          await conn.query(
            `INSERT INTO usuario_beneficios (usuario_id, beneficio_id, valor_personalizado, data_inicio, data_fim)
             VALUES (?, ?, ?, ?, ?)`,
            [usuario_id, beneficio_id, valor, di, df]
          );
        }

        await conn.commit();
        conn.release();
        return true;
      } catch (err) {
        try { await conn.rollback(); } catch (_) {}
        conn.release();
        throw err;
      }
    } else {
      // fallback sem transação
      await db.query(`DELETE FROM usuario_beneficios WHERE usuario_id = ?`, [usuario_id]);
      for (const b of items) {
        try {
          const beneficio_id = b.beneficio_id || b.id || null;
          if (!beneficio_id) continue;
          await this.addBeneficioToUsuario({
            usuario_id,
            beneficio_id,
            valor_personalizado: b.valor_personalizado ?? b.valor,
            data_inicio: b.data_inicio || new Date(),
            data_fim: b.data_fim || null
          });
        } catch (err) {
          console.error("bulkReplaceForUsuario (fallback) - erro ao inserir item:", err.message);
        }
      }
      return true;
    }
  }
};

module.exports = UsuarioBeneficiosModel;
