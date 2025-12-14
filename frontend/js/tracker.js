/*
 * Tracker 模組
 * - 優先使用原生橋接 (window.NativeBridge.startTracking / stopTracking)
 * - 若無原生橋接，使用 Web API 回退：DeviceMotionEvent (加速度) 與 getUserMedia (麥克風)
 * - 固定頻率採樣（預設 10 Hz）
 * - 提供 startTracking({ sampleRate, onData }) 與 stopTracking()
 */
const Tracker = (function () {
    let isTracking = false;
    let sampleRate = 10; // Hz
    let motionHandler = null;
    let latestMotion = null;
    let motionInterval = null;
    let audioStream = null;
    let audioContext = null;
    let scriptNode = null;
    let onDataCb = null;

    function hasNativeBridge() {
        return typeof window.NativeBridge === 'object' && (typeof window.NativeBridge.startTracking === 'function');
    }

    async function startWebSensors(options = {}) {
        sampleRate = options.sampleRate || sampleRate;
        onDataCb = options.onData || function () {};

        // DeviceMotion
        latestMotion = { x: null, y: null, z: null, timestamp: Date.now() };

        motionHandler = function (e) {
            const acc = e.accelerationIncludingGravity || e.acceleration || { x: null, y: null, z: null };
            latestMotion = {
                x: acc.x === null ? null : Number(acc.x.toFixed(3)),
                y: acc.y === null ? null : Number(acc.y.toFixed(3)),
                z: acc.z === null ? null : Number(acc.z.toFixed(3)),
                timestamp: Date.now()
            };
        };

        // Request permission for iOS 13+
        try {
            if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
                const perm = await DeviceMotionEvent.requestPermission();
                if (perm === 'granted') {
                    window.addEventListener('devicemotion', motionHandler);
                }
            } else {
                window.addEventListener('devicemotion', motionHandler);
            }
        } catch (err) {
            console.warn('DeviceMotion permission denied or unavailable:', err);
        }

        // Microphone
        try {
            audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(audioStream);

            // ScriptProcessor fallback; small buffer for low-latency
            const bufferSize = 1024;
            scriptNode = audioContext.createScriptProcessor(bufferSize, 1, 1);
            source.connect(scriptNode);
            scriptNode.connect(audioContext.destination);

            let lastAudioSample = { rms: 0, timestamp: Date.now() };

            scriptNode.onaudioprocess = function (audioProcessingEvent) {
                const inputBuffer = audioProcessingEvent.inputBuffer.getChannelData(0);
                let sum = 0;
                for (let i = 0; i < inputBuffer.length; i++) {
                    sum += inputBuffer[i] * inputBuffer[i];
                }
                const rms = Math.sqrt(sum / inputBuffer.length);
                lastAudioSample = { rms: Number(rms.toFixed(6)), timestamp: Date.now() };
                // We don't emit every audio frame; main interval will pick latest
                latestMotion = latestMotion || { x: null, y: null, z: null, timestamp: Date.now() };
                latestMotion.audio = lastAudioSample;
            };
        } catch (err) {
            console.warn('Microphone permission denied or unavailable:', err);
        }

        // Emit at fixed frequency
        const intervalMs = Math.round(1000 / sampleRate);
        motionInterval = setInterval(() => {
            const payload = {
                motion: latestMotion ? { x: latestMotion.x, y: latestMotion.y, z: latestMotion.z, timestamp: latestMotion.timestamp } : null,
                audio: latestMotion && latestMotion.audio ? latestMotion.audio : null,
                createdAt: new Date().toISOString()
            };
            try { onDataCb(payload); } catch (e) { console.error('onData callback error', e); }
        }, intervalMs);

        isTracking = true;
        return true;
    }

    async function stopWebSensors() {
        if (motionHandler) {
            window.removeEventListener('devicemotion', motionHandler);
            motionHandler = null;
        }
        if (motionInterval) {
            clearInterval(motionInterval);
            motionInterval = null;
        }
        if (scriptNode) {
            try { scriptNode.disconnect(); } catch (e) {}
            scriptNode.onaudioprocess = null;
            scriptNode = null;
        }
        if (audioContext) {
            try { audioContext.close(); } catch (e) {}
            audioContext = null;
        }
        if (audioStream) {
            audioStream.getTracks().forEach(t => t.stop());
            audioStream = null;
        }
        isTracking = false;
    }

    return {
        async startTracking(options = {}) {
            if (isTracking) return false;
            if (hasNativeBridge()) {
                // 呼叫原生橋接（bridge 需自行實作）
                try {
                    window.NativeBridge.startTracking(JSON.stringify(options));
                    isTracking = true;
                    return true;
                } catch (err) {
                    console.warn('NativeBridge.startTracking failed, fallback to web sensors', err);
                }
            }

            // Web API 回退
            return await startWebSensors(options);
        },

        async stopTracking() {
            if (!isTracking) return false;
            if (hasNativeBridge()) {
                try {
                    window.NativeBridge.stopTracking();
                    isTracking = false;
                    return true;
                } catch (err) {
                    console.warn('NativeBridge.stopTracking failed, fallback to web sensors', err);
                }
            }

            await stopWebSensors();
            return true;
        },

        isTracking() { return isTracking; }
    };
})();

// Expose for modules and direct include
window.Tracker = Tracker;
