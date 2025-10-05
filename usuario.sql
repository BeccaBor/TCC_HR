-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 29/09/2025 às 15:58
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
  `data_criacao` timestamp NOT NULL DEFAULT current_timestamp(),
  `tipo_jornada` varchar(100) NOT NULL,
  `horas_diarias` varchar(50) NOT NULL,
  `foto` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `usuario`
--

INSERT INTO `usuario` (`id`, `empresa_id`, `numero_registro`, `nome`, `cpf`, `email`, `cnpj`, `senha_hash`, `tipo_usuario`, `cargo`, `setor`, `data_criacao`, `tipo_jornada`, `horas_diarias`, `foto`) VALUES
(1, 1, 'G1', 'teste', NULL, NULL, '12345678910', '$2b$10$Cl8nwzxRUMZBIyjDllm8QOG7J8QOvEE7k/LMpubTj779o23lT9gJy', 'gestor', NULL, NULL, '2025-08-27 09:28:49', '6x1', '08:00', NULL),
(2, 2, 'G2', 'teste1', NULL, NULL, '12345678911', '$2b$10$FUooESsPuSv9ODgmOX1Ehek/89VS/VCtFv9ya4I64ZrASqyl80jYu', 'gestor', NULL, NULL, '2025-08-27 09:38:29', '6x1', '08:00', NULL),
(3, 3, 'G3', 'r', NULL, NULL, '1234567899', '$2b$10$B849u4PKLbINn0LEuEIjgegMwene1NaUupI6R.OgvpgLJKiO7JKFK', 'gestor', NULL, NULL, '2025-09-11 14:27:02', '6x1', '08:00', NULL),
(4, 4, 'G4', 'rmaon', NULL, NULL, '1234567890', '$2b$10$CtX8pT4FXstCLh2zK0CCHutsMXqQ7i4.w7FzqT/8xaaSTc5zTtrV2', 'gestor', NULL, NULL, '2025-09-11 14:49:05', '6x1', '08:00', NULL),
(5, 9, 'G9', 'bolsonaro', NULL, NULL, '12345678922', '$2b$10$ktV7ftJ0i/Hdy1EjODxQVeDBtcP7LVm6uUUTc9y8k55bWjx4tfWua', 'gestor', NULL, NULL, '2025-09-16 01:12:45', '6x1', '08:00', NULL),
(6, 10, 'G10', 'luis', NULL, NULL, '12345678924', '$2b$10$FowSlFRUUTsvhUiLYVkgFOZc8CJGmSQ/LjjQzSG5bIunxr5/kHlGm', 'gestor', 'ADM', 'ADM', '2025-09-29 02:28:19', '6x1', '8', NULL);

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `empresa_id` (`empresa_id`,`numero_registro`),
  ADD UNIQUE KEY `uq_usuario_cnpj` (`cnpj`,`tipo_usuario`),
  ADD UNIQUE KEY `uq_usuario_cpf` (`cpf`),
  ADD UNIQUE KEY `uq_usuario_email` (`email`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `usuario`
--
ALTER TABLE `usuario`
  ADD CONSTRAINT `fk_usuario_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresa` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
