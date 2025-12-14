# 快速開始指南

## 🚀 5 分鐘快速開始

### 最簡單的方式 - 僅前端

```bash
# 進入前端目錄
cd frontend

# 啟動本地伺服器
python -m http.server 8080

# 打開瀏覽器
# http://localhost:8080/index.html
```

**就這樣！** 應用程式會自動使用本地存儲（LocalStorage）保存您的鬧鐘設定。

---

## 🔧 完整設置 - 前後端 + 資料庫

### 前置需求
- PHP 7.4 或以上
- MySQL 8.0 或以上
- 現代瀏覽器

### 步驟 1️⃣ 建立資料庫

**方法 A：使用命令行**
```bash
mysql -u root -p < backend/database/schema.sql
```

**方法 B：使用 phpMyAdmin**
1. 打開 http://localhost/phpmyadmin
2. 建立新資料庫：`sleep_tracker`
3. 複製並執行 `backend/database/schema.sql` 中的 SQL

### 步驟 2️⃣ 配置後端

編輯 `backend/config/config.php`：

```php
define('DB_HOST', 'localhost');      // 資料庫主機
define('DB_NAME', 'sleep_tracker');  // 資料庫名稱
define('DB_USER', 'root');           // 資料庫用戶名
define('DB_PASS', '');               // 資料庫密碼
define('API_BASE_URL', 'http://localhost:8000');
```

### 步驟 3️⃣ 啟動後端伺服器

```bash
cd backend
php -S localhost:8000
```

您應該看到：
```
Development Server (http://localhost:8000) started
```

### 步驟 4️⃣ 啟動前端伺服器

在新的終端：
```bash
cd frontend
python -m http.server 8080
```

### 步驟 5️⃣ 訪問應用

打開瀏覽器訪問：
```
http://localhost:8080/index.html
```

---

## 📱 功能演示

### 設定鬧鐘

1. **設定最晚喚醒時間**
   - 在「最晚喚醒時間」欄位選擇時間（例如：7:00 AM）

2. **查看建議時間**
   - 系統自動計算提前 30 分鐘的智能喚醒時間
   - 顯示為「建議喚醒時間：6:30 AM」

3. **新增鬧鐘名稱（選填）**
   - 例如：「工作日」、「週末」

4. **選擇重複日期**
   - 勾選一周中的日期
   - 支援選擇多天

5. **保存鬧鐘**
   - 點擊「保存鬧鐘」按鈕
   - 鬧鐘將顯示在下方列表中

### 管理鬧鐘

- **編輯**：點擊列表中的「編輯」按鈕修改
- **刪除**：在編輯模態視窗中點擊「刪除鬧鐘」

---

## 🧪 測試 API

### 使用 curl 測試後端

```bash
# 1. 健康檢查
curl http://localhost:8000/api/health

# 2. 獲取所有鬧鐘
curl http://localhost:8000/api/alarms

# 3. 建立新鬧鐘
curl -X POST http://localhost:8000/api/alarms \
  -H "Content-Type: application/json" \
  -d '{
    "wakeup_time": "07:00",
    "smart_wakeup_time": "06:30",
    "alarm_name": "工作日",
    "days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "enabled": true
  }'

# 4. 更新鬧鐘 (將 1 替換為實際的鬧鐘 ID)
curl -X PUT http://localhost:8000/api/alarms/1 \
  -H "Content-Type: application/json" \
  -d '{"alarm_name": "更新的鬧鐘名稱"}'

# 5. 刪除鬧鐘
curl -X DELETE http://localhost:8000/api/alarms/1
```

### 在瀏覽器控制台測試

```javascript
// 開啟瀏覽器開發者工具 (F12)，在 Console 標籤執行：

// 1. 測試本地存儲
API.getLocalAlarms();

// 2. 建立測試鬧鐘
AlarmManager.createAlarmObject({
  wakeupTime: '08:00',
  alarmName: '測試鬧鐘',
  days: ['monday', 'wednesday', 'friday']
});

// 3. 計算智能喚醒時間
AlarmManager.calculateSmartWakeupTime('09:00'); // 輸出: "08:30"
```

---

## 🔄 數據流向

```
用戶操作
    ↓
JavaScript (app.js)
    ↓
本地驗證 (alarm.js)
    ↓
API 通信 (api.js)
    ↓
[API 可用？]
  ├→ YES: PHP 後端 → MySQL 資料庫
  └→ NO: 本地存儲 (LocalStorage)
    ↓
更新 UI
    ↓
顯示鬧鐘列表
```

---

## 💾 數據存儲方式

### 本地存儲 (無網路時自動使用)
- 儲存位置：瀏覽器 LocalStorage
- 數據格式：JSON
- 特點：快速、離線可用

### 雲端存儲 (有網路時自動使用)
- 儲存位置：MySQL 資料庫
- API：RESTful
- 特點：持久化、多設備同步

---

## 🐛 常見問題

### 問題 1：API 連接失敗？

**症狀**：看到錯誤提示，但鬧鐘仍然保存

**原因**：後端伺服器未啟動

**解決**：
```bash
# 確保後端伺服器正在運行
cd backend
php -S localhost:8000
```

### 問題 2：鬧鐘沒有保存？

**症狀**：設定後刷新頁面消失

**原因**：API 和本地存儲都失敗

**檢查**：
1. 打開開發者工具 (F12)
2. 查看 Console 標籤的錯誤信息
3. 確認 LocalStorage 沒有被禁用

### 問題 3：資料庫連接錯誤？

**症狀**：看到「Failed to create alarm」

**解決步驟**：
```bash
# 1. 檢查 MySQL 是否運行
mysql -u root -p -e "SHOW DATABASES;"

# 2. 檢查資料庫是否存在
mysql -u root -p -e "USE sleep_tracker; SHOW TABLES;"

# 3. 檢查配置文件
cat backend/config/config.php
```

---

## 📦 文件結構速查

```
frontend/
├── index.html       ← 打開這個文件
├── css/
│   └── styles.css   ← 應用樣式
└── js/
    ├── app.js       ← 主應用邏輯
    ├── alarm.js     ← 鬧鐘邏輯
    └── api.js       ← API 通信

backend/
├── api/
│   ├── index.php    ← API 路由入口
│   ├── AlarmController.php
│   └── ApiResponse.php
├── database/
│   ├── Database.php ← 資料庫連接
│   ├── Alarm.php    ← 鬧鐘模型
│   └── schema.sql   ← 資料庫結構
└── config/
    └── config.php   ← 環境配置
```

---

## 🚀 進階功能

準備好進階開發？查看：
- [完整 README.md](./README.md) - 詳細文檔
- [開發指南](./DEVELOPMENT.md) - 代碼架構和開發流程
- [項目指南](./PROJECT_GUIDE.md) - 深入技術細節

---

## 📞 獲取幫助

1. 查看本指南的常見問題部分
2. 檢查瀏覽器開發者工具的錯誤信息
3. 查閱項目文檔

祝您使用愉快！ 🎉
