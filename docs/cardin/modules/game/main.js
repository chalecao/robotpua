/**
 * @file main.js
 * @description 游戏主入口，初始化各模块并启动循环
 */
import * as THREE from '../../lib/three.module.js';
import { Engine } from '../core/Engine.js';
import { Input } from '../core/Input.js';
import { VehiclePhysics } from '../physics/VehiclePhysics.js';
import { Collision } from '../physics/Collision.js';
import { Kart } from '../entities/Kart.js';
import { Track } from '../entities/Track.js';
import { AIController } from '../ai/AIController.js';
import { GameManager } from './GameManager.js';
import { ParticleEffects } from '../effects/ParticleEffects.js';

class TinyKartGame {
    constructor() {
        this.engine = new Engine();
        this.input = new Input();
        this.physics = new VehiclePhysics();
        this.gameManager = new GameManager(this.engine);
        this.particles = new ParticleEffects(this.engine.getScene());

        this.karts = [];
        this.aiControllers = [];
        this.lastTime = performance.now();
        this.hasItem = false;
        this.lapCount = 0;
        this.lastAngle = 0;
        this.totalAngle = 0;
        this.itemKeyWasDown = false;

        this.init();
        this.loop();
    }

    init() {
        const scene = this.engine.getScene();
        const trackRadius = 40;

        const playerKart = new Kart(0xff0000);
        scene.add(playerKart.getMesh());
        this.karts.push({ kart: playerKart, mesh: playerKart.getMesh(), isPlayer: true });

        const aiKart1 = new Kart(0x0000ff);
        scene.add(aiKart1.getMesh());
        this.karts.push({ kart: aiKart1, mesh: aiKart1.getMesh(), isPlayer: false });

        const aiStartAngle1 = Math.PI / 2;
        aiKart1.getMesh().position.set(
            Math.cos(aiStartAngle1) * trackRadius,
            0,
            Math.sin(aiStartAngle1) * trackRadius
        );
        const aiCtrl1 = new AIController(aiKart1.getMesh(), new THREE.Vector3(0, 0, 0), trackRadius);
        aiCtrl1.angle = aiStartAngle1;
        aiCtrl1.baseSpeed = 0.6;
        aiCtrl1.speedVariation = 0.1;
        this.aiControllers.push(aiCtrl1);

        const aiKart2 = new Kart(0x00ff00);
        scene.add(aiKart2.getMesh());
        this.karts.push({ kart: aiKart2, mesh: aiKart2.getMesh(), isPlayer: false });

        const aiStartAngle2 = Math.PI;
        aiKart2.getMesh().position.set(
            Math.cos(aiStartAngle2) * trackRadius,
            0,
            Math.sin(aiStartAngle2) * trackRadius
        );
        const aiCtrl2 = new AIController(aiKart2.getMesh(), new THREE.Vector3(0, 0, 0), trackRadius);
        aiCtrl2.angle = aiStartAngle2;
        aiCtrl2.baseSpeed = 0.5;
        aiCtrl2.speedVariation = 0.15;
        this.aiControllers.push(aiCtrl2);

        this.track = new Track(scene);

        this.engine.camera.position.set(0, 10, -20);
    }

    update(dt) {
        this.aiControllers.forEach(ai => {
            const wasDebuffed = ai.isDebuffed();
            ai.update(dt);
            if (wasDebuffed && !ai.isDebuffed()) {
                const kartData = this.karts.find(k => k.mesh === ai.mesh);
                if (kartData) kartData.kart.restoreColor();
            }
        });

        const playerData = this.karts[0];
        const playerMesh = playerData.mesh;
        const physicsState = this.physics.update(playerMesh, this.input, dt);

        const itemKeyDown = this.input.isItem();
        if (itemKeyDown && !this.itemKeyWasDown && this.hasItem) {
            this.useItem(playerMesh);
        }
        this.itemKeyWasDown = itemKeyDown;

        this.updateLapTracking(playerMesh);
        this.enforceTrackBoundary(playerMesh);
        this.checkItemPickup(playerMesh);
        this.track.updateItems();

        const steerInput = this.input.getSteering();
        if (physicsState.isDrifting && steerInput !== 0) {
            this.particles.emitDriftSparks(playerMesh.position, steerInput, playerMesh.quaternion);
        }
        if (this.input.isNitro() && physicsState.nitro > 0) {
            this.particles.emitNitroFlame(playerMesh.position, playerMesh.quaternion);
        }
        this.particles.update(dt);

        if (this.aimLines) {
            for (let i = this.aimLines.length - 1; i >= 0; i--) {
                this.aimLines[i].timer -= dt;
                if (this.aimLines[i].timer <= 0) {
                    this.engine.getScene().remove(this.aimLines[i].line);
                    this.aimLines[i].line.geometry.dispose();
                    this.aimLines[i].line.material.dispose();
                    this.aimLines.splice(i, 1);
                }
            }
        }

        this.gameManager.updateUI(physicsState, this.lapCount);

        this.updateCamera(playerMesh, physicsState);
    }

