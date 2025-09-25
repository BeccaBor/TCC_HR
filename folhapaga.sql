-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 16/09/2025 às 22:50
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `folhapaga`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `colaboradores`
--

CREATE TABLE `colaboradores` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `cpf` varchar(14) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `setor` varchar(100) DEFAULT NULL,
  `empresa` varchar(100) DEFAULT NULL,
  `gestor_id` int(11) DEFAULT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `controlarfolhadepagamento`
--

CREATE TABLE `controlarfolhadepagamento` (
  `id` int(11) NOT NULL,
  `mes_referencia` date NOT NULL,
  `total_liquido_geral` decimal(12,2) DEFAULT NULL,
  `total_bruto_geral` decimal(12,2) DEFAULT NULL,
  `data_processamento` timestamp NOT NULL DEFAULT current_timestamp(),
  `processado_por_gestor_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `empresa`
--

CREATE TABLE `empresa` (
  `id` int(11) NOT NULL,
  `cnpj` varchar(18) NOT NULL,
  `nome_empresa` varchar(100) NOT NULL,
  `senha_hash` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `empresa`
--

INSERT INTO `empresa` (`id`, `cnpj`, `nome_empresa`, `senha_hash`) VALUES
(1, '12345678910', 'teste', ''),
(2, '12345678911', 'teste1', ''),
(3, '1234567899', 'r', ''),
(4, '1234567890', 'rmaon', ''),
(8, '12345678918', 'tamandua', ''),
(9, '12345678922', 'bolsonaro', '$2b$10$ktV7ftJ0i/Hdy1EjODxQVeDBtcP7LVm6uUUTc9y8k55bWjx4tfWua');

-- --------------------------------------------------------

--
-- Estrutura para tabela `gerenciarbeneficios`
--

CREATE TABLE `gerenciarbeneficios` (
  `id` int(11) NOT NULL,
  `gestor_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `nome_do_beneficio` varchar(100) NOT NULL,
  `descricao_beneficio` text DEFAULT NULL,
  `valor_aplicado` decimal(10,2) DEFAULT NULL,
  `data_inicio` date DEFAULT curdate(),
  `data_fim` date DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `gerenciardocumentacaotrabalhista`
--

CREATE TABLE `gerenciardocumentacaotrabalhista` (
  `id` int(11) NOT NULL,
  `gestor_id` int(11) NOT NULL,
  `documento_id` int(11) NOT NULL,
  `acao_gerenciamento` varchar(100) DEFAULT NULL,
  `data_gerenciamento` date DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `gerenciarponto`
--

CREATE TABLE `gerenciarponto` (
  `id` int(11) NOT NULL,
  `gestor_id` int(11) NOT NULL,
  `registro_ponto_id` int(11) NOT NULL,
  `acao_gerenciamento` varchar(50) DEFAULT NULL,
  `data_acao` date DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `gerenciarrelatorios`
--

CREATE TABLE `gerenciarrelatorios` (
  `id` int(11) NOT NULL,
  `gerado_por_usuario_id` int(11) NOT NULL,
  `tipo_relatorio` varchar(100) NOT NULL,
  `data_geracao` timestamp NOT NULL DEFAULT current_timestamp(),
  `caminho_arquivo` varchar(255) DEFAULT NULL,
  `parametros_geracao` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`parametros_geracao`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `gerenciarusuarios`
--

CREATE TABLE `gerenciarusuarios` (
  `id` int(11) NOT NULL,
  `gestor_id` int(11) NOT NULL,
  `usuario_gerenciado_id` int(11) NOT NULL,
  `acao_realizada` varchar(100) DEFAULT NULL,
  `data_acao` date DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `gestores`
--

CREATE TABLE `gestores` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `cpf` varchar(14) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `setor` varchar(100) DEFAULT NULL,
  `empresa` varchar(100) DEFAULT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `logs_acesso`
--

CREATE TABLE `logs_acesso` (
  `id` int(11) NOT NULL,
  `usuario_tipo` enum('gestor','colaborador') NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `acao` varchar(255) NOT NULL,
  `data_hora` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `pontos`
--

CREATE TABLE `pontos` (
  `id` int(10) UNSIGNED NOT NULL,
  `nome` varchar(255) NOT NULL,
  `setor` varchar(255) DEFAULT NULL,
  `tipo_usuario` varchar(50) DEFAULT NULL,
  `tipo_registro` enum('entrada','saida','inicio_intervalo','fim_intervalo') NOT NULL,
  `horas` tinyint(3) UNSIGNED DEFAULT NULL,
  `cnpj` varchar(50) NOT NULL,
  `data_registro` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `realizarsolicitacoes`
--

CREATE TABLE `realizarsolicitacoes` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `tipo_solicitacao` enum('ferias','alteracao_dados','consulta_banco_horas','desligamento','reembolso','outros') NOT NULL,
  `descricao` text DEFAULT NULL,
  `data_solicitacao` date DEFAULT current_timestamp(),
  `status` enum('pendente','aprovada','rejeitada') DEFAULT 'pendente',
  `gestor_id` int(11) DEFAULT NULL,
  `data_aprovacao_rejeicao` date DEFAULT NULL,
  `observacao_gestor` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `realizarupload`
--

CREATE TABLE `realizarupload` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `tipo_documento` enum('contrato','holerite','atestado','recibo','declaracao','outros') NOT NULL,
  `caminho_arquivo` varchar(255) NOT NULL,
  `data_upload` date DEFAULT current_timestamp(),
  `status` enum('pendente','aprovado','rejeitado') DEFAULT 'pendente'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `registroponto`
--

CREATE TABLE `registroponto` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `data_hora_registro` datetime NOT NULL,
  `tipo_registro` enum('entrada','saida','intervalo_inicio','intervalo_fim') NOT NULL,
  `nome` varchar(50) DEFAULT NULL,
  `setor` varchar(50) DEFAULT NULL,
  `horas` decimal(5,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuario`
--

CREATE TABLE `usuario` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `numero_registro` varchar(50) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `cpf` varchar(14) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `cnpj` varchar(100) NOT NULL,
  `senha_hash` varchar(255) NOT NULL,
  `tipo_usuario` enum('gestor','colaborador') NOT NULL,
  `cargo` varchar(50) DEFAULT NULL,
  `setor` varchar(50) DEFAULT NULL,
  `data_criacao` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `usuario`
--

INSERT INTO `usuario` (`id`, `empresa_id`, `numero_registro`, `nome`, `cpf`, `email`, `cnpj`, `senha_hash`, `tipo_usuario`, `cargo`, `setor`, `data_criacao`) VALUES
(1, 1, 'G1', 'teste', NULL, NULL, '12345678910', '$2b$10$Cl8nwzxRUMZBIyjDllm8QOG7J8QOvEE7k/LMpubTj779o23lT9gJy', 'gestor', NULL, NULL, '2025-08-27 09:28:49'),
(2, 2, 'G2', 'teste1', NULL, NULL, '12345678911', '$2b$10$FUooESsPuSv9ODgmOX1Ehek/89VS/VCtFv9ya4I64ZrASqyl80jYu', 'gestor', NULL, NULL, '2025-08-27 09:38:29'),
(3, 3, 'G3', 'r', NULL, NULL, '1234567899', '$2b$10$B849u4PKLbINn0LEuEIjgegMwene1NaUupI6R.OgvpgLJKiO7JKFK', 'gestor', NULL, NULL, '2025-09-11 14:27:02'),
(4, 4, 'G4', 'rmaon', NULL, NULL, '1234567890', '$2b$10$CtX8pT4FXstCLh2zK0CCHutsMXqQ7i4.w7FzqT/8xaaSTc5zTtrV2', 'gestor', NULL, NULL, '2025-09-11 14:49:05'),
(5, 9, 'G9', 'bolsonaro', NULL, NULL, '12345678922', '$2b$10$ktV7ftJ0i/Hdy1EjODxQVeDBtcP7LVm6uUUTc9y8k55bWjx4tfWua', 'gestor', NULL, NULL, '2025-09-16 01:12:45');

-- --------------------------------------------------------

--
-- Estrutura para tabela `visualizardados`
--

CREATE TABLE `visualizardados` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `visualizarholerites`
--

CREATE TABLE `visualizarholerites` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `mes_referencia` date NOT NULL,
  `salario_base` decimal(10,2) DEFAULT NULL,
  `proventos_detalhe` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`proventos_detalhe`)),
  `descontos_detalhe` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`descontos_detalhe`)),
  `salario_liquido` decimal(10,2) DEFAULT NULL,
  `arquivo_pdf_caminho` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `colaboradores`
--
ALTER TABLE `colaboradores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cpf` (`cpf`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `gestor_id` (`gestor_id`);

--
-- Índices de tabela `controlarfolhadepagamento`
--
ALTER TABLE `controlarfolhadepagamento`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `mes_referencia` (`mes_referencia`),
  ADD KEY `fk_controlar_folha_gestor` (`processado_por_gestor_id`);

--
-- Índices de tabela `empresa`
--
ALTER TABLE `empresa`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cnpj` (`cnpj`);

--
-- Índices de tabela `gerenciarbeneficios`
--
ALTER TABLE `gerenciarbeneficios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario_id` (`usuario_id`,`nome_do_beneficio`,`data_inicio`),
  ADD KEY `fk_gerenciar_beneficios_gestor` (`gestor_id`);

--
-- Índices de tabela `gerenciardocumentacaotrabalhista`
--
ALTER TABLE `gerenciardocumentacaotrabalhista`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `documento_id` (`documento_id`),
  ADD KEY `fk_gerenciar_documentacao_gestor` (`gestor_id`);

--
-- Índices de tabela `gerenciarponto`
--
ALTER TABLE `gerenciarponto`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `registro_ponto_id` (`registro_ponto_id`),
  ADD KEY `fk_gerenciar_ponto_gestor` (`gestor_id`);

--
-- Índices de tabela `gerenciarrelatorios`
--
ALTER TABLE `gerenciarrelatorios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_gerenciar_relatorios_gerador` (`gerado_por_usuario_id`);

--
-- Índices de tabela `gerenciarusuarios`
--
ALTER TABLE `gerenciarusuarios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_gerenciar_usuarios_gestor` (`gestor_id`),
  ADD KEY `fk_gerenciar_usuarios_usuario_gerenciado` (`usuario_gerenciado_id`);

--
-- Índices de tabela `gestores`
--
ALTER TABLE `gestores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cpf` (`cpf`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Índices de tabela `logs_acesso`
--
ALTER TABLE `logs_acesso`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Índices de tabela `pontos`
--
ALTER TABLE `pontos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_cnpj` (`cnpj`),
  ADD KEY `idx_data` (`data_registro`);

--
-- Índices de tabela `realizarsolicitacoes`
--
ALTER TABLE `realizarsolicitacoes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_realizar_solicitacoes_usuario` (`usuario_id`),
  ADD KEY `fk_realizar_solicitacoes_gestor` (`gestor_id`);

--
-- Índices de tabela `realizarupload`
--
ALTER TABLE `realizarupload`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_realizar_upload_usuario` (`usuario_id`);

--
-- Índices de tabela `registroponto`
--
ALTER TABLE `registroponto`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_registro_ponto_usuario` (`usuario_id`);

--
-- Índices de tabela `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `empresa_id` (`empresa_id`,`numero_registro`),
  ADD UNIQUE KEY `uq_usuario_cpf` (`cpf`),
  ADD UNIQUE KEY `uq_usuario_email` (`email`);

--
-- Índices de tabela `visualizardados`
--
ALTER TABLE `visualizardados`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_visualizar_dados_usuario` (`usuario_id`);

--
-- Índices de tabela `visualizarholerites`
--
ALTER TABLE `visualizarholerites`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario_id` (`usuario_id`,`mes_referencia`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `colaboradores`
--
ALTER TABLE `colaboradores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `controlarfolhadepagamento`
--
ALTER TABLE `controlarfolhadepagamento`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `empresa`
--
ALTER TABLE `empresa`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de tabela `gerenciarbeneficios`
--
ALTER TABLE `gerenciarbeneficios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `gerenciardocumentacaotrabalhista`
--
ALTER TABLE `gerenciardocumentacaotrabalhista`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `gerenciarponto`
--
ALTER TABLE `gerenciarponto`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `gerenciarrelatorios`
--
ALTER TABLE `gerenciarrelatorios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `gerenciarusuarios`
--
ALTER TABLE `gerenciarusuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `gestores`
--
ALTER TABLE `gestores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `logs_acesso`
--
ALTER TABLE `logs_acesso`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `pontos`
--
ALTER TABLE `pontos`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `realizarsolicitacoes`
--
ALTER TABLE `realizarsolicitacoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `realizarupload`
--
ALTER TABLE `realizarupload`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `registroponto`
--
ALTER TABLE `registroponto`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de tabela `visualizardados`
--
ALTER TABLE `visualizardados`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `visualizarholerites`
--
ALTER TABLE `visualizarholerites`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `colaboradores`
--
ALTER TABLE `colaboradores`
  ADD CONSTRAINT `colaboradores_ibfk_1` FOREIGN KEY (`gestor_id`) REFERENCES `gestores` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `controlarfolhadepagamento`
--
ALTER TABLE `controlarfolhadepagamento`
  ADD CONSTRAINT `fk_controlar_folha_gestor` FOREIGN KEY (`processado_por_gestor_id`) REFERENCES `usuario` (`id`);

--
-- Restrições para tabelas `gerenciarbeneficios`
--
ALTER TABLE `gerenciarbeneficios`
  ADD CONSTRAINT `fk_gerenciar_beneficios_gestor` FOREIGN KEY (`gestor_id`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `fk_gerenciar_beneficios_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`);

--
-- Restrições para tabelas `logs_acesso`
--
ALTER TABLE `logs_acesso`
  ADD CONSTRAINT `fk_logs_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `usuario`
--
ALTER TABLE `usuario`
  ADD CONSTRAINT `fk_usuario_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresa` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
