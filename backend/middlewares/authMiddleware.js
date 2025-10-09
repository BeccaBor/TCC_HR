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

    // Cookie HttpOnly (nome 'token')
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // Query fallback
    if (!token && req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      if (req.accepts && req.accepts('html')) return res.redirect('/');
      return res.status(401).json({ success: false, message: 'Token não fornecido' });
    }

    if (!JWT_SECRET) {
      if (req.accepts && req.accepts('html')) return res.redirect('/');
      return res.status(500).json({ success: false, message: 'JWT_SECRET não configurado no servidor' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        if (req.accepts && req.accepts('html')) return res.redirect('/');
        return res.status(401).json({ success: false, message: 'Token inválido ou expirado' });
      }

      // Normalizar/garantir forma consistente em req.usuario e req.user
      const normalized = Object.assign({}, decoded);

      // garantir tipo_usuario em lowercase
      const tipoRaw = (decoded.tipo_usuario || decoded.tipo || decoded.role || '').toString().trim().toLowerCase();
      if (tipoRaw) normalized.tipo_usuario = tipoRaw;

      // garantir roles array (se existir roles/papeis)
      const roles = new Set();
      if (Array.isArray(decoded.roles)) decoded.roles.forEach(r => { if (r) roles.add(String(r).toLowerCase()); });
      if (Array.isArray(decoded.papeis)) decoded.papeis.forEach(r => { if (r) roles.add(String(r).toLowerCase()); });
      if (decoded.role) roles.add(String(decoded.role).toLowerCase());
      if (decoded.tipo) roles.add(String(decoded.tipo).toLowerCase());
      if (decoded.tipo_usuario) roles.add(String(decoded.tipo_usuario).toLowerCase());
      normalized.roles = Array.from(roles);

      // padronizar id campo (algumas implementações usam sub)
      normalized.id = normalized.id || normalized.sub || normalized.usuario_id || normalized.user_id || null;

      req.usuario = normalized;
      req.user = normalized;

      if (res && res.locals) {
        res.locals.usuario = normalized;
        res.locals.user = normalized;
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
  // permitidos pode ser ['gestor'] ou []
  const permitidosLower = (Array.isArray(permitidos) ? permitidos : []).map(p => String(p).toLowerCase());

  return (req, res, next) => {
    try {
      const usuarioObj = req.user || req.usuario;
      if (!usuarioObj) {
        if (req.accepts && req.accepts('html')) return res.redirect('/');
        return res.status(401).json({ success: false, message: 'Não autenticado' });
      }

      // coletar possíveis fontes de papel/role em várias chaves
      const candidates = new Set();

      // campos simples
      if (usuarioObj.tipo_usuario) candidates.add(String(usuarioObj.tipo_usuario).toLowerCase());
      if (usuarioObj.tipo) candidates.add(String(usuarioObj.tipo).toLowerCase());
      if (usuarioObj.role) candidates.add(String(usuarioObj.role).toLowerCase());
      if (usuarioObj.cargo) candidates.add(String(usuarioObj.cargo).toLowerCase());

      // arrays
      if (Array.isArray(usuarioObj.roles)) usuarioObj.roles.forEach(r => { if (r) candidates.add(String(r).toLowerCase()); });
      if (Array.isArray(usuarioObj.papeis)) usuarioObj.papeis.forEach(r => { if (r) candidates.add(String(r).toLowerCase()); });

      // se o token não contiver roles explícitos, aceitar 'gestor' em outras propriedades como fallback:
      // (ex.: usuarioObj.permissao = 'gestor' — opcional)
      if (usuarioObj.permissao) candidates.add(String(usuarioObj.permissao).toLowerCase());

      // padronizações comuns: tratar 'admin' e 'manager' como gestores também
      const extraAliases = ['admin', 'manager'];
      extraAliases.forEach(a => {
        if (candidates.has(a)) candidates.add('gestor');
      });

      // se permitidos vazios -> liberar
      if (permitidosLower.length === 0) return next();

      // se alguma interseção entre permitidos e candidates => ok
      const ok = Array.from(candidates).some(c => permitidosLower.includes(c));
      if (ok) return next();

      // fallback extra: se roles array existir e conter qualquer dos permitidos
      if (Array.isArray(usuarioObj.roles) && usuarioObj.roles.some(r => permitidosLower.includes(String(r).toLowerCase()))) {
        return next();
      }

      if (req.accepts && req.accepts('html')) return res.status(403).send('Acesso negado');
      return res.status(403).json({ success: false, message: 'Acesso negado: requer papel gestor' });
    } catch (err) {
      console.error('Erro em autorizarTipoUsuario:', err);
      if (req.accepts && req.accepts('html')) return res.status(500).send('Erro interno');
      return res.status(500).json({ success: false, message: 'Erro interno de autorização' });
    }
  };
}

module.exports = { verificarToken, autorizarTipoUsuario };
