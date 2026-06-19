/**
 * @file Level_04_Narrow.js
 * @description 关卡 4：狭窄通道 — 越来越窄的轨道考验精细操控。
 * @module levels/Level_04_Narrow
 */

import * as THREE from 'https://robotpua.com/cs/lib/three.module.js';
import { Level } from '../entities/Level.js';

/**
 * 关卡 4 构建器
 */
export function buildLevel04(scene, physicsWorld, assets) {
    const level = new Level(scene, physicsWorld, assets);
    level.clear();
    level.levelName = 'LEVEL 04 — NARROW PASSAGE';

    // ===== 起点平台（宽） =====
    level.createTrack({ width: 4, length: 4, x: 0, y: 0, z: 0, material: 'concrete' });
    level.createStartMarker(new THREE.Vector3(0, 0.31, 0));

    // ===== 逐渐收窄段 1 (w=3) =====
    level.createTrack({ width: 3, length: 8, x: 0, y: 0, z: -7, material: 'woodPlank' });
    level.createGuardrail({ trackLength: 8, x: -1.5, y: 0.3, z: -7 });
    level.createGuardrail({ trackLength: 8, x: 1.5, y: 0.3, z: -7 });

    // ===== 逐渐收窄段 2 (w=2.5) =====
    level.createTrack({ width: 2.5, length: 8, x: 0, y: 0, z: -15, material: 'woodPlank' });
    level.createGuardrail({ trackLength: 8, x: -1.25, y: 0.3, z: -15 });
    level.createGuardrail({ trackLength: 8, x: 1.25, y: 0.3, z: -15 });

    // ===== 狭窄段 (w=1.8) =====
    level.createTrack({ width: 1.8, length: 10, x: 0, y: 0, z: -24, material: 'metal' });
    level.createGuardrail({ trackLength: 10, x: -0.9, y: 0.3, z: -24 });
    level.createGuardrail({ trackLength: 10, x: 0.9, y: 0.3, z: -24 });

    // ===== 安全平台 =====
    level.createTrack({ width: 4, length: 3, x: 0, y: 0, z: -32, material: 'concrete' });

    // ===== 极窄段 (w=1.2) =====
    level.createTrack({ width: 1.2, length: 12, x: 0, y: 0, z: -40, material: 'metal' });
    level.createGuardrail({ trackLength: 12, x: -0.6, y: 0.3, z: -40 });
    level.createGuardrail({ trackLength: 12, x: 0.6, y: 0.3, z: -40 });

    // ===== 安全平台 =====
    level.createTrack({ width: 4, length: 3, x: 0, y: 0, z: -48, material: 'concrete' });

    // ===== 超窄段 (w=1.0) =====
    level.createTrack({ width: 1.0, length: 8, x: 0, y: 0, z: -54, material: 'metal' });
    level.createGuardrail({ trackLength: 8, x: -0.5, y: 0.3, z: -54 });
    level.createGuardrail({ trackLength: 8, x: 0.5, y: 0.3, z: -54 });

    // ===== 横向偏移段 =====
    level.createTrack({ width: 1.5, length: 8, x: 3, y: 0, z: -62, material: 'woodPlank' });
    level.createGuardrail({ trackLength: 8, x: 2.25, y: 0.3, z: -62 });
    level.createGuardrail({ trackLength: 8, x: 3.75, y: 0.3, z: -62 });

    // ===== 终点平台 =====
    level.createTrack({ width: 5, length: 5, x: 3, y: 0, z: -70, material: 'concrete' });
    level.createFinishZone(new THREE.Vector3(3, 0.31, -70));

    // ===== 移动平台（在极窄段前） =====
    level.createMovingPlatform({
        width: 2, height: 0.2, depth: 2,
        x: 0, y: 0, z: -36,
        range: new THREE.Vector3(1.5, 0, 0),
        speed: 1.5,
    });

    // ===== 装饰 =====
    level.createPillar(-8, -2, -20, 10);
    level.createPillar(8, -2, -20, 10);
    level.createPillar(-8, -2, -45, 12);
    level.createPillar(8, -2, -45, 12);
    level.createPillar(-8, -2, -65, 8);
    level.createPillar(8, -2, -65, 8);

    level.startPoint = new THREE.Vector3(0, 2, 0);

    return level;
}
