/**
 * API 模組 - 處理所有後端 API 通訊
 * 支援 RESTful API，可連接 PHP/MySQL 或 Firebase
 */

const API = {
    BASE_URL: 'http://localhost:8000/api', // 根據實際後端地址修改
    FIREBASE_CONFIG: {
        apiKey: 'YOUR_FIREBASE_API_KEY',
        projectId: 'YOUR_FIREBASE_PROJECT_ID',
        // 其他 Firebase 配置
    },

    /**
     * 建立鬧鐘
     * @param {Object} alarmData - 鬧鐘數據
     * @returns {Promise<Object>} - API 響應
     */
    createAlarm: async function(alarmData) {
        try {
            const response = await fetch(`${this.BASE_URL}/alarms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(alarmData),
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('建立鬧鐘失敗:', error);
            throw error;
        }
    },

    /**
     * 取得所有鬧鐘
     * @returns {Promise<Array>} - 鬧鐘列表
     */
    getAlarms: async function() {
        try {
            const response = await fetch(`${this.BASE_URL}/alarms`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('取得鬧鐘列表失敗:', error);
            // 如果後端不可用，回傳本地存儲的數據
            return this.getLocalAlarms();
        }
    },

    /**
     * 更新鬧鐘
     * @param {number|string} alarmId - 鬧鐘 ID
     * @param {Object} alarmData - 更新的數據
     * @returns {Promise<Object>} - API 響應
     */
    updateAlarm: async function(alarmId, alarmData) {
        try {
            const response = await fetch(`${this.BASE_URL}/alarms/${alarmId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(alarmData),
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('更新鬧鐘失敗:', error);
            throw error;
        }
    },

    /**
     * 刪除鬧鐘
     * @param {number|string} alarmId - 鬧鐘 ID
     * @returns {Promise<Object>} - API 響應
     */
    deleteAlarm: async function(alarmId) {
        try {
            const response = await fetch(`${this.BASE_URL}/alarms/${alarmId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('刪除鬧鐘失敗:', error);
            throw error;
        }
    },

    /**
     * 本地存儲 - 鬧鐘相關操作
     */
    saveLocalAlarm: function(alarm) {
        const alarms = this.getLocalAlarms();
        alarm.id = alarm.id || Date.now();
        alarm.createdAt = alarm.createdAt || new Date().toISOString();
        
        const existingIndex = alarms.findIndex(a => a.id === alarm.id);
        if (existingIndex > -1) {
            alarms[existingIndex] = { ...alarms[existingIndex], ...alarm };
        } else {
            alarms.push(alarm);
        }
        
        localStorage.setItem('alarms', JSON.stringify(alarms));
        return alarm;
    },

    getLocalAlarms: function() {
        const alarms = localStorage.getItem('alarms');
        return alarms ? JSON.parse(alarms) : [];
    },

    deleteLocalAlarm: function(alarmId) {
        const alarms = this.getLocalAlarms();
        const filtered = alarms.filter(a => a.id !== alarmId);
        localStorage.setItem('alarms', JSON.stringify(filtered));
    },

    clearLocalAlarms: function() {
        localStorage.removeItem('alarms');
    },

    /**
     * 測試 API 連接
     * @returns {Promise<boolean>} - 連接是否成功
     */
    testConnection: async function() {
        try {
            const response = await fetch(`${this.BASE_URL}/health`, {
                method: 'GET',
                timeout: 5000,
            });
            return response.ok;
        } catch (error) {
            console.warn('後端 API 連接失敗，將使用本地存儲:', error);
            return false;
        }
    },
};

// 初始化時設定本地存儲中是否有數據
API.hasLocalData = () => API.getLocalAlarms().length > 0;
