/**
 * @file GameManager.js
 * @description 游戏状态管理器：关卡切换、球体管理、胜利条件、HUD 更新、音效触发。
 * @module game/GameManager
 */

import * as THREE from 'https://robotpua.com/cs/lib/three.module.js';
import { PaperBall } from '../entities/PaperBall.js';
import { WoodBall } from '../entities/WoodBall.js';
import { IronBall } from '../entities/IronBall.js';
import { buildLevel01 } from '../levels/Level_01_Bridge.js';
import { buildLevel02 } from '../levels/Level_02_Wind.js';
import { buildLevel03 } from '../levels/Level_03_Maze.js';
import { buildLevel04 } from '../levels/Level_04_Narrow.js';
import { buildLevel05 } from '../levels/Level_05_Vertical.js';
import { buildLevel06 } from '../levels/Level_06_Multi.js';
import { buildLevel07 } from '../levels/Level_07_Final.js';

const LEVEL_FACTORIES = {
    0: buildLevel01,
    1: buildLevel02,
    2: buildLevel03,
    3: buildLevel04,
    4: buildLevel05,
    5: buildLevel06,
    6: buildLevel07,
};

const BALL_CONSTRUCTORS = {
    paper: PaperBall,
    wood: WoodBall,
    iron: IronBall,
};

export class GameManager {
    constructor(engine, physicsWorld, particles, assets, postProcessing, audioManager) {
        this.engine = engine;
        this.physicsWorld = physicsWorld;
        this.particles = particles;
        this.assets = assets;
        this.postProcessing = postProcessing;
        this.audio = audioManager || null;

        this.currentLevelIndex = 0;
        this.currentBallType = 'wood';
        this.balls = {};
        this.activeBall = null;
        this.level = null;
        this.score = 0;
        this.moves = 0;
        this.gameState = 'playing';
        this.switchTimer = 0;

        this.hud = {
            levelName: document.getElementById('level-name'),
            dotPaper: document.getElementById('dot-paper'),
            dotWood: document.getElementById('dot-wood'),
            dotIron: document.getElementById('dot-iron'),
            switchHint: document.getElementById('switch-hint'),
            victoryScreen: document.getElementById('victory-screen'),
            victoryText: document.getElementById('victory-text'),
            nextLevelBtn: document.getElementById('next-level-btn'),
            loadingScreen: document.getElementById('loading-screen'),
            loadingBar: document.getElementById('loading-bar'),
        };

        this._setupNextLevelBtn();
    }

    loadLevel(index) {
        this.currentLevelIndex = index;
        const factory = LEVEL_FACTORIES[index];
        if (!factory) {
            console.warn(`Level ${index} not found, falling back to Level 0`);
            this.loadLevel(0);
            return;
        }

        if (this.level) {
            this.level.clear();
        }

        this.level = factory(this.engine.scene, this.physicsWorld, this.assets);
        this.level.setupLighting();

        for (const type of ['paper', 'wood', 'iron']) {
            if (this.balls[type]) {
                this.balls[type].destroy();
            }
        }

        for (const type of ['paper', 'wood', 'iron']) {
            const Ctor = BALL_CONSTRUCTORS[type];
            this.balls[type] = new Ctor(
                this.engine.scene,
                this.level.startPoint.clone()
            );
            this.balls[type].mesh.visible = (type === this.currentBallType);

            if (this.level.finishZone) {
                this.balls[type].setFinishZone(this.level.finishZone);
            }
        }

        this.activeBall = this.balls[this.currentBallType];
        this.activeBall.mesh.visible = true;
        this.activeBall.state = 'idle';

        this.cameraOffset = new THREE.Vector3(0, 12, 16);
        this.cameraLookTarget = this.level.startPoint.clone();

        if (this.hud.levelName) {
            this.hud.levelName.textContent = this.level.levelName.toUpperCase();
        }

        this.updateHUD();
        this.gameState = 'playing';
        this.score = 0;
        this.moves = 0;
    }

    switchBall(type) {
        if (this.gameState !== 'playing') return;
        if (type === this.currentBallType) return;

        this.gameState = 'switching';
        this.switchTimer = 0.5;

        const oldBall = this.balls[this.currentBallType];
        const newBall = this.balls[type];
        const switchPos = oldBall.mesh.position.clone();

        oldBall.playSwitchOutEffect(this.particles, switchPos);
        oldBall.setSwitchOut();

        newBall.mesh.position.copy(switchPos);
        newBall.velocity.set(0, 0, 0);
        newBall.setSwitchIn();

        this.currentBallType = type;
        this.updateHUD();

        if (this.audio) this.audio.playSwitch(type);
    }

