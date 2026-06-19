/**
 * @file main.js
 * @description 游戏主入口：组装各模块，启动游戏循环。
 * @module game/main
 */

import * as THREE from 'https://robotpua.com/cs/lib/three.module.js';
import { Engine } from '../core/Engine.js';
import { Input } from '../core/Input.js';
import { Assets } from '../core/Assets.js';
import { PhysicsWorld } from '../physics/PhysicsWorld.js';
import { ParticleSystem } from '../graphics/ParticleSystem.js';
import { PostProcessing } from '../graphics/PostProcessing.js';
import { SkySystem } from '../graphics/SkySystem.js';
import { createSkyEnvironmentTexture } from '../graphics/Materials.js';
import { GameManager } from './GameManager.js';
import { AudioManager } from './AudioManager.js';

async function init() {
    const container = document.getElementById('game-container');
    if (!container) {
        console.error('Game container not found!');
        return;
    }

    const engine = new Engine(container);
    const input = new Input();
    const assets = new Assets();
    const physicsWorld = new PhysicsWorld(engine.scene);
    const particleSystem = new ParticleSystem(engine.scene);
    const postProcessing = new PostProcessing(engine.renderer, engine.width, engine.height);
    const skySystem = new SkySystem(engine.scene);

    // ===== IBL 环境贴图（PMREM）=====
    // 为所有 PBR 材质提供真实的环境反射 — 金属球能反射出真实天空
    try {
        const envTexture = createSkyEnvironmentTexture();
        const pmremGenerator = new THREE.PMREMGenerator(engine.renderer);
        pmremGenerator.compileEquirectangularShader();
        const envMap = pmremGenerator.fromEquirectangular(envTexture).texture;
        pmremGenerator.dispose();
        envTexture.dispose();
        engine.setEnvironment(envMap);
        assets.setEnvironmentMap(envMap);
    } catch (e) {
        console.warn('PMREM environment setup failed:', e);
    }

    // 检测 WebGL 是否可用
    if (!engine.renderer.getContext()) {
        console.error('WebGL not supported — cannot render!');
        showWebGLError();
    }

    let audioManager;
    try {
        audioManager = new AudioManager();
    } catch (e) {
        console.warn('AudioManager init failed:', e);
        audioManager = null;
    }

    const gameManager = new GameManager(
        engine,
        physicsWorld,
        particleSystem,
        assets,
        postProcessing,
        audioManager
    );

    gameManager.loadLevel(0);

    // 渲染管线：先尝试 PostProcessing，失败则直接渲染
    engine.setCustomRender(() => {
        try {
            postProcessing.render(engine.scene, engine.camera);
        } catch (e) {
            console.error('PostProcessing render failed, fallback:', e);
            engine.renderer.render(engine.scene, engine.camera);
        }
    });

    const initAudio = () => {
        if (audioManager) audioManager.resume();
        window.removeEventListener('click', initAudio);
        window.removeEventListener('keydown', initAudio);
        window.removeEventListener('touchstart', initAudio);
    };
    window.addEventListener('click', initAudio);
    window.addEventListener('keydown', initAudio);
    window.addEventListener('touchstart', initAudio);

    engine.onFrame((delta) => {
        const inputForce = new THREE.Vector3(0, 0, 0);
        const moveSpeed = 12.0;

        if (input.isDown(['KeyW', 'ArrowUp'])) inputForce.z -= moveSpeed;
        if (input.isDown(['KeyS', 'ArrowDown'])) inputForce.z += moveSpeed;
        if (input.isDown(['KeyA', 'ArrowLeft'])) inputForce.x -= moveSpeed;
        if (input.isDown(['KeyD', 'ArrowRight'])) inputForce.x += moveSpeed;

        if (input.justPressed('Digit1')) {
            gameManager.switchBall('paper');
            gameManager.showSwitchHint('paper');
        }
        if (input.justPressed('Digit2')) {
            gameManager.switchBall('wood');
            gameManager.showSwitchHint('wood');
        }
        if (input.justPressed('Digit3')) {
            gameManager.switchBall('iron');
            gameManager.showSwitchHint('iron');
        }

        if (input.justPressed('KeyR')) {
            gameManager.restartLevel();
        }

        input.clearJustPressed();

        gameManager.update(delta, inputForce);
        particleSystem.update(delta, engine.camera);
        skySystem.update(delta, engine.camera);
    }, 0);

    engine.start();

    // 强制在 2 秒后隐藏加载画面（无论是否出错）
    setTimeout(() => gameManager.hideLoading(), 2000);
    // 额外 1 秒兜底
    setTimeout(() => {
        if (gameManager.hud && gameManager.hud.loadingScreen) {
            gameManager.hud.loadingScreen.classList.add('hidden');
        }
    }, 3000);

    window.addEventListener('resize', () => {
        postProcessing.setSize(engine.width, engine.height);
    });

    console.log('The Balance — Game Started');
}

function showWebGLError() {
    const el = document.createElement('div');
    el.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#000;color:#f55;font:20px monospace;display:flex;align-items:center;justify-content:center;z-index:9999;flex-direction:column;gap:16px;';
    el.innerHTML = '<h1>WebGL Not Supported</h1><p>Your browser or device does not support WebGL. Please try Chrome, Firefox, or Safari.</p>';
    document.getElementById('game-container').appendChild(el);
}

// 启动
init().catch(err => {
    console.error('Failed to initialize game:', err);
    const el = document.createElement('div');
    el.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#000;color:#f55;font:16px monospace;display:flex;align-items:center;justify-content:center;z-index:9999;flex-direction:column;gap:12px;padding:40px;overflow:auto;';
    el.innerHTML = `<h1>Game Error</h1><pre style="white-space:pre-wrap;color:#faa;">${err.message}\n${err.stack}</pre><p style="color:#888">Check browser console (F12) for details.</p>`;
    const container = document.getElementById('game-container');
    if (container) container.appendChild(el);
});
