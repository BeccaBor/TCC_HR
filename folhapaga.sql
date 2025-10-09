-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 08/10/2025 às 03:54
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
  `cnpj` varchar(14) NOT NULL,
  `nome_empresa` varchar(100) NOT NULL,
  `senha_hash` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `empresa`
--

INSERT INTO `empresa` (`id`, `cnpj`, `nome_empresa`, `senha_hash`) VALUES
(1, '12345678910111', 'teste', '$2b$10$default_hash_aqui'),
(2, '12345678911101', 'teste1', '$2b$10$default_hash_aqui'),
(3, '12345678991011', 'r', '$2b$10$default_hash_aqui'),
(4, '12345678902331', 'rmaon', '$2b$10$default_hash_aqui'),
(8, '12345678918456', 'tamandua', '$2b$10$default_hash_aqui'),
(9, '12345678922543', 'bolsonaro', '$2b$10$ktV7ftJ0i/Hdy1EjODxQVeDBtcP7LVm6uUUTc9y8k55bWjx4tfWua'),
(10, '1234567892412', 'meu bem', '$2b$10$FowSlFRUUTsvhUiLYVkgFOZc8CJGmSQ/LjjQzSG5bIunxr5/kHlGm'),
(11, '12345678910234', 'wuwa', '$2b$10$JywJpNHAcOarIiIJTyL/EOIICxxWgzUzz0b7BNQdkq/3gOMoSlgYy'),
(12, '12345678910232', 'teste', '$2b$10$h/iY/gK5J10STb4.p.QOlumSn8LMLrW/SJ/3Inh0.b8fjTl4jJ7WK');

-- --------------------------------------------------------

--
-- Estrutura para tabela `gerenciarbeneficios`
--

