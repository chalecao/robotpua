/**
 * @file Materials.js
 * @description 定义三种球体的 PBR 材质：纸球(米色纤维哑光)、木球(深棕年轮+漆面)、
 *              铁球(拉丝金属+高反射)。所有材质均支持 IBL 环境贴图。
 * @module graphics/Materials
 */

import * as THREE from 'https://robotpua.com/cs/lib/three.module.js';

// ===========================
// 程序化纹理生成器
// ===========================

/**
 * 生成纸张纤维纹理 — 米白色 + 纤维丝 + 轻微褶皱
 */
function createPaperTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 基础米白色
    ctx.fillStyle = '#f4ead8';
    ctx.fillRect(0, 0, 512, 512);

    // 纤维丝
    for (let i = 0; i < 8000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const len = 1 + Math.random() * 4;
        const angle = Math.random() * Math.PI * 2;
        const shade = 200 + Math.random() * 40;
        ctx.strokeStyle = `rgba(${shade}, ${shade - 10}, ${shade - 30}, 0.15)`;
        ctx.lineWidth = 0.4;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
        ctx.stroke();
    }

    // 细微的色块变化
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = 8 + Math.random() * 30;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, `rgba(220, 200, 170, 0.08)`);
        grad.addColorStop(1, `rgba(220, 200, 170, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // 噪点
    const imageData = ctx.getImageData(0, 0, 512, 512);
    for (let i = 0; i < imageData.data.length; i += 4) {
        const n = (Math.random() - 0.5) * 12;
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
 * 生成纸张粗糙度贴图 — 边缘略粗糙
 */
function createPaperRoughness() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#e8e8e8';  // 高粗糙度
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2000; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const r = 1 + Math.random() * 2;
        ctx.fillStyle = `rgba(${200 + Math.random() * 40}, 0, 0, 0.2)`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
    return new THREE.CanvasTexture(canvas);
}

/**
 * 生成木纹纹理 — 深棕色年轮 + 自然纹路
 */
function createWoodTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 基础深棕色（橡木/胡桃木色）
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#8b5a2b');
    grad.addColorStop(0.5, '#6b3e15');
    grad.addColorStop(1, '#8b5a2b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // 年轮
    for (let r = 30; r < 280; r += 6 + Math.random() * 4) {
        ctx.beginPath();
        ctx.arc(256, 256, r, 0, Math.PI * 2);
        const darkness = 40 + Math.random() * 50;
        ctx.strokeStyle = `rgba(${darkness}, ${darkness * 0.5}, ${darkness * 0.2}, ${0.2 + Math.random() * 0.2})`;
        ctx.lineWidth = 1 + Math.random() * 2;
        ctx.stroke();
    }

    // 木纹线条
    for (let i = 0; i < 80; i++) {
        const y = Math.random() * 512;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x < 512; x += 8) {
            ctx.lineTo(x, y + Math.sin(x * 0.04) * 4 + (Math.random() - 0.5) * 3);
        }
        ctx.strokeStyle = `rgba(40, 25, 10, ${0.05 + Math.random() * 0.12})`;
        ctx.lineWidth = 0.5 + Math.random() * 1.5;
        ctx.stroke();
    }

    // 木节疤
    for (let i = 0; i < 4; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = 4 + Math.random() * 8;
        const knot = ctx.createRadialGradient(x, y, 0, x, y, r);
        knot.addColorStop(0, 'rgba(20, 10, 5, 0.7)');
        knot.addColorStop(0.6, 'rgba(50, 30, 15, 0.4)');
        knot.addColorStop(1, 'rgba(50, 30, 15, 0)');
        ctx.fillStyle = knot;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // 噪点
    const imageData = ctx.getImageData(0, 0, 512, 512);
    for (let i = 0; i < imageData.data.length; i += 4) {
        const n = (Math.random() - 0.5) * 18;
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
 * 生成木纹粗糙度贴图 — 木纹凹槽处更粗糙
 */
function createWoodRoughness() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#b0b0b0';  // 中等粗糙度
    ctx.fillRect(0, 0, 256, 256);
    for (let r = 20; r < 150; r += 4) {
        ctx.beginPath();
        ctx.arc(128, 128, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${100 + Math.random() * 60}, 0, 0, 0.3)`;
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    return new THREE.CanvasTexture(canvas);
}

/**
 * 生成拉丝金属纹理 — 钢铁拉丝+划痕
 */
function createBrushedMetalTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 基础灰色（钢/铁色）
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#8a929c');
    grad.addColorStop(0.5, '#9aa3ad');
    grad.addColorStop(1, '#8a929c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // 拉丝纹理（水平）
    for (let i = 0; i < 1500; i++) {
        const y = Math.random() * 512;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y + (Math.random() - 0.5) * 1.5);
        const alpha = 0.02 + Math.random() * 0.06;
        ctx.strokeStyle = `rgba(${Math.random() < 0.5 ? 200 : 80}, ${Math.random() < 0.5 ? 200 : 80}, ${Math.random() < 0.5 ? 200 : 80}, ${alpha})`;
        ctx.lineWidth = 0.4;
        ctx.stroke();
    }

    // 划痕
    for (let i = 0; i < 8; i++) {
        const x1 = Math.random() * 512;
        const y1 = Math.random() * 512;
        const angle = Math.random() * Math.PI * 2;
        const len = 30 + Math.random() * 100;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 + Math.cos(angle) * len, y1 + Math.sin(angle) * len);
        ctx.strokeStyle = `rgba(40, 40, 50, 0.4)`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
    }

    // 锈斑（轻微）
    for (let i = 0; i < 3; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = 5 + Math.random() * 15;
        const rust = ctx.createRadialGradient(x, y, 0, x, y, r);
        rust.addColorStop(0, 'rgba(120, 60, 30, 0.2)');
        rust.addColorStop(0.5, 'rgba(80, 50, 30, 0.1)');
        rust.addColorStop(1, 'rgba(80, 50, 30, 0)');
        ctx.fillStyle = rust;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // 噪点
    const imageData = ctx.getImageData(0, 0, 512, 512);
    for (let i = 0; i < imageData.data.length; i += 4) {
        const n = (Math.random() - 0.5) * 8;
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
 * 生成金属粗糙度贴图 — 拉丝方向光滑，凹痕处粗糙
 */
function createBrushedMetalRoughness() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#3a3a3a';  // 较低粗糙度（更光滑）
    ctx.fillRect(0, 0, 256, 256);
    // 拉丝方向略光滑
    for (let i = 0; i < 800; i++) {
        const y = Math.random() * 256;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(256, y + (Math.random() - 0.5) * 1);
        ctx.strokeStyle = `rgba(${50 + Math.random() * 30}, 0, 0, 0.2)`;
        ctx.lineWidth = 0.4;
        ctx.stroke();
    }
    return new THREE.CanvasTexture(canvas);
}

// ===========================
// 缓存的纹理（全局共享）
// ===========================
let _paperMap = null;
let _paperRough = null;
let _woodMap = null;
let _woodRough = null;
let _brushedMap = null;
let _brushedRough = null;

function getPaperMap() { _paperMap = _paperMap || createPaperTexture(); return _paperMap; }
function getPaperRough() { _paperRough = _paperRough || createPaperRoughness(); return _paperRough; }
function getWoodMap() { _woodMap = _woodMap || createWoodTexture(); return _woodMap; }
function getWoodRough() { _woodRough = _woodRough || createWoodRoughness(); return _woodRough; }
function getBrushedMap() { _brushedMap = _brushedMap || createBrushedMetalTexture(); return _brushedMap; }
function getBrushedRough() { _brushedRough = _brushedRough || createBrushedMetalRoughness(); return _brushedRough; }

// ===========================
// 球体材质工厂
// ===========================

/**
 * 创建纸球材质 — 米白色纤维哑光
 * @param {THREE.SphereGeometry} geometry
 * @returns {THREE.MeshStandardMaterial}
 */
export function createPaperBallMaterial(geometry) {
    const material = new THREE.MeshStandardMaterial({
        color: 0xf4ead8,
        map: getPaperMap(),
        roughness: 0.95,
        metalness: 0.0,
        roughnessMap: getPaperRough(),
        envMapIntensity: 0.6,
    });
    return material;
}

/**
 * 创建木球材质 — 深棕色年轮 + 自然纹路
 * @param {THREE.SphereGeometry} geometry
 * @returns {THREE.MeshStandardMaterial}
 */
export function createWoodBallMaterial(geometry) {
    const material = new THREE.MeshStandardMaterial({
        color: 0x8b5a2b,
        map: getWoodMap(),
        roughness: 0.7,
        metalness: 0.0,
        roughnessMap: getWoodRough(),
        envMapIntensity: 0.8,
    });
    return material;
}

/**
 * 创建铁球材质 — 拉丝钢 + 高反射 + IBL
 * @param {THREE.SphereGeometry} geometry
 * @param {THREE.Scene} [scene] — 用于生成环境贴图
 * @returns {THREE.MeshStandardMaterial}
 */
export function createIronBallMaterial(geometry, scene) {
    const material = new THREE.MeshStandardMaterial({
        color: 0x9aa3ad,
        map: getBrushedMap(),
        roughness: 0.22,
        metalness: 1.0,
        roughnessMap: getBrushedRough(),
        envMapIntensity: 1.5,
    });
    return material;
}

/**
 * 根据球类型创建对应 PBR 材质
 * @param {'paper'|'wood'|'iron'} type
 * @param {THREE.SphereGeometry} geometry
 * @param {THREE.Scene} [scene]
 * @returns {THREE.MeshStandardMaterial}
 */
export function createBallMaterial(type, geometry, scene) {
    switch (type) {
        case 'paper':
            return createPaperBallMaterial(geometry);
        case 'wood':
            return createWoodBallMaterial(geometry);
        case 'iron':
            return createIronBallMaterial(geometry, scene);
        default:
            return createWoodBallMaterial(geometry);
    }
}

// ===========================
// 程序化天空环境贴图（PMREM 源）
// ===========================

/**
 * 生成一个真实的天空 + 地面渐变环境贴图
 * 用于 PBR 材质的 IBL 反射，金属球能反射出真实天空。
 * @returns {THREE.CanvasTexture}
 */
export function createSkyEnvironmentTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 上半部分 — 天空（蓝→淡蓝→地平线暖色）
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 256);
    skyGrad.addColorStop(0, '#4a7fb8');     // 顶天蓝
    skyGrad.addColorStop(0.3, '#7ba8d4');
    skyGrad.addColorStop(0.55, '#b8d4e8');
    skyGrad.addColorStop(0.7, '#e0d4c0');   // 地平线
    skyGrad.addColorStop(0.85, '#c0a890');  // 大地远景
    skyGrad.addColorStop(1, '#8b7355');     // 地面
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 1024, 256);

    // 下半部分 — 反射地面
    const groundGrad = ctx.createLinearGradient(0, 256, 0, 512);
    groundGrad.addColorStop(0, '#8b7355');
    groundGrad.addColorStop(0.3, '#6b5540');
    groundGrad.addColorStop(0.7, '#4a3c30');
    groundGrad.addColorStop(1, '#2a2218');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, 256, 1024, 256);

    // 太阳（明亮高光点，金属球能反射出太阳）
    const sunX = 700;
    const sunY = 100;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 80);
    sunGrad.addColorStop(0, 'rgba(255, 250, 230, 1)');
    sunGrad.addColorStop(0.1, 'rgba(255, 240, 200, 0.95)');
    sunGrad.addColorStop(0.4, 'rgba(255, 220, 180, 0.4)');
    sunGrad.addColorStop(1, 'rgba(255, 220, 180, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 80, 0, Math.PI * 2);
    ctx.fill();

    // 太阳核心
    ctx.fillStyle = 'rgba(255, 255, 240, 1)';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 25, 0, Math.PI * 2);
    ctx.fill();

    // 云层（带状条纹，金属球能反射出云的形状）
    for (let i = 0; i < 6; i++) {
        const cx = 100 + i * 160;
        const cy = 120 + Math.random() * 40;
        const cw = 80 + Math.random() * 60;
        const ch = 12 + Math.random() * 8;
        const cloudGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cw);
        cloudGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
        cloudGrad.addColorStop(0.4, 'rgba(240, 240, 250, 0.4)');
        cloudGrad.addColorStop(1, 'rgba(220, 220, 230, 0)');
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(cw / ch, 1);
        ctx.fillStyle = cloudGrad;
        ctx.beginPath();
        ctx.arc(0, 0, ch, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // 远处山脉（深色剪影）
    ctx.fillStyle = 'rgba(60, 50, 40, 0.6)';
    ctx.beginPath();
    ctx.moveTo(0, 256);
    for (let x = 0; x < 1024; x += 40) {
        const y = 256 - (20 + Math.sin(x * 0.02) * 30 + Math.random() * 10);
        ctx.lineTo(x, y);
    }
    ctx.lineTo(1024, 256);
    ctx.closePath();
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}
