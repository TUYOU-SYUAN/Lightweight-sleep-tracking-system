/**
 * 主應用程式邏輯
 * 整合 UI、API 和業務邏輯
 */

class SleepTrackerApp {
    constructor() {
        this.currentEditingAlarmId = null;
        this.alarms = [];
        this.apiAvailable = false;
        this.init();
    }

    /**
     * 啟動鬧鐘檢查器，每 15 秒檢查一次是否到達設定時間
     */
    startAlarmChecker() {
        // 檢查日期變化以重置 triggeredToday
        this.alarmCheckerInterval = setInterval(() => {
            const today = (new Date()).toDateString();
            if (today !== this.lastCheckedDate) {
                this.triggeredToday.clear();
                this.lastCheckedDate = today;
            }
            this.checkAlarms();
        }, 15000);
    }

    /**
     * 停止鬧鐘檢查器
     */
    stopAlarmChecker() {
        if (this.alarmCheckerInterval) {
            clearInterval(this.alarmCheckerInterval);
            this.alarmCheckerInterval = null;
        }
    }

    /**
     * 檢查所有已啟用的鬧鐘，若時間匹配則觸發
     */
    checkAlarms() {
        const now = new Date();
        const hhmm = now.toTimeString().slice(0,5); // "HH:MM"

        // 檢查每個鬧鐘
        this.alarms.forEach(alarm => {
            if (!alarm || alarm.enabled === false) return;

            // 若已在今天觸發過，跳過
            if (this.triggeredToday.has(alarm.id)) return;

            // 支援重複日或單次
            const todayDay = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][now.getDay()];
            const runsToday = Array.isArray(alarm.days) && alarm.days.length > 0 ? alarm.days.includes(todayDay) : true;
            if (!runsToday) return;

            // 比對時間：僅使用 alarm.wakeupTime（HH:MM）
            if (alarm.wakeupTime === hhmm) {
                this.triggerAlarm(alarm);
            }
        });
    }

    /**
     * 觸發鬧鐘：播放鈴聲、顯示介面、標記為已觸發
     */
    triggerAlarm(alarm) {
        try {
            this.activeAlarm = alarm;
            this.triggeredToday.add(alarm.id);

            // 顯示覆蓋層
            const ring = document.getElementById('alarmRing');
            const title = document.getElementById('alarmRingTitle');
            const msg = document.getElementById('alarmRingMessage');
            if (ring) ring.setAttribute('aria-hidden','false');
            if (title) title.textContent = alarm.alarmName || '鬧鐘響起';
            if (msg) msg.textContent = `時間：${alarm.wakeupTime}`;

            // 播放鈴聲
            this.playRingtone();
        } catch (e) {
            console.error('triggerAlarm error', e);
        }
    }

    /**
     * 播放鈴聲（使用 Web Audio API 生成漸進音調）
     */
    playRingtone() {
        try {
            if (this.ringtoneContext) return; // 已播放中
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ringtoneContext = new AudioCtx();
            const now = this.ringtoneContext.currentTime;
            const osc = this.ringtoneContext.createOscillator();
            const gain = this.ringtoneContext.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.linearRampToValueAtTime(880, now + 2);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
            osc.connect(gain);
            gain.connect(this.ringtoneContext.destination);
            osc.start(now);
            this.ringtoneOsc = osc;
            this.ringtoneGain = gain;

            // 持續播放直到 stopRingtone 被呼叫；但設一個最大時間保護（5 分鐘）
            this.ringtoneTimeout = setTimeout(() => {
                this.stopAlarmSound();
            }, 5 * 60 * 1000);
        } catch (e) {
            console.warn('Audio API failed, fallback to beep via alert', e);
            // fallback: 持續震動（若支援）
            if (navigator.vibrate) navigator.vibrate([500,200,500,200,500]);
        }
    }

    /**
     * 停止鈴聲並隱藏覆蓋層
     */
    stopAlarmSound() {
        try {
            if (this.ringtoneOsc) {
                try { this.ringtoneOsc.stop(); } catch (e) {}
                this.ringtoneOsc.disconnect();
                this.ringtoneOsc = null;
            }
            if (this.ringtoneGain) {
                try { this.ringtoneGain.disconnect(); } catch (e) {}
                this.ringtoneGain = null;
            }
            if (this.ringtoneContext) {
                try { this.ringtoneContext.close(); } catch (e) {}
                this.ringtoneContext = null;
            }
            if (this.ringtoneTimeout) {
                clearTimeout(this.ringtoneTimeout);
                this.ringtoneTimeout = null;
            }

            const ring = document.getElementById('alarmRing');
            if (ring) ring.setAttribute('aria-hidden','true');
            this.activeAlarm = null;
        } catch (e) {
            console.error('stopAlarmSound error', e);
        }
    }

    /**
     * 貪睡：將 activeAlarm 的時間加 5 分鐘並解除播放
     */
    snoozeActiveAlarm() {
        if (!this.activeAlarm) return;
        try {
            // 計算新時間
            const base = this.activeAlarm.wakeupTime;
            if (!base) return this.stopAlarmSound();
            const [hh, mm] = base.split(':').map(v => Number(v));
            const d = new Date();
            d.setHours(hh, mm + 5, 0, 0);
            const newHH = String(d.getHours()).padStart(2,'0');
            const newMM = String(d.getMinutes()).padStart(2,'0');
            this.activeAlarm.wakeupTime = `${newHH}:${newMM}`;

            // 解除當前播放
            this.stopAlarmSound();
            this.showNotification('已設定貪睡 5 分鐘');
        } catch (e) {
            console.error('snooze error', e);
        }
    }

    /**
     * 初始化應用程式
     */
    async init() {
        this.cacheElements();
        this.attachEventListeners();
        await this.loadAlarms();
        this.updateUI();

        // 啟動鬧鐘檢查器
        this.triggeredToday = new Set();
        this.lastCheckedDate = (new Date()).toDateString();
        this.startAlarmChecker();

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
        };
    }

    /**
     * 綁定事件監聽器
     */
    attachEventListeners() {
        // 喚醒時間變更：不再更新智能喚醒建議（已移除）

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

        // 開始/停止追蹤按鈕已移除（現在在 tracking.html）

        // 喚醒按鈕已移除

        // 鬧鐘停止與貪睡按鈕
        const stopBtn = document.getElementById('stopAlarmBtn');
        const snoozeBtn = document.getElementById('snoozeAlarmBtn');
        if (stopBtn) stopBtn.addEventListener('click', () => this.stopAlarmSound());
        if (snoozeBtn) snoozeBtn.addEventListener('click', () => this.snoozeActiveAlarm());

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
    // 智能喚醒建議已移除

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
        // 智能喚醒已移除，不再更新建議時間
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
                    <div class="alarm-time">${alarm.wakeupTime}</div>
                    <div class="alarm-name">${this.escapeHtml(alarm.alarmName)}</div>
                    
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
     * 更新睡眠狀態顯示（已移除 - 現在在 monitoring.html）
     * @deprecated
     */
    updateSleepStateDisplay(sleepState) {
        // 此功能已移除，現已移至 monitoring.html
        return;
    }

    /**
     * 更新聲音分析顯示（已移除 - 現在在 monitoring.html）
     * @deprecated
     */
    updateSoundAnalysis(soundAnalysis) {
        // 此功能已移除，現已移至 monitoring.html
        return;
    }
}

// 當 DOM 加載完成後初始化應用程式
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SleepTrackerApp();
});
