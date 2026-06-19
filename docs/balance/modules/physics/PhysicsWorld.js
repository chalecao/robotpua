/**
 * @file PhysicsWorld.js
 * @description 自定义物理世界：基于运动学和 Raycaster 的碰撞检测系统，模拟重力、推力、摩擦力和弹跳。
 * @module physics/PhysicsWorld
 */

import * as THREE from 'https://robotpua.com/cs/lib/three.module.js';

export class PhysicsWorld {
    constructor(scene) {
        this.scene = scene;
        this.gravity = new THREE.Vector3(0, -20, 0);
        this.raycaster = new THREE.Raycaster();
        this.colliders = [];      // 静态碰撞体列表
        this.movingPlatforms = []; // 移动平台列表
        this.windZones = [];       // 风力区域
        this.magnetZones = [];     // 磁力区域
        this.brittleObjects = [];  // 脆弱物体
    }

    /**
     * 添加静态碰撞体
     * @param {THREE.Mesh} mesh 
     */
    addCollider(mesh) {
        if (!mesh.userData.physicsBody) {
            mesh.userData.physicsBody = true;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.colliders.push(mesh);
        }
    }

    /**
     * 添加移动平台
     * @param {THREE.Mesh} mesh 
     * @param {THREE.Vector3} range - 移动范围
     * @param {number} speed - 移动速度
     */
    addMovingPlatform(mesh, range, speed = 1) {
        this.addCollider(mesh);
        this.movingPlatforms.push({
            mesh, range: range.clone(), speed,
            origin: mesh.position.clone(),
            time: Math.random() * Math.PI * 2
        });
    }

    /**
     * 添加风力区域
     * @param {THREE.Vector3} position 
     * @param {THREE.Vector3} direction 
     * @param {number} strength 
     * @param {number} radius 
     */
    addWindZone(position, direction, strength, radius) {
        this.windZones.push({ position: position.clone(), direction: direction.clone().normalize(), strength, radius });
    }

    /**
     * 添加磁力区域
     * @param {THREE.Vector3} position 
     * @param {number} strength 
     * @param {number} radius 
     */
    addMagnetZone(position, strength, radius) {
        this.magnetZones.push({ position: position.clone(), strength, radius });
    }

    /**
     * 添加脆弱物体（可被铁球压碎）
     * @param {THREE.Mesh} mesh 
     */
    addBrittleObject(mesh) {
        this.brittleObjects.push(mesh);
        this.addCollider(mesh);
    }

    /**
     * 更新移动平台位置
     * @param {number} dt 
     */
    updatePlatforms(dt) {
        for (const plat of this.movingPlatforms) {
            plat.time += dt * plat.speed;
            const t = (Math.sin(plat.time) + 1) / 2; // 0~1 正弦往复
            plat.mesh.position.x = plat.origin.x + plat.range.x * t;
            plat.mesh.position.y = plat.origin.y + plat.range.y * t;
            plat.mesh.position.z = plat.origin.z + plat.range.z * t;
        }
    }

