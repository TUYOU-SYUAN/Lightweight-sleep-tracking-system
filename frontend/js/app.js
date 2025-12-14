/**
 * 主應用程式邏輯
 * 整合 UI、API 和業務邏輯
 */

class SleepTrackerApp {
    constructor() {
        this.currentEditingAlarmId = null;
        this.alarms = [];
        this.apiAvailable = false;
        this.trackingActive = false;
        this.init();
    }

    /**
     * 初始化應用程式
     */
    async init() {
        this.cacheElements();
        this.attachEventListeners();
        await this.loadAlarms();
        this.updateUI();

        // 檢查後端 API 連接
        this.apiAvailable = await API.testConnection();
        console.log(`後端 API ${this.apiAvailable ? '可用' : '不可用'}`);
    }

    /**
     * 快取 DOM 元素
     */
    cacheElements() {
        this.elements = {
            wakeupTimeInput: document.getElementById('wakeupTime'),
            suggestedTimeDisplay: document.getElementById('suggestedTime'),
            alarmNameInput: document.getElementById('alarmName'),
            dayCheckboxes: document.querySelectorAll('.day-checkbox'),
            saveAlarmBtn: document.getElementById('saveAlarmBtn'),
            alarmsList: document.getElementById('alarmsList'),
            editModal: document.getElementById('editModal'),
            closeBtn: document.querySelector('.close-btn'),
            editWakeupTime: document.getElementById('editWakeupTime'),
            editAlarmName: document.getElementById('editAlarmName'),
            updateAlarmBtn: document.getElementById('updateAlarmBtn'),
            deleteAlarmBtn: document.getElementById('deleteAlarmBtn'),
            startTrackingBtn: document.getElementById('startTrackingBtn'),
            trackingStatus: document.getElementById('trackingStatus'),
            sleepStateDisplay: document.getElementById('sleepStateDisplay'),
            sleepStateInfo: document.getElementById('sleepStateInfo'),
            maxDbValue: document.getElementById('maxDbValue'),
            avgDbValue: document.getElementById('avgDbValue'),
            snoreAlert: document.getElementById('snoreAlert'),
            noiseAlert: document.getElementById('noiseAlert'),
            awakenBtn: document.getElementById('awakenBtn'),
            awakenStatus: document.getElementById('awakenStatus'),
        };
    }

