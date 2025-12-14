# 框架整合指南

本指南說明如何將現有的前端升級到 React.js 或 Vue.js。

## 📦 使用 React.js

### 1. 初始化 React 項目

```bash
npx create-react-app frontend-react
cd frontend-react
npm install
```

### 2. 複製業務邏輯

```bash
# 複製 API 和 Alarm 模塊
cp ../frontend/js/api.js src/services/
cp ../frontend/js/alarm.js src/services/
```

### 3. 建立 React 組件

**src/components/AlarmForm.jsx**
```jsx
import React, { useState } from 'react';
import { AlarmManager } from '../services/alarm';

export function AlarmForm() {
  const [wakeupTime, setWakeupTime] = useState('');
  const [alarmName, setAlarmName] = useState('');
  const [suggestedTime, setSuggestedTime] = useState('--:--');

  const handleTimeChange = (e) => {
    const time = e.target.value;
    setWakeupTime(time);
    setSuggestedTime(AlarmManager.calculateSmartWakeupTime(time));
  };

  return (
    <div className="alarm-setup">
      <h2>設定您的鬧鐘</h2>
      <input
        type="time"
        value={wakeupTime}
        onChange={handleTimeChange}
        placeholder="設定最晚喚醒時間"
      />
      <p>建議喚醒時間：{suggestedTime}</p>
      <input
        type="text"
        value={alarmName}
        onChange={(e) => setAlarmName(e.target.value)}
        placeholder="鬧鐘名稱（選填）"
      />
    </div>
  );
}
```

**src/components/AlarmList.jsx**
```jsx
import React, { useEffect, useState } from 'react';
import { API } from '../services/api';

export function AlarmList() {
  const [alarms, setAlarms] = useState([]);

  useEffect(() => {
    loadAlarms();
  }, []);

  const loadAlarms = async () => {
    const data = await API.getAlarms();
    setAlarms(data);
  };

  return (
    <div className="alarms-list">
      <h2>已設定的鬧鐘</h2>
      {alarms.length === 0 ? (
        <p>還沒有設定任何鬧鐘</p>
      ) : (
        alarms.map(alarm => (
          <div key={alarm.id} className="alarm-item">
            <div>{alarm.smartWakeupTime}</div>
            <div>{alarm.alarmName}</div>
          </div>
        ))
      )}
    </div>
  );
}
```

### 4. 主應用組件

**src/App.jsx**
```jsx
import React from 'react';
import './App.css';
import { AlarmForm } from './components/AlarmForm';
import { AlarmList } from './components/AlarmList';

function App() {
  return (
    <div className="container">
      <header className="app-header">
        <h1>💤 睡眠追蹤系統</h1>
      </header>
      <main className="content">
        <AlarmForm />
        <AlarmList />
      </main>
    </div>
  );
}

export default App;
```

### 5. 複製樣式

```bash
cp ../frontend/css/styles.css src/App.css
```

### 6. 啟動應用

```bash
npm start
```

---

## 💚 使用 Vue.js

### 1. 初始化 Vue 項目

```bash
npm create vue@latest frontend-vue
cd frontend-vue
npm install
```

### 2. 複製業務邏輯

```bash
cp ../frontend/js/api.js src/services/
cp ../frontend/js/alarm.js src/services/
```

### 3. 建立 Vue 組件

**src/components/AlarmForm.vue**
```vue
<template>
  <section class="alarm-setup-section">
    <h2>設定您的鬧鐘</h2>
    
    <div class="form-group">
      <label for="wakeupTime">最晚喚醒時間：</label>
      <input 
        type="time" 
        v-model="wakeupTime"
        @change="updateSuggestedTime"
      />
    </div>

    <div class="smart-wake-section">
      <h3>智能喚醒建議</h3>
      <p>建議喚醒時間：{{ suggestedTime }}</p>
    </div>

    <div class="form-group">
      <label for="alarmName">鬧鐘名稱（選填）：</label>
      <input 
        type="text" 
        v-model="alarmName"
        placeholder="例如：週一工作"
      />
    </div>

    <button @click="saveAlarm" class="btn btn-primary">
      保存鬧鐘
    </button>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { AlarmManager } from '../services/alarm';
import { API } from '../services/api';

const wakeupTime = ref('');
const alarmName = ref('');
const suggestedTime = ref('--:--');

const updateSuggestedTime = () => {
  suggestedTime.value = AlarmManager.calculateSmartWakeupTime(wakeupTime.value);
};

const saveAlarm = async () => {
  const alarmData = AlarmManager.createAlarmObject({
    wakeupTime: wakeupTime.value,
    alarmName: alarmName.value
  });

  try {
    await API.createAlarm(alarmData);
    wakeupTime.value = '';
    alarmName.value = '';
    suggestedTime.value = '--:--';
  } catch (error) {
    console.error('保存失敗:', error);
  }
};
</script>

<style scoped>
/* 樣式與原應用一致 */
</style>
```

