// backend/models/uploadModel.js
const db = require('../config/db');

const VALID_TIPOS = new Set(['contrato','holerite','atestado','recibo','declaracao','outros']);

const UploadModel = {
  async registrarUpload(usuarioId, tipoDocumento, caminhoArquivo, nomeArquivo) {
    try {
      if (!usuarioId) throw new Error('usuarioId obrigatório');
      if (!tipoDocumento || !VALID_TIPOS.has(tipoDocumento)) {
        throw new Error('tipoDocumento inválido: ' + tipoDocumento);
      }
      if (!caminhoArquivo) throw new Error('caminhoArquivo obrigatório');

      // garantir limites de tamanho compatíveis com esquema DB
      const caminho = String(caminhoArquivo).substr(0, 255);
      const nome = String(nomeArquivo || '').substr(0, 100);

      const [result] = await db.query(
        'INSERT INTO realizarupload (usuario_id, tipo_documento, caminho_arquivo, nome_arquivo, data_upload) VALUES (?, ?, ?, ?, NOW())',
        [usuarioId, tipoDocumento, caminho, nome]
      );
      console.info('[UploadModel] registrarUpload -> insertId=', result.insertId);
      return result;
    } catch (error) {
      console.error('[UploadModel] erro registrarUpload:', error);
      throw error;
    }
  },

  async listarUploadsPorUsuario(usuarioId) {
    try {
      if (!usuarioId) return [];
      const [rows] = await db.query(
        'SELECT id, tipo_documento, caminho_arquivo, nome_arquivo, data_upload FROM realizarupload WHERE usuario_id = ? ORDER BY data_upload DESC',
        [usuarioId]
      );
      return rows || [];
    } catch (error) {
      console.error('[UploadModel] erro listarUploadsPorUsuario:', error);
      throw error;
    }
  },

  async listarTodos() {
    try {
      const [rows] = await db.query(
        'SELECT id, usuario_id, tipo_documento, caminho_arquivo, nome_arquivo, data_upload FROM realizarupload ORDER BY data_upload DESC'
      );
      return rows || [];
    } catch (error) {
      console.error('[UploadModel] erro listarTodos:', error);
      throw error;
    }
  },

  async buscarPorId(uploadId) {
    try {
      if (!uploadId) return null;
      const [rows] = await db.query(
        'SELECT id, usuario_id, tipo_documento, caminho_arquivo, nome_arquivo, data_upload FROM realizarupload WHERE id = ? LIMIT 1',
        [uploadId]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('[UploadModel] erro buscarPorId:', error);
      throw error;
    }
  }
};

module.exports = UploadModel;
