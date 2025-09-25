// backend/models/usuarioModel.js
const db = require('../config/db');

const usuarioModel = {
  async findById(id) {
    const [rows] = await db.query('SELECT id, empresa_id, numero_registro, nome, cnpj, tipo_usuario, cargo, setor FROM usuario WHERE id = ? LIMIT 1', [id]);
    return rows && rows[0] ? rows[0] : null;
  },

  async findByRegistroAndTipo(numero_registro, tipo_usuario, cnpj = null) {
    if (cnpj) {
      const [rows] = await db.query('SELECT * FROM usuario WHERE numero_registro = ? AND tipo_usuario = ? AND cnpj = ? LIMIT 1', [numero_registro, tipo_usuario, cnpj]);
      return rows && rows[0] ? rows[0] : null;
    } else {
      const [rows] = await db.query('SELECT * FROM usuario WHERE numero_registro = ? AND tipo_usuario = ? LIMIT 1', [numero_registro, tipo_usuario]);
      return rows && rows[0] ? rows[0] : null;
    }
  },

  async create(usuarioObj) {
    const q = `INSERT INTO usuario (empresa_id, numero_registro, nome, cnpj, senha_hash, tipo_usuario, cargo, setor)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      usuarioObj.empresa_id || null,
      usuarioObj.numero_registro,
      usuarioObj.nome,
      usuarioObj.cnpj || null,
      usuarioObj.senha_hash,
      usuarioObj.tipo_usuario,
      usuarioObj.cargo || null,
      usuarioObj.setor || null
    ];
    const [result] = await db.query(q, params);
    return result;
  }
};

module.exports = usuarioModel;
