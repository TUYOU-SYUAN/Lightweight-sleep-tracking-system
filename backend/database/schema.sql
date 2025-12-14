-- 睡眠追蹤系統資料庫結構
-- MySQL 8.0+ 推薦

-- 建立資料庫
CREATE DATABASE IF NOT EXISTS `sleep_tracker` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `sleep_tracker`;

-- 用戶表
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 鬧鐘表
CREATE TABLE IF NOT EXISTS `alarms` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `wakeup_time` VARCHAR(5) NOT NULL COMMENT '最晚喚醒時間 (HH:mm)',
    `smart_wakeup_time` VARCHAR(5) NOT NULL COMMENT '智能喚醒時間 (HH:mm)',
    `alarm_name` VARCHAR(100) DEFAULT '鬧鐘' COMMENT '鬧鐘名稱',
    `days` JSON DEFAULT NULL COMMENT '重複日期 (JSON陣列)',
    `enabled` TINYINT(1) DEFAULT 1 COMMENT '是否啟用',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_enabled` (`enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 睡眠記錄表 (擴展功能)
CREATE TABLE IF NOT EXISTS `sleep_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `alarm_id` INT,
    `sleep_start` DATETIME,
    `sleep_end` DATETIME,
    `actual_wakeup_time` VARCHAR(5),
    `sleep_duration` INT COMMENT '睡眠時長 (分鐘)',
    `quality` ENUM('poor', 'fair', 'good', 'excellent') DEFAULT 'good',
    `notes` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`alarm_id`) REFERENCES `alarms`(`id`) ON DELETE SET NULL,
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_sleep_date` (`sleep_start`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始測試數據 (可選)
-- INSERT INTO `users` (`username`, `email`, `password_hash`) VALUES 
-- ('testuser', 'test@example.com', SHA2('password123', 256));
