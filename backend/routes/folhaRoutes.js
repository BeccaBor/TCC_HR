// backend/routes/folhaRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verificarToken } = require('../middlewares/authMiddleware');

// ===== ROTAS DE CONFIGURAÇÃO DE PAGAMENTO =====

// GET - Buscar configurações de pagamento
router.get('/configuracoes/pagamento', async (req, res) => {
    try {
        console.log('📥 GET /configuracoes/pagamento recebido');
        console.log('Query params:', req.query);
        console.log('Usuario:', req.usuario);
        
        const empresa_id = req.usuario?.empresa_id || req.query.empresa_id;
        
        if (!empresa_id) {
            console.log('Empresa ID não fornecido, retornando padrão');
            return res.json({
                qtdPagamentos: '1',
                diaPagamento1: '5',
                diaPagamento2: ''
            });
        }
        
        const [rows] = await db.query(
            'SELECT * FROM config_pagamento WHERE empresa_id = ? LIMIT 1',
            [empresa_id]
        );
        
        if (rows && rows.length > 0) {
            console.log('Configurações encontradas:', rows[0]);
            res.json(rows[0]);
        } else {
            console.log('Nenhuma configuração encontrada, retornando padrão');
            res.json({
                qtdPagamentos: '1',
                diaPagamento1: '5',
                diaPagamento2: ''
            });
        }
    } catch (error) {
        console.error('Erro ao buscar configurações de pagamento:', error);
        res.status(500).json({ 
            error: 'Erro ao buscar configurações',
            qtdPagamentos: '1',
            diaPagamento1: '5',
            diaPagamento2: ''
        });
    }
});

// POST - Salvar/atualizar configurações de pagamento
router.post('/configuracoes/pagamento', async (req, res) => {
    try {
        const { qtdPagamentos, diaPagamento1, diaPagamento2 } = req.body;
        
        // Tenta pegar empresa_id de várias fontes
        let empresa_id = req.usuario?.empresa_id || req.body.empresa_id || req.query.empresa_id;
        
        // Se não tem empresa_id, tenta extrair do token manualmente
        if (!empresa_id) {
            const authHeader = req.headers.authorization;
            if (authHeader) {
                try {
                    const jwt = require('jsonwebtoken');
                    const token = authHeader.replace('Bearer ', '');
                    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'seu_secret_aqui');
                    empresa_id = decoded.empresa_id;
                } catch (err) {
                    console.error('Erro ao decodificar token:', err);
                }
            }
        }
        
        console.log('Salvando configurações:', { qtdPagamentos, diaPagamento1, diaPagamento2, empresa_id });
        
        if (!empresa_id) {
            return res.status(400).json({ error: 'empresa_id não fornecido' });
        }
        
        // Verifica se já existe configuração
        const [existing] = await db.query(
            'SELECT id FROM config_pagamento WHERE empresa_id = ?',
            [empresa_id]
        );
        
        if (existing && existing.length > 0) {
            // Atualiza
            await db.query(
                `UPDATE config_pagamento 
                SET qtdPagamentos = ?, diaPagamento1 = ?, diaPagamento2 = ?
                WHERE empresa_id = ?`,
                [qtdPagamentos || '1', diaPagamento1 || '5', diaPagamento2 || '', empresa_id]
            );
            console.log('Configurações atualizadas');
        } else {
            // Insere
            await db.query(
                `INSERT INTO config_pagamento (empresa_id, qtdPagamentos, diaPagamento1, diaPagamento2)
                VALUES (?, ?, ?, ?)`,
                [empresa_id, qtdPagamentos || '1', diaPagamento1 || '5', diaPagamento2 || '']
            );
            console.log('Configurações inseridas');
        }
        
        res.json({ 
            success: true,
            message: 'Configurações salvas com sucesso',
            data: { qtdPagamentos, diaPagamento1, diaPagamento2 }
        });
        
    } catch (error) {
        console.error('Erro ao salvar configurações de pagamento:', error);
        res.status(500).json({ error: 'Erro ao salvar configurações' });
    }
});

module.exports = router;