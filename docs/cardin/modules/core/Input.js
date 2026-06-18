/**
 * @file Input.js
 * @description 键盘输入管理器，维护按键状态
 */
export class Input {
    constructor() {
        this.keys = {};
        this.initListeners();
    }

    initListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    isPressed(keyCode) {
        return !!this.keys[keyCode];
    }

    getSteering() {
        if (this.isPressed('ArrowLeft') || this.isPressed('KeyA')) return -1;
        if (this.isPressed('ArrowRight') || this.isPressed('KeyD')) return 1;
        return 0;
    }

    getThrottle() {
        if (this.isPressed('ArrowUp') || this.isPressed('KeyW')) return 1;
        if (this.isPressed('ArrowDown') || this.isPressed('KeyS')) return -1;
        return 0;
    }

    isDrifting() {
        return this.isPressed('ShiftLeft') || this.isPressed('Space');
    }

    isNitro() {
        return this.isPressed('ControlLeft') || this.isPressed('KeyN');
    }

    isItem() {
        return this.isPressed('KeyE') || this.isPressed('KeyQ');
    }
}
