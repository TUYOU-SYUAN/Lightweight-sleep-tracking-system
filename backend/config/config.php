<?php
/**
 * 環境配置文件
 * 根據開發環境調整相應的設定
 */

// 應用程式環境
define('APP_ENV', $_ENV['APP_ENV'] ?? 'development');
define('APP_DEBUG', APP_ENV === 'development');

// 資料庫配置
define('DB_HOST', $_ENV['DB_HOST'] ?? 'localhost');
define('DB_PORT', $_ENV['DB_PORT'] ?? 3306);
define('DB_NAME', $_ENV['DB_NAME'] ?? 'sleep_tracker');
define('DB_USER', $_ENV['DB_USER'] ?? 'root');
define('DB_PASS', $_ENV['DB_PASS'] ?? '');
define('DB_CHARSET', 'utf8mb4');

// API 基本設定
define('API_BASE_URL', $_ENV['API_BASE_URL'] ?? 'http://localhost:8000');
define('API_VERSION', 'v1');

// Firebase 配置（可選）
define('FIREBASE_API_KEY', $_ENV['FIREBASE_API_KEY'] ?? '');
define('FIREBASE_PROJECT_ID', $_ENV['FIREBASE_PROJECT_ID'] ?? '');
define('FIREBASE_DATABASE_URL', $_ENV['FIREBASE_DATABASE_URL'] ?? '');

// 錯誤報告設定
if (APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// 時區設定
date_default_timezone_set('Asia/Taipei');

// 字符編碼設定
header('Content-Type: application/json; charset=utf-8');