    /**
     * 检测球与轨道的碰撞
     * @param {THREE.Mesh} ball
     * @param {THREE.Vector3} velocity
     * @param {object} params - 物理参数
     * @returns {{ onGround: boolean, groundNormal: THREE.Vector3, groundY: number, windForce: THREE.Vector3, magnetForce: THREE.Vector3, sideCollision: boolean, sideNormal: THREE.Vector3 }}
     */
    checkCollision(ball, velocity, params) {
        const pos = ball.position.clone();
        const r = params.radius || 0.5;
        const downDir = new THREE.Vector3(0, -1, 0);

        // 向下射线检测地面/轨道
        this.raycaster.set(pos, downDir);
        this.raycaster.far = r + 3.0;
        const intersects = this.raycaster.intersectObjects(this.colliders, false);

        let onGround = false;
        let groundNormal = new THREE.Vector3(0, 1, 0);
        let groundY = Infinity;

        if (intersects.length > 0) {
            const hit = intersects[0];
            if (hit.distance <= r + 0.5) {
                onGround = true;
                if (hit.face) {
                    const normalMatrix = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
                    groundNormal.copy(hit.face.normal).applyMatrix3(normalMatrix).normalize();
                } else {
                    groundNormal.set(0, 1, 0).applyQuaternion(hit.object.quaternion).normalize();
                }
                groundY = hit.point.y;
            }
        }

        // 侧向碰撞检测 — 只检测高度接近球心的碰撞体，忽略远处装饰物
        let sideCollision = false;
        let sideNormal = new THREE.Vector3(0, 0, 0);
        const sideThreshold = r + 0.15;

        for (const collider of this.colliders) {
            if (!collider.visible) continue;
            // 跳过装饰物（如背景支柱）
            if (collider.userData.skipCollision) continue;
            const box = new THREE.Box3().setFromObject(collider);

            // 只检测高度接近球的位置的碰撞体（排除装饰柱等远处物体）
            const colliderTop = box.max.y;
            const colliderBottom = box.min.y;
            if (pos.y < colliderBottom - r - 0.5 || pos.y > colliderTop + r + 0.5) continue;

            const halfW = (box.max.x - box.min.x) / 2;
            const halfD = (box.max.z - box.min.z) / 2;
            const cx = (box.max.x + box.min.x) / 2;
            const cz = (box.max.z + box.min.z) / 2;

            // X 方向侧撞检测
            const dx = pos.x - cx;
            if (Math.abs(dx) > halfW - sideThreshold && Math.abs(dx) < halfW + sideThreshold * 2) {
                const zInRange = pos.z >= box.min.z - r && pos.z <= box.max.z + r;
                if (zInRange) {
                    sideCollision = true;
                    sideNormal.set(-Math.sign(dx), 0, 0);
                }
            }
            // Z 方向侧撞检测（仅在 X 方向未触发时）
            if (!sideCollision) {
                const dz = pos.z - cz;
                if (Math.abs(dz) > halfD - sideThreshold && Math.abs(dz) < halfD + sideThreshold * 2) {
                    const xInRange = pos.x >= box.min.x - r && pos.x <= box.max.x + r;
                    if (xInRange) {
                        sideCollision = true;
                        sideNormal.set(0, 0, -Math.sign(dz));
                    }
                }
            }
        }

        // 风力效果
        const windForce = new THREE.Vector3(0, 0, 0);
        for (const zone of this.windZones) {
            const dist = pos.distanceTo(zone.position);
            if (dist < zone.radius) {
                const factor = 1 - dist / zone.radius;
                windForce.addScaledVector(zone.direction, zone.strength * factor * params.windMultiplier);
            }
        }

        // 磁力效果
        const magnetForce = new THREE.Vector3(0, 0, 0);
        for (const zone of this.magnetZones) {
            const dist = pos.distanceTo(zone.position);
            if (dist < zone.radius) {
                const dir = zone.position.clone().sub(pos).normalize();
                const factor = 1 - dist / zone.radius;
                magnetForce.addScaledVector(dir, zone.strength * factor * 0.5);
            }
        }

        return {
            onGround,
            groundNormal,
            groundY,
            windForce,
            magnetForce,
            sideCollision,
            sideNormal
        };
    }

    /**
     * 检查球是否进入脆弱物体范围（触发碎裂）
     * @param {THREE.Mesh} ball 
     * @param {object} params 
     * @returns {THREE.Mesh|null} 碎裂的物体
     */
    checkBrittleDamage(ball, params) {
        if (params.mass < 2.0) return null; // 只有铁球能压碎
        for (const obj of this.brittleObjects) {
            if (!obj.visible) continue;
            const dist = ball.position.distanceTo(obj.position);
            if (dist < (params.radius || 0.5) + 1.0) {
                obj.visible = false;
                obj.userData.destroyed = true;
                return obj;
            }
        }
        return null;
    }

