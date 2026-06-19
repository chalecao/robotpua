/**
 * @file ParticleSystem.js
 * @description 通用粒子管理器：支持撞击波纹、木屑、火星、烟尘、纸屑等粒子效果。
 *              使用软圆形纹理 + 加性混合 + 真实物理，呈现专业级视觉。
 * @module graphics/ParticleSystem
 */

import * as THREE from 'https://robotpua.com/cs/lib/three.module.js';

/**
 * 粒子类型枚举
 */
export const PARTICLE_TYPE = {
    RIPPLE: 'ripple',       // 圆形扩散波纹
    WOOD_SHARDS: 'wood',    // 木屑
    SPARKS: 'sparks',       // 火星（加性混合）
    DUST: 'dust',           // 尘土
    SMOKE: 'smoke',         // 烟雾
    PAPER_BITS: 'paper',    // 纸屑
    GLOW: 'glow',           // 光晕（加性混合）
};

// 缓存的软圆纹理（所有粒子共用）
let _softCircleTex = null;
let _sparkTex = null;

function getSoftCircleTexture() {
    if (_softCircleTex) return _softCircleTex;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    grad.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    _softCircleTex = new THREE.CanvasTexture(canvas);
    _softCircleTex.colorSpace = THREE.SRGBColorSpace;
    return _softCircleTex;
}

function getSparkTexture() {
    if (_sparkTex) return _sparkTex;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    // 中心极亮的尖刺状火花
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.15, 'rgba(255, 255, 220, 0.95)');
    grad.addColorStop(0.4, 'rgba(255, 200, 80, 0.6)');
    grad.addColorStop(0.8, 'rgba(255, 100, 30, 0.2)');
    grad.addColorStop(1, 'rgba(255, 80, 20, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    // 4 道光芒
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const len = 28;
        const sx = 32 + Math.cos(angle) * 4;
        const sy = 32 + Math.sin(angle) * 4;
        const ex = 32 + Math.cos(angle) * len;
        const ey = 32 + Math.sin(angle) * len;
        const lineGrad = ctx.createLinearGradient(sx, sy, ex, ey);
        lineGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        lineGrad.addColorStop(1, 'rgba(255, 200, 100, 0)');
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
    }

    _sparkTex = new THREE.CanvasTexture(canvas);
    _sparkTex.colorSpace = THREE.SRGBColorSpace;
    return _sparkTex;
}

/**
 * 粒子配置模板
 */
const PARTICLE_CONFIGS = {
    [PARTICLE_TYPE.RIPPLE]: {
        count: 1,
        lifetime: 0.7,
        size: 2.5,
        speed: 3.0,
        color: 0xffffff,
        opacity: 0.7,
        gravity: 0,
        additive: false,
        rotation: false,
    },
    [PARTICLE_TYPE.WOOD_SHARDS]: {
        count: 10,
        lifetime: 1.2,
        size: 0.1,
        speed: 4.5,
        color: 0x8b5a2b,
        opacity: 1.0,
        gravity: -8.0,
        airResistance: 0.5,
        additive: false,
        rotation: true,
    },
    [PARTICLE_TYPE.SPARKS]: {
        count: 16,
        lifetime: 0.9,
        size: 0.18,
        speed: 7.0,
        color: 0xffaa33,
        opacity: 1.0,
        gravity: -5.0,
        airResistance: 0.8,
        additive: true,
        rotation: false,
    },
    [PARTICLE_TYPE.DUST]: {
        count: 12,
        lifetime: 1.4,
        size: 0.22,
        speed: 2.0,
        color: 0xc0b8a8,
        opacity: 0.5,
        gravity: -1.0,
        airResistance: 0.3,
        additive: false,
        rotation: false,
    },
    [PARTICLE_TYPE.SMOKE]: {
        count: 8,
        lifetime: 1.8,
        size: 0.35,
        speed: 1.0,
        color: 0x888888,
        opacity: 0.4,
        gravity: 1.0,  // 烟雾向上飘
        airResistance: 0.2,
        additive: false,
        rotation: false,
    },
    [PARTICLE_TYPE.PAPER_BITS]: {
        count: 14,
        lifetime: 1.6,
        size: 0.12,
        speed: 3.0,
        color: 0xf4ead8,
        opacity: 0.9,
        gravity: -3.0,
        airResistance: 1.2,  // 纸片空气阻力大
        additive: false,
        rotation: true,
    },
    [PARTICLE_TYPE.GLOW]: {
        count: 6,
        lifetime: 1.0,
        size: 0.4,
        speed: 1.5,
        color: 0x00ff88,
        opacity: 0.8,
        gravity: 0,
        airResistance: 0.3,
        additive: true,
        rotation: false,
    },
};

