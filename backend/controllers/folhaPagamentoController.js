// backend/controllers/folhaPagamentoController.js
const db = require('../config/db'); 
const folhaService = require('../services/folhadePagamentoService');

const folhaPagamentoController = {
  // Exibe a folha de pagamento
  async mostrarFolha(req, res) {
    try {
      // Buscar funcionários ativos
      const [funcionarios] = await db.query(
        `SELECT u.id, u.nome, u.tipo_usuario, u.setor, vh.salario_liquido AS salario, vh.proventos_detalhe AS dependentes
         FROM usuario u
         LEFT JOIN visualizarholerites vh ON u.id = vh.usuario_id
         WHERE u.tipo_usuario IN ('Gestor','Colaborador')`
      );

      const listaFuncionarios = funcionarios || [];

      // Calcular folha completa usando o serviço
      const { detalhesFuncionarios, resumo } = folhaService.calcularFolhaCompleta(listaFuncionarios);

      // Dados para o template
      const data = {
        funcionariosAtivos: listaFuncionarios.length,
        folhaAtual: new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date()),
        totalFolha: `R$ ${resumo.totalLiquido || 0}`,
        folhasRecentes: [
          { data: '12/2023', tipo: 'Folha Normal', valor: 'R$ 150.000,00', status: 'Processada', icone: 'bi-file-earmark-text' },
          { data: '11/2023', tipo: '13º Salário', valor: 'R$ 50.000,00', status: 'Processada', icone: 'bi-cash-stack' },
          { data: '10/2023', tipo: 'Férias', valor: 'R$ 30.000,00', status: 'Pendente', icone: 'bi-calendar' }
        ],
        resumoFolha: resumo
      };

      res.render('folhadepagamento', data);
    } catch (err) {
      console.error('Erro ao mostrar folha:', err);
      res.status(500).send('Erro interno no servidor');
    }
  }
};

module.exports = folhaPagamentoController;
