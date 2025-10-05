const db = require("../config/db");

const Colaborador = {
  // Criar um novo colaborador
  async create({
    empresa_id,
    numero_registro,
    nome,
    cpf,
    cnpj,
    senha_hash, // já vem pronto do controller
    cargo,
    setor,
    tipo_jornada,
    horas_diarias,
    foto,
    salario
  }) {
    const [result] = await db.query(
      `INSERT INTO usuario 
        (empresa_id, numero_registro, nome, cpf, cnpj, senha_hash, tipo_usuario, cargo, setor, tipo_jornada, horas_diarias, foto, salario) 
       VALUES (?, ?, ?, ?, ?, ?, 'colaborador', ?, ?, ?, ?, ?, ?)`,
      [
        empresa_id,
        numero_registro,
        nome,
        cpf || null,
        cnpj || null,
        senha_hash,
        cargo || null,
        setor || null,
        tipo_jornada,
        horas_diarias,
        foto || "fundofoda.png",
        salario || 0
      ]
    );

    await this.criarSetorSeNaoExistir(empresa_id, setor);

    return {
      id: result.insertId,
      empresa_id,
      numero_registro,
      nome,
      cpf: cpf || null,
      cnpj: cnpj || null,
      tipo_usuario: "colaborador",
      cargo: cargo || null,
      setor: setor || null,
      tipo_jornada,
      horas_diarias,
      foto: foto || "fundofoda.png",
      salario: salario || 0
    };
  },

  // Atualizar colaborador
  async update(id, { nome, cpf, cargo, setor, tipo_jornada, horas_diarias, foto, senha_hash, salario }) {
    const colaboradorAtual = await this.findById(id);
    if (!colaboradorAtual) throw new Error("Colaborador não encontrado");

    const dadosAtualizados = {
      nome: nome ?? colaboradorAtual.nome,
      cpf: cpf ?? colaboradorAtual.cpf,
      cargo: cargo ?? colaboradorAtual.cargo,
      setor: setor ?? colaboradorAtual.setor,
      tipo_jornada: tipo_jornada ?? colaboradorAtual.tipo_jornada,
      horas_diarias: horas_diarias ?? colaboradorAtual.horas_diarias,
      foto: foto ?? colaboradorAtual.foto,
      senha_hash: senha_hash ?? colaboradorAtual.senha_hash,
      salario: salario ?? colaboradorAtual.salario
    };

    await db.query(
      `UPDATE usuario 
         SET nome = ?, cpf = ?, cargo = ?, setor = ?, tipo_jornada = ?, horas_diarias = ?, foto = ?, senha_hash = ?, salario = ?
       WHERE id = ? AND tipo_usuario = 'colaborador'`,
      [
        dadosAtualizados.nome,
        dadosAtualizados.cpf,
        dadosAtualizados.cargo,
        dadosAtualizados.setor,
        dadosAtualizados.tipo_jornada,
        dadosAtualizados.horas_diarias,
        dadosAtualizados.foto,
        dadosAtualizados.senha_hash,
        dadosAtualizados.salario,
        id
      ]
    );

    if (colaboradorAtual && setor) {
      await this.criarSetorSeNaoExistir(colaboradorAtual.empresa_id, dadosAtualizados.setor);
    }

    return this.findById(id);
  },

  async criarSetorSeNaoExistir(empresa_id, nome_setor) {
    if (!nome_setor) return;

    const [rows] = await db.query(
      `SELECT id FROM setores WHERE empresa_id = ? AND nome_setor = ?`,
      [empresa_id, nome_setor]
    );

    if (rows.length === 0) {
      await db.query(
        `INSERT INTO setores (empresa_id, nome_setor) VALUES (?, ?)`,
        [empresa_id, nome_setor]
      );
    }
  },

  async findByRegistro(empresa_id, numero_registro) {
    const [rows] = await db.query(
      `SELECT * FROM usuario 
       WHERE empresa_id = ? AND numero_registro = ? AND tipo_usuario = 'colaborador'`,
      [empresa_id, numero_registro]
    );
    return rows[0];
  },

  async findById(id) {
    const [rows] = await db.query(
      `SELECT * FROM usuario WHERE id = ? AND tipo_usuario = 'colaborador'`,
      [id]
    );
    return rows[0];
  },

  async findByEmpresa(empresa_id) {
    const [rows] = await db.query(
      `SELECT * FROM usuario WHERE empresa_id = ? AND tipo_usuario = 'colaborador' ORDER BY nome`,
      [empresa_id]
    );
    return rows;
  },

  async delete(id) {
    await db.query(
      `DELETE FROM usuario WHERE id = ? AND tipo_usuario = 'colaborador'`,
      [id]
    );
    return true;
  },

  async proximoRegistro(empresa_id) {
    const [rows] = await db.query(
      `SELECT numero_registro FROM usuario WHERE empresa_id = ? AND tipo_usuario = 'colaborador' ORDER BY id DESC LIMIT 1`,
      [empresa_id]
    );

    if (rows.length === 0) return "C001";

    const ultimoRegistro = rows[0].numero_registro;
    const numero = parseInt(ultimoRegistro.replace(/\D/g, "")) + 1;
    return "C" + numero.toString().padStart(3, "0");
  },

  async listarSetores(empresa_id) {
    const [rows] = await db.query(
      `SELECT nome_setor FROM setores WHERE empresa_id = ? ORDER BY nome_setor`,
      [empresa_id]
    );
    return rows.map(r => r.nome_setor);
  },

  async criarSetor(empresa_id, nome_setor) {
    await this.criarSetorSeNaoExistir(empresa_id, nome_setor);
    return { empresa_id, nome_setor };
  }
};

module.exports = Colaborador;