/**
 * 单个粒子系统实例
 */
class ParticleBatch {
    /**
     * @param {THREE.Scene} scene
     * @param {object} config
     * @param {THREE.Vector3} position
     * @param {THREE.Vector3} [direction]
     */
    constructor(scene, config, position, direction = new THREE.Vector3(0, 1, 0)) {
        this.scene = scene;
        this.config = config;
        this.particles = [];
        this.alive = true;

        // 选用纹理（火星/光晕用特殊纹理，其他用软圆）
        const tex = config.additive
            ? (config.type === PARTICLE_TYPE.SPARKS ? getSparkTexture() : getSoftCircleTexture())
            : getSoftCircleTexture();

        const geometry = new THREE.PlaneGeometry(config.size, config.size);
        const material = new THREE.MeshBasicMaterial({
            color: config.color,
            map: tex,
            transparent: true,
            opacity: config.opacity,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: config.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
        });

        this.mesh = new THREE.InstancedMesh(geometry, material, config.count);
        this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this._instanceColors = new Float32Array(config.count * 3);
        this.mesh.instanceColor = new THREE.InstancedBufferAttribute(this._instanceColors, 3);

        // 初始化粒子
        const dummy = new THREE.Object3D();
        const baseColor = new THREE.Color(config.color);
        for (let i = 0; i < config.count; i++) {
            const t = i / config.count;
            const angle = (Math.PI * 2 * t) + (Math.random() - 0.5) * 0.5;
            const spread = direction.clone();
            const perp = new THREE.Vector3(-spread.z, 0, spread.x).normalize();
            const up = new THREE.Vector3(0, 1, 0);

            // 主要沿方向散开 + 一些向上分量
            const upComponent = up.dot(direction) > 0.5
                ? Math.random() * config.speed * 0.6
                : Math.random() * config.speed * 0.3;
            const radial = Math.cos(angle) * config.speed * (0.5 + Math.random() * 0.6);
            const tangent = Math.sin(angle) * config.speed * (0.5 + Math.random() * 0.6);

            const vel = new THREE.Vector3();
            vel.addScaledVector(spread, upComponent);
            vel.addScaledVector(perp, radial);
            vel.addScaledVector(up, tangent);

            // 颜色变化（火星从黄到红的渐变）
            let col = baseColor.clone();
            if (config.type === PARTICLE_TYPE.SPARKS) {
                col.r = 1.0;
                col.g = 0.5 + Math.random() * 0.4;
                col.b = 0.0 + Math.random() * 0.2;
            } else if (config.type === PARTICLE_TYPE.SMOKE) {
                const v = 0.6 + Math.random() * 0.3;
                col.setRGB(v, v * 0.95, v * 0.85);
            } else if (config.type === PARTICLE_TYPE.DUST) {
                const v = 0.7 + Math.random() * 0.2;
                col.setRGB(v, v * 0.9, v * 0.75);
            } else if (config.type === PARTICLE_TYPE.PAPER_BITS) {
                col.setRGB(0.95, 0.92, 0.85);
            }
            this._instanceColors[i * 3] = col.r;
            this._instanceColors[i * 3 + 1] = col.g;
            this._instanceColors[i * 3 + 2] = col.b;

            this.particles.push({
                position: position.clone(),
                velocity: vel,
                life: config.lifetime * (0.6 + Math.random() * 0.5),
                maxLife: config.lifetime,
                angle,
                scale: 0.6 + Math.random() * 0.8,
                rotSpeed: config.rotation ? (Math.random() - 0.5) * 8 : 0,
                rot: Math.random() * Math.PI * 2,
            });

            dummy.position.copy(position);
            dummy.scale.setScalar(0.001);
            dummy.updateMatrix();
            this.mesh.setMatrixAt(i, dummy.matrix);
        }
        this.mesh.instanceMatrix.needsUpdate = true;
        if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
        scene.add(this.mesh);
    }

