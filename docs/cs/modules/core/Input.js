/**
 * @module Input
 * @description 键盘鼠标输入管理，支持 Pointer Lock API 和按键边缘检测
 */
export class Input {
  constructor(canvas) {
    this.keys = {};
    this.mouseDown = false;
    this.pointerLocked = false;

    this._justPressedMap = {};
    this._justReleasedMap = {};
    this._prevMouseDown = false;
    this._canvas = canvas;

    this._setupKeyboard();
    this._setupPointerLock();
  }

  _setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      const key = e.code;
      if (!this.keys[key]) this._justPressedMap[key] = true;
      this.keys[key] = true;
    });

    window.addEventListener('keyup', (e) => {
      const key = e.code;
      this.keys[key] = false;
      this._justReleasedMap[key] = true;
    });
  }

  _setupPointerLock() {
    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this._canvas;
    });

    document.addEventListener('mousedown', (e) => {
      if (this.pointerLocked && e.button === 0) this.mouseDown = true;
    });

    document.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouseDown = false;
    });
  }

  isKeyDown(code) { return !!this.keys[code]; }
  isJustPressed(code) { return !!this._justPressedMap[code]; }
  isJustReleased(code) { return !!this._justReleasedMap[code]; }
  isMouseDown() { return this.mouseDown; }
  isMouseJustPressed() { return this.mouseDown && !this._prevMouseDown; }
  isMouseJustReleased() { return !this.mouseDown && this._prevMouseDown; }

  update() {
    this._justPressedMap = {};
    this._justReleasedMap = {};
    this._prevMouseDown = this.mouseDown;
  }
}
