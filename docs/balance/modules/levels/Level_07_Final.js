/**
 * @file Level_07_Final.js
 * @description 关卡 7：最终挑战 — 所有机关的综合终极关卡，最长最复杂。
 * @module levels/Level_07_Final
 */

import * as THREE from 'https://robotpua.com/cs/lib/three.module.js';
import { Level } from '../entities/Level.js';

/**
 * 关卡 7 构建器（最终关卡）
 */
export function buildLevel07(scene, physicsWorld, assets) {
    const level = new Level(scene, physicsWorld, assets);
    level.clear();
    level.levelName = 'LEVEL 07 — FINAL CHALLENGE';

    // ===== 起点平台 =====
    level.createTrack({ width: 4, length: 4, x: 0, y: 0, z: 0, material: 'concrete' });
    level.createStartMarker(new THREE.Vector3(0, 0.31, 0));

    // --- 第 1 段：木板桥 ---
    level.createTrack({ width: 2.5, length: 8, x: 0, y: 0, z: -7, material: 'woodPlank' });
    level.createGuardrail({ trackLength: 8, x: -1.25, y: 0.3, z: -7 });
    level.createGuardrail({ trackLength: 8, x: 1.25, y: 0.3, z: -7 });

    // --- 移动平台 1 ---
    level.createMovingPlatform({
        width: 3, height: 0.2, depth: 2,
        x: 0, y: -0.5, z: -14,
        range: new THREE.Vector3(0, 0, 3),
        speed: 1.0,
    });

    // --- 第 2 段：金属桥 ---
    level.createTrack({ width: 2.5, length: 8, x: 0, y: 0, z: -20, material: 'metal' });
    level.createGuardrail({ trackLength: 8, x: -1.25, y: 0.3, z: -20 });
    level.createGuardrail({ trackLength: 8, x: 1.25, y: 0.3, z: -20 });

    // --- 风扇区 1 ---
    level.createFan(new THREE.Vector3(0, -1, -26), new THREE.Vector3(0, 1, 0), 10, 3);
    level.createTrack({ width: 3, length: 3, x: 0, y: 0, z: -29, material: 'concrete' });

    // --- 第 3 段：狭窄金属轨 ---
    level.createTrack({ width: 2, length: 8, x: 0, y: 0, z: -35, material: 'metal' });
    level.createGuardrail({ trackLength: 8, x: -1, y: 0.3, z: -35 });
    level.createGuardrail({ trackLength: 8, x: 1, y: 0.3, z: -35 });

    // --- 磁铁区 ---
    level.createMagnet(new THREE.Vector3(0, 1.5, -41), 18, 3.5);
    level.createTrack({ width: 2.5, length: 6, x: 0, y: 0, z: -44, material: 'metal' });
    level.createGuardrail({ trackLength: 6, x: -1.25, y: 0.3, z: -44 });
    level.createGuardrail({ trackLength: 6, x: 1.25, y: 0.3, z: -44 });

    // --- 脆弱桥梁 ---
    level.createTrack({ width: 2.5, length: 5, x: 0, y: 0, z: -50, material: 'brittle', isBrittle: true });
    level.createGuardrail({ trackLength: 5, x: -1.25, y: 0.3, z: -50 });
    level.createGuardrail({ trackLength: 5, x: 1.25, y: 0.3, z: -50 });

    // --- 安全平台 ---
    level.createTrack({ width: 4, length: 4, x: 0, y: 0, z: -56, material: 'concrete' });

    // --- 风扇区 2（侧向） ---
    level.createFan(new THREE.Vector3(-4, 0, -61), new THREE.Vector3(1, 0, 0), 12, 4);
    level.createTrack({ width: 2, length: 8, x: 0, y: 0, z: -65, material: 'metal' });
    level.createGuardrail({ trackLength: 8, x: -1, y: 0.3, z: -65 });
    level.createGuardrail({ trackLength: 8, x: 1, y: 0.3, z: -65 });

    // --- 移动平台 2 ---
    level.createMovingPlatform({
        width: 2.5, height: 0.2, depth: 2,
        x: 0, y: 0, z: -63,
        range: new THREE.Vector3(2, 0, 0),
        speed: 1.3,
    });

    // --- 横向偏移 ---
    level.createTrack({ width: 2.5, length: 4, x: 3, y: 0, z: -70, material: 'metal' });
    level.createGuardrail({ trackLength: 4, x: 1.75, y: 0.3, z: -70 });
    level.createGuardrail({ trackLength: 4, x: 4.25, y: 0.3, z: -70 });

    // --- 第 4 段：木板桥 ---
    level.createTrack({ width: 2.5, length: 8, x: 3, y: 0, z: -76, material: 'woodPlank' });
    level.createGuardrail({ trackLength: 8, x: 1.75, y: 0.3, z: -76 });
    level.createGuardrail({ trackLength: 8, x: 4.25, y: 0.3, z: -76 });

    // --- 磁铁区 2 ---
    level.createMagnet(new THREE.Vector3(3, 1.5, -82), 15, 3);
    level.createTrack({ width: 2.5, length: 6, x: 3, y: 0, z: -85, material: 'metal' });
    level.createGuardrail({ trackLength: 6, x: 1.75, y: 0.3, z: -85 });
    level.createGuardrail({ trackLength: 6, x: 4.25, y: 0.3, z: -85 });

    // --- 狭窄通道 ---
    level.createTrack({ width: 1.5, length: 8, x: 3, y: 0, z: -92, material: 'metal' });
    level.createGuardrail({ trackLength: 8, x: 2.25, y: 0.3, z: -92 });
    level.createGuardrail({ trackLength: 8, x: 3.75, y: 0.3, z: -92 });

    // --- 终点平台 ---
    level.createTrack({ width: 5, length: 5, x: 3, y: 0, z: -100, material: 'concrete' });
    level.createFinishZone(new THREE.Vector3(3, 0.31, -100));

    // --- 移动平台 3 ---
    level.createMovingPlatform({
        width: 2.5, height: 0.2, depth: 2,
        x: 3, y: 0, z: -96,
        range: new THREE.Vector3(0, 0, 2),
        speed: 1.1,
    });

    // ===== 装饰 =====
    level.createPillar(-8, -2, -15, 12);
    level.createPillar(8, -2, -15, 12);
    level.createPillar(-8, -2, -45, 14);
    level.createPillar(8, -2, -45, 14);
    level.createPillar(-8, -2, -75, 12);
    level.createPillar(8, -2, -75, 12);
    level.createPillar(-8, -2, -95, 10);
    level.createPillar(8, -2, -95, 10);

    level.startPoint = new THREE.Vector3(0, 2, 0);

    return level;
}
