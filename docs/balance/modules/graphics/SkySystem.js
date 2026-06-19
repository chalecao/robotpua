/**
 * @file SkySystem.js
 * @description 天空与云层系统：使用渐变天空球 + 多层体积感云朵，
 *              配合柔和的光晕，营造真实高空氛围。
 * @module graphics/SkySystem
 */

import * as THREE from 'https://robotpua.com/cs/lib/three.module.js';

export class SkySystem {
    /**
     * @param {THREE.Scene} scene
     */
    constructor(scene) {
        this.scene = scene;
        this.cloudGroups = [];
        this.time = 0;

        this._createSkyDome();
        this._createSun();
        this._createClouds();
    }

    /**
     * 创建渐变天空球 — 顶点颜色插值模拟天顶到地平线的渐变
     */
    _createSkyDome() {
        const skyGeo = new THREE.SphereGeometry(500, 32, 16);
        // 自定义顶点颜色
        const colors = [];
        const positions = skyGeo.attributes.position;
        const topColor = new THREE.Color(0x3a6fb0);      // 顶天深蓝
        const midColor = new THREE.Color(0x7ba8d4);      // 中天浅蓝
        const horizonColor = new THREE.Color(0xe8d8c0);  // 地平线暖白
        const groundColor = new THREE.Color(0x8a7060);   // 远景地

        for (let i = 0; i < positions.count; i++) {
            const y = positions.getY(i);
            const r = 500;
            const t = Math.max(0, Math.min(1, (y + r) / (2 * r)));
            let c;
            if (t < 0.45) {
                // 下半部分：地平线 → 中天
                const k = t / 0.45;
                c = horizonColor.clone().lerp(midColor, k);
            } else if (t < 0.7) {
                // 中天 → 顶天
                const k = (t - 0.45) / 0.25;
                c = midColor.clone().lerp(topColor, k);
            } else {
                // 顶天以上
                c = topColor.clone();
            }
            colors.push(c.r, c.g, c.b);
        }
        skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const skyMat = new THREE.MeshBasicMaterial({
            side: THREE.BackSide,
            vertexColors: true,
            fog: false,
            depthWrite: false,
        });
        this.skyDome = new THREE.Mesh(skyGeo, skyMat);
        this.skyDome.renderOrder = -1;
        this.scene.add(this.skyDome);
    }

    /**
     * 创建太阳 — 柔光光晕
     */
    _createSun() {
        // 太阳核心
        const sunGeo = new THREE.SphereGeometry(8, 16, 16);
        const sunMat = new THREE.MeshBasicMaterial({
            color: 0xfff8e0,
            transparent: true,
            opacity: 0.95,
            fog: false,
            depthWrite: false,
        });
        this.sun = new THREE.Mesh(sunGeo, sunMat);
        const sunDir = new THREE.Vector3(0.5, 0.5, 0.3).normalize().multiplyScalar(400);
        this.sun.position.copy(sunDir);
        this.scene.add(this.sun);

        // 太阳光晕（外圈）
        const haloGeo = new THREE.SphereGeometry(20, 16, 16);
        const haloMat = new THREE.MeshBasicMaterial({
            color: 0xfff0c0,
            transparent: true,
            opacity: 0.35,
            fog: false,
            depthWrite: false,
        });
        this.sunHalo = new THREE.Mesh(haloGeo, haloMat);
        this.sunHalo.position.copy(sunDir);
        this.scene.add(this.sunHalo);

        // 更外层光晕
        const outerHaloGeo = new THREE.SphereGeometry(35, 16, 16);
        const outerHaloMat = new THREE.MeshBasicMaterial({
            color: 0xffe080,
            transparent: true,
            opacity: 0.15,
            fog: false,
            depthWrite: false,
        });
        this.sunOuterHalo = new THREE.Mesh(outerHaloGeo, outerHaloMat);
        this.sunOuterHalo.position.copy(sunDir);
        this.scene.add(this.sunOuterHalo);
    }

