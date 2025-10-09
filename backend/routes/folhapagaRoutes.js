const express = require('express');
const router = express.Router();

// Rota para folha individual
router.get('/:id', async (req, res) => {
  try {
    const colaboradorId = req.params.id;
    const colaborador = {
      id: colaboradorId,
      nome: "Colaborador " + colaboradorId,
      salario: 2500.00,
      horas_diarias: 8,
      dependentes: 0
    };
    
    res.render('folhapaga', {
      colaborador: colaborador
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).send('Erro interno');
  }
});

module.exports = router;