    /**
     * 綁定事件監聽器
     */
    attachEventListeners() {
        // 喚醒時間變更時，更新建議時間
        this.elements.wakeupTimeInput.addEventListener('change', (e) => {
            this.updateSuggestedTime(e.target.value);
        });

        this.elements.wakeupTimeInput.addEventListener('input', (e) => {
            this.updateSuggestedTime(e.target.value);
        });

        // 保存鬧鐘按鈕
        this.elements.saveAlarmBtn.addEventListener('click', () => this.saveAlarm());

        // 模態視窗關閉按鈕
        this.elements.closeBtn.addEventListener('click', () => this.closeModal());

        // 模態視窗更新按鈕
        this.elements.updateAlarmBtn.addEventListener('click', () => this.updateAlarm());

        // 模態視窗刪除按鈕
        this.elements.deleteAlarmBtn.addEventListener('click', () => this.deleteAlarm());

        // 點擊模態視窗外部時關閉
        window.addEventListener('click', (e) => {
            if (e.target === this.elements.editModal) {
                this.closeModal();
            }
        });

        // 鍵盤 Escape 關閉模態視窗
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.editModal.classList.contains('show')) {
                this.closeModal();
            }
        });

        // 開始/停止追蹤按鈕
        if (this.elements.startTrackingBtn) {
            this.elements.startTrackingBtn.addEventListener('click', async () => {
                try {
                    if (!this.trackingActive) {
                        // 開始追蹤
                        const onData = (payload) => {
                            // 儲存到 localStorage（環境離線也可）
                            try {
                                const key = 'trackingSamples';
                                const arr = JSON.parse(localStorage.getItem(key) || '[]');
                                arr.push(payload);
                                // 控制陣列長度以免無限制膨脹
                                if (arr.length > 1000) arr.shift();
                                localStorage.setItem(key, JSON.stringify(arr));
                            } catch (e) {
                                console.error('儲存追蹤資料失敗', e);
                            }
                            
                            // 傳送數據給 SmartAwake 進行分析
                            if (typeof SmartAwake !== 'undefined') {
                                SmartAwake.processData(payload);
                            }
                        };

                        // 設置 SmartAwake 狀態與聲音偵測回調
                        if (typeof SmartAwake !== 'undefined') {
                            SmartAwake.startMonitoring(
                                (newState) => this.updateSleepStateDisplay(newState),
                                (soundAnalysis) => this.updateSoundAnalysis(soundAnalysis)
                            );
                        }

                        const started = await Tracker.startTracking({ sampleRate: 10, onData });
                        if (started) {
                            this.trackingActive = true;
                            this.elements.startTrackingBtn.textContent = '停止追蹤';
                            this.elements.startTrackingBtn.setAttribute('aria-pressed', 'true');
                            if (this.elements.trackingStatus) this.elements.trackingStatus.textContent = '追蹤中';
                            this.showNotification('追蹤已開始');
                        } else {
                            alert('無法啟動追蹤（可能缺少權限或裝置不支援）');
                        }
                    } else {
                        // 停止追蹤
                        await Tracker.stopTracking();
                        if (typeof SmartAwake !== 'undefined') {
                            SmartAwake.stopMonitoring();
                        }
                        this.trackingActive = false;
                        this.elements.startTrackingBtn.textContent = '開始追蹤';
                        this.elements.startTrackingBtn.setAttribute('aria-pressed', 'false');
                        if (this.elements.trackingStatus) this.elements.trackingStatus.textContent = '未啟動';
                        if (this.elements.sleepStateDisplay) this.elements.sleepStateDisplay.textContent = '未監控';
                        this.showNotification('追蹤已停止');
                    }
                } catch (err) {
                    console.error('追蹤按鈕處理錯誤', err);
                    alert('追蹤操作發生錯誤，請查看控制台');
                }
            });
        }

        // 喚醒按鈕
        if (this.elements.awakenBtn) {
            this.elements.awakenBtn.addEventListener('click', () => {
                try {
                    if (typeof SmartAwake === 'undefined') {
                        alert('SmartAwake 模組未載入');
                        return;
                    }
                    const success = SmartAwake.awaken();
                    if (success) {
                        this.showNotification('⏰ 溫和喚醒已觸發');
                    } else {
                        alert('⚠️ 用戶處於深眠狀態，不建議立即喚醒');
                    }
                } catch (err) {
                    console.error('喚醒按鈕錯誤', err);
                    alert('喚醒操作失敗');
                }
            });
        }

        // 在頁面關閉或離開時嘗試停止追蹤
        window.addEventListener('beforeunload', () => {
            if (this.trackingActive) Tracker.stopTracking();
        });

        // 全域與區塊返回按鈕（事件代理）
        document.addEventListener('click', (e) => {
            const btn = e.target.closest && e.target.closest('.back-btn');
            if (btn) {
                e.preventDefault();
                this.goBack();
            }
        });
    }

    /**
     * 處理返回行為：嘗試 history.back()，若無效果則以滾動回頂部替代
     */
    goBack() {
        try {
            if (window.history && window.history.length > 1) {
                window.history.back();
                return;
            }
        } catch (e) {
            console.warn('history.back failed', e);
        }

        // fallback: scroll to top of page and show notification
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.showNotification('已返回');
    }

    /**
     * 更新建議喚醒時間顯示
     * @param {string} wakeupTime - 喚醒時間
     */
    updateSuggestedTime(wakeupTime) {
        const suggestedTime = AlarmManager.calculateSmartWakeupTime(wakeupTime);
        this.elements.suggestedTimeDisplay.textContent = suggestedTime;
    }

    /**
     * 取得選中的日期
     * @returns {Array} - 選中的日期陣列
     */
    getSelectedDays() {
        return Array.from(this.elements.dayCheckboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);
    }

    /**
     * 設定選中的日期
     * @param {Array} days - 日期陣列
     */
    setSelectedDays(days = []) {
        this.elements.dayCheckboxes.forEach(checkbox => {
            checkbox.checked = days.includes(checkbox.value);
        });
    }

    /**
     * 保存鬧鐘
     */
    async saveAlarm() {
        const wakeupTime = this.elements.wakeupTimeInput.value;
        const alarmName = this.elements.alarmNameInput.value.trim();
        const selectedDays = this.getSelectedDays();

        // 建立鬧鐘物件
        const alarmData = AlarmManager.createAlarmObject({
            wakeupTime,
            alarmName: alarmName || `鬧鐘 ${wakeupTime}`,
            days: selectedDays,
        });

        // 驗證資料
        const validation = AlarmManager.validateAlarm(alarmData);
        if (!validation.valid) {
            alert(`驗證失敗：\n${validation.errors.join('\n')}`);
            return;
        }

        try {
            // 嘗試透過 API 保存
            if (this.apiAvailable) {
                const response = await API.createAlarm(alarmData);
                alarmData.id = response.id || alarmData.id;
                console.log('已透過 API 保存鬧鐘');
            } else {
                // 使用本地存儲
                API.saveLocalAlarm(alarmData);
                console.log('已使用本地存儲保存鬧鐘');
            }

            this.alarms.push(alarmData);
            this.resetForm();
            this.updateUI();
            this.showNotification('鬧鐘已保存成功！');
        } catch (error) {
            console.error('保存鬧鐘失敗:', error);
            alert('保存鬧鐘失敗，請檢查網路連接');

            // 降級到本地存儲
            API.saveLocalAlarm(alarmData);
            this.alarms.push(alarmData);
            this.resetForm();
            this.updateUI();
        }
    }

    /**
     * 編輯鬧鐘（打開模態視窗）
     * @param {string|number} alarmId - 鬧鐘 ID
     */
    editAlarm(alarmId) {
        const alarm = this.alarms.find(a => a.id === alarmId);
        if (!alarm) {
            console.error('找不到鬧鐘:', alarmId);
            return;
        }

        this.currentEditingAlarmId = alarmId;
        this.elements.editWakeupTime.value = alarm.wakeupTime;
        this.elements.editAlarmName.value = alarm.alarmName;

        this.openModal();
    }

    /**
     * 更新鬧鐘
     */
    async updateAlarm() {
        if (this.currentEditingAlarmId === null) return;

        const updatedData = {
            wakeupTime: this.elements.editWakeupTime.value,
            alarmName: this.elements.editAlarmName.value.trim(),
            updatedAt: new Date().toISOString(),
        };

        try {
            // 更新本地記錄
            const alarmIndex = this.alarms.findIndex(a => a.id === this.currentEditingAlarmId);
            if (alarmIndex > -1) {
                this.alarms[alarmIndex] = {
                    ...this.alarms[alarmIndex],
                    ...updatedData,
                    smartWakeupTime: AlarmManager.calculateSmartWakeupTime(updatedData.wakeupTime),
                };

                // 同步到 API
                if (this.apiAvailable) {
                    await API.updateAlarm(this.currentEditingAlarmId, updatedData);
                } else {
                    API.saveLocalAlarm(this.alarms[alarmIndex]);
                }

                this.closeModal();
                this.updateUI();
                this.showNotification('鬧鐘已更新成功！');
            }
        } catch (error) {
            console.error('更新鬧鐘失敗:', error);
            alert('更新鬧鐘失敗，請重試');
        }
    }

    /**
     * 刪除鬧鐘
     */
    async deleteAlarm() {
        if (this.currentEditingAlarmId === null) return;

        if (!confirm('確認要刪除此鬧鐘嗎？')) {
            return;
        }

        try {
            // 刪除本地記錄
            this.alarms = this.alarms.filter(a => a.id !== this.currentEditingAlarmId);

            // 同步到 API
            if (this.apiAvailable) {
                await API.deleteAlarm(this.currentEditingAlarmId);
            } else {
                API.deleteLocalAlarm(this.currentEditingAlarmId);
            }

            this.closeModal();
            this.updateUI();
            this.showNotification('鬧鐘已刪除');
        } catch (error) {
            console.error('刪除鬧鐘失敗:', error);
            alert('刪除鬧鐘失敗，請重試');
        }
    }

    /**
     * 打開模態視窗
     */
    openModal() {
        this.elements.editModal.classList.add('show');
    }

    /**
     * 關閉模態視窗
     */
    closeModal() {
        this.elements.editModal.classList.remove('show');
        this.currentEditingAlarmId = null;
    }

    /**
     * 重置表單
     */
    resetForm() {
        this.elements.wakeupTimeInput.value = '';
        this.elements.alarmNameInput.value = '';
        this.setSelectedDays([]);
        this.updateSuggestedTime('');
    }

    /**
     * 加載鬧鐘列表
     */
    async loadAlarms() {
        try {
            if (this.apiAvailable) {
                this.alarms = await API.getAlarms();
            } else {
                this.alarms = API.getLocalAlarms();
            }

            // 確保陣列格式
            if (!Array.isArray(this.alarms)) {
                this.alarms = [];
            }

            this.alarms = AlarmManager.sortAlarms(this.alarms);
        } catch (error) {
            console.error('加載鬧鐘失敗:', error);
            this.alarms = API.getLocalAlarms();
        }
    }

    /**
     * 更新 UI 顯示
     */
    updateUI() {
        this.renderAlarmsList();
    }

    /**
     * 渲染鬧鐘列表
     */
    renderAlarmsList() {
        const container = this.elements.alarmsList;

        if (this.alarms.length === 0) {
            container.innerHTML = '<p class="empty-message">還沒有設定任何鬧鐘</p>';
            return;
        }

        container.innerHTML = this.alarms.map(alarm => this.createAlarmElement(alarm)).join('');

        // 為編輯和刪除按鈕綁定事件
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const alarmId = Number(e.target.dataset.alarmId);
                this.editAlarm(alarmId);
            });
        });
    }

    /**
     * 建立鬧鐘元素 HTML
     * @param {Object} alarm - 鬧鐘物件
     * @returns {string} - HTML 字串
     */
    createAlarmElement(alarm) {
        const formattedDays = AlarmManager.formatDays(alarm.days);
        const dayBadges = formattedDays.length > 0
            ? formattedDays.map(day => `<span class="day-badge">${day}</span>`).join('')
            : '<span class="day-badge">單次</span>';

        return `
            <div class="alarm-item">
                <div class="alarm-info">
                    <div class="alarm-time">${alarm.smartWakeupTime}</div>
                    <div class="alarm-name">${this.escapeHtml(alarm.alarmName)}</div>
                    <div class="alarm-suggested">建議時間：${alarm.wakeupTime}</div>
                    <div class="alarm-days">${dayBadges}</div>
                </div>
                <div class="alarm-actions">
                    <button class="btn btn-edit" data-alarm-id="${alarm.id}" aria-label="編輯鬧鐘">
                        編輯
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 轉義 HTML 特殊字符
     * @param {string} text - 文字
     * @returns {string} - 轉義後的文字
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 顯示通知訊息
     * @param {string} message - 訊息文字
     * @param {number} duration - 顯示時長（毫秒）
     */
    showNotification(message, duration = 3000) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4caf50;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            z-index: 9999;
            animation: slideUp 0.3s ease-out;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'fadeIn 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    /**
     * 更新睡眠狀態顯示
     * @param {string} sleepState - 睡眠狀態
     */
    updateSleepStateDisplay(sleepState) {
        if (!this.elements.sleepStateDisplay) return;

        const stateConfig = {
            awake: { text: '🔆 清醒', color: '#ff9800' },
            light: { text: '💤 淺眠', color: '#667eea' },
            deep: { text: '😴 深眠', color: '#764ba2' }
        };

        const config = stateConfig[sleepState] || { text: '未知', color: '#999' };
        this.elements.sleepStateDisplay.textContent = config.text;
        this.elements.sleepStateDisplay.style.color = config.color;

        if (this.elements.sleepStateInfo) {
            const info = {
                awake: '用戶已清醒',
                light: '用戶處於淺眠狀態，適合溫和喚醒',
                deep: '用戶處於深眠狀態，避免打擾'
            };
            this.elements.sleepStateInfo.textContent = info[sleepState] || '狀態未知';
        }
    }

    /**
     * 更新聲音分析顯示
     * @param {Object} soundAnalysis - { hasSnore, hasNoise, dbValues, maxDb, avgDb }
     */
    updateSoundAnalysis(soundAnalysis) {
        if (!soundAnalysis) return;

        // 更新分貝值顯示
        if (this.elements.maxDbValue && soundAnalysis.maxDb !== undefined) {
            this.elements.maxDbValue.textContent = soundAnalysis.maxDb.toFixed(1) + ' dB';
        }
        if (this.elements.avgDbValue && soundAnalysis.avgDb !== undefined) {
            this.elements.avgDbValue.textContent = soundAnalysis.avgDb.toFixed(1) + ' dB';
        }

        // 更新打鼾提示
        if (this.elements.snoreAlert) {
            if (soundAnalysis.hasSnore) {
                this.elements.snoreAlert.classList.remove('alert-hidden');
            } else {
                this.elements.snoreAlert.classList.add('alert-hidden');
            }
        }

        // 更新噪音提示
        if (this.elements.noiseAlert) {
            if (soundAnalysis.hasNoise) {
                this.elements.noiseAlert.classList.remove('alert-hidden');
            } else {
                this.elements.noiseAlert.classList.add('alert-hidden');
            }
        }
    }
}

// 當 DOM 加載完成後初始化應用程式
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SleepTrackerApp();
});
