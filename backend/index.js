// backend/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const hbs = require('hbs');
const MulterLib = require('multer');
const db = require('./config/db');
const routes = require('./routes'); // API router (index.js)
const colaboradorRoutes = require('./routes/colaboradorRoutes'); // views router
const uploadRoutes = require('./routes/uploadRoutes');
const app = express();

/* ------------------ Security, CORS, Parsers ------------------ */
try {
  const helmet = require('helmet');
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "http://localhost:3000", "http://localhost:3001"],
        frameAncestors: ["'self'"],
        objectSrc: ["'none'"]
      }
    }
  }));
  console.log('🔒 helmet ativado (CSP dev)');
} catch (err) {
  console.warn('⚠️ helmet não encontrado — rodando sem ele (dev).');
}

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ------------------ Views configuration ------------------ */
const backendViewsPath = path.join(__dirname, 'views');
const frontendViewsPath = path.join(__dirname, '..', 'frontend', 'views');

// Express aceita array de paths para views: tenta em ordem
app.set('views', [ backendViewsPath, frontendViewsPath ]);

// Registramos engines (.hbs e .handlebars) usando hbs.__express
app.engine('hbs', hbs.__express);
app.engine('handlebars', hbs.__express);

// Por padrão tentaremos render .handlebars (já que seus arquivos são .handlebars),
// mas temos um wrapper que também tentará .hbs
app.set('view engine', 'handlebars');
console.log('✔ View engines registradas: .handlebars, .hbs (padrao: .handlebars)');

/* ------------------ Partials registration (recursivo) ------------------ */
function registerPartialsRecursively(dirPath) {
  const exts = ['.hbs', '.handlebars'];
  if (!fs.existsSync(dirPath)) {
    // ok se não existir
    return;
  }
  const walk = (dir) => {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const full = path.join(dir, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walk(full);
        return;
      }
      const ext = path.extname(item).toLowerCase();
      if (!exts.includes(ext)) return;
      const name = path.basename(item, ext);
      try {
        const content = fs.readFileSync(full, 'utf8');
        hbs.registerPartial(name, content);
        console.log(`✔ Partial registrado: "${name}" (src: ${full})`);
      } catch (err) {
        console.warn(`⚠ Falha ao registrar partial ${name}:`, err.message || err);
      }
    });
  };
  walk(dirPath);
}

registerPartialsRecursively(path.join(backendViewsPath, 'partials'));
registerPartialsRecursively(path.join(frontendViewsPath, 'partials'));

/* ------------------ Middleware: expose current path to templates ------------------ */
app.use((req, res, next) => {
  // usado por helpers like ifActive / activeClass
  res.locals.currentPath = req.originalUrl || req.url || '';
  next();
});

/* ------------------ Handlebars helpers ------------------ */

// ifActive helper: bloco que renderiza se currentPath startsWith match (ou regex)
hbs.registerHelper('ifActive', function () {
  const args = Array.from(arguments);
  const options = args.pop();
  let match;
  let currentPath;

  if (args.length === 2) {
    currentPath = args[0] || (options.data && options.data.root && options.data.root.currentPath) || '';
    match = args[1];
  } else if (args.length === 1) {
    currentPath = (options.data && options.data.root && options.data.root.currentPath) || this.currentPath || '';
    match = args[0];
  } else {
    currentPath = (options.data && options.data.root && options.data.root.currentPath) || this.currentPath || '';
    match = '';
  }

  if (!match) return options.inverse(this);

  // detect regex-like
  let isRegex = false;
  let regex = null;
  if (typeof match === 'string') {
    const maybe = match.trim();
    if ((maybe.startsWith('/') && maybe.endsWith('/') && maybe.length > 1) || maybe.startsWith('^') || /[.*+?()[\]{}|\\]/.test(maybe)) {
      try {
        const body = (maybe.startsWith('/') && maybe.endsWith('/')) ? maybe.slice(1, -1) : maybe;
        regex = new RegExp(body);
        isRegex = true;
      } catch (e) { isRegex = false; regex = null; }
    }
  } else if (match instanceof RegExp) {
    isRegex = true; regex = match;
  }

  let matched = false;
  if (isRegex && regex) matched = regex.test(currentPath);
  else matched = String(currentPath || '').startsWith(String(match));

  if (matched) return options.fn(this);
  return options.inverse(this);
});