    update(dt, inputForce) {
        if (this.gameState === 'switching') {
            this.switchTimer -= dt;
            for (const type of ['paper', 'wood', 'iron']) {
                this.balls[type].update(dt);
            }
            if (this.switchTimer <= 0) {
                this.gameState = 'playing';
                this.activeBall = this.balls[this.currentBallType];
                this.activeBall.state = 'idle';
                this.activeBall.mesh.visible = true;
                const dampingFactor = Math.pow(0.01, dt / 0.15);
                this.activeBall.velocity.multiplyScalar(dampingFactor);
                const result = this.physicsWorld.update(
                    this.activeBall.mesh,
                    this.activeBall.velocity,
                    this.activeBall.params,
                    new THREE.Vector3(0, 0, 0),
                    Math.min(dt, 0.016)
                );
                this.activeBall.velocity.copy(result.velocity);
                this.activeBall.onGround = result.onGround;
            }
            return;
        }

        if (this.gameState !== 'playing') return;
        if (!this.activeBall) return;

        const result = this.physicsWorld.update(
            this.activeBall.mesh,
            this.activeBall.velocity,
            this.activeBall.params,
            inputForce,
            dt
        );
        this.activeBall.velocity.copy(result.velocity);
        this.activeBall.onGround = result.onGround;

        // 撞击检测 + 音效
        if (result.onGround && this.activeBall.velocity.y < -1) {
            const impactSpeed = Math.abs(this.activeBall.velocity.y);
            if (impactSpeed > 2) {
                this.activeBall.playImpactEffect(
                    this.particles,
                    this.activeBall.mesh.position.clone(),
                    new THREE.Vector3(0, 1, 0)
                );
                if (this.audio) {
                    this.audio.playImpact(impactSpeed / 10, this.currentBallType);
                }
            }
        }

        // 滚动音效
        if (this.audio && this.activeBall.onGround) {
            const speed = this.activeBall.velocity.length();
            this.audio.updateRolling(speed);
        } else if (this.audio) {
            this.audio.updateRolling(0);
        }

        this.activeBall.update(dt);
        this.physicsWorld.updatePlatforms(dt);
        this._updateCamera(dt);

        if (this.physicsWorld.checkFinish(this.activeBall.mesh)) {
            this._onVictory();
        }

        if (this.activeBall.mesh.position.y < -10) {
            this._respawnBall();
        }
    }

    _updateCamera(dt) {
        if (!this.activeBall || !this.activeBall.mesh) return;

        const targetPos = this.activeBall.mesh.position.clone().add(this.cameraOffset);
        this.engine.camera.position.lerp(targetPos, dt * 3);

        const lookTarget = this.activeBall.mesh.position.clone();
        lookTarget.y += 2;
        this.engine.camera.lookAt(lookTarget);
    }

    _onVictory() {
        if (this.gameState !== 'playing') return;
        this.gameState = 'victory';
        this.score += 100;

        const victoryPos = this.activeBall.mesh.position.clone();
        this.particles.emitRipple(victoryPos);
        this.particles.emitSparks(victoryPos);
        this.particles.emitSmoke(victoryPos);
        this.particles.emitGlow(victoryPos);
        // 多角度绽放
        for (let i = 0; i < 4; i++) {
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 1.5,
                (Math.random() - 0.5) * 2
            );
            this.particles.emitGlow(victoryPos.clone().add(offset));
        }

        this.hud.victoryScreen.classList.add('show');
        this.hud.victoryText.textContent = `Level ${this.currentLevelIndex + 1} Complete! Score: ${this.score}`;

        if (this.level && this.level.finishZone) {
            this.level.finishZone.mesh.material.emissiveIntensity = 5;
            this.level.finishZone.pillar.material.opacity = 0.2;
        }

        if (this.audio) this.audio.playVictory();
    }

    _respawnBall() {
        if (this.audio) this.audio.playFall();

        this.activeBall.mesh.position.copy(this.level.startPoint);
        this.activeBall.velocity.set(0, 0, 0);
        this.activeBall.state = 'idle';
        const result = this.physicsWorld.update(
            this.activeBall.mesh,
            this.activeBall.velocity,
            this.activeBall.params,
            new THREE.Vector3(0, 0, 0),
            0.016
        );
        this.activeBall.velocity.copy(result.velocity);
        this.activeBall.onGround = result.onGround;
    }

    nextLevel() {
        this.hud.victoryScreen.classList.remove('show');
        const nextIndex = this.currentLevelIndex + 1;
        if (LEVEL_FACTORIES[nextIndex]) {
            this.loadLevel(nextIndex);
        } else {
            this.hud.victoryText.textContent = `All levels complete! Final Score: ${this.score}`;
            this.hud.nextLevelBtn.textContent = 'RESTART';
            this.hud.nextLevelBtn.onclick = () => {
                this.hud.nextLevelBtn.textContent = 'NEXT LEVEL →';
                this.loadLevel(0);
            };
        }
        if (this.audio) this.audio.playUI();
    }

    restartLevel() {
        this.loadLevel(this.currentLevelIndex);
        if (this.audio) this.audio.playUI();
    }

    updateHUD() {
        if (this.hud.levelName) {
            this.hud.levelName.textContent = this.level ? this.level.levelName : '';
        }
        for (const type of ['paper', 'wood', 'iron']) {
            const dot = this.hud[`dot${type.charAt(0).toUpperCase() + type.slice(1)}`];
            if (dot) {
                dot.classList.toggle('active', type === this.currentBallType);
            }
        }
    }

    _setupNextLevelBtn() {
        if (this.hud.nextLevelBtn) {
            this.hud.nextLevelBtn.onclick = () => this.nextLevel();
        }
    }

    showSwitchHint(type) {
        const names = { paper: 'PAPER', wood: 'WOOD', iron: 'IRON' };
        if (this.hud.switchHint) {
            this.hud.switchHint.textContent = names[type] || type;
            this.hud.switchHint.style.opacity = '1';
            setTimeout(() => {
                if (this.hud.switchHint) this.hud.switchHint.style.opacity = '0';
            }, 500);
        }
    }

    hideLoading() {
        if (this.hud.loadingScreen) {
            this.hud.loadingScreen.classList.add('hidden');
        }
    }
}
