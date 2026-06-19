/**
 * @file Assets.js
 * @description 材质与几何体资源管理器：预创建共享的几何体和 PBR 材质，
 *               包含程序化纹理以实现更精致的视觉效果。所有材质支持 IBL 环境贴图。
 * @module core/Assets
 */

import * as THREE from 'https://robotpua.com/cs/lib/three.module.js';

export class Assets {
    constructor() {
        this.geometries = {};
        this.materials = {};
        this.envMap = null;
        this._initGeometries();
        this._initMaterials();
    }

    _initGeometries() {
        this.geometries.sphere = new THREE.SphereGeometry(1, 32, 32);
        this.geometries.box = new THREE.BoxGeometry(1, 1, 1);
        this.geometries.plane = new THREE.PlaneGeometry(1, 1);
        this.geometries.cylinder = new THREE.CylinderGeometry(1, 1, 1, 32);
        this.geometries.ring = new THREE.RingGeometry(0.9, 1.1, 64);
        this.geometries.capsule = this._createCapsuleGeometry();
    }

    _createCapsuleGeometry() {
        return new THREE.CapsuleGeometry(1, 2, 16, 32);
    }

    // ===========================
    // 程序化纹理生成器（高分辨率）
    // ===========================

    /**
     * 风化混凝土纹理 — 灰白底 + 颗粒 + 裂纹 + 苔藓痕迹
     */
    _createConcreteTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // 基础灰白色
        ctx.fillStyle = '#b8b8b4';
        ctx.fillRect(0, 0, 512, 512);