// activeClass sugar (retorna 'active' se casar)
hbs.registerHelper('activeClass', function () {
  const args = Array.from(arguments);
  const options = args.pop();
  let cls = 'active';
  let match;
  let currentPath;

  if (args.length === 2) {
    currentPath = args[0] || (options.data && options.data.root && options.data.root.currentPath) || '';
    match = args[1];
  } else if (args.length === 1) {
    currentPath = (options.data && options.data.root && options.data.root.currentPath) || this.currentPath || '';
    match = args[0];
  } else {
    return '';
  }

  let isRegex = false;
  let regex = null;
  if (typeof match === 'string') {
    const maybe = match.trim();
    if ((maybe.startsWith('/') && maybe.endsWith('/') && maybe.length > 1) || maybe.startsWith('^') || /[.*+?()[\]{}|\\]/.test(maybe)) {
      try {
        const body = (maybe.startsWith('/') && maybe.endsWith('/')) ? maybe.slice(1, -1) : maybe;
        regex = new RegExp(body);
        isRegex = true;
      } catch (e) { isRegex = false; regex = null; }
    }
  } else if (match instanceof RegExp) {
    isRegex = true; regex = match;
  }

  let matched = false;
  if (isRegex && regex) matched = regex.test(currentPath);
  else matched = String(currentPath || '').startsWith(String(match));

  if (matched) return cls;
  return '';
});

// formatDate simple helper (para evitar erros se usado)
hbs.registerHelper('formatDate', function(dateInput, format) {
  try {
    const d = new Date(dateInput);
    if (isNaN(d)) return '';
    // formato simples: day/month/year hh:mm
    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const yy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2,'0');
    const min = String(d.getMinutes()).padStart(2,'0');
    return `${dd}/${mm}/${yy} ${hh}:${min}`;
  } catch (e) { return String(dateInput); }
});

// json helper - útil para debugging in templates
hbs.registerHelper('json', function(context) {
  return JSON.stringify(context);
});

/* ------------------ Static files ------------------ */
// serve frontend/public na raiz -> /css/... /js/...
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));
app.use('/api/upload', uploadRoutes);
/* ------------------ Utility: list available templates (dev) ------------------ */
function listarTemplatesDisponiveis() {
  const exts = ['.handlebars', '.hbs'];
  const dirs = [backendViewsPath, frontendViewsPath];
  console.log('--- TEMPLATES DISPONÍVEIS ---');
  dirs.forEach(dir => {
    try {
      if (!fs.existsSync(dir)) { console.log(`(não existe) ${dir}`); return; }
      const walk = (d, prefix = '') => {
        const items = fs.readdirSync(d);
        items.forEach(it => {
          const full = path.join(d, it);
          const stat = fs.statSync(full);
          if (stat.isDirectory()) return walk(full, path.join(prefix, it));
          const ext = path.extname(it).toLowerCase();
          if (exts.includes(ext)) {
            console.log(path.join(prefix, it));
          }
        });
      };
      walk(dir);
    } catch (e) {
      console.warn('Erro ao listar templates em', dir, e.message || e);
    }
  });
  console.log('-----------------------------');
}

/* ------------------ Safe render wrapper (try multiple extensions) ------------------ */
(function patchResponseRender() {
  const originalRender = app.response.render;
  app.response.render = function(view /*, options, callback */) {
    // normalize args
    let args = Array.prototype.slice.call(arguments, 1);
    let options = {};
    let callback = null;
    if (args.length === 1) {
      if (typeof args[0] === 'function') callback = args[0];
      else options = args[0] || {};
    } else if (args.length >= 2) {
      options = args[0] || {};
      callback = args[1];
    }

    const tryExts = ['handlebars', 'hbs'];
    let idx = 0;
    const self = this;

    const tryNext = () => {
      if (idx >= tryExts.length) {
        // nenhuma extensão => deixa o erro original ocorrer
        return originalRender.call(self, view, options, callback);
      }
      const ext = tryExts[idx++];
      const tryView = `${view}.${ext}`;
      return originalRender.call(self, tryView, options, (err, html) => {
        if (!err) {
          if (typeof callback === 'function') return callback(null, html);
          return self.send(html);
        }
        const msg = String(err && (err.message || err)).toLowerCase();
        const isNotFound = msg.includes('failed to lookup view') || msg.includes('enoent') || msg.includes('not found');
        if (isNotFound) {
          return tryNext();
        }
        // erro real (compilação) -> propaga
        if (typeof callback === 'function') return callback(err);
        return self.req ? self.req.next(err) : self.next(err);
      });
    };

    return tryNext();
  };
})();

