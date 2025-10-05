// backend/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn('AVISO: JWT_SECRET não está definida no .env. Recomenda-se configurar para produção.');
}

function verificarToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    let token = null;

    if (authHeader && typeof authHeader === 'string') {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        token = parts[1];
      } else if (parts.length === 1) {
        token = parts[0];
      }
    }

    // Cookie (ex.: cookie HttpOnly nome 'token')
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // Query fallback
    if (!token && req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      if (req.accepts && req.accepts('html')) {
        return res.redirect('/');
      }
      return res.status(401).json({ success: false, message: 'Token não fornecido' });
    }

    if (!JWT_SECRET) {
      if (req.accepts && req.accepts('html')) return res.redirect('/');
      return res.status(500).json({ success: false, message: 'JWT_SECRET não configurado no servidor' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        if (req.accepts && req.accepts('html')) {
          return res.redirect('/');
        }
        return res.status(401).json({ success: false, message: 'Token inválido ou expirado' });
      }

      // Normalizar: definir req.usuario (pt) E req.user (en) para compatibilidade
      req.usuario = decoded;
      req.user = decoded;

      if (res && res.locals) {
        res.locals.usuario = decoded;
        res.locals.user = decoded;
      }

      return next();
    });
  } catch (err) {
    console.error('Erro em verificarToken:', err);
    if (req.accepts && req.accepts('html')) return res.redirect('/');
    return res.status(500).json({ success: false, message: 'Erro interno no middleware de autenticação' });
  }
}

function autorizarTipoUsuario(permitidos = []) {
  const permitidosLower = (Array.isArray(permitidos) ? permitidos : []).map(p => String(p).toLowerCase());

  return (req, res, next) => {
    try {
      // aceitar tanto req.user quanto req.usuario
      const usuarioObj = req.user || req.usuario;
      if (!usuarioObj) {
        if (req.accepts && req.accepts('html')) return res.redirect('/');
        return res.status(401).json({ success: false, message: 'Não autenticado' });
      }

      const tipo = (usuarioObj.tipo_usuario || usuarioObj.tipo || '').toLowerCase();
      if (permitidosLower.length === 0 || permitidosLower.includes(tipo)) {
        return next();
      }

      if (req.accepts && req.accepts('html')) return res.status(403).send('Acesso negado');
      return res.status(403).json({ success: false, message: 'Acesso negado para este tipo de usuário' });
    } catch (err) {
      console.error('Erro em autorizarTipoUsuario:', err);
      if (req.accepts && req.accepts('html')) return res.status(500).send('Erro interno');
      return res.status(500).json({ success: false, message: 'Erro interno de autorização' });
    }
  };
}

module.exports = { verificarToken, autorizarTipoUsuario };
