const db = require('../config/db');
const UploadModel = require('../models/uploadModel');
const path = require('path');
const fs = require('fs');

const uploadController = {
  // Função para realizar upload
  async realizarUpload(req, res) {
    console.log('=== INICIANDO UPLOAD ===');
    console.log('Usuario completo do token:', req.usuario);

    try {
      if (!req.usuario) {
        return res.status(401).json({ erro: 'Usuário não autenticado.' });
      }

      // BUSCAR O USUÁRIO NO BANCO
      let usuarioId;
      if (req.usuario.id) {
        usuarioId = req.usuario.id;
      } else if (req.usuario.numero_registro) {
        const [usuarios] = await db.query(
          'SELECT id FROM usuario WHERE numero_registro = ?',
          [req.usuario.numero_registro]
        );
        if (usuarios.length === 0) {
          return res.status(404).json({ erro: 'Usuário não encontrado no banco.' });
        }
        usuarioId = usuarios[0].id;
      } else if (req.usuario.cnpj) {
        const [usuarios] = await db.query(
          'SELECT id FROM usuario WHERE cnpj = ?',
          [req.usuario.cnpj]
        );
        if (usuarios.length === 0) {
          return res.status(404).json({ erro: 'Usuário não encontrado no banco.' });
        }
        usuarioId = usuarios[0].id;
      } else {
        return res.status(401).json({ erro: 'Dados do usuário insuficientes.' });
      }

      const tipoDocumento = req.body.tipo_documento;
      console.log('Usuario ID encontrado:', usuarioId);

      if (!req.file) {
        console.log('ERRO: Nenhum arquivo enviado');
        return res.status(400).json({ erro: 'Nenhum arquivo enviado.' });
      }

      if (!tipoDocumento) {
        console.log('ERRO: Tipo de documento não informado');
        fs.unlinkSync(req.file.path); // Remove arquivo salvo
        return res.status(400).json({ erro: 'O tipo do documento é obrigatório.' });
      }

      // Nome original do arquivo e nome salvo
      const nomeArquivo = req.file.originalname;
      const nomeGerado = req.file.filename;
      const caminhoParaSalvar = path.join('uploads', nomeGerado).replace(/\\/g, '/');

      console.log('Caminho para salvar no BD:', caminhoParaSalvar);

      // Registrar no banco de dados
      const resultado = await UploadModel.registrarUpload(
        usuarioId,
        tipoDocumento,
        caminhoParaSalvar,
        nomeArquivo
      );
      console.log('Registro no BD realizado:', resultado);

      res.status(201).json({
        mensagem: 'Upload realizado com sucesso.',
        fileName: nomeArquivo,
        filePath: caminhoParaSalvar,
        id: resultado.insertId
      });
    } catch (error) {
      console.error('Erro no controlador ao realizar upload:', error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
        console.log('Arquivo removido devido ao erro');
      }
      res.status(500).json({ erro: 'Erro interno no servidor ao processar upload.' });
    }
  },

  // Função para download de arquivo
  async downloadArquivo(req, res) {
    try {
      const { id } = req.params;
      console.log('Download solicitado para ID:', id);

      const [arquivos] = await db.query("SELECT * FROM realizarupload WHERE id = ?", [id]);
      if (!arquivos || arquivos.length === 0) {
        return res.status(404).json({ erro: "Arquivo não encontrado no banco de dados." });
      }

      const arquivo = arquivos[0];
      const filePath = path.resolve(arquivo.caminho_arquivo);
      console.log('Caminho do arquivo:', filePath);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ erro: "Arquivo não existe no servidor." });
      }

      return res.download(filePath, err => {
        if (err) {
          console.error("Erro ao enviar arquivo:", err);
          res.status(500).json({ erro: "Erro ao fazer download do arquivo." });
        }
      });
    } catch (error) {
      console.error("Erro no controlador ao baixar arquivo:", error);
      res.status(500).json({ erro: error.message });
    }
  },

  // Função para listar uploads do usuário logado
  async listarMeusUploads(req, res) {
    try {
      console.log('Usuario completo do token:', req.usuario);

      if (!req.usuario) {
        return res.status(401).json({ erro: 'Usuário não autenticado.' });
      }

      let usuarioId;
      if (req.usuario.id) {
        usuarioId = req.usuario.id;
      } else if (req.usuario.numero_registro) {
        const [usuarios] = await db.query(
          'SELECT id FROM usuario WHERE numero_registro = ?',
          [req.usuario.numero_registro]
        );
        if (usuarios.length === 0) {
          return res.status(404).json({ erro: 'Usuário não encontrado no banco.' });
        }
        usuarioId = usuarios[0].id;
      } else if (req.usuario.cnpj) {
        const [usuarios] = await db.query(
          'SELECT id FROM usuario WHERE cnpj = ?',
          [req.usuario.cnpj]
        );
        if (usuarios.length === 0) {
          return res.status(404).json({ erro: 'Usuário não encontrado no banco.' });
        }
        usuarioId = usuarios[0].id;
      } else {
        return res.status(401).json({ erro: 'Dados do usuário insuficientes.' });
      }

      console.log('Buscando uploads para usuarioId:', usuarioId);
      const uploads = await UploadModel.listarUploadsPorUsuario(usuarioId);
      res.status(200).json({ uploads });
    } catch (error) {
      console.error("Erro ao listar uploads:", error);
      res.status(500).json({ erro: error.message });
    }
  },

  // Função para listar todos os documentos (adicionada)
  async listarTodos(req, res) {
    try {
      const [documentos] = await db.query('SELECT * FROM documentos');
      res.status(200).json({ documentos });
    } catch (error) {
      console.error('Erro ao listar documentos:', error);
      res.status(500).json({ erro: 'Erro ao listar documentos.' });
    }
  }
};

module.exports = uploadController;