CREATE TABLE `gerenciarbeneficios` (
  `id` int(11) NOT NULL,
  `gestor_id` int(11) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `cargo` varchar(100) DEFAULT NULL,
  `nome_do_beneficio` varchar(100) NOT NULL,
  `descricao_beneficio` text DEFAULT NULL,
  `valor_aplicado` decimal(10,2) DEFAULT NULL,
  `data_inicio` date DEFAULT curdate(),
  `data_fim` date DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `gerenciarbeneficios`
--

INSERT INTO `gerenciarbeneficios` (`id`, `gestor_id`, `usuario_id`, `cargo`, `nome_do_beneficio`, `descricao_beneficio`, `valor_aplicado`, `data_inicio`, `data_fim`, `ativo`) VALUES
(8, 5, NULL, 'Analista', 'Vale Refeição', 'Vale refeição diário', 25.00, '2025-10-01', NULL, 1),
(9, 5, NULL, 'Analista', 'Vale Transporte', 'Benefício transporte', 8.00, '2025-10-01', NULL, 1),
(10, 5, NULL, 'Analista', 'Plano de Saúde', 'Plano de saúde empresarial - coparticipação', 150.00, '2025-10-01', NULL, 1);

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
  `usuario_id` int(11) DEFAULT NULL,
  `nome` varchar(255) NOT NULL,
  `setor` varchar(255) DEFAULT NULL,
  `tipo_usuario` varchar(50) DEFAULT NULL,
  `tipo_registro` enum('entrada','saida','inicio_intervalo','fim_intervalo') NOT NULL,
  `horas` tinyint(3) UNSIGNED DEFAULT NULL,
  `cnpj` varchar(14) NOT NULL,
  `data_registro` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `pontos`
--

INSERT INTO `pontos` (`id`, `usuario_id`, `nome`, `setor`, `tipo_usuario`, `tipo_registro`, `horas`, `cnpj`, `data_registro`) VALUES
(1, 5, 'bolsonaro', 'Departamento Pessoal', 'gestor', 'entrada', 8, '12345678922', '2025-09-28 21:56:23'),
(2, 5, 'bolsonaro', 'Departamento Pessoal', 'gestor', 'saida', 6, '12345678922', '2025-09-30 10:40:46'),
(3, 1, 'teste', 'Departamento Pessoal', 'gestor', 'entrada', 8, '12345678910111', '2025-10-04 19:44:27'),
(4, 1, 'teste', 'Departamento Pessoal', 'gestor', 'entrada', 6, '12345678910111', '2025-10-04 19:44:36'),
(5, 7, 'cris', 'TI', 'colaborador', 'entrada', 8, '55770680881', '2025-10-04 19:56:20'),
(6, 7, 'cris', 'TI', 'colaborador', 'saida', 6, '55770680881', '2025-10-04 19:56:37'),
(7, 7, 'cris', 'TI', 'colaborador', 'saida', 8, '55770680881', '2025-10-07 17:42:33');

-- --------------------------------------------------------

--
-- Estrutura para tabela `realizarsolicitacoes`
--

CREATE TABLE `realizarsolicitacoes` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `tipo_solicitacao` enum('ferias','alteracao_dados','consulta_banco_horas','banco_horas','desligamento','reembolso','outros','reajuste_salarial') NOT NULL,
  `descricao` text DEFAULT NULL,
  `data_solicitacao` date DEFAULT current_timestamp(),
  `status` enum('pendente','aprovada','rejeitada','reprovada') DEFAULT 'pendente',
  `gestor_id` int(11) DEFAULT NULL,
  `data_aprovacao_rejeicao` date DEFAULT NULL,
  `observacao_gestor` text DEFAULT NULL,
  `titulo` varchar(255) DEFAULT NULL,
  `data_inicio` date DEFAULT NULL,
  `data_fim` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `realizarsolicitacoes`
--

INSERT INTO `realizarsolicitacoes` (`id`, `usuario_id`, `tipo_solicitacao`, `descricao`, `data_solicitacao`, `status`, `gestor_id`, `data_aprovacao_rejeicao`, `observacao_gestor`, `titulo`, `data_inicio`, `data_fim`, `created_at`, `updated_at`) VALUES
(1, 7, 'outros', NULL, '2025-10-05', 'pendente', NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-05 19:42:23', NULL),
(2, 7, 'outros', NULL, '2025-10-07', 'pendente', NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 20:05:37', NULL),
(3, 7, 'reajuste_salarial', NULL, '2025-10-07', 'pendente', NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 20:34:42', NULL),
(4, 7, 'reajuste_salarial', NULL, '2025-10-07', 'pendente', NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 20:41:47', NULL);

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
  `status` enum('pendente','aprovado','rejeitado') DEFAULT 'pendente',
  `nome_arquivo` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `realizarupload`
--

INSERT INTO `realizarupload` (`id`, `usuario_id`, `tipo_documento`, `caminho_arquivo`, `data_upload`, `status`, `nome_arquivo`) VALUES
(1, 5, 'contrato', 'uploads/documento-5-1759236227587.jpeg', '2025-09-30', 'pendente', 'WhatsApp Image 2025-09-28 at 18.06.41 (1).jpeg'),
(2, 1, 'contrato', 'uploads/documento-1-1759601770709.jpg', '2025-10-04', 'pendente', 'changli.jpg'),
(3, 7, 'contrato', 'uploads/doc-7-wallpaper-1759618486038.png', '2025-10-04', 'pendente', 'wallpaper.png'),
(4, 1, 'contrato', 'uploads/doc-1-wallpaper-1759625802462.png', '2025-10-04', 'pendente', 'wallpaper.png'),
(5, 1, 'contrato', 'uploads/doc-1-wallpaper-1759625934775.png', '2025-10-04', 'pendente', 'wallpaper.png'),
(6, 1, 'contrato', 'uploads/doc-1-wallpaper-1759626077092.png', '2025-10-04', 'pendente', 'wallpaper.png'),
(7, 1, 'contrato', 'uploads/doc-1-wallpaper-1759626176373.png', '2025-10-04', 'pendente', 'wallpaper.png'),
(8, 1, 'recibo', 'uploads/doc-1-changli-1759626218148.jpg', '2025-10-04', 'pendente', 'changli.jpg'),
(9, 1, 'contrato', 'uploads/doc-1-changli-1759626957797.jpg', '2025-10-04', 'pendente', 'changli.jpg'),
(10, 1, 'contrato', 'uploads/doc-1-changli-1759627255153.jpg', '2025-10-04', 'pendente', 'changli.jpg');

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
-- Estrutura para tabela `setores`
--

CREATE TABLE `setores` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `nome_setor` varchar(100) NOT NULL,
  `descricao` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `setores`
--

INSERT INTO `setores` (`id`, `empresa_id`, `nome_setor`, `descricao`) VALUES
(1, 10, 'ADM', NULL),
(2, 9, 'TI', NULL),
(4, 9, 'putaria', NULL),
(5, 9, 'Artes', NULL),
(6, 9, 'Todos', NULL),
(7, 9, 'ADM', NULL),
(8, 9, 'Departamento Pessoal', NULL),
(9, 9, 'odio', NULL),
(10, 9, 'PENIANO', NULL),
(11, 1, 'Departamento Pessoal', NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `solicitacao_anexos`
--

CREATE TABLE `solicitacao_anexos` (
  `id` int(11) NOT NULL,
  `solicitacao_id` int(11) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `path` varchar(500) NOT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `solicitacao_log`
--

CREATE TABLE `solicitacao_log` (
  `id` int(11) NOT NULL,
  `solicitacao_id` int(11) NOT NULL,
  `gestor_id` int(11) DEFAULT NULL,
  `acao` varchar(128) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `observacao` text DEFAULT NULL
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
  `cnpj` varchar(14) NOT NULL,
  `senha_hash` varchar(255) NOT NULL,
  `tipo_usuario` enum('gestor','colaborador') NOT NULL,
  `cargo` varchar(50) DEFAULT NULL,
  `setor` varchar(50) DEFAULT NULL,
  `salario` decimal(10,2) DEFAULT 0.00,
  `data_criacao` timestamp NOT NULL DEFAULT current_timestamp(),
  `tipo_jornada` varchar(100) NOT NULL,
  `horas_diarias` int(11) NOT NULL DEFAULT 8,
  `foto` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `usuario`
--

INSERT INTO `usuario` (`id`, `empresa_id`, `numero_registro`, `nome`, `cpf`, `email`, `cnpj`, `senha_hash`, `tipo_usuario`, `cargo`, `setor`, `salario`, `data_criacao`, `tipo_jornada`, `horas_diarias`, `foto`) VALUES
(1, 1, 'G1', 'teste', NULL, NULL, '12345678910111', '$2b$10$Cl8nwzxRUMZBIyjDllm8QOG7J8QOvEE7k/LMpubTj779o23lT9gJy', 'gestor', NULL, NULL, 0.00, '2025-08-27 09:28:49', '6x1', 8, NULL),
(2, 2, 'G2', 'teste1', NULL, NULL, '12345678911101', '$2b$10$FUooESsPuSv9ODgmOX1Ehek/89VS/VCtFv9ya4I64ZrASqyl80jYu', 'gestor', NULL, NULL, 0.00, '2025-08-27 09:38:29', '6x1', 8, NULL),
(3, 3, 'G3', 'r', NULL, NULL, '1234567899101', '$2b$10$B849u4PKLbINn0LEuEIjgegMwene1NaUupI6R.OgvpgLJKiO7JKFK', 'gestor', NULL, NULL, 0.00, '2025-09-11 14:27:02', '6x1', 8, NULL),
(4, 4, 'G4', 'rmaon', NULL, NULL, '12345678902331', '$2b$10$CtX8pT4FXstCLh2zK0CCHutsMXqQ7i4.w7FzqT/8xaaSTc5zTtrV2', 'gestor', NULL, NULL, 0.00, '2025-09-11 14:49:05', '6x1', 8, NULL),
(5, 9, 'G9', 'bolsonaro', NULL, NULL, '12345678922543', '$2b$10$ktV7ftJ0i/Hdy1EjODxQVeDBtcP7LVm6uUUTc9y8k55bWjx4tfWua', 'gestor', NULL, NULL, 0.00, '2025-09-16 01:12:45', '6x1', 8, NULL),
(6, 10, 'G10', 'luis', NULL, NULL, '12345678924', '$2b$10$FowSlFRUUTsvhUiLYVkgFOZc8CJGmSQ/LjjQzSG5bIunxr5/kHlGm', 'gestor', 'Adm', 'ADM', 0.00, '2025-09-29 02:28:19', '6x1', 8, NULL),
(7, 9, 'C001', 'cris', '55770680881', NULL, '55770680881', '$2b$10$9WXuFoVIFPsvuWRHBYVE8OyzXOOVXSTeHfMB.4Pel0IFWB5ixcFQq', 'colaborador', 'Analista', 'TI', 450.00, '2025-09-29 14:11:40', '6x1', 6, '1759196108067.jpg'),
(15, 9, 'CC003', 'edson', '55770680882', NULL, '12345678922', '$2b$10$0xnH0IXNMXWDNFAdkv6pvOF9eE.y82qOGeSjUkHytWI42zKhxSsda', 'colaborador', 'Analista', 'TI', 140.00, '2025-09-30 01:14:29', '6x1', 6, '1759196132303.jpg'),
(16, 9, 'CC004', 'jean', '55770680883', NULL, '12345678922', '$2b$10$ZppMgNl6tLpjtX.sbtMMNu9R5Q6MeyDUHEqj65.WDcKfxcKyfEVeW', 'colaborador', 'Desing', 'Artes', 0.00, '2025-09-30 01:36:30', '6x1', 23, '1759196189829.jpg'),
(18, 9, 'CC006', 'rebecca', '55770680885', NULL, '12345678922', '$2b$10$2T89V75xqBr51X/yz46I5eYFEGahw8c.MYetGQsMzom7j3ZcZxVvK', 'colaborador', 'Analista', 'TI', 0.00, '2025-09-30 01:43:18', '6x1', 12, '1759196598380.jpg'),
(21, 9, 'CC009', 'samuel', '55770680889', NULL, '12345678922', '$2b$10$/ue3J4g7oSii4OxKqpgqM.vEc9v0WV/A4QiSDtWEmiRBhn5NjUJLi', 'colaborador', 'Analista', 'odio', 0.00, '2025-09-30 13:34:21', '6x1', 12, '1759239260750.jpg'),
(22, 9, 'CC010', 'mAUHE', '40028922', NULL, '12345678922', '$2b$10$sZoxR0qx5yLv5ZbUQdu0.ORRS3OP/vYp3GJt54/2rG74LqMM.hVfC', 'colaborador', 'Vadiação', 'PENIANO', 0.00, '2025-09-30 13:57:17', 'flexivel', 23, '1759240637201.jpeg'),
(23, 9, 'CC011', 'Ramon Viana Ferreira Dos Reis ', '55770680871', NULL, '12345678922', '$2b$10$Bt3vCU7vH.l8m1V0I.AcueHVGKFteySpkppiTl68q.oiJc/pu3FYu', 'colaborador', 'Analista', 'TI', 1250.00, '2025-10-01 21:33:15', '6x1', 12, 'fundofoda.png'),
(24, 11, 'G11', 'changli', NULL, NULL, '12345678910234', '$2b$10$JywJpNHAcOarIiIJTyL/EOIICxxWgzUzz0b7BNQdkq/3gOMoSlgYy', 'gestor', 'Chefe', 'Recursos humanos', 0.00, '2025-10-04 16:35:14', '5x2', 8, NULL),
(25, 12, 'G12', 'aaa', NULL, NULL, '12345678910232', '$2b$10$h/iY/gK5J10STb4.p.QOlumSn8LMLrW/SJ/3Inh0.b8fjTl4jJ7WK', 'gestor', 'Chefe', 'Recursos humanos', 0.00, '2025-10-04 16:49:18', '6x1', 4, NULL),
(26, 1, 'CC001', 'sla', '12345678911', NULL, '12345678910111', '$2b$10$fNGQyCJ/Pfl6fbcdN1ec1ufNSWbXoD7eieD1ZpaIm.UGXPIno9.6C', 'colaborador', 'colaborador ', 'Departamento Pessoal', 1000.00, '2025-10-04 22:43:54', '6x1', 8, '1759617833972.jpg');

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuario_beneficios`
--

CREATE TABLE `usuario_beneficios` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `beneficio_id` int(11) NOT NULL,
  `valor_personalizado` decimal(10,2) DEFAULT NULL,
  `data_inicio` date DEFAULT curdate(),
  `data_fim` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `usuario_beneficios`
--

INSERT INTO `usuario_beneficios` (`id`, `usuario_id`, `beneficio_id`, `valor_personalizado`, `data_inicio`, `data_fim`) VALUES
(1, 7, 8, 25.00, '2025-10-01', NULL),
(2, 7, 9, 8.00, '2025-10-01', NULL),
(3, 7, 10, 150.00, '2025-10-01', NULL),
(4, 15, 8, 25.00, '2025-10-01', NULL),
(5, 15, 9, 8.00, '2025-10-01', NULL),
(6, 15, 10, 150.00, '2025-10-01', NULL),
(7, 18, 8, 25.00, '2025-10-01', NULL),
(8, 18, 9, 8.00, '2025-10-01', NULL),
(9, 18, 10, 150.00, '2025-10-01', NULL),
(10, 21, 8, 25.00, '2025-10-01', NULL),
(11, 21, 9, 8.00, '2025-10-01', NULL),
(12, 21, 10, 150.00, '2025-10-01', NULL);

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
  ADD KEY `idx_data` (`data_registro`),
  ADD KEY `idx_usuario_id` (`usuario_id`);

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
-- Índices de tabela `setores`
--
ALTER TABLE `setores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `empresa_setor` (`empresa_id`,`nome_setor`),
  ADD KEY `fk_setores_empresa` (`empresa_id`);

--
-- Índices de tabela `solicitacao_anexos`
--
ALTER TABLE `solicitacao_anexos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_solicitacao_id` (`solicitacao_id`);

--
-- Índices de tabela `solicitacao_log`
--
ALTER TABLE `solicitacao_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `solicitacao_id` (`solicitacao_id`),
  ADD KEY `gestor_id` (`gestor_id`);

--
-- Índices de tabela `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `empresa_id` (`empresa_id`,`numero_registro`),
  ADD UNIQUE KEY `uq_usuario_cpf` (`cpf`),
  ADD UNIQUE KEY `uq_usuario_email` (`email`),
  ADD KEY `idx_usuario_cnpj` (`cnpj`);

--
-- Índices de tabela `usuario_beneficios`
--
ALTER TABLE `usuario_beneficios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_usuario_beneficio` (`usuario_id`,`beneficio_id`,`data_inicio`),
  ADD KEY `fk_usuario_beneficios_beneficio` (`beneficio_id`);

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
-- AUTO_INCREMENT de tabela `controlarfolhadepagamento`
--
ALTER TABLE `controlarfolhadepagamento`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `empresa`
--
ALTER TABLE `empresa`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de tabela `gerenciarbeneficios`
--
ALTER TABLE `gerenciarbeneficios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

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
-- AUTO_INCREMENT de tabela `logs_acesso`
--
ALTER TABLE `logs_acesso`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `pontos`
--
ALTER TABLE `pontos`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de tabela `realizarsolicitacoes`
--
ALTER TABLE `realizarsolicitacoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `realizarupload`
--
ALTER TABLE `realizarupload`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de tabela `registroponto`
--
ALTER TABLE `registroponto`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `setores`
--
ALTER TABLE `setores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de tabela `solicitacao_anexos`
--
ALTER TABLE `solicitacao_anexos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `solicitacao_log`
--
ALTER TABLE `solicitacao_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT de tabela `usuario_beneficios`
--
ALTER TABLE `usuario_beneficios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

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
-- Restrições para tabelas `controlarfolhadepagamento`
--
ALTER TABLE `controlarfolhadepagamento`
  ADD CONSTRAINT `fk_controlar_folha_gestor` FOREIGN KEY (`processado_por_gestor_id`) REFERENCES `usuario` (`id`);

--
-- Restrições para tabelas `gerenciarbeneficios`
--
ALTER TABLE `gerenciarbeneficios`
  ADD CONSTRAINT `fk_gerenciar_beneficios_gestor` FOREIGN KEY (`gestor_id`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `fk_gerenciar_beneficios_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `gerenciardocumentacaotrabalhista`
--
ALTER TABLE `gerenciardocumentacaotrabalhista`
  ADD CONSTRAINT `fk_gerenciar_documentacao_gestor` FOREIGN KEY (`gestor_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `gerenciarponto`
--
ALTER TABLE `gerenciarponto`
  ADD CONSTRAINT `fk_gerenciar_ponto_gestor` FOREIGN KEY (`gestor_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `gerenciarusuarios`
--
ALTER TABLE `gerenciarusuarios`
  ADD CONSTRAINT `fk_gerenciar_usuarios_gestor` FOREIGN KEY (`gestor_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `logs_acesso`
--
ALTER TABLE `logs_acesso`
  ADD CONSTRAINT `fk_logs_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `pontos`
--
ALTER TABLE `pontos`
  ADD CONSTRAINT `fk_pontos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Restrições para tabelas `realizarsolicitacoes`
--
ALTER TABLE `realizarsolicitacoes`
  ADD CONSTRAINT `fk_realizar_solicitacoes_gestor` FOREIGN KEY (`gestor_id`) REFERENCES `usuario` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `setores`
--
ALTER TABLE `setores`
  ADD CONSTRAINT `fk_setores_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresa` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `solicitacao_anexos`
--
ALTER TABLE `solicitacao_anexos`
  ADD CONSTRAINT `fk_solicitacao_anexos_realizarsolicitacoes` FOREIGN KEY (`solicitacao_id`) REFERENCES `realizarsolicitacoes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `usuario`
--
ALTER TABLE `usuario`
  ADD CONSTRAINT `fk_usuario_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresa` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `usuario_beneficios`
--
ALTER TABLE `usuario_beneficios`
  ADD CONSTRAINT `fk_usuario_beneficios_beneficio` FOREIGN KEY (`beneficio_id`) REFERENCES `gerenciarbeneficios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_usuario_beneficios_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