        // 大块色彩变化
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const r = 60 + Math.random() * 100;
            const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
            const tone = 160 + Math.random() * 50;
            grad.addColorStop(0, `rgba(${tone}, ${tone}, ${tone + 5}, 0.3)`);
            grad.addColorStop(1, `rgba(${tone}, ${tone}, ${tone + 5}, 0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // 砂石颗粒
        for (let i = 0; i < 12000; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const gray = 150 + Math.random() * 80;
            ctx.fillStyle = `rgba(${gray}, ${gray}, ${gray - 5}, ${0.15 + Math.random() * 0.25})`;
            const size = 0.5 + Math.random() * 1.5;
            ctx.fillRect(x, y, size, size);
        }

        // 暗色颗粒（深色砂石）
        for (let i = 0; i < 2000; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const gray = 60 + Math.random() * 60;
            ctx.fillStyle = `rgba(${gray}, ${gray - 5}, ${gray - 15}, 0.5)`;
            ctx.fillRect(x, y, 1 + Math.random() * 1.5, 1 + Math.random() * 1.5);
        }

        // 风化裂纹
        for (let i = 0; i < 12; i++) {
            ctx.beginPath();
            let x = Math.random() * 512;
            let y = Math.random() * 512;
            ctx.moveTo(x, y);
            const segments = 3 + Math.floor(Math.random() * 5);
            for (let j = 0; j < segments; j++) {
                const angle = Math.random() * Math.PI * 2;
                const len = 20 + Math.random() * 50;
                x += Math.cos(angle) * len;
                y += Math.sin(angle) * len;
                ctx.lineTo(x, y);
            }
            ctx.strokeStyle = `rgba(80, 80, 75, ${0.2 + Math.random() * 0.3})`;
            ctx.lineWidth = 0.5 + Math.random() * 1;
            ctx.stroke();
        }

        // 苔藓/水渍（绿色斑点）
        for (let i = 0; i < 6; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const r = 15 + Math.random() * 30;
            const moss = ctx.createRadialGradient(x, y, 0, x, y, r);
            moss.addColorStop(0, 'rgba(80, 100, 60, 0.3)');
            moss.addColorStop(0.5, 'rgba(60, 80, 50, 0.15)');
            moss.addColorStop(1, 'rgba(60, 80, 50, 0)');
            ctx.fillStyle = moss;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // 噪点
        const imageData = ctx.getImageData(0, 0, 512, 512);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const n = (Math.random() - 0.5) * 14;
            imageData.data[i] = Math.max(0, Math.min(255, imageData.data[i] + n));
            imageData.data[i + 1] = Math.max(0, Math.min(255, imageData.data[i + 1] + n));
            imageData.data[i + 2] = Math.max(0, Math.min(255, imageData.data[i + 2] + n));
        }
        ctx.putImageData(imageData, 0, 0);

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(2, 2);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    /**
     * 混凝土粗糙度贴图
     */
    _createConcreteRoughness() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 4000; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            ctx.fillStyle = `rgba(${140 + Math.random() * 80}, 0, 0, 0.2)`;
            ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
        }
        return new THREE.CanvasTexture(canvas);
    }

    /**
     * 木板纹理 — 长条木板 + 自然木纹 + 节疤 + 钉孔
     */
    _createWoodPlankTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // 基础棕色（松木/橡木）
        ctx.fillStyle = '#a87842';
        ctx.fillRect(0, 0, 512, 512);

        // 横向木板分界线
        const plankCount = 4;
        const plankHeight = 512 / plankCount;
        for (let p = 0; p < plankCount; p++) {
            const y0 = p * plankHeight;
            // 每块木板有独立的色调
            const baseTone = 150 + Math.random() * 60;
            const r = baseTone;
            const g = baseTone * 0.7;
            const b = baseTone * 0.4;
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.4)`;
            ctx.fillRect(0, y0, 512, plankHeight);

            // 木纹（横向，沿木板方向）
            for (let i = 0; i < 25; i++) {
                const y = y0 + Math.random() * plankHeight;
                ctx.beginPath();
                ctx.moveTo(0, y);
                for (let x = 0; x < 512; x += 6) {
                    ctx.lineTo(x, y + Math.sin(x * 0.03) * 3 + (Math.random() - 0.5) * 2);
                }
                ctx.strokeStyle = `rgba(60, 35, 15, ${0.08 + Math.random() * 0.12})`;
                ctx.lineWidth = 0.5 + Math.random() * 1.2;
                ctx.stroke();
            }

            // 木节疤
            if (Math.random() > 0.4) {
                const x = 50 + Math.random() * 400;
                const y = y0 + plankHeight * 0.5;
                const kr = 5 + Math.random() * 10;
                const knot = ctx.createRadialGradient(x, y, 0, x, y, kr);
                knot.addColorStop(0, 'rgba(30, 15, 5, 0.6)');
                knot.addColorStop(0.7, 'rgba(60, 35, 15, 0.3)');
                knot.addColorStop(1, 'rgba(60, 35, 15, 0)');
                ctx.fillStyle = knot;
                ctx.beginPath();
                ctx.arc(x, y, kr, 0, Math.PI * 2);
                ctx.fill();
            }

            // 钉孔
            for (let n = 0; n < 2; n++) {
                const x = 30 + n * 450;
                const y = y0 + plankHeight * 0.5;
                ctx.fillStyle = 'rgba(20, 10, 5, 0.8)';
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
                // 钉孔高光
                ctx.fillStyle = 'rgba(180, 180, 200, 0.4)';
                ctx.beginPath();
                ctx.arc(x - 0.5, y - 0.5, 0.8, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // 板缝阴影
        for (let p = 1; p < plankCount; p++) {
            const y = p * plankHeight;
            const grad = ctx.createLinearGradient(0, y - 2, 0, y + 2);
            grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
            grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.4)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, y - 2, 512, 4);
        }

        // 噪点
        const imageData = ctx.getImageData(0, 0, 512, 512);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const n = (Math.random() - 0.5) * 12;
            imageData.data[i] = Math.max(0, Math.min(255, imageData.data[i] + n));
            imageData.data[i + 1] = Math.max(0, Math.min(255, imageData.data[i + 1] + n * 0.8));
            imageData.data[i + 2] = Math.max(0, Math.min(255, imageData.data[i + 2] + n * 0.6));
        }
        ctx.putImageData(imageData, 0, 0);

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    /**
     * 金属纹理 — 拉丝钢 + 焊接缝 + 铆钉 + 锈痕
     */
    _createMetalTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // 基础渐变（钢蓝色）
        const grad = ctx.createLinearGradient(0, 0, 512, 512);
        grad.addColorStop(0, '#8a96a4');
        grad.addColorStop(0.5, '#a0b0c0');
        grad.addColorStop(1, '#8a96a4');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 512);

        // 拉丝纹理（水平）
        for (let i = 0; i < 2500; i++) {
            const y = Math.random() * 512;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(512, y + (Math.random() - 0.5) * 1);
            const v = 180 + Math.random() * 75;
            ctx.strokeStyle = `rgba(${v}, ${v + 5}, ${v + 10}, ${0.03 + Math.random() * 0.06})`;
            ctx.lineWidth = 0.4;
            ctx.stroke();
        }

        // 铆钉
        for (let x = 32; x < 512; x += 96) {
            for (let y = 32; y < 512; y += 96) {
                // 铆钉阴影
                ctx.fillStyle = 'rgba(40, 50, 60, 0.6)';
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.fill();
                // 铆钉主体
                const rivet = ctx.createRadialGradient(x - 1, y - 1, 0, x, y, 4);
                rivet.addColorStop(0, 'rgba(200, 210, 220, 0.9)');
                rivet.addColorStop(0.7, 'rgba(150, 160, 175, 0.8)');
                rivet.addColorStop(1, 'rgba(100, 110, 120, 0.6)');
                ctx.fillStyle = rivet;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
                // 铆钉高光
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.beginPath();
                ctx.arc(x - 1, y - 1, 1, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // 焊接缝（深色直线）
        for (let i = 0; i < 3; i++) {
            const y = 64 + i * 192;
            const grad = ctx.createLinearGradient(0, y - 2, 0, y + 2);
            grad.addColorStop(0, 'rgba(40, 50, 60, 0)');
            grad.addColorStop(0.5, 'rgba(40, 50, 60, 0.7)');
            grad.addColorStop(1, 'rgba(40, 50, 60, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, y - 2, 512, 4);
        }

        // 锈斑
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const r = 8 + Math.random() * 20;
            const rust = ctx.createRadialGradient(x, y, 0, x, y, r);
            rust.addColorStop(0, 'rgba(140, 70, 30, 0.3)');
            rust.addColorStop(0.5, 'rgba(100, 55, 25, 0.15)');
            rust.addColorStop(1, 'rgba(80, 40, 20, 0)');
            ctx.fillStyle = rust;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // 噪点
        const imageData = ctx.getImageData(0, 0, 512, 512);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const n = (Math.random() - 0.5) * 10;
            imageData.data[i] = Math.max(0, Math.min(255, imageData.data[i] + n));
            imageData.data[i + 1] = Math.max(0, Math.min(255, imageData.data[i + 1] + n));
            imageData.data[i + 2] = Math.max(0, Math.min(255, imageData.data[i + 2] + n));
        }
        ctx.putImageData(imageData, 0, 0);

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    /**
     * 金属粗糙度贴图 — 拉丝方向更光滑
     */
    _createMetalRoughness() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#5a5a5a';
        ctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 1500; i++) {
            const y = Math.random() * 256;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(256, y + (Math.random() - 0.5) * 1);
            ctx.strokeStyle = `rgba(${60 + Math.random() * 50}, 0, 0, 0.25)`;
            ctx.lineWidth = 0.4;
            ctx.stroke();
        }
        return new THREE.CanvasTexture(canvas);
    }

    /**
     * 脆弱桥纹理 — 陶土/砖色 + 裂纹
     */
    _createBrittleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // 基础橙色（陶土色）
        ctx.fillStyle = '#c87850';
        ctx.fillRect(0, 0, 512, 512);

        // 砖块分块
        const brickW = 64;
        const brickH = 32;
        for (let y = 0; y < 512; y += brickH) {
            const offset = (y / brickH) % 2 === 0 ? 0 : brickW / 2;
            for (let x = -brickW; x < 512; x += brickW) {
                const bx = x + offset;
                // 砖块色块
                const tone = 180 + Math.random() * 30;
                ctx.fillStyle = `rgba(${tone}, ${tone * 0.6}, ${tone * 0.4}, 0.3)`;
                ctx.fillRect(bx, y, brickW, brickH);
            }
        }

        // 砖缝阴影
        for (let y = 0; y < 512; y += brickH) {
            ctx.fillStyle = 'rgba(40, 20, 10, 0.6)';
            ctx.fillRect(0, y, 512, 2);
        }
        for (let y = 0; y < 512; y += brickH) {
            const offset = (y / brickH) % 2 === 0 ? 0 : brickW / 2;
            for (let x = -brickW; x < 512; x += brickW) {
                ctx.fillStyle = 'rgba(40, 20, 10, 0.6)';
                ctx.fillRect(x + offset, y, 1, brickH);
            }
        }

        // 大量裂纹
        for (let i = 0; i < 25; i++) {
            ctx.beginPath();
            let x = Math.random() * 512;
            let y = Math.random() * 512;
            ctx.moveTo(x, y);
            const segments = 4 + Math.floor(Math.random() * 6);
            for (let j = 0; j < segments; j++) {
                const angle = Math.random() * Math.PI * 2;
                const len = 10 + Math.random() * 30;
                x += Math.cos(angle) * len;
                y += Math.sin(angle) * len;
                ctx.lineTo(x, y);
            }
            ctx.strokeStyle = `rgba(40, 20, 10, ${0.4 + Math.random() * 0.4})`;
            ctx.lineWidth = 0.5 + Math.random() * 1;
            ctx.stroke();
        }

        // 噪点
        const imageData = ctx.getImageData(0, 0, 512, 512);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const n = (Math.random() - 0.5) * 20;
            imageData.data[i] = Math.max(0, Math.min(255, imageData.data[i] + n));
            imageData.data[i + 1] = Math.max(0, Math.min(255, imageData.data[i + 1] + n * 0.6));
            imageData.data[i + 2] = Math.max(0, Math.min(255, imageData.data[i + 2] + n * 0.4));
        }
        ctx.putImageData(imageData, 0, 0);

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    /**
     * 石头纹理（支柱用）— 灰色石块
     */
    _createStoneTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // 基础灰色
        ctx.fillStyle = '#808080';
        ctx.fillRect(0, 0, 256, 256);

        // 大块石块
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const w = 30 + Math.random() * 60;
            const h = 30 + Math.random() * 60;
            const tone = 110 + Math.random() * 40;
            ctx.fillStyle = `rgba(${tone}, ${tone}, ${tone + 5}, 0.3)`;
            ctx.fillRect(x, y, w, h);
            // 石块边缘阴影
            ctx.strokeStyle = 'rgba(40, 40, 40, 0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, w, h);
        }

        // 颗粒
        for (let i = 0; i < 3000; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const g = 80 + Math.random() * 100;
            ctx.fillStyle = `rgba(${g}, ${g}, ${g}, ${0.1 + Math.random() * 0.2})`;
            ctx.fillRect(x, y, 1, 1);
        }

        // 噪点
        const imageData = ctx.getImageData(0, 0, 256, 256);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const n = (Math.random() - 0.5) * 20;
            imageData.data[i] = Math.max(0, Math.min(255, imageData.data[i] + n));
            imageData.data[i + 1] = Math.max(0, Math.min(255, imageData.data[i + 1] + n));
            imageData.data[i + 2] = Math.max(0, Math.min(255, imageData.data[i + 2] + n));
        }
        ctx.putImageData(imageData, 0, 0);

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    _initMaterials() {
        const concreteTex = this._createConcreteTexture();
        const concreteRough = this._createConcreteRoughness();
        const woodTex = this._createWoodPlankTexture();
        const metalTex = this._createMetalTexture();
        const metalRough = this._createMetalRoughness();
        const brittleTex = this._createBrittleTexture();
        const stoneTex = this._createStoneTexture();

        // 真实混凝土 — 灰白色风化混凝土
        this.materials.concrete = new THREE.MeshStandardMaterial({
            color: 0xb8b8b4,
            roughness: 0.85,
            metalness: 0.05,
            map: concreteTex,
            roughnessMap: concreteRough,
            envMapIntensity: 0.5,
        });

        // 真实木板 — 暖棕色木板带钉孔
        this.materials.woodPlank = new THREE.MeshStandardMaterial({
            color: 0xa87842,
            roughness: 0.75,
            metalness: 0.0,
            map: woodTex,
            envMapIntensity: 0.7,
        });

        // 真实金属 — 拉丝钢带铆钉
        this.materials.metal = new THREE.MeshStandardMaterial({
            color: 0xa0b0c0,
            roughness: 0.35,
            metalness: 0.85,
            map: metalTex,
            roughnessMap: metalRough,
            envMapIntensity: 1.2,
        });

        // 脆弱桥 — 陶土砖带裂纹
        this.materials.brittle = new THREE.MeshStandardMaterial({
            color: 0xc87850,
            roughness: 0.65,
            metalness: 0.05,
            map: brittleTex,
            envMapIntensity: 0.6,
        });

        // 石头支柱
        this.materials.stone = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.9,
            metalness: 0.0,
            map: stoneTex,
            envMapIntensity: 0.5,
        });

        // 引导线 — 发光蓝
        this.materials.guideLine = new THREE.MeshStandardMaterial({
            color: 0x00ccff,
            emissive: 0x00ccff,
            emissiveIntensity: 2.5,
            transparent: true,
            opacity: 0.8,
        });

        // 终点光圈 — 翠绿
        this.materials.finishGlow = new THREE.MeshStandardMaterial({
            color: 0x00ff88,
            emissive: 0x00ff88,
            emissiveIntensity: 3.0,
            transparent: true,
            opacity: 0.9,
        });

        // 磁铁 — 红色发光
        this.materials.magnet = new THREE.MeshStandardMaterial({
            color: 0xff3344,
            emissive: 0xff2233,
            emissiveIntensity: 1.5,
            roughness: 0.3,
            metalness: 0.6,
        });

        // 风扇 — 青色发光
        this.materials.fan = new THREE.MeshStandardMaterial({
            color: 0x44bbff,
            emissive: 0x44aaff,
            emissiveIntensity: 1.0,
            roughness: 0.4,
            metalness: 0.7,
        });

        // 护栏顶部发光条
        this.materials.glowEdge = new THREE.MeshBasicMaterial({
            color: 0x00ccff,
            transparent: true,
            opacity: 0.5,
            depthWrite: false,
        });
    }

    /**
     * 设置全局环境贴图（PMREM 格式）— 所有 PBR 材质会反射此环境
     * @param {THREE.Texture} envMap
     */
    setEnvironmentMap(envMap) {
        this.envMap = envMap;
        for (const name in this.materials) {
            const mat = this.materials[name];
            if (mat.isMeshStandardMaterial) {
                mat.envMap = envMap;
                mat.needsUpdate = true;
            }
        }
    }

    getSphere(radius = 1, seg = 32) {
        if (radius === 1 && seg === 32) return this.geometries.sphere;
        const key = `sphere_${radius}_${seg}`;
        if (!this.geometries[key]) {
            this.geometries[key] = new THREE.SphereGeometry(radius, seg, seg);
        }
        return this.geometries[key];
    }

    getBox(w = 1, h = 1, d = 1) {
        const key = `box_${w}_${h}_${d}`;
        if (!this.geometries[key]) {
            this.geometries[key] = new THREE.BoxGeometry(w, h, d);
        }
        return this.geometries[key];
    }

    getRing(innerRadius = 0.9, outerRadius = 1.1, segments = 64) {
        if (innerRadius === 0.9 && outerRadius === 1.1 && segments === 64) {
            return this.geometries.ring;
        }
        const key = `ring_${innerRadius}_${outerRadius}_${segments}`;
        if (!this.geometries[key]) {
            this.geometries[key] = new THREE.RingGeometry(innerRadius, outerRadius, segments);
        }
        return this.geometries[key];
    }

    getCapsule(radius = 1, length = 2, radialSegments = 16, heightSegments = 32) {
        const key = `capsule_${radius}_${length}_${radialSegments}_${heightSegments}`;
        if (!this.geometries[key]) {
            this.geometries[key] = new THREE.CapsuleGeometry(radius, length, radialSegments, heightSegments);
        }
        return this.geometries[key];
    }

    getMat(name) {
        return this.materials[name];
    }
}
