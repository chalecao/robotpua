/**
 * @file Level.js
 * @description 关卡加载器：管理关卡场景构建、轨道生成、机关布置和终点检测。
 * @module entities/Level
 */

import * as THREE from 'https://robotpua.com/cs/lib/three.module.js';

/**
 * 关卡数据结构
 */
export class Level {
    constructor(scene, physicsWorld, assets) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.assets = assets;
        this.objects = [];       // 关卡中所有可碰撞对象
        this.finishZone = null;  // 终点光圈
        this.startPoint = new THREE.Vector3(0, 3, 0);
        this.levelName = '';
    }

    /**
     * 清空当前关卡
     */
    clear() {
        for (const obj of this.objects) {
            this.scene.remove(obj);
            // 只 dispose 克隆的材质（clone 的），共享材质不归 Level 管
            if (obj.material && obj.material.isClone) {
                obj.material.dispose();
            }
            if (obj.geometry && !obj.geometry.isSharedGeometry) {
                obj.geometry.dispose();
            }
        }
        this.objects = [];
        this.physicsWorld.colliders = [];
        this.physicsWorld.movingPlatforms = [];
        this.physicsWorld.windZones = [];
        this.physicsWorld.magnetZones = [];
        this.physicsWorld.brittleObjects = [];
        this.finishZone = null;
    }

    /**
     * 创建轨道段
     * @param {object} options
     * @param {number} options.width - 轨道宽度
     * @param {number} options.length - 轨道长度
     * @param {number} options.x - X 位置
     * @param {number} options.y - Y 位置
     * @param {number} options.z - Z 位置
     * @param {string} [options.material='concrete'] - 材质名
     * @param {boolean} [options.isBrittle=false] - 是否脆弱
     * @returns {THREE.Mesh}
     */
    createTrack({ width, length, x, y, z, material = 'concrete', isBrittle = false }) {
        const geo = this.assets.getBox(width, 0.3, length);
        const mat = this.assets.getMat(material);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        this.physicsWorld.addCollider(mesh);
        this.objects.push(mesh);
        if (isBrittle) {
            this.physicsWorld.addBrittleObject(mesh);
        }
        return mesh;
    }

    /**
     * 创建轨道边缘护栏
     * @param {object} options
     * @param {number} options.trackLength - 关联轨道长度
     * @param {number} options.x
     * @param {number} options.y
     * @param {number} options.z
     * @param {number} [options.height=0.5]
     */
    createGuardrail({ trackLength, x, y, z, height = 0.5 }) {
        const geo = this.assets.getBox(0.12, height, trackLength);
        const mat = this.assets.getMat('metal');
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        this.physicsWorld.addCollider(mesh);
        this.objects.push(mesh);

        // 护栏顶部发光条
        const glowGeo = this.assets.getBox(0.04, 0.04, trackLength);
        const glowMat = this.assets.getMat('glowEdge');
        const glowStrip = new THREE.Mesh(glowGeo, glowMat);
        glowStrip.position.set(x, y + height * 0.5 + 0.02, z);
        glowStrip.userData.skipCollision = true;
        this.scene.add(glowStrip);
        this.objects.push(glowStrip);

        return mesh;
    }

    /**
     * 创建起点标记
     * @param {THREE.Vector3} position
     */
    createStartMarker(position) {
        const geo = this.assets.getRing(0.3, 0.5, 32);
        const mat = this.assets.getMat('guideLine').clone();
        mat.isClone = true;
        mat.emissiveIntensity = 1.0;
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(position);
        mesh.rotation.x = -Math.PI / 2;
        this.scene.add(mesh);
        this.objects.push(mesh);
        return mesh;
    }

    /**
     * 创建终点光圈
     * @param {THREE.Vector3} position
     * @returns {THREE.Mesh}
     */
    createFinishZone(position) {
        const geo = new THREE.TorusGeometry(1.2, 0.1, 16, 64);
        const mat = this.assets.getMat('finishGlow').clone();
        mat.isClone = true;
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(position);
        mesh.rotation.x = -Math.PI / 2;
        this.scene.add(mesh);
        this.objects.push(mesh);

        // 终点光柱
        const pillarGeo = new THREE.CylinderGeometry(1.0, 1.0, 8, 32, 1, true);
        const pillarMat = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.08,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.copy(position);
        pillar.position.y += 4;
        this.scene.add(pillar);
        this.objects.push(pillar);

        this.finishZone = { position: position.clone(), mesh, pillar };
        return this.finishZone;
    }

    /**
     * 创建移动平台
     * @param {object} options
     * @param {number} options.width
     * @param {number} options.height
     * @param {number} options.depth
     * @param {number} options.x
     * @param {number} options.y
     * @param {number} options.z
     * @param {THREE.Vector3} options.range - 移动范围
     * @param {number} [options.speed=1]
     * @returns {THREE.Mesh}
     */
    createMovingPlatform({ width, height, depth, x, y, z, range, speed = 1 }) {
        const geo = this.assets.getBox(width, height, depth);
        const mat = this.assets.getMat('metal').clone();
        mat.isClone = true;
        mat.color.setHex(0x99aabb);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        this.physicsWorld.addMovingPlatform(mesh, range, speed);
        this.objects.push(mesh);
        return mesh;
    }

    /**
     * 创建风扇装置
     * @param {THREE.Vector3} position
     * @param {THREE.Vector3} direction
     * @param {number} strength
     * @param {number} radius
     */
    createFan(position, direction, strength, radius) {
        // 视觉表示
        const geo = new THREE.CylinderGeometry(0.6, 0.6, 0.2, 32);
        const mat = this.assets.getMat('fan').clone();
        mat.isClone = true;
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(position);
        mesh.lookAt(position.clone().add(direction));
        mesh.rotateX(Math.PI / 2);
        this.scene.add(mesh);
        this.objects.push(mesh);

        // 物理效果
        this.physicsWorld.addWindZone(position, direction, strength, radius);
    }

    /**
     * 创建磁铁装置
     * @param {THREE.Vector3} position
     * @param {number} strength
     * @param {number} radius
     */
    createMagnet(position, strength, radius) {
        const geo = new THREE.OctahedronGeometry(0.5, 0);
        const mat = this.assets.getMat('magnet').clone();
        mat.isClone = true;
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(position);
        mesh.castShadow = true;
        this.scene.add(mesh);
        this.objects.push(mesh);

        this.physicsWorld.addMagnetZone(position, strength, radius);
    }

    /**
     * 创建装饰性支柱（背景元素）
     * 不参与碰撞检测，仅用于视觉装饰。
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {number} height
     */
    createPillar(x, y, z, height) {
        const geo = this.assets.getBox(0.5, height, 0.5);
        const mat = this.assets.getMat('concrete');
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.skipCollision = true; // 标记为装饰物，碰撞检测跳过
        this.scene.add(mesh);
        this.objects.push(mesh);
        return mesh;
    }

    /**
     * 添加三点布光 — 真实色温（暖阳 + 冷天光 + 反射环境）
     */
    setupLighting() {
        // 微弱环境光 — 避免纯黑阴影
        const ambient = new THREE.AmbientLight(0xa8b8cc, 0.4);
        this.scene.add(ambient);

        // 半球光 — 模拟天光（蓝）+ 地面反射（暖）
        const hemiLight = new THREE.HemisphereLight(0xa8c8e8, 0x8a7050, 0.7);
        this.scene.add(hemiLight);

        // 主光 — 暖色阳光（约 5800K → 0xfff5e0），强方向光
        const keyLight = new THREE.DirectionalLight(0xfff5e0, 2.5);
        keyLight.position.set(20, 30, 15);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        keyLight.shadow.camera.near = 0.5;
        keyLight.shadow.camera.far = 120;
        keyLight.shadow.camera.left = -60;
        keyLight.shadow.camera.right = 60;
        keyLight.shadow.camera.top = 60;
        keyLight.shadow.camera.bottom = -60;
        keyLight.shadow.bias = -0.0005;
        keyLight.shadow.normalBias = 0.02;
        keyLight.shadow.radius = 4;  // PCF 软阴影半径
        this.scene.add(keyLight);

        // 轮廓光 — 冷天光（约 7500K），增强体积感
        const rimLight = new THREE.DirectionalLight(0x8aa8d8, 0.9);
        rimLight.position.set(-20, 15, -20);
        this.scene.add(rimLight);

        // 底部补光 — 暖调（模拟地面反射）
        const fillLight = new THREE.DirectionalLight(0xc89060, 0.3);
        fillLight.position.set(0, -10, 8);
        this.scene.add(fillLight);

        // 额外补光 — 消除暗角 + 高光反射
        const extraFill = new THREE.PointLight(0xfff0e0, 0.5, 100);
        extraFill.position.set(0, 8, 0);
        this.scene.add(extraFill);
    }
}