    /**
     * @param {number} dt
     * @returns {boolean} 是否已消亡
     */
    update(dt) {
        const dummy = new THREE.Object3D();
        let allDead = true;
        const cam = this.scene.userData.camera;
        const camPos = cam ? cam.position : new THREE.Vector3(0, 0, 0);

        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            p.life -= dt;
            if (p.life <= 0) {
                dummy.position.copy(p.position);
                dummy.scale.setScalar(0.001);
                dummy.updateMatrix();
                this.mesh.setMatrixAt(i, dummy.matrix);
                continue;
            }

            allDead = false;
            const progress = 1 - p.life / p.maxLife;

            // 更新位置 + 重力
            p.position.addScaledVector(p.velocity, dt);
            if (this.config.gravity !== 0) {
                p.velocity.y += this.config.gravity * dt;
            }
            // 空气阻力
            if (this.config.airResistance) {
                const drag = 1 - this.config.airResistance * dt;
                p.velocity.multiplyScalar(Math.max(0, drag));
            }

            // 缩放变化
            let scale = p.scale;
            if (this.config.type === PARTICLE_TYPE.RIPPLE) {
                // 波纹快速扩散
                scale = p.scale * (1 + progress * 6);
            } else if (this.config.additive) {
                // 火星/光晕：先增长后衰减
                scale = p.scale * (1 - progress) * (0.5 + Math.sin(progress * Math.PI) * 0.5);
            } else {
                // 普通粒子：缓慢增长后衰减
                scale = p.scale * (0.4 + (1 - progress) * 0.6);
            }

            // 旋转
            if (this.config.rotation) {
                p.rot += p.rotSpeed * dt;
            }

            dummy.position.copy(p.position);
            // 始终朝向相机（billboard）
            if (cam) {
                dummy.lookAt(camPos);
            } else {
                dummy.lookAt(p.position.clone().add(new THREE.Vector3(0, 0, 1)));
            }
            if (this.config.rotation) {
                dummy.rotateZ(p.rot);
            }
            dummy.scale.setScalar(scale);
            dummy.updateMatrix();
            this.mesh.setMatrixAt(i, dummy.matrix);
        }

        this.mesh.instanceMatrix.needsUpdate = true;

        // 渐变整体透明度（避免硬性消失）
        if (this.mesh.material) {
            // 让着色器做平滑淡出
        }

        return allDead;
    }

    dispose() {
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
    }
}

/**
 * 粒子管理器 — 单例
 */
export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.batches = [];
    }

    /**
     * 发射粒子
     * @param {PARTICLE_TYPE} type
     * @param {THREE.Vector3} position
     * @param {THREE.Vector3} [direction]
     * @returns {ParticleBatch}
     */
    emit(type, position, direction = new THREE.Vector3(0, 1, 0)) {
        const config = Object.assign({}, PARTICLE_CONFIGS[type]);
        config.type = type;
        const batch = new ParticleBatch(this.scene, config, position, direction);
        this.batches.push(batch);
        return batch;
    }

    /**
     * 撞击波纹
     */
    emitRipple(position) {
        return this.emit(PARTICLE_TYPE.RIPPLE, position, new THREE.Vector3(0, 0, 1));
    }

    /**
     * 木屑
     */
    emitWoodShards(position) {
        return this.emit(PARTICLE_TYPE.WOOD_SHARDS, position, new THREE.Vector3(0, 0.3, 0));
    }

    /**
     * 火星
     */
    emitSparks(position) {
        return this.emit(PARTICLE_TYPE.SPARKS, position, new THREE.Vector3(0, 0.5, 0));
    }

    /**
     * 尘土
     */
    emitDust(position) {
        return this.emit(PARTICLE_TYPE.DUST, position, new THREE.Vector3(0, 0.2, 0));
    }

    /**
     * 烟雾
     */
    emitSmoke(position) {
        return this.emit(PARTICLE_TYPE.SMOKE, position, new THREE.Vector3(0, 1, 0));
    }

    /**
     * 纸屑
     */
    emitPaperBits(position) {
        return this.emit(PARTICLE_TYPE.PAPER_BITS, position, new THREE.Vector3(0, 0.5, 0));
    }

    /**
     * 光晕（终点到达等）
     */
    emitGlow(position) {
        return this.emit(PARTICLE_TYPE.GLOW, position, new THREE.Vector3(0, 1, 0));
    }

    /**
     * 更新所有粒子批次
     * @param {number} dt
     * @param {THREE.Camera} [camera]
     */
    update(dt, camera) {
        if (camera) {
            this.scene.userData.camera = camera;
        }
        for (let i = this.batches.length - 1; i >= 0; i--) {
            if (this.batches[i].update(dt)) {
                this.batches[i].dispose();
                this.batches.splice(i, 1);
            }
        }
    }

    /**
     * 清理全部粒子
     */
    clear() {
        for (const batch of this.batches) {
            batch.dispose();
        }
        this.batches = [];
    }
}
