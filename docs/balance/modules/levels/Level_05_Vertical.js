/**
 * @file Level_05_Vertical.js
 * @description 关卡 5：垂直升降 — 利用移动平台逐级上升，考验时机把握。
 * @module levels/Level_05_Vertical
 */

import * as THREE from 'https://robotpua.com/cs/lib/three.module.js';
import { Level } from '../entities/Level.js';

/**
 * 关卡 5 构建器
 */
export function buildLevel05(scene, physicsWorld, assets) {
    const level = new Level(scene, physicsWorld, assets);
    level.clear();
    level.levelName = 'LEVEL 05 — VERTICAL ASCENT';

    // ===== 起点平台 =====
    level.createTrack({ width: 4, length: 4, x: 0, y: 0, z: 0, material: 'concrete' });
    level.createStartMarker(new THREE.Vector3(0, 0.31, 0));

    // ---- 第一阶梯 ----
    level.createTrack({ width: 3, length: 4, x: 0, y: 1, z: -5, material: 'metal' });
    level.createGuardrail({ trackLength: 4, x: -1.5, y: 1.3, z: -5 });
    level.createGuardrail({ trackLength: 4, x: 1.5, y: 1.3, z: -5 });

    // ---- 第二阶梯 ----
    level.createTrack({ width: 3, length: 4, x: 0, y: 2.5, z: -10, material: 'metal' });
    level.createGuardrail({ trackLength: 4, x: -1.5, y: 2.8, z: -10 });
    level.createGuardrail({ trackLength: 4, x: 1.5, y: 2.8, z: -10 });

    // ---- 第三阶梯 ----
    level.createTrack({ width: 3, length: 4, x: 0, y: 4, z: -15, material: 'metal' });
    level.createGuardrail({ trackLength: 4, x: -1.5, y: 4.3, z: -15 });
    level.createGuardrail({ trackLength: 4, x: 1.5, y: 4.3, z: -15 });

    // ===== 安全平台（中段） =====
    level.createTrack({ width: 5, length: 5, x: 0, y: 4, z: -22, material: 'concrete' });

    // ---- 第四阶梯 ----
    level.createTrack({ width: 3, length: 4, x: 0, y: 5.5, z: -28, material: 'metal' });
    level.createGuardrail({ trackLength: 4, x: -1.5, y: 5.8, z: -28 });
    level.createGuardrail({ trackLength: 4, x: 1.5, y: 5.8, z: -28 });

    // ---- 第五阶梯 ----
    level.createTrack({ width: 3, length: 4, x: 0, y: 7, z: -33, material: 'metal' });
    level.createGuardrail({ trackLength: 4, x: -1.5, y: 7.3, z: -33 });
    level.createGuardrail({ trackLength: 4, x: 1.5, y: 7.3, z: -33 });

    // ---- 第六阶梯 ----
    level.createTrack({ width: 3, length: 4, x: 0, y: 8.5, z: -38, material: 'metal' });
    level.createGuardrail({ trackLength: 4, x: -1.5, y: 8.8, z: -38 });
    level.createGuardrail({ trackLength: 4, x: 1.5, y: 8.8, z: -38 });

    // ===== 横向连接段 =====
    level.createTrack({ width: 2.5, length: 6, x: 3, y: 8.5, z: -44, material: 'metal' });
    level.createGuardrail({ trackLength: 6, x: 1.75, y: 8.8, z: -44 });
    level.createGuardrail({ trackLength: 6, x: 4.25, y: 8.8, z: -44 });

    // ---- 第七阶梯 ----
    level.createTrack({ width: 3, length: 4, x: 3, y: 10, z: -50, material: 'metal' });
    level.createGuardrail({ trackLength: 4, x: 1.5, y: 10.3, z: -50 });
    level.createGuardrail({ trackLength: 4, x: 4.5, y: 10.3, z: -50 });

    // ---- 第八阶梯（终点前） ----
    level.createTrack({ width: 3, length: 4, x: 3, y: 11.5, z: -55, material: 'metal' });
    level.createGuardrail({ trackLength: 4, x: 1.5, y: 11.8, z: -55 });
    level.createGuardrail({ trackLength: 4, x: 4.5, y: 11.8, z: -55 });

    // ===== 终点平台 =====
    level.createTrack({ width: 5, length: 5, x: 3, y: 11.5, z: -62, material: 'concrete' });
    level.createFinishZone(new THREE.Vector3(3, 11.81, -62));

    // ===== 移动平台（阶梯之间的桥梁） =====
    level.createMovingPlatform({
        width: 2, height: 0.2, depth: 3,
        x: 0, y: 0.5, z: -3,
        range: new THREE.Vector3(0, 0, 2),
        speed: 1.0,
    });
    level.createMovingPlatform({
        width: 2, height: 0.2, depth: 3,
        x: 0, y: 3.2, z: -18,
        range: new THREE.Vector3(0, 0, 2),
        speed: 1.2,
    });
    level.createMovingPlatform({
        width: 2, height: 0.2, depth: 3,
        x: 0, y: 7.5, z: -36,
        range: new THREE.Vector3(0, 0, 2),
        speed: 1.0,
    });
    level.createMovingPlatform({
        width: 2, height: 0.2, depth: 3,
        x: 3, y: 9.2, z: -48,
        range: new THREE.Vector3(0, 0, 2),
        speed: 1.3,
    });

    // ===== 装饰 =====
    level.createPillar(-8, -2, -20, 20);
    level.createPillar(8, -2, -20, 20);
    level.createPillar(-8, -2, -50, 22);
    level.createPillar(8, -2, -50, 22);

    level.startPoint = new THREE.Vector3(0, 2, 0);

    return level;
}
