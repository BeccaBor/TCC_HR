// backend/models/usuarioModel.js
const db = require('../config/db');

const usuarioModel = {
  /**
   * Busca usuário por ID (campos públicos)
   */
  async findById(id) {
    const [rows] = await db.query(
      'SELECT id, empresa_id, numero_registro, nome, cnpj, tipo_usuario, cargo, setor, salario, tipo_jornada, horas_diarias, foto FROM usuario WHERE id = ? LIMIT 1',
      [id]
    );
    return rows && rows[0] ? rows[0] : null;
  },

  /**
   * Busca por número de registro + (opcional) cnpj
   * Se cnpj fornecido, filtra por ambos; caso contrário retorna o primeiro registro que bater com numero_registro
   */
  async findByRegistro(numero_registro, cnpj = null) {
    if (cnpj) {
      const [rows] = await db.query(
        'SELECT * FROM usuario WHERE numero_registro = ? AND cnpj = ? LIMIT 1',
        [numero_registro, cnpj]
      );
      return rows && rows[0] ? rows[0] : null;
    } else {
      const [rows] = await db.query(
        'SELECT * FROM usuario WHERE numero_registro = ? LIMIT 1',
        [numero_registro]
      );
      return rows && rows[0] ? rows[0] : null;
    }
  },

  /**
   * Busca por registro + tipo (caso precise)
   */
  async findByRegistroAndTipo(numero_registro, tipo_usuario, cnpj = null) {
    if (cnpj) {
      const [rows] = await db.query(
        'SELECT * FROM usuario WHERE numero_registro = ? AND tipo_usuario = ? AND cnpj = ? LIMIT 1',
        [numero_registro, tipo_usuario, cnpj]
      );
      return rows && rows[0] ? rows[0] : null;
    } else {
      const [rows] = await db.query(
        'SELECT * FROM usuario WHERE numero_registro = ? AND tipo_usuario = ? LIMIT 1',
        [numero_registro, tipo_usuario]
      );
      return rows && rows[0] ? rows[0] : null;
    }
  },

  /**
   * Cria usuário (padrão usado pelo authController.register)
   */
  async create(usuarioObj) {
    const q = `INSERT INTO usuario (empresa_id, numero_registro, nome, cnpj, senha_hash, tipo_usuario, cargo, setor, tipo_jornada, horas_diarias, foto, salario)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      usuarioObj.empresa_id || null,
      usuarioObj.numero_registro,
      usuarioObj.nome,
      usuarioObj.cnpj || null,
      usuarioObj.senha_hash,
      usuarioObj.tipo_usuario,
      usuarioObj.cargo || null,
      usuarioObj.setor || null,
      usuarioObj.tipo_jornada || '6x1',
      usuarioObj.horas_diarias || 8,
      usuarioObj.foto || null,
      usuarioObj.salario || 0.00
    ];
    const [result] = await db.query(q, params);
    return result;
  }
};

module.exports = usuarioModel;
