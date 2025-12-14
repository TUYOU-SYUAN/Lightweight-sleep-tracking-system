# API 快速參考

## 基本信息

**基礎 URL**: `http://localhost:8000/api`  
**Content-Type**: `application/json`  
**編碼**: UTF-8

---

## 端點列表

### 1. 健康檢查

```http
GET /api/health
```

**響應**:
```json
{
  "success": true,
  "status": 200,
  "message": "API is running",
  "data": {
    "status": "ok"
  }
}
```

---

### 2. 獲取所有鬧鐘

```http
GET /api/alarms?user_id=1
```

**參數**:
- `user_id` (可選) - 用戶 ID，預設為 1

**響應**:
```json
{
  "success": true,
  "status": 200,
  "message": "Alarms retrieved successfully",
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "wakeup_time": "07:00",
      "smart_wakeup_time": "06:30",
      "alarm_name": "工作日",
      "days": ["monday", "tuesday"],
      "enabled": 1,
      "created_at": "2024-12-14 10:30:00",
      "updated_at": "2024-12-14 10:30:00"
    }
  ]
}
```

---

### 3. 獲取單個鬧鐘

```http
GET /api/alarms/1
```

**參數**:
- `1` - 鬧鐘 ID

**響應**:
```json
{
  "success": true,
  "status": 200,
  "message": "Alarm retrieved successfully",
  "data": {
    "id": 1,
    "user_id": 1,
    "wakeup_time": "07:00",
    "smart_wakeup_time": "06:30",
    "alarm_name": "工作日",
    "days": ["monday", "tuesday"],
    "enabled": 1,
    "created_at": "2024-12-14 10:30:00",
    "updated_at": "2024-12-14 10:30:00"
  }
}
```

---

### 4. 建立鬧鐘

```http
POST /api/alarms
Content-Type: application/json

{
  "wakeup_time": "07:00",
  "smart_wakeup_time": "06:30",
  "alarm_name": "工作日",
  "days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
  "enabled": true
}
```

**必填欄位**:
- `wakeup_time` - 時間格式 HH:mm
- `smart_wakeup_time` - 時間格式 HH:mm

**可選欄位**:
- `alarm_name` - 鬧鐘名稱（預設：鬧鐘）
- `days` - 日期陣列（預設：[]）
- `enabled` - 是否啟用（預設：true）

**響應**:
```json
{
  "success": true,
  "status": 201,
  "message": "Alarm created successfully",
  "data": {
    "id": 1,
    "user_id": 1,
    "wakeup_time": "07:00",
    "smart_wakeup_time": "06:30",
    "alarm_name": "工作日",
    "days": ["monday", "tuesday"],
    "enabled": 1,
    "created_at": "2024-12-14 10:30:00",
    "updated_at": "2024-12-14 10:30:00"
  }
}
```

---

### 5. 更新鬧鐘

```http
PUT /api/alarms/1
Content-Type: application/json

{
  "wakeup_time": "08:00",
  "smart_wakeup_time": "07:30",
  "alarm_name": "更新的名稱"
}
```

**可更新欄位**:
- `wakeup_time`
- `smart_wakeup_time`
- `alarm_name`
- `days`
- `enabled`

**響應**:
```json
{
  "success": true,
  "status": 200,
  "message": "Alarm updated successfully",
  "data": {
    "id": 1,
    "wakeup_time": "08:00",
    "smart_wakeup_time": "07:30",
    "alarm_name": "更新的名稱",
    "days": ["monday", "tuesday"],
    "enabled": 1,
    "updated_at": "2024-12-14 11:00:00"
  }
}
```

---

### 6. 刪除鬧鐘

```http
DELETE /api/alarms/1
```

**參數**:
- `1` - 鬧鐘 ID

**響應**:
```json
{
  "success": true,
  "status": 200,
  "message": "Alarm deleted successfully",
  "data": {
    "id": 1
  }
}
```

---

### 7. 按日期獲取鬧鐘

```http
GET /api/alarms/day/monday?user_id=1
```

**參數**:
- `monday` - 日期（monday, tuesday, wednesday, thursday, friday, saturday, sunday）
- `user_id` (可選) - 用戶 ID

**響應**:
```json
{
  "success": true,
  "status": 200,
  "message": "Alarms for the specified day retrieved successfully",
  "data": [
    {
      "id": 1,
      "wakeup_time": "07:00",
      "smart_wakeup_time": "06:30",
      "alarm_name": "工作日",
      "days": ["monday", "tuesday"],
      "enabled": 1
    }
  ]
}
```

---

## 錯誤響應

### 400 - 請求錯誤

```json
{
  "success": false,
  "status": 400,
  "message": "Bad request",
  "errors": ["錯誤信息"]
}
```

### 404 - 未找到

```json
{
  "success": false,
  "status": 404,
  "message": "Alarm not found"
}
```

### 422 - 驗證失敗

