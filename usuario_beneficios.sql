-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 01/10/2025 às 21:44
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

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `usuario_beneficios`
--
ALTER TABLE `usuario_beneficios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_usuario_beneficio` (`usuario_id`,`beneficio_id`,`data_inicio`),
  ADD KEY `fk_usuario_beneficios_beneficio` (`beneficio_id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `usuario_beneficios`
--
ALTER TABLE `usuario_beneficios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- Restrições para tabelas despejadas
--

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
