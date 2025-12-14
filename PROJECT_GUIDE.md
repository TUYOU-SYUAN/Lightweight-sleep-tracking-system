# 輕量睡眠追蹤系統 - 項目指南

## 📋 項目信息

- **項目名稱**: 輕量睡眠追蹤系統 (Sleep Tracking System)
- **版本**: 1.0.0
- **目標**: 提供簡單易用的睡眠追蹤和智能鬧鐘功能

## 🎯 核心功能

### 已實現
- ✅ 最晚喚醒時間設定
- ✅ 自動計算 30 分鐘智能喚醒時間
- ✅ 每周重複日期設定
- ✅ 鬧鐘新增、編輯、刪除
- ✅ 本地存儲支援
- ✅ RESTful API 後端
- ✅ 響應式網頁設計

### 計劃中
- 🔄 睡眠數據分析
- 🔄 用戶認證系統
- 🔄 Firebase 整合
- 🔄 React/Vue 前端升級
- 🔄 React Native 移動應用

## 📁 項目結構詳解

```
├── frontend/
│   ├── index.html          # 主頁面 - 語義化 HTML5
│   ├── css/
│   │   └── styles.css      # 響應式 CSS 樣式
│   └── js/
│       ├── api.js          # API 通信模組 (支持本地存儲降級)
│       ├── alarm.js        # 鬧鐘業務邏輯 (計算、驗證)
│       └── app.js          # 主應用程式 (UI 控制、事件處理)
│
├── backend/
│   ├── api/
│   │   ├── index.php       # 路由入口 (RESTful)
│   │   ├── AlarmController.php  # 鬧鐘控制器
│   │   └── ApiResponse.php      # 統一響應類
│   ├── database/
│   │   ├── Database.php    # PDO 資料庫連接類
│   │   ├── Alarm.php       # 鬧鐘模型 (CRUD 操作)
│   │   └── schema.sql      # 資料庫結構
│   └── config/
│       └── config.php      # 環境和常數配置
│
├── README.md               # 項目說明
├── DEVELOPMENT.md          # 開發指南
├── package.json            # 項目元數據
└── .env.example            # 環境變數範本
```

## 🚀 快速開始

### 最小化設置（僅前端）

```bash
# 1. 進入 frontend 目錄
cd frontend

# 2. 啟動簡易伺服器
python -m http.server 8080

# 3. 訪問
http://localhost:8080
```

### 完整設置（前後端）

```bash
# 1. MySQL 建立資料庫
mysql -u root -p < backend/database/schema.sql

# 2. 編輯配置
# backend/config/config.php

# 3. 啟動後端
cd backend
php -S localhost:8000

# 4. 另開終端啟動前端
cd frontend
python -m http.server 8080

# 5. 訪問
http://localhost:8080
```

## 🛠️ 技術選擇說明

### 為什麼選擇原生 JavaScript？
- ✅ 無依賴，輕量級
- ✅ 快速加載和執行
- ✅ 易於理解和修改
- ✅ 支援升級到 React/Vue

### 為什麼選擇 PHP + MySQL？
- ✅ 簡單易部署
- ✅ 廣泛的服務器支持
- ✅ 完整的開源生態
- ✅ 易於與 Firebase 集成

### LocalStorage 降級機制
當後端 API 不可用時：
- 自動切換到本地存儲
- 用戶體驗無中斷
- 網路恢復後自動同步

## 📱 響應式設計

支援屏幕尺寸：
- 📱 手機：320px - 480px
- 📲 平板：480px - 768px
- 💻 桌面：768px 以上

## 🔒 安全性考慮

### 前端
- ✅ HTML 轉義防止 XSS
- ✅ 輸入驗證
- ✅ CORS 跨域配置

### 後端
- ✅ 準備語句防止 SQL 注入
- ✅ 輸入驗證和淨化
- ✅ 適當的錯誤處理
- ✅ 時間戳和更新追蹤

## 📊 數據結構

### 鬧鐘對象
```javascript
{
  id: 1234567890,
  wakeupTime: "07:00",           // HH:mm 格式
  smartWakeupTime: "06:30",      // 自動計算
  alarmName: "工作日",
  days: ["monday", "tuesday"],   // 重複日期
  enabled: true,
  createdAt: "2024-12-14T...",
  updatedAt: "2024-12-14T..."
}
```

## 🔌 API 端點概覽

```
GET    /api/health                  # 健康檢查
GET    /api/alarms                  # 獲取所有鬧鐘
GET    /api/alarms/:id              # 獲取單個鬧鐘
POST   /api/alarms                  # 建立鬧鐘
PUT    /api/alarms/:id              # 更新鬧鐘
DELETE /api/alarms/:id              # 刪除鬧鐘
GET    /api/alarms/day/:day         # 按日期獲取
```

## 📚 代碼規範

遵循 `.github/copilot-instructions.md` 中的規範：

- **HTML**: 語義化標記，原生元素優先
- **CSS**: 相對單位 (rem, em)，移動優先
- **JavaScript**: ES6+, camelCase, 錯誤處理
- **PHP**: PSR-12 編碼標準，文檔註釋

## 🧪 測試方式

### 前端功能測試
1. 在輸入框設定鬧鐘
2. 檢查建議時間是否正確計算
3. 選擇重複日期並保存
4. 刷新頁面檢查本地存儲

### 後端 API 測試
```bash
# 使用 curl 測試
curl -X POST http://localhost:8000/api/alarms \
  -H "Content-Type: application/json" \
  -d '{"wakeup_time":"07:00","smart_wakeup_time":"06:30","alarm_name":"測試"}'
```

## 🐛 常見問題排查

| 問題 | 解決方案 |
|------|--------|
| API 連接失敗 | 檢查後端伺服器狀態，查看瀏覽器控制台 |
| 數據未保存 | 檢查本地存儲或資料庫連接 |
| 樣式錯亂 | 清除瀏覽器快取，重新載入 |
| CORS 錯誤 | 檢查後端 CORS 配置 |

## 📖 參考資源

- [HTML5 規範](https://html.spec.whatwg.org/)
- [CSS 最佳實踐](https://web.dev/css-basics/)
- [JavaScript MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/)
- [PHP 官方手冊](https://www.php.net/manual/zh/)
- [RESTful API 設計](https://restfulapi.net/)

## 🤝 開發貢獻

1. Fork 此項目
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📞 聯絡方式

- 📧 郵件: [your-email@example.com]
- 🐛 問題: 提交 GitHub Issue
- 💬 討論: 使用 GitHub Discussions

---

**最後更新**: 2024年12月14日
**狀態**: 開發中 (v1.0.0)
