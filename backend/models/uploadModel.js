const UploadModel = require('../models/uploadModel');

const uploadController = {
    realizarUpload: (req, res) => {
        if (!req.file) {
            return res.status(400).json({ erro: 'Nenhum arquivo foi enviado.' });
        }

        const usuarioId = req.body.usuarioId || 1; // pegar do login depois
        const tipoDocumento = req.body.tipoDocumento;
        const caminhoArquivo = `/uploads/${req.file.filename}`;

        UploadModel.salvar(usuarioId, tipoDocumento, caminhoArquivo, (err, result) => {
            if (err) {
                console.error('Erro ao salvar upload:', err);
                return res.status(500).json({ erro: 'Erro ao salvar no banco.' });
            }
            res.json({ sucesso: true, mensagem: 'Upload realizado com sucesso!' });
        });
    },

    listarPorCategoria: (req, res) => {
        const categoria = req.params.categoria;
        UploadModel.listarPorCategoria(categoria, (err, results) => {
            if (err) return res.status(500).json({ erro: 'Erro ao buscar arquivos' });
            res.json(results);
        });
    },

    listarTodos: (req, res) => {
        UploadModel.listarTodos((err, results) => {
            if (err) return res.status(500).json({ erro: 'Erro ao buscar todos arquivos' });
            res.json(results);
        });
    }
};

module.exports = uploadController;