    useItem(playerMesh) {
        let closestAI = null;
        let minDist = Infinity;
        for (const ai of this.aiControllers) {
            const dist = playerMesh.position.distanceTo(ai.mesh.position);
            if (dist < minDist) {
                minDist = dist;
                closestAI = ai;
            }
        }
        if (closestAI) {
            this.showAimLine(playerMesh.position, closestAI.mesh.position);
            this.applyItemEffect(closestAI);
        }
        this.hasItem = false;
    }

    showAimLine(from, to) {
        const points = [from.clone(), to.clone()];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.8 });
        const line = new THREE.Line(geometry, material);
        this.engine.getScene().add(line);
        if (!this.aimLines) this.aimLines = [];
        this.aimLines.push({ line, timer: 0.3 });
    }

    updateLapTracking(mesh) {
        const angle = Math.atan2(mesh.position.z, mesh.position.x);
        let delta = angle - this.lastAngle;
        if (delta > Math.PI) delta -= Math.PI * 2;
        if (delta < -Math.PI) delta += Math.PI * 2;
        this.totalAngle += delta;
        this.lastAngle = angle;
        this.lapCount = Math.floor(Math.abs(this.totalAngle) / (Math.PI * 2));
    }

    enforceTrackBoundary(mesh) {
        const x = mesh.position.x;
        const z = mesh.position.z;
        const dist = Math.sqrt(x * x + z * z);
        const limit = this.track.boundaryRadius;

        if (dist > limit) {
            const scale = limit / dist;
            mesh.position.x *= scale;
            mesh.position.z *= scale;
            this.physics.speed *= 0.5;
        }
    }

    checkItemPickup(playerMesh) {
        for (let i = this.track.items.length - 1; i >= 0; i--) {
            if (Collision.check(playerMesh, this.track.items[i])) {
                this.track.removeItem(i);
                this.hasItem = true;
                this.gameManager.showItemGet();
            }
        }
    }

    applyItemEffect(aiCtrl) {
        aiCtrl.applyDebuff(2500);

        const kartData = this.karts.find(k => k.mesh === aiCtrl.mesh);
        if (kartData) {
            kartData.kart.flashRed();
        }

        this.particles.emitHitBurst(aiCtrl.mesh.position);
        this.gameManager.showHit();
    }

    updateCamera(targetMesh, physicsState) {
        const speedRatio = Math.abs(physicsState.speed) / this.physics.maxSpeed;
        const baseDistance = 10;
        const distance = baseDistance + speedRatio * 4;

        const offset = new THREE.Vector3(0, 5, -distance);
        offset.applyQuaternion(targetMesh.quaternion);

        let driftOffset = new THREE.Vector3();
        if (physicsState.isDrifting) {
            const steer = this.input.getSteering();
            driftOffset = new THREE.Vector3(-steer * 3, 0, 0);
            driftOffset.applyQuaternion(targetMesh.quaternion);
        }

        const targetPos = targetMesh.position.clone().add(offset).add(driftOffset);
        this.engine.camera.position.lerp(targetPos, 0.08);

        const targetFov = 60 + speedRatio * 10 + (physicsState.nitro > 0 && this.input.isNitro() ? 5 : 0);
        this.engine.camera.fov = THREE.MathUtils.lerp(this.engine.camera.fov, targetFov, 0.05);
        this.engine.camera.updateProjectionMatrix();

        this.engine.camera.lookAt(targetMesh.position);
    }

    loop() {
        requestAnimationFrame(() => this.loop());
        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 1000, 0.05);
        this.lastTime = now;
        this.update(dt);
        this.engine.getRenderer().render(this.engine.getScene(), this.engine.camera);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new TinyKartGame();
});