**src/components/AlarmList.vue**
```vue
<template>
  <section class="alarms-list-section">
    <h2>已設定的鬧鐘</h2>
    
    <div v-if="alarms.length === 0" class="empty-message">
      還沒有設定任何鬧鐘
    </div>

    <div v-else class="alarms-list">
      <div v-for="alarm in alarms" :key="alarm.id" class="alarm-item">
        <div class="alarm-info">
          <div class="alarm-time">{{ alarm.smartWakeupTime }}</div>
          <div class="alarm-name">{{ alarm.alarmName }}</div>
        </div>
        <button @click="editAlarm(alarm)" class="btn btn-edit">
          編輯
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { API } from '../services/api';

const alarms = ref([]);

onMounted(async () => {
  const data = await API.getAlarms();
  alarms.value = data;
});

const editAlarm = (alarm) => {
  // 打開編輯模態視窗
  console.log('編輯鬧鐘:', alarm.id);
};
</script>
```

### 4. 主應用組件

**src/App.vue**
```vue
<template>
  <div class="container">
    <header class="app-header">
      <h1>💤 睡眠追蹤系統</h1>
      <p class="subtitle">智能鬧鐘設定</p>
    </header>

    <div class="content">
      <AlarmForm />
      <AlarmList />
    </div>

    <footer class="app-footer">
      <p>輕量睡眠追蹤系統 v1.0</p>
    </footer>
  </div>
</template>

<script setup>
import AlarmForm from './components/AlarmForm.vue';
import AlarmList from './components/AlarmList.vue';
</script>

<style>
@import '../frontend/css/styles.css';
</style>
```

### 5. 啟動應用

```bash
npm run dev
```

---

## 📱 React Native 移動應用

### 1. 初始化 React Native 項目

```bash
npx react-native init SleepTracker
cd SleepTracker
npm install @react-navigation/native @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
```

### 2. 建立警報設定屏幕

**src/screens/AlarmScreen.js**
```javascript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AlarmManager } from '../services/alarm';
import { API } from '../services/api';

export function AlarmScreen() {
  const [wakeupTime, setWakeupTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [alarmName, setAlarmName] = useState('');
  const [suggestedTime, setSuggestedTime] = useState('');

  const handleTimeChange = (event, selectedDate) => {
    if (selectedDate) {
      setWakeupTime(selectedDate);
      const hours = String(selectedDate.getHours()).padStart(2, '0');
      const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;
      setSuggestedTime(AlarmManager.calculateSmartWakeupTime(timeStr));
    }
    setShowTimePicker(false);
  };

  const saveAlarm = async () => {
    const hours = String(wakeupTime.getHours()).padStart(2, '0');
    const minutes = String(wakeupTime.getMinutes()).padStart(2, '0');
    const wakeupTimeStr = `${hours}:${minutes}`;

    const alarmData = AlarmManager.createAlarmObject({
      wakeupTime: wakeupTimeStr,
      alarmName
    });

    try {
      await API.createAlarm(alarmData);
      setAlarmName('');
      // 導航到鬧鐘列表
    } catch (error) {
      console.error('保存失敗:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>設定您的鬧鐘</Text>

      <TouchableOpacity
        style={styles.timeButton}
        onPress={() => setShowTimePicker(true)}
      >
        <Text style={styles.timeButtonText}>
          設定時間：{String(wakeupTime.getHours()).padStart(2, '0')}:
          {String(wakeupTime.getMinutes()).padStart(2, '0')}
        </Text>
      </TouchableOpacity>

      {showTimePicker && (
        <DateTimePicker
          value={wakeupTime}
          mode="time"
          display="spinner"
          onChange={handleTimeChange}
        />
      )}

      <View style={styles.suggestedTime}>
        <Text style={styles.label}>建議喚醒時間：</Text>
        <Text style={styles.timeValue}>{suggestedTime}</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="鬧鐘名稱（選填）"
        value={alarmName}
        onChangeText={setAlarmName}
      />

      <TouchableOpacity style={styles.saveButton} onPress={saveAlarm}>
        <Text style={styles.saveButtonText}>保存鬧鐘</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#667eea',
  },
  timeButton: {
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 15,
  },
  timeButtonText: {
    fontSize: 16,
    textAlign: 'center',
  },
  suggestedTime: {
    padding: 15,
    backgroundColor: '#f8f9ff',
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  timeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#667eea',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
```

---

## 🔗 API 兼容性

所有框架都使用相同的 API 模塊：

```javascript
// 在 React、Vue 或 React Native 中
import { API } from './services/api';
import { AlarmManager } from './services/alarm';

// API 使用方式完全相同
API.getAlarms();
AlarmManager.calculateSmartWakeupTime('07:00');
```

---

## 📝 遷移檢查清單

- [ ] 複製 `api.js` 和 `alarm.js` 到新項目
- [ ] 複製 CSS 樣式到新項目
- [ ] 建立框架組件替代原 HTML
- [ ] 測試所有 CRUD 操作
- [ ] 確認本地存儲功能
- [ ] 測試 API 連接
- [ ] 調整響應式設計

---

## 🤝 貢獻

如果您有改進框架整合的建議，歡迎提交 PR！

---

最後更新：2024年12月14日
