/**
 * 鬧鐘邏輯模組
 * 處理鬧鐘的核心業務邏輯
 */

const AlarmManager = {
    /**
     * 計算建議的智能喚醒時間（提前 30 分鐘）
     * @param {string} wakeupTime - 最晚喚醒時間 (HH:mm 格式)
     * @returns {string} - 建議喚醒時間 (HH:mm 格式)
     */
    calculateSmartWakeupTime: function(wakeupTime) {
        if (!wakeupTime) return '--:--';

        const [hours, minutes] = wakeupTime.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);

        // 減去 30 分鐘
        date.setMinutes(date.getMinutes() - 30);

        const smartHours = String(date.getHours()).padStart(2, '0');
        const smartMinutes = String(date.getMinutes()).padStart(2, '0');

        return `${smartHours}:${smartMinutes}`;
    },

    /**
     * 建立鬧鐘物件
     * @param {Object} options - 鬧鐘選項
     * @returns {Object} - 完整的鬧鐘物件
     */
    createAlarmObject: function(options = {}) {
        const {
            wakeupTime = '',
            alarmName = '',
            days = [],
            enabled = true,
        } = options;

        const smartWakeupTime = this.calculateSmartWakeupTime(wakeupTime);

        return {
            id: Date.now(),
            wakeupTime,
            smartWakeupTime,
            alarmName: alarmName || `鬧鐘 ${new Date().toLocaleTimeString()}`,
            days: Array.isArray(days) ? days : [],
            enabled,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    },

    /**
     * 驗證鬧鐘資料
     * @param {Object} alarm - 鬧鐘物件
     * @returns {Object} - {valid: boolean, errors: string[]}
     */
    validateAlarm: function(alarm) {
        const errors = [];

        if (!alarm.wakeupTime) {
            errors.push('必須設定最晚喚醒時間');
        }

        if (alarm.days && alarm.days.length === 0) {
            errors.push('至少選擇一個重複日期');
        }

        if (alarm.alarmName && alarm.alarmName.trim().length > 50) {
            errors.push('鬧鐘名稱不能超過 50 個字符');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    },

    /**
     * 格式化天數顯示
     * @param {Array} days - 天數陣列
     * @returns {Array} - 格式化後的天數陣列
     */
    formatDays: function(days) {
        const dayMap = {
            monday: '週一',
            tuesday: '週二',
            wednesday: '週三',
            thursday: '週四',
            friday: '週五',
            saturday: '週六',
            sunday: '週日',
        };

        return days.map(day => dayMap[day] || day);
    },

    /**
     * 判斷鬧鐘是否會在今天觸發
     * @param {Object} alarm - 鬧鐘物件
     * @returns {boolean}
     */
    isAlarmTodayEnabled: function(alarm) {
        const today = new Date();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const todayName = dayNames[today.getDay()];

        return alarm.enabled && alarm.days && alarm.days.includes(todayName);
    },

    /**
     * 計算距離下一次鬧鐘觸發的時間
     * @param {Object} alarm - 鬧鐘物件
     * @returns {string} - 描述性文字
     */
    getNextAlarmTime: function(alarm) {
        if (!alarm.enabled) return '已禁用';

        const today = new Date();
        const [hours, minutes] = alarm.smartWakeupTime.split(':').map(Number);
        const alarmDate = new Date();
        alarmDate.setHours(hours, minutes, 0, 0);

        if (alarmDate < today) {
            alarmDate.setDate(alarmDate.getDate() + 1);
        }

        const diffMs = alarmDate - today;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (diffHours === 0) {
            return `${diffMinutes} 分鐘後`;
        } else if (diffHours < 24) {
            return `${diffHours} 小時 ${diffMinutes} 分鐘後`;
        } else {
            return alarmDate.toLocaleDateString('zh-TW');
        }
    },

    /**
     * 排序鬧鐘列表
     * @param {Array} alarms - 鬧鐘陣列
     * @returns {Array} - 排序後的陣列
     */
    sortAlarms: function(alarms) {
        return [...alarms].sort((a, b) => {
            const timeA = a.smartWakeupTime.split(':').map(Number);
            const timeB = b.smartWakeupTime.split(':').map(Number);

            const minutesA = timeA[0] * 60 + timeA[1];
            const minutesB = timeB[0] * 60 + timeB[1];

            return minutesA - minutesB;
        });
    },

    /**
     * 取得統計資訊
     * @param {Array} alarms - 鬧鐘陣列
     * @returns {Object} - 統計資訊
     */
    getStatistics: function(alarms) {
        return {
            total: alarms.length,
            enabled: alarms.filter(a => a.enabled).length,
            disabled: alarms.filter(a => !a.enabled).length,
            weeklyAlarms: alarms.filter(a => a.days && a.days.length >= 5).length,
        };
    },
};