```json
{
  "success": false,
  "status": 422,
  "message": "Validation failed",
  "errors": [
    "wakeup_time is required",
    "smart_wakeup_time must be in HH:mm format"
  ]
}
```

### 500 - 伺服器錯誤

```json
{
  "success": false,
  "status": 500,
  "message": "Internal server error"
}
```

---

## 日期值

支援的日期值：

```javascript
["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
```

或中文：

```javascript
["週一", "週二", "週三", "週四", "週五", "週六", "週日"]
```

> 注意：建議使用英文值以保持一致性

---

## 時間格式

所有時間使用 24 小時制，格式為 `HH:mm`：

- `07:00` - 早上 7:00
- `14:30` - 下午 2:30
- `23:59` - 晚上 11:59

---

## curl 範例

### 建立鬧鐘
```bash
curl -X POST http://localhost:8000/api/alarms \
  -H "Content-Type: application/json" \
  -d '{
    "wakeup_time": "07:00",
    "smart_wakeup_time": "06:30",
    "alarm_name": "工作日",
    "days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "enabled": true
  }'
```

### 獲取所有鬧鐘
```bash
curl http://localhost:8000/api/alarms
```

### 更新鬧鐘
```bash
curl -X PUT http://localhost:8000/api/alarms/1 \
  -H "Content-Type: application/json" \
  -d '{"alarm_name": "新名稱"}'
```

### 刪除鬧鐘
```bash
curl -X DELETE http://localhost:8000/api/alarms/1
```

---

## JavaScript 範例

### 使用 fetch API

```javascript
// 建立鬧鐘
fetch('http://localhost:8000/api/alarms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    wakeup_time: '07:00',
    smart_wakeup_time: '06:30',
    alarm_name: '工作日',
    days: ['monday', 'tuesday']
  })
})
.then(res => res.json())
.then(data => console.log(data));

// 獲取所有鬧鐘
fetch('http://localhost:8000/api/alarms')
  .then(res => res.json())
  .then(alarms => console.log(alarms));

// 更新鬧鐘
fetch('http://localhost:8000/api/alarms/1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ alarm_name: '更新的名稱' })
})
.then(res => res.json())
.then(data => console.log(data));

// 刪除鬧鐘
fetch('http://localhost:8000/api/alarms/1', {
  method: 'DELETE'
})
.then(res => res.json())
.then(data => console.log(data));
```

### 使用項目的 API 模組

```javascript
// 已在 frontend/js/api.js 中實現
API.createAlarm(alarmData);
API.getAlarms();
API.updateAlarm(alarmId, updateData);
API.deleteAlarm(alarmId);
```

---

## 驗證規則

### wakeup_time
- 必填
- 格式：`HH:mm`
- 範圍：`00:00` - `23:59`

### smart_wakeup_time
- 必填
- 格式：`HH:mm`
- 範圍：`00:00` - `23:59`

### alarm_name
- 可選
- 最大長度：50 字符

### days
- 可選
- 必須是陣列
- 有效值：monday, tuesday, wednesday, thursday, friday, saturday, sunday

### enabled
- 可選（預設：true）
- 類型：boolean

---

## 狀態碼

| 狀態碼 | 說明 |
|--------|------|
| 200 | 成功 |
| 201 | 資源已建立 |
| 400 | 請求錯誤 |
| 401 | 未授權 |
| 404 | 資源未找到 |
| 422 | 驗證失敗 |
| 500 | 伺服器錯誤 |

---

## 速率限制

目前沒有速率限制，但在生產環境中建議添加：

```
- 每個 IP：100 requests/minute
- 每個用戶：1000 requests/hour
```

---

## 認證（未來實現）

目前 API 不需要認證。未來版本將支援：

```http
Authorization: Bearer <token>
```

---

## CORS

API 已配置 CORS 支援：

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## 問題排除

### API 返回 500 錯誤？
- 檢查 MySQL 是否運行
- 檢查資料庫連接配置
- 查看 PHP 錯誤日誌

### API 返回 422 驗證失敗？
- 檢查必填欄位
- 驗證時間格式
- 檢查日期有效性

### 跨域請求失敗？
- 確保 CORS 已啟用
- 檢查 Origin 頭部

---

## 最佳實踐

1. **總是驗證響應**
   ```javascript
   if (response.success) {
     // 處理成功
   } else {
     // 顯示錯誤
   }
   ```

2. **處理錯誤**
   ```javascript
   .catch(err => console.error('API 錯誤:', err));
   ```

3. **檢查狀態碼**
   ```javascript
   if (response.status === 201) {
     // 資源已建立
   }
   ```

4. **驗證輸入**
   ```javascript
   // 在發送前驗證
   const validation = AlarmManager.validateAlarm(alarm);
   if (!validation.valid) {
     console.error(validation.errors);
   }
   ```

---

最後更新：2024 年 12 月 14 日