    /**
     * 检查是否到达终点
     * @param {THREE.Mesh} ball 
     * @returns {boolean}
     */
    checkFinish(ball) {
        if (!ball.userData.finishZone) return false;
        const fz = ball.userData.finishZone;
        // finishZone 可能是 mesh（有 position）或包含 position 的对象
        const targetPos = fz.position || fz;
        const dist = ball.position.distanceTo(targetPos);
        // 同时检查高度差，确保球确实落在终点平面上
        if (fz.mesh) {
            const heightDiff = Math.abs(ball.position.y - fz.mesh.position.y);
            return dist < 1.5 && heightDiff < 2.0;
        }
        return dist < 1.5;
    }

    /**
     * 更新物理状态
     * @param {THREE.Mesh} ball
     * @param {THREE.Vector3} velocity
     * @param {object} params
     * @param {THREE.Vector3} inputForce - 玩家输入力
     * @param {number} [dt] - 实际时间步长
     * @returns {{ velocity: THREE.Vector3, onGround: boolean }}
     */
    update(ball, velocity, params, inputForce, dt = 1 / 60) {
        const fixedDt = Math.min(dt, 0.033); // cap at ~30fps minimum

        // 重力
        velocity.addScaledVector(this.gravity, fixedDt);

        // 空气阻力
        velocity.multiplyScalar(Math.pow(1 - params.airResistance, fixedDt * 60));

        // 碰撞检测（在应用力之前获取初始状态）
        const collisionInfo = this.checkCollision(ball, velocity, params);

        // 地面静止防抖：贴地且向下速度很小时，直接清零 y 速度，
        // 避免重力逐帧累积导致球在地面微抖动（这是滚动音效滋滋声的源头之一）
        if (collisionInfo.onGround && velocity.y < 0 && velocity.y > -1.5) {
            velocity.y = 0;
        }

        // 风力
        velocity.addScaledVector(collisionInfo.windForce, fixedDt);

        // 磁力
        if (params.mass >= 2.0) {
            velocity.addScaledVector(collisionInfo.magnetForce, fixedDt);
        }

        // 玩家输入力
        if (inputForce) {
            velocity.addScaledVector(inputForce, fixedDt * params.controlForce / params.mass);
        }

        // 速度限制
        const speed = velocity.length();
        if (speed > params.maxSpeed) {
            velocity.normalize().multiplyScalar(params.maxSpeed);
        }

        // 暂存碰撞前速度用于碰撞响应
        const preVelocity = velocity.clone();

        // 移动球体
        ball.position.addScaledVector(velocity, fixedDt);

        // 重新检测碰撞（位置已改变）
        const updatedCollision = this.checkCollision(ball, velocity, params);

        // 地面碰撞响应 — 防止穿透
        if (updatedCollision.onGround && velocity.y < 0) {
            ball.position.y = updatedCollision.groundY + params.radius + 0.01;
            const dot = velocity.dot(updatedCollision.groundNormal);
            if (dot < -0.1) {
                // 反弹
                velocity.addScaledVector(updatedCollision.groundNormal, -dot * params.restitution);
                // 水平摩擦力
                const horizontalVel = new THREE.Vector3(velocity.x, 0, velocity.z);
                horizontalVel.multiplyScalar(params.friction);
                velocity.x = horizontalVel.x;
                velocity.z = horizontalVel.z;
            }
        } else if (updatedCollision.onGround && !collisionInfo.onGround) {
            // 新落地的情况：确保 y 速度不会过大
            if (velocity.y < 0) {
                velocity.y = 0;
            }
        }

        // 侧向碰撞响应 — 推回轨道内
        if (updatedCollision.sideCollision && updatedCollision.sideNormal.lengthSq() > 0.01) {
            const sideDot = velocity.dot(updatedCollision.sideNormal);
            if (sideDot < 0) {
                velocity.addScaledVector(updatedCollision.sideNormal, -sideDot * params.restitution * 0.3);
                // 将球推回安全区域
                ball.position.addScaledVector(updatedCollision.sideNormal, 0.02);
            }
        }

        // 脆弱物体检测
        this.checkBrittleDamage(ball, params);

        return { velocity, onGround: updatedCollision.onGround };
    }
}
