// backend/models/gestorModel.js
const db = require('../config/db');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

const gestorModel = {
  /**
   * Busca gestor por ID (da tabela usuario, com tipo 'gestor')
   */
  async findById(id) {
    try {
      const [rows] = await db.query(
        `SELECT id, empresa_id, numero_registro, nome, cnpj, tipo_usuario, cargo, setor 
         FROM usuario 
         WHERE id = ? AND tipo_usuario = 'gestor' 
         LIMIT 1`,
        [id]
      );
      return rows[0] || null;
    } catch (err) {
      console.error('Erro em gestorModel.findById:', err);
      throw err;
    }
  },

  /**
   * Busca gestor por registro e CNPJ (valida tipo 'gestor')
   */
  async findByRegistro(empresa_id, numero_registro) {
    try {
      const [rows] = await db.query(
        `SELECT * FROM usuario 
         WHERE empresa_id = ? AND numero_registro = ? AND tipo_usuario = 'gestor' 
         LIMIT 1`,
        [empresa_id, numero_registro]
      );
      return rows[0] || null;
    } catch (err) {
      console.error('Erro em gestorModel.findByRegistro:', err);
      throw err;
    }
  },

  /**
   * Cria um novo gestor (insere na tabela usuario com tipo 'gestor')
   */
 // backend/models/gestorModel.js

async create({ empresa_id, numero_registro, nome, cnpj, senha, cargo, setor, tipo_jornada, horas_diarias }) {
  if (!empresa_id || !numero_registro || !nome || !cnpj || !senha || !tipo_jornada || !horas_diarias) {
    throw new Error('Campos obrigatórios ausentes para criar gestor.');
  }

  try {
    const existing = await this.findByRegistro(empresa_id, numero_registro);
    if (existing) {
      throw new Error('Gestor já existe para este registro e empresa.');
    }

    const senha_hash = await bcrypt.hash(senha, SALT_ROUNDS);

    const [result] = await db.query(
      `INSERT INTO usuario 
        (empresa_id, numero_registro, nome, cnpj, senha_hash, tipo_usuario, cargo, setor, tipo_jornada, horas_diarias)
       VALUES (?, ?, ?, ?, ?, 'gestor', ?, ?, ?, ?)`,
      [empresa_id, numero_registro, nome, cnpj, senha_hash, cargo, setor, tipo_jornada, horas_diarias]
    );

    return { id: result.insertId, empresa_id, numero_registro, nome, cnpj, cargo, setor, tipo_jornada, horas_diarias };
  } catch (err) {
    console.error('Erro em gestorModel.create:', err);
    throw err;
  }
},
  /**
   * Atualiza gestor por ID
   */
  async update(id, updates) {
    try {
      const gestor = await this.findById(id);
      if (!gestor) {
        throw new Error('Gestor não encontrado.');
      }

      const fields = [];
      const values = [];
      Object.keys(updates).forEach(key => {
        if (key !== 'senha' && key !== 'senha_hash') { // Não atualiza senha aqui
          fields.push(`${key} = ?`);
          values.push(updates[key]);
        }
      });
      values.push(id);

      if (fields.length === 0) {
        return gestor; // Nada para atualizar
      }

      const [result] = await db.query(
        `UPDATE usuario SET ${fields.join(', ')} 
         WHERE id = ? AND tipo_usuario = 'gestor'`,
        values
      );

      if (result.affectedRows === 0) {
        throw new Error('Nenhum gestor atualizado.');
      }

      return { ...gestor, ...updates };
    } catch (err) {
      console.error('Erro em gestorModel.update:', err);
      throw err;
    }
  },

  /**
   * Deleta gestor por ID (soft delete ou hard, conforme necessidade)
   */
  async delete(id) {
    try {
      const [result] = await db.query(
        `DELETE FROM usuario WHERE id = ? AND tipo_usuario = 'gestor'`,
        [id]
      );

      if (result.affectedRows === 0) {
        throw new Error('Gestor não encontrado ou não deletado.');
      }

      return { message: 'Gestor deletado com sucesso.' };
    } catch (err) {
      console.error('Erro em gestorModel.delete:', err);
      throw err;
    }
  }
};

module.exports = gestorModel;