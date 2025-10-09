-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 08/10/2025 às 04:40
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
(4, 7, 'reajuste_salarial', NULL, '2025-10-07', 'pendente', NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 20:41:47', NULL),
(5, 26, 'reajuste_salarial', NULL, '2025-10-07', 'pendente', NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-08 02:14:20', NULL);

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `realizarsolicitacoes`
--
ALTER TABLE `realizarsolicitacoes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_realizar_solicitacoes_usuario` (`usuario_id`),
  ADD KEY `fk_realizar_solicitacoes_gestor` (`gestor_id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `realizarsolicitacoes`
--
ALTER TABLE `realizarsolicitacoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `realizarsolicitacoes`
--
ALTER TABLE `realizarsolicitacoes`
  ADD CONSTRAINT `fk_realizar_solicitacoes_gestor` FOREIGN KEY (`gestor_id`) REFERENCES `usuario` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
