/**
 * @file Engine.js
 * @description 核心引擎：初始化 Three.js 渲染管线，管理 Scene、Camera、Renderer 及动画循环。
 * @module core/Engine
 */

import * as THREE from 'https://robotpua.com/cs/lib/three.module.js';

export class Engine {
    /** @param {HTMLElement} container */
    constructor(container) {
        this.container = container;
        this.width = container.clientWidth;
        this.height = container.clientHeight;
        this.isRunning = false;
        this.clock = new THREE.Clock();
        this.listeners = {};

        this._initRenderer();
        this._initScene();
        this._initCamera();
    }

    _initRenderer() {
        this.width = Math.max(1, this.container.clientWidth || window.innerWidth);
        this.height = Math.max(1, this.container.clientHeight || window.innerHeight);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x88bbee, 1);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.container.appendChild(this.renderer.domElement);

        // WebGL 上下文错误检测
        const gl = this.renderer.getContext();
        if (!gl) {
            console.error('WebGL context not supported!');
        }

        window.addEventListener('resize', () => this._onResize());
    }

    _initScene() {
        this.scene = new THREE.Scene();
        // 天空背景色（蓝灰色调，作为远景底色）
        this.scene.background = new THREE.Color(0x8fb3d4);
        this.scene.fog = new THREE.FogExp2(0xb8d4e8, 0.004);
    }

    /**
     * 设置环境贴图（PMREM 格式）— 用于所有 PBR 材质的 IBL 反射
     * @param {THREE.Texture} envMap - PMREMGenerator 生成的贴图
     */
    setEnvironment(envMap) {
        this.scene.environment = envMap;
    }

    _initCamera() {
        this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 1000);
        this.camera.position.set(0, 15, 20);
        this.camera.lookAt(0, 0, 0);
    }

    /**
     * 注册帧回调
     * @param {(delta: number) => void} fn
     * @param {number} priority - 优先级，越小越先执行
     */
    onFrame(fn, priority = 0) {
        if (!this._frames) this._frames = [];
        this._frames.push({ fn, priority });
        this._frames.sort((a, b) => a.priority - b.priority);
    }

    /**
     * 设置自定义渲染函数（使用后期处理时调用）
     * @param {Function} renderFn
     */
    setCustomRender(renderFn) {
        this._customRender = renderFn;
    }

    _animate() {
        if (!this.isRunning) return;
        requestAnimationFrame(() => this._animate());
        const delta = Math.min(this.clock.getDelta(), 0.1);
        if (this._frames) {
            for (const item of this._frames) {
                item.fn(delta);
            }
        }
        if (this._customRender) {
            this._customRender();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    /**
     * 启动引擎
     */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this._animate();
    }

    stop() {
        this.isRunning = false;
    }

    _onResize() {
        const w = Math.max(1, this.container.clientWidth || window.innerWidth);
        const h = Math.max(1, this.container.clientHeight || window.innerHeight);
        this.width = w;
        this.height = h;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    get aspect() { return this.width / this.height; }
    get pixelRatio() { return this.renderer.getPixelRatio(); }
}
