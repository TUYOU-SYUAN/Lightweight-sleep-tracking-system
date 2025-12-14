# 新增頁面快速測試

## 本地測試

### 使用 Python 簡易伺服器
```bash
# 進入 frontend 目錄
cd frontend

# Python 3
python -m http.server 8000

# 訪問
http://localhost:8000
```

### 使用 Node.js http-server
```bash
# 全域安裝
npm install -g http-server

# 進入 frontend 目錄
http-server

# 訪問
http://localhost:8080
```

## 頁面導覽測試清單

### ✅ 導航功能
- [ ] 主頁面 (index.html) 的導航菜單顯示正常
- [ ] 行動版 (< 640px) 漢堡菜單可點擊
- [ ] 點擊菜單項目可正確導航
- [ ] 點擊菜單外部可關閉菜單
- [ ] 所有頁面的導航菜單都有 "active" 狀態

### ✅ 儀表板頁面 (dashboard.html)
- [ ] 正確計算已啟用鬧鐘數量
- [ ] 顯示本週追蹤次數
- [ ] 顯示近期統計資訊
- [ ] 快速操作按鈕可點擊並導航
- [ ] 匯出功能正常（生成 JSON）

### ✅ 歷史紀錄頁面 (history.html)
- [ ] 日期篩選器正確設置預設日期範圍（最近30天）
- [ ] 套用篩選按鈕工作正常
- [ ] 歷史清單正確顯示分組資料
- [ ] 匯出 CSV 按鈕生成正確格式
- [ ] 匯出 JSON 按鈕生成完整資料
- [ ] 無資料時顯示空狀態提示

### ✅ 設定頁面 (settings.html)
- [ ] 音量滑塊範圍 0-100%
- [ ] 時間格式下拉選單有 24h/12h 選項
- [ ] 提前通知輸入框接受 0-30 分鐘
- [ ] 取樣頻率選擇正確 (5/10/15/20 Hz)
- [ ] 敏感度滑塊範圍 1-10 且顯示標籤
- [ ] 切換開關（通知、自動追蹤、深色模式）可點擊
- [ ] 所有設定變更自動儲存到 localStorage
- [ ] 成功訊息 "✅ 設定已保存" 出現
- [ ] 匯出、清空、危險區按鈕可點擊
- [ ] 清空操作需要二次確認

### ✅ 響應式設計 (RWD)
- [ ] 行動版 (320px): 單欄、漢堡菜單
- [ ] 平板版 (768px): 導航顯示、2欄網格
- [ ] 桌面版 (1024px+): 完整佈局、3欄網格
- [ ] 所有按鈕最少 44×44px
- [ ] 文字大小隨視窗調整
- [ ] 表格在小螢幕上可橫向捲動
- [ ] 沒有水平捲動條

## 資料測試

### 測試 localStorage 資料
```javascript
// 主控台測試

// 檢查儀表板
const alarms = JSON.parse(localStorage.getItem('alarms') || '[]');
console.log('鬧鐘數:', alarms.length);

// 檢查追蹤樣本
const samples = JSON.parse(localStorage.getItem('trackingSamples') || '[]');
console.log('追蹤樣本:', samples.length);

// 檢查設定
const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
console.log('應用設定:', settings);
```

## 瀏覽器兼容性

- ✅ Chrome/Edge (最新)
- ✅ Firefox (最新)
- ✅ Safari (最新)
- ✅ 行動瀏覽器 (iOS Safari, Chrome Mobile)

## 性能檢查

- [ ] 頁面載入時間 < 2 秒
- [ ] 導航切換平滑 (無卡頓)
- [ ] localStorage 操作不阻塞 UI
- [ ] 資料匯出不延遲 UI

## 無障礙性檢查

- [ ] 所有按鈕有 `aria-label`
- [ ] 表單標籤正確關聯 `<label for>`
- [ ] 色彩對比度 ≥ 4.5:1
- [ ] 鍵盤導航可用 (Tab, Enter, Esc)
- [ ] 螢幕閱讀器相容 (NVDA/JAWS)

---

## 常見問題

### Q: 儀表板為何不顯示資料？
A: 需要先在主頁面設定鬧鐘和啟動追蹤以生成資料。

### Q: 設定為何未保存？
A: 檢查瀏覽器是否允許 localStorage（私密模式不支援）。

### Q: 導航菜單在平板上不關閉？
A: 這是預期行為 - 平板版本應顯示完整菜單。

### Q: 如何清除測試資料？
A: 在設定頁面點擊「清空所有資料」或使用 DevTools 清除 localStorage。

---

**提示**：使用 DevTools 的響應式設計模式 (F12 → 設備工具列) 測試不同螢幕尺寸。