    /**
     * 创建云层 — 多层体积感云朵
     */
    _createClouds() {
        // 4 层云朵，分布在远处作为背景
        const cloudLayers = [
            // 最远高层 — 体积感最大
            { count: 6, y: -35, spread: 350, sizeRange: [18, 28], opacity: 0.2, speed: 0.06 },
            // 中高层
            { count: 8, y: -25, spread: 280, sizeRange: [12, 20], opacity: 0.32, speed: 0.1 },
            // 中低层
            { count: 10, y: -18, spread: 220, sizeRange: [8, 14], opacity: 0.45, speed: 0.18 },
            // 最近低层
            { count: 6, y: -10, spread: 160, sizeRange: [5, 10], opacity: 0.55, speed: 0.25 },
        ];

        for (const layer of cloudLayers) {
            for (let i = 0; i < layer.count; i++) {
                const cloud = this._createCloudCluster(
                    layer.sizeRange[0] + Math.random() * (layer.sizeRange[1] - layer.sizeRange[0]),
                    layer.opacity
                );
                cloud.position.set(
                    (Math.random() - 0.5) * layer.spread,
                    layer.y + (Math.random() - 0.5) * 4,
                    (Math.random() - 0.5) * layer.spread
                );
                this.scene.add(cloud);
                this.cloudGroups.push({
                    group: cloud,
                    speed: layer.speed * (0.7 + Math.random() * 0.6),
                    spread: layer.spread,
                });
            }
        }
    }

    /**
     * 创建单个云朵簇 — 多个不规则球体叠加
     * @param {number} size
     * @param {number} baseOpacity
     * @returns {THREE.Group}
     */
    _createCloudCluster(size, baseOpacity) {
        const group = new THREE.Group();
        const puffCount = 6 + Math.floor(Math.random() * 6);

        for (let i = 0; i < puffCount; i++) {
            const puffSize = size * (0.3 + Math.random() * 0.5);
            const geo = new THREE.SphereGeometry(puffSize, 10, 8);
            // 顶部稍亮，底部稍暗（模拟光照）
            const brightness = 0.88 + Math.random() * 0.12;
            const tint = brightness + Math.random() * 0.04;
            const mat = new THREE.MeshBasicMaterial({
                color: new THREE.Color(tint, tint, tint + 0.04),
                transparent: true,
                opacity: baseOpacity * (0.6 + Math.random() * 0.4),
                depthWrite: false,
                fog: false,
            });
            const puff = new THREE.Mesh(geo, mat);
            const angle = (i / puffCount) * Math.PI * 2 + Math.random() * 0.5;
            const dist = size * (0.2 + Math.random() * 0.5);
            puff.position.set(
                Math.cos(angle) * dist + (Math.random() - 0.5) * size * 0.3,
                (Math.random() - 0.5) * size * 0.2,
                Math.sin(angle) * dist + (Math.random() - 0.5) * size * 0.3
            );
            puff.scale.y = 0.35 + Math.random() * 0.2;
            puff.scale.x = 0.9 + Math.random() * 0.3;
            group.add(puff);
        }
        return group;
    }

    /**
     * 更新云层位置 + 太阳视差
     * @param {number} dt
     * @param {THREE.Camera} camera
     */
    update(dt, camera) {
        this.time += dt;

        // 太阳跟随相机（保持远景效果）
        if (camera) {
            const sunDir = new THREE.Vector3(0.5, 0.5, 0.3).normalize().multiplyScalar(400);
            this.sun.position.copy(camera.position).add(sunDir);
            this.sunHalo.position.copy(this.sun.position);
            this.sunOuterHalo.position.copy(this.sun.position);
        }

        // 太阳光晕呼吸效果
        if (this.sunHalo) {
            const breath = 1 + Math.sin(this.time * 0.5) * 0.05;
            this.sunHalo.scale.setScalar(breath);
        }

        // 云层缓慢水平漂移
        for (const cloud of this.cloudGroups) {
            cloud.group.position.x += cloud.speed * dt;
            if (cloud.group.position.x > cloud.spread * 0.5) {
                cloud.group.position.x = -cloud.spread * 0.5;
            }
        }

        // 天空球跟随相机（玩家移动时不会看到边缘）
        if (camera && this.skyDome) {
            this.skyDome.position.copy(camera.position);
        }
    }

    /**
     * 销毁资源
     */
    dispose() {
        if (this.skyDome) {
            this.scene.remove(this.skyDome);
            this.skyDome.geometry.dispose();
            this.skyDome.material.dispose();
        }
        if (this.sun) {
            this.scene.remove(this.sun);
            this.sun.geometry.dispose();
            this.sun.material.dispose();
        }
        if (this.sunHalo) {
            this.scene.remove(this.sunHalo);
            this.sunHalo.geometry.dispose();
            this.sunHalo.material.dispose();
        }
        if (this.sunOuterHalo) {
            this.scene.remove(this.sunOuterHalo);
            this.sunOuterHalo.geometry.dispose();
            this.sunOuterHalo.material.dispose();
        }
        for (const cloud of this.cloudGroups) {
            cloud.group.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            this.scene.remove(cloud.group);
        }
    }
}
