/**
 * 智能喚醒模組 (SmartAwake)
 * - 分析加速度計與聲音數據判斷睡眠狀態
 * - 支持淺眠時的溫和喚醒
 * - 監聽打鼾與噪音干擾
 */

const SmartAwake = (function () {
    // 睡眠狀態定義
    const SLEEP_STATES = {
        AWAKE: 'awake',         // 清醒
        LIGHT_SLEEP: 'light',   // 淺眠
        DEEP_SLEEP: 'deep'      // 深眠
    };

    // 配置參數
    const config = {
        motionWindowSize: 20,              // 檢查過去 20 個加速度樣本
        deepSleepVarianceThreshold: 0.5,   // 深眠：低動作變異（< 0.5）
        lightSleepVarianceThreshold: 2.5,  // 淺眠：中等動作變異（0.5 - 2.5）
        awakenThreshold: 0.15,             // 喚醒分貝閾值（15 dB）
        snoreThreshold: 0.25,              // 打鼾分貝閾值（25 dB）
        updateInterval: 1000,              // 1 秒更新一次狀態
    };

    // 內部狀態
    let motionBuffer = [];
    let soundBuffer = [];
    let currentSleepState = SLEEP_STATES.AWAKE;
    let lastUpdateTime = 0;
    let isMonitoring = false;
    let stateChangeCallbacks = [];
    let snoreDetectCallbacks = [];

    /**
     * 計算數組的變異數
     * @param {Array} arr - 數據陣列
     * @returns {number} 變異數
     */
    function calculateVariance(arr) {
        if (arr.length < 2) return 0;
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        const squaredDiffs = arr.map(x => Math.pow(x - mean, 2));
        return squaredDiffs.reduce((a, b) => a + b, 0) / arr.length;
    }

    /**
     * 計算數據的標準差
     * @param {Array} arr - 數據陣列
     * @returns {number} 標準差
     */
    function calculateStdDev(arr) {
        return Math.sqrt(calculateVariance(arr));
    }

    /**
     * 計算加速度幅度（motion magnitude）
     * @param {Object} motion - { x, y, z }
     * @returns {number} 加速度大小
     */
    function calculateMotionMagnitude(motion) {
        if (!motion || motion.x === null || motion.y === null || motion.z === null) {
            return 0;
        }
        return Math.sqrt(motion.x ** 2 + motion.y ** 2 + motion.z ** 2);
    }

    /**
     * 將 RMS 轉換為分貝（dB）
     * RMS 範圍通常在 0 - 1.0（或更小）
     * dB = 20 * log10(RMS / ref)，ref = 0.00002（20 µPa）
     * 簡化：dB = 20 * log10(RMS * 50000)
     * @param {number} rms - 音頻 RMS 值
     * @returns {number} 分貝值
     */
    function convertRmsToDb(rms) {
        if (rms <= 0) return -Infinity;
        const ref = 0.00002; // 20 µPa
        return 20 * Math.log10(rms / ref);
    }

    /**
     * 推測睡眠狀態（基於加速度計動作）
     * @param {Array} motions - 最近的加速度數據
     * @returns {string} SLEEP_STATES 之一
     */
    function predictSleepState(motions) {
        if (!motions || motions.length === 0) {
            return SLEEP_STATES.AWAKE;
        }

        // 計算動作幅度
        const magnitudes = motions.map(m => calculateMotionMagnitude(m));
        if (magnitudes.length === 0) return SLEEP_STATES.AWAKE;

        // 計算變異數（反映動作變化程度）
        const variance = calculateVariance(magnitudes);
        const stdDev = calculateStdDev(magnitudes);

        // 判斷睡眠狀態
        if (variance < config.deepSleepVarianceThreshold) {
            return SLEEP_STATES.DEEP_SLEEP;
        } else if (variance < config.lightSleepVarianceThreshold) {
            return SLEEP_STATES.LIGHT_SLEEP;
        } else {
            return SLEEP_STATES.AWAKE;
        }
    }

    /**
     * 監聽打鼾與噪音
     * @param {Array} sounds - 最近的聲音數據 [{ rms, timestamp }, ...]
     * @returns {Object} { hasSnore, hasNoise, dbValues }
     */
    function analyzeSound(sounds) {
        if (!sounds || sounds.length === 0) {
            return { hasSnore: false, hasNoise: false, dbValues: [] };
        }

        const dbValues = sounds.map(s => convertRmsToDb(s.rms));

        // 找出最大分貝值
        const maxDb = Math.max(...dbValues);
        const avgDb = dbValues.reduce((a, b) => a + b, 0) / dbValues.length;

        // 判斷打鼾（連續高分貝信號，典型範圍 40-60 dB）
        const hasSnore = maxDb > config.snoreThreshold * 100; // 閾值調整到 dB 範圍
        // 判斷噪音干擾
        const hasNoise = avgDb > config.awakenThreshold * 50;

        return { hasSnore, hasNoise, dbValues, maxDb, avgDb };
    }

    /**
     * 溫和喚醒用戶
     * 在淺眠時觸發振動/聲音提示
     */
    function gentleAwaken() {
        // 嘗試使用振動 API
        if ('vibrate' in navigator) {
            // 柔和振動模式：短暫、漸進
            navigator.vibrate([200, 100, 200, 100, 300]);
        }

        // 播放溫和的喚醒提示音（需預先準備音頻檔案）
        // 可改為使用 Web Audio API 生成柔和音調
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const now = audioContext.currentTime;
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();

            osc.connect(gain);
            gain.connect(audioContext.destination);

            // 生成漸進式柔和音調（400-500 Hz）
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(500, now + 0.5);

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
            gain.gain.linearRampToValueAtTime(0, now + 0.5);

            osc.start(now);
            osc.stop(now + 0.5);
        } catch (e) {
            console.warn('無法播放喚醒音，可能是權限或環境問題', e);
        }
    }

    /**
     * 處理追蹤數據回調
     * @param {Object} trackingData - { motion, audio, createdAt }
     */
    function processTrackingData(trackingData) {
        if (!trackingData || !trackingData.motion) return;

        // 將動作數據加入緩衝區
        motionBuffer.push(trackingData.motion);
        if (motionBuffer.length > config.motionWindowSize) {
            motionBuffer.shift();
        }

        // 將聲音數據加入緩衝區
        if (trackingData.audio) {
            soundBuffer.push(trackingData.audio);
            if (soundBuffer.length > 10) {
                soundBuffer.shift();
            }
        }

        // 定期更新睡眠狀態（避免過度更新）
        const now = Date.now();
        if (now - lastUpdateTime >= config.updateInterval) {
            updateSleepState();
            lastUpdateTime = now;
        }
    }

    /**
     * 更新睡眠狀態
     */
    function updateSleepState() {
        const newState = predictSleepState(motionBuffer);

        // 狀態改變時觸發回調
        if (newState !== currentSleepState) {
            currentSleepState = newState;
            stateChangeCallbacks.forEach(cb => {
                try { cb(newState); } catch (e) { console.error('State change callback error', e); }
            });
        }

        // 分析聲音
        const soundAnalysis = analyzeSound(soundBuffer);
        if (soundAnalysis.hasSnore || soundAnalysis.hasNoise) {
            snoreDetectCallbacks.forEach(cb => {
                try { cb(soundAnalysis); } catch (e) { console.error('Snore detect callback error', e); }
            });
        }
    }

    /**
     * 公開 API
     */
    return {
        /**
         * 開始監聽追蹤數據
         * @param {Function} onStateChange - 狀態改變回調
         * @param {Function} onSnoreDetect - 打鼾/噪音檢測回調
         */
        startMonitoring(onStateChange, onSnoreDetect) {
            if (typeof onStateChange === 'function') {
                stateChangeCallbacks.push(onStateChange);
            }
            if (typeof onSnoreDetect === 'function') {
                snoreDetectCallbacks.push(onSnoreDetect);
            }
            isMonitoring = true;
        },

        /**
         * 停止監聽
         */
        stopMonitoring() {
            isMonitoring = false;
            stateChangeCallbacks = [];
            snoreDetectCallbacks = [];
        },

        /**
         * 處理來自 Tracker 的數據
         */
        processData(trackingData) {
            if (isMonitoring) {
                processTrackingData(trackingData);
            }
        },

        /**
         * 取得當前睡眠狀態
         */
        getCurrentState() {
            return currentSleepState;
        },

        /**
         * 溫和喚醒用戶
         */
        awaken() {
            if (currentSleepState === SLEEP_STATES.LIGHT_SLEEP || currentSleepState === SLEEP_STATES.AWAKE) {
                gentleAwaken();
                return true;
            }
            return false; // 深眠時不喚醒
        },

        /**
         * 取得睡眠狀態名稱
         */
        getSleepStateName() {
            const names = {
                [SLEEP_STATES.AWAKE]: '清醒',
                [SLEEP_STATES.LIGHT_SLEEP]: '淺眠',
                [SLEEP_STATES.DEEP_SLEEP]: '深眠'
            };
            return names[currentSleepState] || '未知';
        },

        /**
         * 取得配置（用於 UI 調整）
         */
        getConfig() {
            return { ...config };
        },

        /**
         * 更新配置
         */
        updateConfig(newConfig) {
            Object.assign(config, newConfig);
        }
    };
})();

// 暴露到全域
window.SmartAwake = SmartAwake;
