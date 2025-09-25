const db = require('../config/db');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const AuthService = {
  async hashSenha(senha) {
    return await bcrypt.hash(senha, SALT_ROUNDS);
  },

  async verificarSenha(senhaEnviada, senhaHashArmazenada) {
    return await bcrypt.compare(senhaEnviada, senhaHashArmazenada);
  },

  async buscarUsuarioParaLogin(login) {
    try {
      const [rows] = await db.query(
        'SELECT id, nome, cnpj, numero_registro, senha_hash, tipo_usuario, empresa_id FROM usuario WHERE numero_registro = ? OR email = ? LIMIT 1',
        [login, login]
      );

      if (rows.length === 0) return null;

      const user = rows[0];
      return {
        id: user.id,
        nome: user.nome,
        cnpj: user.cnpj,
        numero_registro: user.numero_registro,
        senha_hash: user.senha_hash,
        tipo_usuario: user.tipo_usuario,
        empresa_id: user.empresa_id
      };
    } catch (err) {
      console.error('Erro em AuthService.buscarUsuarioParaLogin:', err);
      throw err;
    }
  }
};

module.exports = AuthService;
