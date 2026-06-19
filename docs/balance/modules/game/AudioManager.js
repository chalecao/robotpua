/**
 * @file AudioManager.js
 * @description 音效管理器：使用 Web Audio API 程序化生成游戏音效，
 *               包括滚动、撞击、球体切换、胜利和环境音。
 * @module game/AudioManager
 */

/**
 * 音效管理器 — 基于 Web Audio API 的程序化音效
 */
export class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.ambientGain = null;
        this.initialized = false;
        this.rollingSource = null;
        this.rollingGain = null;
        this.ambientSource = null;
        this.smoothedRollingSpeed = 0;
    }

    /**
     * 初始化音频上下文（必须在用户交互后调用）
     */
    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.5;
            this.masterGain.connect(this.ctx.destination);
            this.initialized = true;
            this._startAmbient();
        } catch (e) {
            console.warn('Audio init failed:', e);
        }
    }

    /**
     * 确保音频上下文已恢复（用户交互后）
     */
    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        if (!this.initialized) {
            this.init();
        }
    }

    // ===== 程序化音效 =====

    /**
     * 球体滚动音效 — 低频隆隆声，随速度变化
     * @param {number} speed — 当前速度 0~1
     */
    updateRolling(speed) {
        if (!this.initialized || !this.rollingGain) return;
        // 低于静止阈值的速度视为 0，避免纸球在地面微抖动引发滋滋声
        const effective = speed > 0.5 ? speed : 0;
        // 指数平滑，衰减 ~150ms
        const alpha = 0.12;
        this.smoothedRollingSpeed += (effective - this.smoothedRollingSpeed) * alpha;
        
        if (this.smoothedRollingSpeed < 0.01) {
            // 球基本静止，完全静音
            const now = this.ctx.currentTime;
            this.rollingGain.gain.cancelScheduledValues(now);
            this.rollingGain.gain.linearRampToValueAtTime(0, now + 0.1);
        } else {
            const targetVol = Math.min(this.smoothedRollingSpeed / 14, 0.08);
            const now = this.ctx.currentTime;
            this.rollingGain.gain.cancelScheduledValues(now);
            this.rollingGain.gain.linearRampToValueAtTime(targetVol, now + 0.2);
        }
    }

    /**
     * 撞击音效 — 根据力度生成不同音色的冲击声
     * @param {number} intensity — 撞击强度 0~1
     * @param {string} ballType — 球体类型
     */
    playImpact(intensity, ballType = 'wood') {
        if (!this.initialized) return;

        const freqMap = { paper: 800, wood: 400, iron: 200 };
        const baseFreq = freqMap[ballType] || 400;
        const vol = Math.min(intensity * 0.3, 0.4);

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = ballType === 'iron' ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.3, this.ctx.currentTime + 0.15);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(baseFreq * 3, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.2);
        filter.Q.value = 2;

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);

        // 噪声冲击层
        this._playNoiseBurst(vol * 0.5, 0.1);
    }

    /**
     * 球体切换音效 — 升/降音阶
     * @param {string} type — 切换到的球体类型
     */
    playSwitch(type) {
        if (!this.initialized) return;

        const freqs = { paper: [600, 900, 1200], wood: [400, 600, 800], iron: [200, 350, 500] };
        const notes = freqs[type] || freqs.wood;

        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, this.ctx.currentTime + i * 0.06);
            gain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + i * 0.06 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.06 + 0.15);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(this.ctx.currentTime + i * 0.06);
            osc.stop(this.ctx.currentTime + i * 0.06 + 0.2);
        });

        this._playNoiseBurst(0.05, 0.15);
    }

    /**
     * 胜利音效 — 和弦上升
     */
    playVictory() {
        if (!this.initialized) return;

        const chord = [523, 659, 784, 1047];
        chord.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const start = this.ctx.currentTime + i * 0.12;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.15, start + 0.05);
            gain.gain.setValueAtTime(0.15, start + 0.4);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 1.2);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(start);
            osc.stop(start + 1.3);
        });

        // 闪烁音
        for (let i = 0; i < 6; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 1500 + i * 200;
            const t = this.ctx.currentTime + 0.5 + i * 0.08;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.06, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(t);
            osc.stop(t + 0.15);
        }
    }

    /**
     * 掉落/失败音效 — 下行滑音
     */
    playFall() {
        if (!this.initialized) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.7);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.8);
    }

    /**
     * 按键/UI 音效
     */
    playUI() {
        if (!this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 1000;
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    // ===== 内部方法 =====

    _playNoiseBurst(volume, duration) {
        if (!this.initialized) return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 2000;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        source.start();
    }

    _startAmbient() {
        if (!this.initialized) return;

        this.ambientGain = this.ctx.createGain();
        this.ambientGain.gain.value = 0.01;  // 极低的环境风声，避免干扰
        this.ambientGain.connect(this.masterGain);

        // 低频风声 — 音量极低，仅作背景氛围
        const bufferSize = this.ctx.sampleRate * 4;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        // 无缝循环交叉淡化
        const ambFade = Math.min(2048, bufferSize >> 2);
        for (let i = 0; i < ambFade; i++) {
            const t = i / ambFade;
            const a = data[i];
            const b = data[bufferSize - ambFade + i];
            data[i] = a * t + b * (1 - t);
        }
        this.ambientSource = this.ctx.createBufferSource();
        this.ambientSource.buffer = buffer;
        this.ambientSource.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200;
        filter.Q.value = 0.5;

        this.ambientSource.connect(filter);
        filter.connect(this.ambientGain);
        this.ambientSource.start();

        // 滚动音源 — 持续循环的低频噪声，由 updateRolling() 控制音量
        this.rollingGain = this.ctx.createGain();
        this.rollingGain.gain.value = 0;
        this.rollingGain.connect(this.masterGain);

        const rollingBufferSize = this.ctx.sampleRate * 2;
        const rollingBuffer = this.ctx.createBuffer(1, rollingBufferSize, this.ctx.sampleRate);
        const rollingData = rollingBuffer.getChannelData(0);
        for (let i = 0; i < rollingBufferSize; i++) {
            rollingData[i] = Math.random() * 2 - 1;
        }
        // 首尾交叉淡化，消除循环点击声
        const fade = Math.min(2048, rollingBufferSize >> 2);
        for (let i = 0; i < fade; i++) {
            const t = i / fade;
            const a = rollingData[i];
            const b = rollingData[rollingBufferSize - fade + i];
            rollingData[i] = a * t + b * (1 - t);
        }

        this.rollingSource = this.ctx.createBufferSource();
        this.rollingSource.buffer = rollingBuffer;
        this.rollingSource.loop = true;

        const rollingFilter = this.ctx.createBiquadFilter();
        rollingFilter.type = 'lowpass';
        rollingFilter.frequency.value = 120;
        rollingFilter.Q.value = 0.7;

        this.rollingSource.connect(rollingFilter);
        rollingFilter.connect(this.rollingGain);
        this.rollingSource.start();

        // 高空鸟鸣/风声装饰音
        this._scheduleWindGusts();
    }

    _scheduleWindGusts() {
        if (!this.initialized) return;
        const delay = 3 + Math.random() * 5;
        setTimeout(() => {
            if (!this.initialized) return;
            this._playWindGust();
            this._scheduleWindGusts();
        }, delay * 1000);
    }

    _playWindGust() {
        if (!this.initialized || !this.ambientGain) return;
        const duration = 1 + Math.random() * 2;
        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            const env = Math.sin((i / bufferSize) * Math.PI);
            data[i] = (Math.random() * 2 - 1) * env;
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.value = 0.04;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 400 + Math.random() * 600;
        filter.Q.value = 1;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ambientGain);
        source.start();
    }

    dispose() {
        if (this.rollingSource) {
            try { this.rollingSource.stop(); } catch (e) { /* ignore */ }
        }
        if (this.ambientSource) {
            try { this.ambientSource.stop(); } catch (e) { /* ignore */ }
        }
        if (this.ctx) {
            this.ctx.close();
        }
    }
}
