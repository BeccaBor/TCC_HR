// backend/config/db.js
const mysql = require('mysql2');
require('dotenv').config();

// Cria pool de conexões
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'folhapaga',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',          // garante compatibilidade com emojis e acentos
  timezone: '-03:00'            // horário de Brasília
});

// Versão com suporte a Promises
const db = pool.promise();

// Testa a conexão ao iniciar
db.getConnection()
  .then(conn => {
    console.log('Conexão com o banco estabelecida com sucesso!');
    conn.release();
  })
  .catch(err => {
    console.error('Erro ao conectar no banco de dados:', err);
    process.exit(1); // encerra o servidor caso não consiga conectar
  });

module.exports = db;
