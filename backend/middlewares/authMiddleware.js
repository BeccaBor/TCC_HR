const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn('AVISO: JWT_SECRET não está definida no .env. Recomenda-se configurar para produção.');
}

/**
 * verificarToken:
 * - aceita token no header Authorization: "Bearer <token>" ou cookie 'token'
 * - coloca o payload decodificado em req.usuario
 * - sempre retorna JSON em caso de erro
 */
function verificarToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    let token = null;

    // Pegar token do header
    if (authHeader && typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.split(' ')[1];
    }
    // Se não veio no header, pegar do cookie
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Token não fornecido' });
    }

    if (!JWT_SECRET) {
      return res.status(500).json({ success: false, message: 'JWT_SECRET não configurado no servidor' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ success: false, message: 'Token inválido ou expirado' });
      }
      req.usuario = decoded; // id, empresa_id, tipo_usuario, etc.
      next();
    });
  } catch (err) {
    console.error('Erro em verificarToken:', err);
    return res.status(500).json({ success: false, message: 'Erro interno no middleware de autenticação' });
  }
}

/**
 * autorizarTipoUsuario(['gestor']) ou autorizarTipoUsuario(['gestor','colaborador'])
 * - retorna middleware que verifica se o tipo do token está entre os permitidos
 * - sempre retorna JSON em caso de erro
 */
function autorizarTipoUsuario(permitidos = []) {
  return (req, res, next) => {
    try {
      if (!req.usuario) {
        return res.status(401).json({ success: false, message: 'Não autenticado' });
      }

      const tipo = (req.usuario.tipo_usuario || '').toLowerCase();
      if (!permitidos || permitidos.length === 0 || permitidos.map(t => t.toLowerCase()).includes(tipo)) {
        return next();
      }

      return res.status(403).json({ success: false, message: 'Acesso negado' });
    } catch (err) {
      console.error('Erro em autorizarTipoUsuario:', err);
      return res.status(500).json({ success: false, message: 'Erro interno de autorização' });
    }
  };
}

module.exports = { verificarToken, autorizarTipoUsuario };
