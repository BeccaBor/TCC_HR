// backend/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const db = require('./config/db'); // Pool do MySQL (promise-based)
const routes = require('./routes'); // Rotas centralizadas (auth, gestor, colaborador)
const uploadRoutes = require('./routes/uploadRoutes'); // Importando as rotas de upload

const app = express();

// --- Middleware ---
// Configuração completa de CORS para frontend
app.use(cors({
  origin: 'http://localhost:3000', // endereço do frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware para tratar JSON e urlencoded (deve vir ANTES das rotas)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Middleware para logs (opcional, útil para debug)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Servir arquivos estáticos
// Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, '..', 'frontend', 'public')));

// --- Rotas principais ---
// Todas as rotas centralizadas em /api
app.use('/api', routes);

// Adicionando a rota de upload
app.use('/upload', uploadRoutes); // Rota de upload

// Rota de saúde
app.get('/health', (req, res) => res.json({ success: true, status: 'ok' }));

// --- Inicialização do servidor ---
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Testa conexão com o banco de dados
    await db.query('SELECT 1');
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso.');

    // Inicia o servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Falha ao conectar ao banco de dados:', err);
    process.exit(1); // Encerra processo se não conseguir conectar
  }
}

startServer();

module.exports = app;
