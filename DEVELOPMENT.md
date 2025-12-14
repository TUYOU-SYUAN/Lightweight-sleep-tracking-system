# 開發指南

## 環境設置

### Windows 本地開發

#### 1. 安裝 PHP

使用 XAMPP 或 WAMP：
- 下載：https://www.apachefriends.org/
- 安裝到 `C:\xampp`
- 啟動 Apache 和 MySQL

#### 2. 配置項目

```bash
# 複製項目到 htdocs (XAMPP) 或 www (WAMP)
# XAMPP: C:\xampp\htdocs\sleep-tracker
# WAMP: C:\wamp\www\sleep-tracker

# 編輯後端配置
# backend/config/config.php
```

#### 3. 建立資料庫

```sql
-- 打開 phpMyAdmin
-- http://localhost/phpmyadmin/

-- 執行 SQL
mysql> source backend/database/schema.sql
```

#### 4. 訪問應用

```
前端: http://localhost/sleep-tracker/frontend/
後端: http://localhost/sleep-tracker/backend/api/
```

## 開發工作流程

### 前端開發

1. **修改 HTML 結構** (`frontend/index.html`)
   - 新增功能時更新 HTML
   - 遵循語義化標記規範

2. **更新樣式** (`frontend/css/styles.css`)
   - 使用相對單位 (rem, em)
   - 確保響應式設計

3. **實現邏輯** (`frontend/js/`)
   - `app.js` - 主應用邏輯
   - `alarm.js` - 業務邏輯
   - `api.js` - API 通信

### 後端開發

1. **定義模型** (`backend/database/`)
   - 建立或修改模型類
   - 實現數據庫操作

2. **建立控制器** (`backend/api/`)
   - 實現 RESTful 端點
   - 驗證輸入數據

3. **配置路由** (`backend/api/index.php`)
   - 新增路由規則
   - 處理 HTTP 方法

## 測試指南

### 前端測試

```javascript
// 瀏覽器控制台測試

// 1. 測試 API 模塊
API.getAlarms().then(alarms => console.log(alarms));

// 2. 測試本地存儲
API.saveLocalAlarm({
    wakeupTime: '07:00',
    smartWakeupTime: '06:30',
    alarmName: '測試鬧鐘',
    days: ['monday']
});

// 3. 測試鬧鐘計算
AlarmManager.calculateSmartWakeupTime('07:00'); // '06:30'
```

### 後端測試

使用 curl 或 Postman：

```bash
# 健康檢查
curl http://localhost:8000/api/health

# 獲取所有鬧鐘
curl http://localhost:8000/api/alarms

# 建立鬧鐘
curl -X POST http://localhost:8000/api/alarms \
  -H "Content-Type: application/json" \
  -d '{
    "wakeup_time": "07:00",
    "smart_wakeup_time": "06:30",
    "alarm_name": "測試",
    "days": ["monday"]
  }'

# 更新鬧鐘
curl -X PUT http://localhost:8000/api/alarms/1 \
  -H "Content-Type: application/json" \
  -d '{"alarm_name": "更新的名稱"}'

# 刪除鬧鐘
curl -X DELETE http://localhost:8000/api/alarms/1
```

## 調試技巧

### 前端調試

1. **使用瀏覽器開發者工具**
   - F12 打開開發者工具
   - 在 Console 檢查錯誤
   - 在 Network 檢查 API 請求

2. **查看本地存儲**
   ```javascript
   localStorage.getItem('alarms');
   ```

3. **監聽 API 響應**
   ```javascript
   // 在 api.js 添加日誌
   console.log('API 響應:', response);
   ```

### 後端調試

1. **查看 PHP 錯誤日誌**
   ```bash
   # XAMPP
   tail -f C:\xampp\apache\logs\error.log
   ```

2. **添加調試輸出**
   ```php
   error_log('調試信息: ' . print_r($data, true));
   ```

3. **使用 PhpStorm/VSCode 調試**
   - 安裝 PHP Debug 擴展
   - 配置 Xdebug

## 效能優化

### 前端優化

- 最小化 CSS/JS 文件
- 使用事件委託減少監聽器
- 緩存 DOM 元素引用

### 後端優化

- 建立資料庫索引
- 使用準備語句防止 SQL 注入
- 實現查詢結果快取

## 安全性考慮

### 前端安全

- 防止 XSS 攻擊（HTML 轉義）
- 驗證用戶輸入
- CSRF 令牌（如適用）

### 後端安全

- 準備語句防止 SQL 注入
- 輸入驗證和淨化
- 適當的錯誤處理
- CORS 配置

## 部署

### 生產環境準備

1. **編譯資源**
   ```bash
   # 最小化 CSS 和 JavaScript
   ```

2. **配置環境變數**
   ```php
   define('APP_ENV', 'production');
   define('APP_DEBUG', false);
   ```

3. **設置 HTTPS**
   - 取得 SSL 證書
   - 配置 .htaccess 強制 HTTPS

4. **資料庫備份**
   ```bash
   mysqldump -u root -p sleep_tracker > backup.sql
   ```

## 常用命令

```bash
# 啟動 PHP 伺服器
php -S localhost:8000 -t backend/api

# 啟動簡易 HTTP 伺服器
python -m http.server 8080

# 檢查 PHP 版本
php -v

# 測試 PHP 語法
php -l backend/api/index.php
```

## 資源連結

- [PHP 官方文檔](https://www.php.net/manual/zh/)
- [MySQL 文檔](https://dev.mysql.com/doc/)
- [MDN Web 文檔](https://developer.mozilla.org/zh-CN/)
- [RESTful API 最佳實踐](https://restfulapi.net/)
