// frontend/app.js
const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const app = express();
require('dotenv').config();

const FRONT_PORT = process.env.FRONT_PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// Middlewares para parse de JSON e urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use('/css', express.static(path.join(__dirname, 'public', 'css')));
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));
app.use('/img', express.static(path.join(__dirname, 'public', 'img')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'backend', 'uploads')));

// Middleware para disponibilizar BACKEND_URL em todas as views
app.use((req, res, next) => {
  res.locals.BACKEND_URL = BACKEND_URL;
  next();
});

// Configuração do Handlebars
const hbs = exphbs.create({
  extname: '.handlebars',
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  defaultLayout: 'main',
  partialsDir: path.join(__dirname, 'views', 'partials'),
  helpers: {
    ifCond: function (v1, operator, v2, options) {
      switch (operator) {
        case '==': return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===': return (v1 === v2) ? options.fn(this) : options.inverse(this);
        default: return options.inverse(this);
      }
    },
    eq: (a, b) => a === b
  }
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// --- ROTAS ---
// Página inicial
app.get('/', (req, res) => {
  res.render('home', { title: 'Painel', BACKEND_URL });
});

// Rotas do colaborador
app.get('/colaborador/holerites', (req, res) => {
  const fake = [
    { id: 1, mes_referencia: '2025-08', salario: 2500.00, arquivo_pdf: '/uploads/exemplo1.pdf' },
    { id: 2, mes_referencia: '2025-07', salario: 2400.00, arquivo_pdf: '/uploads/exemplo2.pdf' }
  ];
  res.render('colaborador/holerites', { holerites: fake, layout: 'main', BACKEND_URL });
});

// Rotas do gestor (prefixo /gestor)
app.get('/gestor/documentacao', (req, res) => {
  res.render('documentacao', { title: 'Documentação', BACKEND_URL });
});

app.get('/gestor/folhadepagamento', (req, res) => {
  res.render('folhadepagamento', { title: 'Folha de pagamento', BACKEND_URL });
});

app.get('/gestor/beneficios', (req, res) => {
  res.render('beneficios', { title: 'Gerenciar Benefícios', BACKEND_URL });
});

app.get('/gestor/solicitacoes', (req, res) => {
  res.render('solicitacoes', { title: 'Solicitações', BACKEND_URL });
});

app.get('/gestor/gerenciamento', (req, res) => {
  res.render('gerenciamento', { title: 'Gerenciamento', BACKEND_URL });
});

app.get('/gestor/gerenciarPonto', (req, res) => {
  res.render('gerenciarPonto', { title: 'Gerenciar Ponto', BACKEND_URL });
});

// Iniciar servidor de frontend
if (require.main === module) {
  app.listen(FRONT_PORT, () => {
    console.log(`Frontend rodando em http://localhost:${FRONT_PORT}`);
    console.log(`Backend esperado em: ${BACKEND_URL}`);
  });
}

module.exports = app;
