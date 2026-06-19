/**
 * @file Input.js
 * @description 输入管理器：统一处理键盘和鼠标事件，提供键位映射和状态查询。
 * @module core/Input
 */

export class Input {
    constructor() {
        this.keys = new Set();
        this._justPressedKeys = new Set();
        this.mouse = { x: 0, y: 0, down: false };
        
        window.addEventListener('keydown', (e) => this._onKeyDown(e));
        window.addEventListener('keyup', (e) => this._onKeyUp(e));
        window.addEventListener('mousemove', (e) => this._onMouseMove(e));
        window.addEventListener('mousedown', () => this.mouse.down = true);
        window.addEventListener('mouseup', () => this.mouse.down = false);
    }

    /**
     * 按键是否持续按下
     * @param {string|string[]} key 
     * @returns {boolean}
     */
    isDown(key) {
        if (Array.isArray(key)) return key.some(k => this.keys.has(k));
        return this.keys.has(key);
    }

    /**
     * 按键是否刚按下（单帧触发）
     * @param {string|string[]} key 
     * @returns {boolean}
     */
    justPressed(key) {
        if (Array.isArray(key)) return key.some(k => this._justPressedKeys.has(k));
        return this._justPressedKeys.has(key);
    }

    _onKeyDown(e) {
        this.keys.add(e.code);
        this._justPressedKeys.add(e.code);
    }

    _onKeyUp(e) {
        this.keys.delete(e.code);
        this._justPressedKeys.delete(e.code);
    }

    _onMouseMove(e) {
        // 归一化 -1 ~ 1
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }

    /**
     * 清除刚按下状态（每帧调用一次）
     */
    clearJustPressed() {
        this._justPressedKeys.clear();
    }
}
