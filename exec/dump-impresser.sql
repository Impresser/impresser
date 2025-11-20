-- MySQL dump 10.13  Distrib 8.2.0, for macos13 (arm64)
--
-- Host: k13s404.p.ssafy.io    Database: impresser
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `compression_type`
--

DROP TABLE IF EXISTS `compression_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `compression_type` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `uuid` binary(16) NOT NULL,
  `compression_type` varchar(20) NOT NULL,
  `processing_unit` varchar(10) NOT NULL,
  `version` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_compression_type_uuid` (`uuid`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `compression_type`
--

LOCK TABLES `compression_type` WRITE;
/*!40000 ALTER TABLE `compression_type` DISABLE KEYS */;
INSERT INTO `compression_type` VALUES (5,_binary '”´ˇl∑\Ò\∞é\„˙.Rç','LZW','GPU',2),(6,_binary '”¨7∑\Ò\∞é\„˙.Rç','LZW','CPU',2),(7,_binary '”¨≤∑\Ò\∞é\„˙.Rç','DEFLATE','CPU',2),(8,_binary '”¨^∑\Ò\∞é\„˙.Rç','PACKBITS','CPU',2);
/*!40000 ALTER TABLE `compression_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `convert_history`
--

DROP TABLE IF EXISTS `convert_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `convert_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `uuid` binary(16) NOT NULL,
  `bmp_key` varchar(255) NOT NULL,
  `bmp_volume` bigint NOT NULL,
  `bmp_width` bigint NOT NULL,
  `bmp_height` bigint NOT NULL,
  `tiff_key` varchar(200) DEFAULT NULL,
  `tiff_volume` bigint DEFAULT NULL,
  `tiff_width` bigint DEFAULT NULL,
  `tiff_height` bigint DEFAULT NULL,
  `requested_at` datetime NOT NULL,
  `completed_at` datetime DEFAULT NULL,
  `avg_gpu_utilization` bigint DEFAULT NULL,
  `avg_speed` decimal(10,2) DEFAULT NULL,
  `max_speed` decimal(10,2) DEFAULT NULL,
  `min_speed` decimal(10,2) DEFAULT NULL,
  `compression_ratio` bigint DEFAULT NULL,
  `compression_type_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `compression_time` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_convert_history_uuid` (`uuid`),
  KEY `FKejhds8n041xl34vwr04onr999` (`compression_type_id`),
  KEY `FKpho0rvl3dok2nf0fab5jd3n1w` (`user_id`),
  CONSTRAINT `FKejhds8n041xl34vwr04onr999` FOREIGN KEY (`compression_type_id`) REFERENCES `compression_type` (`id`),
  CONSTRAINT `FKpho0rvl3dok2nf0fab5jd3n1w` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=145 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `convert_history`
--

LOCK TABLES `convert_history` WRITE;
/*!40000 ALTER TABLE `convert_history` DISABLE KEYS */;
INSERT INTO `convert_history` VALUES (112,_binary 'èj©F3áG>≠enX','bmp/c1c2a462-4955-456d-80dd-c095b84da601_fbe80d44-b4c7-4db5-a99a-1ebc1b23e4b8_convert_test.bmp',2096217,26740,26758,'tiff/eecdf16c-4f49-419c-abea-adb7badf84b5_convert_test.tiff',38157,26740,26758,'2025-11-17 10:40:10','2025-11-17 10:43:01',88,1488.94,1488.94,1488.94,98,5,3,1.78),(113,_binary '/L¨,mtNLõ\ÀB\Á¶£N','bmp/c1c2a462-4955-456d-80dd-c095b84da601_fbe80d44-b4c7-4db5-a99a-1ebc1b23e4b8_convert_test.bmp',2096217,26740,26758,'tiff/eecdf16c-4f49-419c-abea-adb7badf84b5_convert_test.tiff',37961,26740,26758,'2025-11-17 10:56:22','2025-11-17 10:59:10',0,295.85,295.85,295.85,98,6,3,6.92),(118,_binary 's/\⁄»øB€ª]\Íf\\\Á:','bmp/c8b1b4f2-2b69-458d-9059-b5f42f745e10_convert_test.bmp',2096217,26740,26758,'tiff/56d964e8-b63e-4ef0-a942-90735d1f36fd_convert_test.tiff',5978,26740,26758,'2025-11-17 11:33:42','2025-11-17 11:36:58',0,321.46,321.46,321.46,100,7,3,6.37),(119,_binary 'QaÆú\\uBüáå∞\È\€¸wà','bmp/7ef6ccb0-bfa6-4336-bd93-0063f9f064e5_convert_test.bmp',2096217,26740,26758,'tiff/e8958949-9afb-4d3f-9f2e-8e71382f4853_convert_test.tiff',501373,26740,26758,'2025-11-17 12:37:48','2025-11-17 12:43:56',0,1146.99,1146.99,1146.99,76,8,3,1.78),(142,_binary 'ü\»CB\"≤Êçûl8\ıÜ','bmp/293374f2-7ebd-499f-89bb-e76cfadacb58_7158446b-d4d3-4c96-a56d-b8c75c238145.bmp',70294,5999,3999,'tiff/048ab1ac-054f-4b6d-b40c-bcc54884fff9_7158446b-d4d3-4c96-a56d-b8c75c238145.tiff',892,5999,3999,'2025-11-20 00:51:12','2025-11-20 00:51:22',2,302.96,302.96,302.96,99,5,1,0.26),(143,_binary '£¨pG†BhÖÅù5\—c©y','bmp/e424d2a1-7e50-4846-9cbb-5ef073e97ed0_7158446b-d4d3-4c96-a56d-b8c75c238145.bmp',70295,5999,3999,'tiff/544e4627-0e56-4fb5-bcad-e2189d8a8b4a_7158446b-d4d3-4c96-a56d-b8c75c238145.tiff',892,5999,3999,'2025-11-20 00:52:02','2025-11-20 00:52:12',0,191.57,191.57,191.57,99,6,1,0.36),(144,_binary 'á\”\ÔªQ@ŸÖc$\ı5\n{&','bmp/e424d2a1-7e50-4846-9cbb-5ef073e97ed0_7158446b-d4d3-4c96-a56d-b8c75c238145.bmp',70295,5999,3999,'tiff/2a8bee89-e98f-488f-aa9d-cd5cfbd23c85_7158446b-d4d3-4c96-a56d-b8c75c238145.tiff',892,5999,3999,'2025-11-20 00:52:02','2025-11-20 00:52:13',25,306.99,306.99,306.99,99,5,1,0.27);
/*!40000 ALTER TABLE `convert_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `generation_history`
--

DROP TABLE IF EXISTS `generation_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `generation_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `uuid` binary(16) NOT NULL,
  `bmp_key` varchar(200) DEFAULT NULL,
  `requested_at` datetime NOT NULL,
  `completed_at` datetime DEFAULT NULL,
  `bmp_volume` bigint NOT NULL,
  `bmp_width` bigint NOT NULL,
  `bmp_height` bigint NOT NULL,
  `red_count_x` int NOT NULL,
  `red_count_y` int NOT NULL,
  `red_size_x` int NOT NULL,
  `red_size_y` int NOT NULL,
  `red_gap_x` int NOT NULL,
  `red_gap_y` int NOT NULL,
  `green_count_x` int NOT NULL,
  `green_count_y` int NOT NULL,
  `green_size_x` int NOT NULL,
  `green_size_y` int NOT NULL,
  `green_gap_x` int NOT NULL,
  `green_gap_y` int NOT NULL,
  `blue_count_x` int NOT NULL,
  `blue_count_y` int NOT NULL,
  `blue_size_x` int NOT NULL,
  `blue_size_y` int NOT NULL,
  `blue_gap_x` int NOT NULL,
  `blue_gap_y` int NOT NULL,
  `user_id` bigint NOT NULL,
  `gb_gap_x` int NOT NULL,
  `gb_gap_y` int NOT NULL,
  `rg_gap_x` int NOT NULL,
  `rg_gap_y` int NOT NULL,
  `started_at` datetime(6) DEFAULT NULL,
  `status` enum('COMPLETED','FAILED','PENDING','RUNNING') NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_generation_history_uuid` (`uuid`),
  KEY `FKhypbw6u6lowy1s5fsay1pj4c3` (`user_id`),
  CONSTRAINT `FKhypbw6u6lowy1s5fsay1pj4c3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `generation_history`
--

LOCK TABLES `generation_history` WRITE;
/*!40000 ALTER TABLE `generation_history` DISABLE KEYS */;
INSERT INTO `generation_history` VALUES (1,_binary '\0∏à\Ë£\›JyÜ¯Ÿü\Õ','bmp/9bdc915a-92fd-4063-addd-078a32f5f8a2_00b888e8-a3dd-4a79-86f8-037fd99fcd14.bmp','2025-11-17 11:40:10','2025-11-17 11:40:13',0,5,1,1,1,1,1,11,1,1,1,1,1,11,1,1,1,1,1,11,1,3,1,0,1,0,'2025-11-17 11:40:09.658849','COMPLETED'),(2,_binary 'G\ÁI∞{H¢ø\«4\Ã,’Ñ]','bmp/090bee74-eec0-46e5-adcc-2e8d0ba7ab09_47e74911-b07b-48a2-bfc7-34cc2cd5845d.bmp','2025-11-17 11:43:31','2025-11-17 11:43:34',0,3,1,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,3,0,0,0,0,'2025-11-17 11:43:30.743474','COMPLETED'),(3,_binary 'ì\ﬂhk]B Üã\‡96èÀÄ','bmp/3c3987f9-88ae-4b17-8e2b-f89771ab4649_930bdf68-6b5d-4220-868b-e039368fcb80.bmp','2025-11-17 11:43:37','2025-11-17 11:43:39',0,3,1,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,3,0,0,0,0,'2025-11-17 11:43:37.311059','COMPLETED'),(4,_binary 'EãH\ŸGœî\¬x];\'Ω','bmp/be44569c-8d7f-4418-85c5-43edc970bcb3_1e458b48-18d9-47cf-9418-c2785d3b27bd.bmp','2025-11-17 12:08:10','2025-11-17 12:08:14',0,5,3,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,1,'2025-11-17 12:08:10.485223','COMPLETED'),(5,_binary 'ôõπ\»\"\‡CÆÑ_q\\Ò\„\›','bmp/bc237d61-57cb-4706-98ca-d85e3d55525d_999bb9c8-22e0-43ae-845f-71f00bf1e3dd.bmp','2025-11-17 12:35:23','2025-11-17 12:35:32',71982,5999,3999,1000,1000,1,1,1,1,1000,1000,1,1,1,1,1000,1000,1,1,1,1,1,1,1,1,1,'2025-11-17 12:35:22.992754','COMPLETED'),(6,_binary 'ﬂç;Åî¢M\n´\r\r¶Z\Â\Ë','bmp/50eb1c49-c201-46ab-b407-901fa7436979_df8d3b81-94a2-4d0a-ab0d-0da65ae5e808.bmp','2025-11-17 13:42:20','2025-11-17 13:42:29',71982,5999,3999,1000,1000,1,1,1,1,1000,1000,1,1,1,1,1000,1000,1,1,1,1,1,1,1,1,1,'2025-11-17 13:42:19.883073','COMPLETED'),(7,_binary '<kkúI1M\Âç#)k\»\"o\Î','bmp/25bbd539-8774-439a-b7d9-013714aeec78_3c6b6b9c-4931-4de5-8d23-296bc8226feb.bmp','2025-11-17 14:07:23','2025-11-17 14:07:27',0,5,3,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,3,1,1,1,1,'2025-11-17 14:07:22.620641','COMPLETED'),(8,_binary '≈Ü\Zπ|Aö4\»5d\Ú\ﬁ','bmp/9da2d20d-19a8-47de-87d9-77178b1f3b29_c5861ab9-147c-4115-9a34-c8351e64f2de.bmp','2025-11-17 14:08:17','2025-11-17 14:08:26',71982,5999,3999,1000,1000,1,1,1,1,1000,1000,1,1,1,1,1000,1000,1,1,1,1,3,1,1,1,1,'2025-11-17 14:08:17.311969','COMPLETED'),(9,_binary '\rs!ê\…\ﬁFøãkE´c≤F\\','bmp/f6d67086-84ea-465b-826c-1504da8badd3_0d732190-c9de-46bf-8b6b-45ab63b2465c.bmp','2025-11-19 10:03:11','2025-11-19 10:03:22',90000,30000,1000,10000,1000,1,1,0,0,10000,1000,1,1,0,0,10000,1000,1,1,0,0,1,0,0,0,0,'2025-11-19 10:03:10.857765','COMPLETED'),(10,_binary 'å,\r®®Fƒëµ\Ô\«˚Ç','bmp/f71e9124-4342-4250-a491-adb539a1a13b_8c2c0da8-a80b-46c4-91b5-efc7fb168210.bmp','2025-11-19 10:19:16','2025-11-19 10:19:52',450000,30000,5000,10000,5000,1,1,0,0,10000,5000,1,1,0,0,10000,5000,1,1,0,0,1,0,0,0,0,'2025-11-19 10:19:16.209413','COMPLETED'),(11,_binary 'êí\ÊjjÄM~©∑∑Ö±†Z3','bmp/634e10a1-d5ad-478a-9d36-f21ac82bc76a_9092e66a-6a80-4d7e-a9b7-b785b1a05a33.bmp','2025-11-19 22:41:58','2025-11-19 22:42:07',71982,5999,3999,1000,1000,1,1,1,1,1000,1000,1,1,1,1,1000,1000,1,1,1,1,1,1,1,1,1,'2025-11-19 22:41:58.022389','COMPLETED'),(12,_binary 'qXDk\‘\”Lñ•m∏\«\\#ÅE','bmp/42a07907-fe97-44b7-b08b-1f5cbb2ca3a8_7158446b-d4d3-4c96-a56d-b8c75c238145.bmp','2025-11-19 22:45:13','2025-11-19 22:45:21',71982,5999,3999,1000,1000,1,1,1,1,1000,1000,1,1,1,1,1000,1000,1,1,1,1,1,1,1,1,1,'2025-11-19 22:45:12.533358','COMPLETED'),(13,_binary '£ñ\ı|zJH{ù\ı\Õ\ƒ<\Ù\r','bmp/5afb0efd-209a-487e-b846-71e1caddfb2a_a396f57c-7a4a-487b-9d04-f5cdc43cf40d.bmp','2025-11-20 00:48:34',NULL,0,5999,3999,1000,1000,1,1,1,1,1000,1000,1,1,1,1,1000,1000,1,1,1,1,1,1,1,1,1,'2025-11-20 00:48:34.286006','RUNNING'),(14,_binary '\'˙\”9IJã©™ûµg©','bmp/7bc4bd7d-a6c8-4dec-9327-2d88bbf286f2_100f27fa-d339-494a-8b13-a9aa9eb567a9.bmp','2025-11-20 00:49:12',NULL,0,5999,3999,1000,1000,1,1,1,1,1000,1000,1,1,1,1,1000,1000,1,1,1,1,1,1,1,1,1,'2025-11-20 00:49:11.627002','RUNNING'),(15,_binary '¶,˙¸J\‡BÜØ\'˘\Ÿ0º\–4','bmp/508b7386-9382-4be2-a26d-bdf703b41cde_a62cfafc-4ae0-4286-af27-f9d930bcd034.bmp','2025-11-20 00:50:28','2025-11-20 00:50:37',71982,5999,3999,1000,1000,1,1,1,1,1000,1000,1,1,1,1,1000,1000,1,1,1,1,1,1,1,1,1,'2025-11-20 00:50:28.344788','COMPLETED');
/*!40000 ALTER TABLE `generation_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inkjet_printer`
--

DROP TABLE IF EXISTS `inkjet_printer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inkjet_printer` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `uuid` binary(16) NOT NULL,
  `model_name` varchar(255) NOT NULL,
  `printer_name` varchar(255) NOT NULL,
  `install_date` date NOT NULL,
  `cpu` varchar(255) NOT NULL,
  `gpu` varchar(255) NOT NULL,
  `printer_status` enum('BROKEN','UNDER_REPAIR','OPERATIONAL') NOT NULL DEFAULT 'OPERATIONAL',
  `process_status` enum('WAITING','RUNNING') NOT NULL DEFAULT 'WAITING',
  `ram` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `vram` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `canvas_x` int NOT NULL,
  `canvas_y` int NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_inkjet_printer_uuid` (`uuid`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inkjet_printer`
--

LOCK TABLES `inkjet_printer` WRITE;
/*!40000 ALTER TABLE `inkjet_printer` DISABLE KEYS */;
INSERT INTO `inkjet_printer` VALUES (1,_binary '6LaπKFFl•≥ΩB˘áé','IPS-6000','ÏÑ§ÎπÑA601','2025-11-17','Intel Xeon Gold 6226','NVIDIA RTX A6000','OPERATIONAL','WAITING','48GB GDDR6','48GB GDDR6',0,0,'2025-11-17 09:51:00','2025-11-17 09:51:00',NULL),(2,_binary 'Æ\ﬂ˝\ÈÜNO≠äΩ_M>c\\»','IPS-6000','ÏÑ§ÎπÑA602','2025-10-17','Intel Xeon Gold 6226','NVIDIA RTX A6000','OPERATIONAL','WAITING','48GB GDDR6','48GB GDDR6',0,5,'2025-11-17 09:52:26','2025-11-17 09:52:26',NULL),(3,_binary 'YNï-oKjñ¨F[\√O','IPS-7000','ÏÑ§ÎπÑA701','2025-10-23','Intel Xeon Gold 6226','NVIDIA RTX A6000','OPERATIONAL','WAITING','48GB GDDR6','48GB GDDR6',0,10,'2025-11-17 09:52:41','2025-11-17 09:52:41',NULL),(4,_binary '\…l#ú\ÂJ”≠¨{6\'ã\Z','IPS-7000','ÏÑ§ÎπÑA702','2025-10-23','Intel Xeon Gold 6226','NVIDIA RTX A6000','OPERATIONAL','WAITING','48GB GDDR6','48GB GDDR6',12,0,'2025-11-17 09:52:48','2025-11-17 22:11:10',NULL),(5,_binary '\ƒ\∆\‘*4\ÚI\rìf4Xsn8','IPS-8000','ÏÑ§ÎπÑA801','2025-10-29','Intel Xeon Gold 6226','NVIDIA RTX A6000','OPERATIONAL','WAITING','48GB GDDR6','48GB GDDR6',20,5,'2025-11-17 09:53:04','2025-11-17 09:53:04',NULL),(6,_binary 'yãv\"N\Ê¥ Ω\Ê\"\'ÑØ','IPS-8000','ÏÑ§ÎπÑA802','2025-11-11','Intel Xeon Gold 6226','NVIDIA RTX A6000','OPERATIONAL','WAITING','48GB GDDR6','48GB GDDR6',20,10,'2025-11-17 09:53:24','2025-11-17 22:11:31',NULL);
/*!40000 ALTER TABLE `inkjet_printer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inkjet_printer_slot`
--

DROP TABLE IF EXISTS `inkjet_printer_slot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inkjet_printer_slot` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `uuid` binary(16) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL,
  `printer_uuid` binary(16) DEFAULT NULL,
  `status` enum('ACTIVE','DRAINING','RETIRED') DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKi2vk8rfnq06vbyp2yhbcmlbr2` (`uuid`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inkjet_printer_slot`
--

LOCK TABLES `inkjet_printer_slot` WRITE;
/*!40000 ALTER TABLE `inkjet_printer_slot` DISABLE KEYS */;
INSERT INTO `inkjet_printer_slot` VALUES (1,_binary '@Uí\√M\ò\‡˛\‹C\ﬁv±','2025-11-17 00:33:26.000000',NULL,'2025-11-17 09:50:59.698153',_binary '6LaπKFFl•≥ΩB˘áé','ACTIVE'),(2,_binary '@Z3\√M\ò\‡˛\‹C\ﬁv±','2025-11-17 00:33:26.000000',NULL,'2025-11-17 09:52:25.827567',_binary 'Æ\ﬂ˝\ÈÜNO≠äΩ_M>c\\»','ACTIVE'),(3,_binary '@ï\√M\ò\‡˛\‹C\ﬁv±','2025-11-17 00:33:26.000000',NULL,'2025-11-17 09:52:40.669248',_binary 'YNï-oKjñ¨F[\√O','ACTIVE'),(4,_binary '@ñ¥\√M\ò\‡˛\‹C\ﬁv±','2025-11-17 00:33:26.000000',NULL,'2025-11-17 09:52:47.827450',_binary '\…l#ú\ÂJ”≠¨{6\'ã\Z','ACTIVE'),(5,_binary '@ó[\√M\ò\‡˛\‹C\ﬁv±','2025-11-17 00:33:26.000000',NULL,'2025-11-17 09:53:03.573095',_binary '\ƒ\∆\‘*4\ÚI\rìf4Xsn8','ACTIVE'),(6,_binary '@ó\ﬁ\√M\ò\‡˛\‹C\ﬁv±','2025-11-17 00:33:26.000000',NULL,'2025-11-17 09:53:24.134188',_binary 'yãv\"N\Ê¥ Ω\Ê\"\'ÑØ','ACTIVE'),(7,_binary '@òi\√M\ò\‡˛\‹C\ﬁv±','2025-11-17 00:33:26.000000',NULL,'2025-11-17 00:33:26.000000',NULL,NULL),(8,_binary '@ò\Î\√M\ò\‡˛\‹C\ﬁv±','2025-11-17 00:33:26.000000',NULL,'2025-11-17 00:33:26.000000',NULL,NULL),(9,_binary '@ôj\√M\ò\‡˛\‹C\ﬁv±','2025-11-17 00:33:26.000000',NULL,'2025-11-17 00:33:26.000000',NULL,NULL),(10,_binary '@õ\√M\ò\‡˛\‹C\ﬁv±','2025-11-17 00:33:26.000000',NULL,'2025-11-17 00:33:26.000000',NULL,NULL);
/*!40000 ALTER TABLE `inkjet_printer_slot` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_history`
--

DROP TABLE IF EXISTS `job_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `uuid` binary(16) NOT NULL,
  `image_key` varchar(200) NOT NULL,
  `requested_at` datetime NOT NULL,
  `completed_at` datetime DEFAULT NULL,
  `sheet_count` bigint DEFAULT NULL,
  `printer_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_job_history_uuid` (`uuid`),
  KEY `FK3b34n5t9l7dpr7hp78rr3rgag` (`printer_id`),
  CONSTRAINT `FK3b34n5t9l7dpr7hp78rr3rgag` FOREIGN KEY (`printer_id`) REFERENCES `inkjet_printer` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_history`
--

LOCK TABLES `job_history` WRITE;
/*!40000 ALTER TABLE `job_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `uuid` binary(16) NOT NULL,
  `employee_no` varchar(7) NOT NULL,
  `password` varchar(100) NOT NULL,
  `user_name` varchar(20) NOT NULL,
  `user_role` enum('ADMIN','EMPLOYEE') NOT NULL DEFAULT 'EMPLOYEE',
  `profile_key` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_users_uuid` (`uuid`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,_binary '@H§ä∏K\ò\‡˛\‹C\ﬁv±','1234567','$2a$12$2H1WnTpmbhTpce8UUQN7z.qlbvSlrAvhRUR3EmTFNV8M8ZL56QmH6','Í¥ÄÎ¶¨Ïûê','ADMIN',NULL,'2025-11-03 00:22:58','2025-11-03 00:22:58',NULL),(2,_binary 'MM.|∏K\ò\‡˛\‹C\ﬁv±','2345678','$2a$12$2H1WnTpmbhTpce8UUQN7z.qlbvSlrAvhRUR3EmTFNV8M8ZL56QmH6','ÏÇ¨Ïö©Ïûê','EMPLOYEE',NULL,'2025-11-03 00:23:20','2025-11-03 00:23:20',NULL),(3,_binary 'ß\›@¡4\∞é\„˙.Rç','3456789','$2a$12$2H1WnTpmbhTpce8UUQN7z.qlbvSlrAvhRUR3EmTFNV8M8ZL56QmH6','Í¥ÄÎ¶¨Ïûê2','ADMIN',NULL,'2025-11-17 09:29:05','2025-11-17 09:29:05',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'impresser'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-20  1:19:27
