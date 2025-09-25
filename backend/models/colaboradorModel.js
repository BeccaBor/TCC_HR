const db = require('../config/db');
const bcrypt = require('bcrypt');

const Colaborador = {
  // Criar um novo colaborador
  async create({ empresa_id, numero_registro, nome, cnpj, senha, cargo, setor }) {
    const senha_hash = await bcrypt.hash(senha, 10);

    const [result] = await db.query(
      `INSERT INTO usuario 
        (empresa_id, numero_registro, nome, cnpj, senha_hash, tipo_usuario, cargo, setor) 
       VALUES (?, ?, ?, ?, ?, 'colaborador', ?, ?)`,
      [empresa_id, numero_registro, nome, cnpj, senha_hash, cargo, setor]
    );

    return { id: result.insertId, nome, numero_registro, tipo_usuario: 'colaborador' };
  },

  // Buscar colaborador por número de registro + empresa (login)
  async findByRegistro(empresa_id, numero_registro) {
    const [rows] = await db.query(
      `SELECT * FROM usuario 
       WHERE empresa_id = ? AND numero_registro = ? AND tipo_usuario = 'colaborador'`,
      [empresa_id, numero_registro]
    );
    return rows[0];
  },

  // Buscar colaborador por ID
  async findById(id) {
    const [rows] = await db.query(
      `SELECT * FROM usuario WHERE id = ? AND tipo_usuario = 'colaborador'`,
      [id]
    );
    return rows[0];
  },

  // Atualizar dados do colaborador
  async update(id, { nome, cargo, setor }) {
    await db.query(
      `UPDATE usuario SET nome = ?, cargo = ?, setor = ? 
       WHERE id = ? AND tipo_usuario = 'colaborador'`,
      [nome, cargo, setor, id]
    );
    return this.findById(id);
  },

  // Deletar colaborador
  async delete(id) {
    await db.query(`DELETE FROM usuario WHERE id = ? AND tipo_usuario = 'colaborador'`, [id]);
    return true;
  }
};

module.exports = Colaborador;