/* ------------------ Routers ------------------ */
// APIs
app.use('/api', routes);

// tenta descobrir limite configurado no middleware (se existir)
let MULTER_MAX_BYTES = 15 * 1024 * 1024;
try {
  const uploadMw = require('./middlewares/uploadMiddleware');
  if (uploadMw && uploadMw.MAX_FILE_SIZE_BYTES) MULTER_MAX_BYTES = uploadMw.MAX_FILE_SIZE_BYTES;
} catch (e) {
  // ignore se não existir
}
// handler global de erros do multer (e limpeza de arquivo parcial)
app.use((err, req, res, next) => {
  if (err instanceof MulterLib.MulterError) {
    // tenta remover arquivo parcial salvo pelo multer
    try {
      if (req.file && req.file.path) {
        const fs = require('fs');
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
          console.log('[upload error] arquivo parcial removido:', req.file.path);
        }
      }
    } catch (e) {
      console.warn('Falha ao remover arquivo parcial:', e.message || e);
    }

    // mapear códigos para mensagens claras
    let message = err.message || 'Erro no upload';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = `Arquivo muito grande. Tamanho máximo permitido: ${Math.round(MULTER_MAX_BYTES / 1024 / 1024)} MB.`;
      return res.status(413).json({ erro: message, code: err.code });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      // quando fileFilter gerou esse código para tipo inválido
      message = err.message || 'Tipo de arquivo não suportado.';
      return res.status(400).json({ erro: message, code: err.code });
    }
    // fallback para outros códigos do multer
    return res.status(400).json({ erro: message, code: err.code });
  }
  // não é MulterError — propaga
  return next(err);
});
// Views do colaborador (mount)
app.use('/colaborador', colaboradorRoutes);

app.get('/documentacao', (req, res) => {
  const categoria = req.query.categoria || null;
  res.render('documentacao', { categoria });
});
/* ------------------ Health & server start ------------------ */
app.get('/health', (req, res) => res.json({ success: true, status: 'ok' }));

function listarRotas(appInstance) {
  console.log('--- ROTAS REGISTRADAS (Express) ---');
  if (!appInstance || !appInstance._router) { console.log('Nenhuma rota encontrada'); return; }
  appInstance._router.stack.forEach((m) => {
    if (m.route && m.route.path) {
      const methods = Object.keys(m.route.methods).join(',').toUpperCase();
      console.log(`${methods}  ${m.route.path}`);
    } else if (m.name === 'router' && m.handle && m.handle.stack) {
      const mountPath = (m.regexp && m.regexp.fast_slash) ? '/' : (m.regexp && m.regexp.toString()) || '<mount>';
      m.handle.stack.forEach((r) => {
        if (r.route && r.route.path) {
          const methods = Object.keys(r.route.methods).join(',').toUpperCase();
          console.log(`${methods}  MOUNTED_AT: ${mountPath}  -->  ${r.route.path}`);
        }
      });
    }
  });
  console.log('-----------------------------------');
}

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await db.query('SELECT 1');
    console.log('Conexão com o banco de dados OK.');

    const server = app.listen(PORT, () => {
      console.log(`Servidor backend rodando em http://localhost:${PORT}`);
      console.log(`API base: /api`);
      // debug info
      registerPartialsRecursively(path.join(backendViewsPath, 'partials'));   // re-register in case changed
      registerPartialsRecursively(path.join(frontendViewsPath, 'partials'));
      listarTemplatesDisponiveis();
      listarRotas(app);
    });

    return server;
  } catch (err) {
    console.error('Falha ao conectar ao banco:', err);
    process.exit(1);
  }
}

startServer();

module.exports = app;
