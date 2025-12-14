<?php
/**
 * RESTful API 路由文件
 * 處理所有 API 請求的路由和分發
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/AlarmController.php';

// 解析請求路徑
$requestUri = $_SERVER['REQUEST_URI'];
$basePath = '/api';
$path = str_replace($basePath, '', parse_url($requestUri, PHP_URL_PATH));
$method = $_SERVER['REQUEST_METHOD'];

// 路由控制器
$controller = new AlarmController();
$response = new ApiResponse();

try {
    // 匹配路由
    if (preg_match('/^\/health\/?$/', $path) && $method === 'GET') {
        // 健康檢查
        $response->success(['status' => 'ok'], 'API is running');
    } elseif (preg_match('/^\/alarms\/?$/', $path) && $method === 'GET') {
        // 獲取所有鬧鐘
        $controller->getAll();
    } elseif (preg_match('/^\/alarms\/(\d+)\/?$/', $path, $matches) && $method === 'GET') {
        // 獲取單個鬧鐘
        $controller->getById($matches[1]);
    } elseif (preg_match('/^\/alarms\/?$/', $path) && $method === 'POST') {
        // 建立鬧鐘
        $controller->create();
    } elseif (preg_match('/^\/alarms\/(\d+)\/?$/', $path, $matches) && $method === 'PUT') {
        // 更新鬧鐘
        $controller->update($matches[1]);
    } elseif (preg_match('/^\/alarms\/(\d+)\/?$/', $path, $matches) && $method === 'DELETE') {
        // 刪除鬧鐘
        $controller->delete($matches[1]);
    } elseif (preg_match('/^\/alarms\/day\/([a-z]+)\/?$/', $path, $matches) && $method === 'GET') {
        // 按日期獲取鬧鐘
        $controller->getByDay($matches[1]);
    } else {
        // 路由未找到
        $response->notFound('API endpoint not found');
    }
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    $response->error('Internal server error', 500);
}
