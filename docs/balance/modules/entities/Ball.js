/**
 * @file Ball.js
 * @description 球体基类：封装 Three.js Mesh、物理参数、视觉反馈和状态管理。
 * @module entities/Ball
 */

import * as THREE from 'https://robotpua.com/cs/lib/three.module.js';
import { getPhysicsParams } from '../physics/Materials.js';
import { createBallMaterial } from '../graphics/Materials.js';

/**
 * 球体状态枚举
 */
export const BALL_STATE = {
    IDLE: 'idle',
    MOVING: 'moving',
    FALLING: 'falling',
    SWITCHING_OUT: 'switching_out',
    SWITCHING_IN: 'switching_in',
};

/**
 * 球体基类
 */
export class Ball {
    /**
     * @param {string} type
     * @param {THREE.Scene} scene
     * @param {THREE.Vector3} startPosition
     */
    constructor(type, scene, startPosition) {
        this.type = type;
        this.impactCooldown = 0;
        this.params = getPhysicsParams(type);
        this.state = BALL_STATE.IDLE;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.onGround = false;
        this.finished = false;

        // 几何体
        this.geometry = new THREE.SphereGeometry(this.params.radius, 32, 32);

        // 材质
        this.material = createBallMaterial(type, this.geometry, scene);

        // Mesh
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.copy(startPosition);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.userData.ballType = type;
        scene.add(this.mesh);

        // 速度线（高速拖尾）
        this.trailLine = this._createTrailLine();

        // 接触阴影（球体下方软阴影）
        this.contactShadow = this._createContactShadow();

        // 旋转动画
        this.rotationSpeed = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        );


    }

    /**
     * 创建接触阴影 — 软圆形阴影 plane，跟随球体
     * @returns {THREE.Mesh}
     */
    _createContactShadow() {
        // 生成软阴影纹理
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 60);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
        grad.addColorStop(0.4, 'rgba(0, 0, 0, 0.3)');
        grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.08)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 128, 128);
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;

        const geo = new THREE.PlaneGeometry(this.params.radius * 3.5, this.params.radius * 3.5);
        const mat = new THREE.MeshBasicMaterial({
            map: tex,
            transparent: true,
            opacity: 0.6,
            depthWrite: false,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.copy(this.mesh.position);
        mesh.position.y = -this.params.radius + 0.02;
        mesh.userData.skipCollision = true;
        mesh.renderOrder = 1;
        if (this.mesh.parent) {
            this.mesh.parent.add(mesh);
        } else {
            scene.add(mesh);
        }
        return mesh;
    }

    /**
     * 更新接触阴影位置/大小/透明度
     */
    _updateContactShadow() {
        if (!this.contactShadow) return;
        if (this.state === BALL_STATE.SWITCHING_OUT || this.state === BALL_STATE.SWITCHING_IN) {
            this.contactShadow.visible = false;
            return;
        }
        this.contactShadow.visible = true;

        // 向下射线检测地面位置
        const raycaster = new THREE.Raycaster();
        const downDir = new THREE.Vector3(0, -1, 0);
        raycaster.set(this.mesh.position, downDir);
        raycaster.far = this.params.radius + 6.0;

        // 收集所有可见的 collider（包括装饰柱外的所有碰撞体）
        const targets = [];
        if (this.mesh.parent) {
            this.mesh.parent.traverse((obj) => {
                if (obj.isMesh && obj.visible && !obj.userData.skipCollision && obj !== this.mesh && obj !== this.contactShadow) {
                    targets.push(obj);
                }
            });
        }
        const hits = raycaster.intersectObjects(targets, false);

        let groundY = -Infinity;
        let groundX = this.mesh.position.x;
        let groundZ = this.mesh.position.z;

        if (hits.length > 0) {
            const hit = hits[0];
            if (hit.distance <= this.params.radius + 5.0) {
                groundY = hit.point.y;
                groundX = hit.point.x;
                groundZ = hit.point.z;
            }
        }

        // 球离地高度（用于阴影淡化）
        let heightAboveGround = 0;
        if (groundY > -Infinity) {
            heightAboveGround = Math.max(0, this.mesh.position.y - groundY - this.params.radius);
        }
        const heightFactor = Math.min(heightAboveGround / 3.0, 1.0);
        const scaleFactor = 1.0 + heightFactor * 0.6;
        const opacityFactor = groundY > -Infinity
            ? Math.max(0.05, 1.0 - heightFactor * 0.75)
            : 0;

        this.contactShadow.position.x = groundX;
        this.contactShadow.position.z = groundZ;
        this.contactShadow.position.y = (groundY > -Infinity ? groundY : this.mesh.position.y - this.params.radius) + 0.02;
        this.contactShadow.scale.setScalar(scaleFactor);
        this.contactShadow.material.opacity = 0.6 * opacityFactor;
    }

    /**
     * 创建高速运动时的拖尾线
     * @returns {THREE.Line}
     */
    _createTrailLine() {
        const points = [];
        const maxPoints = 20;
        for (let i = 0; i < maxPoints; i++) {
            points.push(new THREE.Vector3(0, 0, 0));
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: this.params.color,
            transparent: true,
            opacity: 0.3,
            depthWrite: false,
        });
        const line = new THREE.Line(geometry, material);
        line.visible = false;
        line.userData.points = points;
        line.userData.index = 0;
        line.userData.maxPoints = maxPoints;
        this.mesh.parent.add(line);
        return line;
    }

    /**
     * 更新拖尾线位置
     */
    _updateTrail() {
        if (!this.trailLine) return;
        if (this.state === BALL_STATE.SWITCHING_OUT || this.state === BALL_STATE.SWITCHING_IN) {
            this.trailLine.visible = false;
            return;
        }

        const speed = this.velocity.length();
        this.trailLine.visible = speed > 3.0;
        if (!this.trailLine.visible) return;

        const pts = this.trailLine.userData;
        const arr = this.trailLine.geometry.attributes.position.array;
        // 移位
        for (let i = pts.maxPoints - 1; i > 0; i--) {
            arr[i * 3] = arr[(i - 1) * 3];
            arr[i * 3 + 1] = arr[(i - 1) * 3 + 1];
            arr[i * 3 + 2] = arr[(i - 1) * 3 + 2];
        }
        arr[0] = this.mesh.position.x;
        arr[1] = this.mesh.position.y;
        arr[2] = this.mesh.position.z;
        this.trailLine.geometry.attributes.position.needsUpdate = true;

        // 动态透明度
        this.trailLine.material.opacity = Math.min(speed / this.params.maxSpeed, 0.5);
        // 朝向速度反方向
        if (speed > 0.1) {
            const lookTarget = this.mesh.position.clone().sub(this.velocity.clone().normalize().multiplyScalar(10));
            this.trailLine.lookAt(lookTarget);
        }
    }

    /**
     * 设置终点区域引用
     * @param {THREE.Mesh} finishZone
     */
    setFinishZone(finishZone) {
        this.mesh.userData.finishZone = finishZone;
    }

    /**
     * 应用输入力
     * @param {THREE.Vector3} force
     */
    applyInputForce(force) {
        if (this.state === BALL_STATE.SWITCHING_OUT || this.state === BALL_STATE.SWITCHING_IN) return;
        this.velocity.addScaledVector(force, 1 / this.params.mass);
    }

    /**
     * 切换为消散状态（用于球体切换特效）
     * @param {THREE.Vector3} position
     */
    setSwitchOut() {
        this.state = BALL_STATE.SWITCHING_OUT;
        this.mesh.visible = false;
        this.trailLine.visible = false;
    }

    /**
     * 切换为出现状态
     */
    setSwitchIn() {
        this.state = BALL_STATE.SWITCHING_IN;
        this.mesh.visible = true;
        this.mesh.scale.setScalar(0.01);
    }

    /**
     * 更新球体状态
     * @param {number} dt
     */
    update(dt) {
        if (this.state === BALL_STATE.SWITCHING_IN) {
            // 渐入动画
            const s = this.mesh.scale.x + dt * 5;
            this.mesh.scale.setScalar(Math.min(s, 1.0));
            if (this.mesh.scale.x >= 1.0) {
                this.state = BALL_STATE.IDLE;
                this.mesh.scale.setScalar(1.0);
            }
            return;
        }

        if (this.state === BALL_STATE.SWITCHING_OUT) return;

        // 旋转
        if (this.onGround) {
            const speed = this.velocity.length();
            if (speed > 0.1) {
                this.mesh.rotation.x += this.velocity.z * dt * 2;
                this.mesh.rotation.z -= this.velocity.x * dt * 2;
            }
        }

        // 速度衰减（非地面）
        if (!this.onGround) {
            this.velocity.multiplyScalar(1 - 0.5 * dt);
        }

        // 注意：不在这里重置 onGround —— 由物理世界在下帧设置
        this._updateTrail();
        this._updateContactShadow();
    }

    /**
     * 销毁球体（清理场景对象和内存）
     */
    destroy() {
        try {
            if (this.mesh.parent) {
                this.mesh.parent.remove(this.mesh);
            }
            if (this.geometry) this.geometry.dispose();
            if (this.material) this.material.dispose();
            if (this.trailLine && this.trailLine.parent) {
                this.trailLine.parent.remove(this.trailLine);
                if (this.trailLine.geometry) this.trailLine.geometry.dispose();
                if (this.trailLine.material) this.trailLine.material.dispose();
            }
            if (this.contactShadow && this.contactShadow.parent) {
                this.contactShadow.parent.remove(this.contactShadow);
                if (this.contactShadow.geometry) this.contactShadow.geometry.dispose();
                if (this.contactShadow.material) {
                    if (this.contactShadow.material.map) this.contactShadow.material.map.dispose();
                    this.contactShadow.material.dispose();
                }
            }
        } catch (e) {
            console.warn('Ball destroy error:', e);
        }
    }
}
