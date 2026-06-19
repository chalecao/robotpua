/**
 * @file Level_03_Maze.js
 * @description 关卡 3：磁铁迷宫 — 引入多个磁铁装置，铁球会被吸引偏离轨道。
 * @module levels/Level_03_Maze
 */

import * as THREE from 'https://robotpua.com/cs/lib/three.module.js';
import { Level } from '../entities/Level.js';

/**
 * 关卡 3 构建器
 */
export function buildLevel03(scene, physicsWorld, assets) {
    const level = new Level(scene, physicsWorld, assets);
    level.clear();
    level.levelName = 'LEVEL 03 — MAGNET MAZE';

    // ===== 起点平台 =====
    level.createTrack({ width: 4, length: 4, x: 0, y: 0, z: 0, material: 'concrete' });
    level.createStartMarker(new THREE.Vector3(0, 0.31, 0));

    // ===== 蛇形通道段 1 =====
    level.createTrack({ width: 2, length: 10, x: 0, y: 0, z: -8, material: 'metal' });
    level.createGuardrail({ trackLength: 10, x: -1, y: 0.3, z: -8 });
    level.createGuardrail({ trackLength: 10, x: 1, y: 0.3, z: -8 });

    // ===== 横向连接 =====
    level.createTrack({ width: 2, length: 6, x: 5, y: 0, z: -13, material: 'metal' });
    level.createGuardrail({ trackLength: 6, x: 4, y: 0.3, z: -13 });
    level.createGuardrail({ trackLength: 6, x: 6, y: 0.3, z: -13 });

    // ===== 蛇形通道段 2 =====
    level.createTrack({ width: 2, length: 10, x: 5, y: 0, z: -20, material: 'metal' });
    level.createGuardrail({ trackLength: 10, x: 4, y: 0.3, z: -20 });
    level.createGuardrail({ trackLength: 10, x: 6, y: 0.3, z: -20 });

    // ===== 磁铁 1 — 吸引铁球偏离 =====
    level.createMagnet(new THREE.Vector3(5, 1.5, -25), 20, 3.5);
    level.createTrack({ width: 2, length: 4, x: 5, y: 0, z: -25, material: 'metal' });
    level.createGuardrail({ trackLength: 4, x: 4, y: 0.3, z: -25 });
    level.createGuardrail({ trackLength: 4, x: 6, y: 0.3, z: -25 });

    // ===== 蛇形通道段 3 =====
    level.createTrack({ width: 2, length: 10, x: 5, y: 0, z: -32, material: 'metal' });
    level.createGuardrail({ trackLength: 10, x: 4, y: 0.3, z: -32 });
    level.createGuardrail({ trackLength: 10, x: 6, y: 0.3, z: -32 });

    // ===== 横向连接 =====
    level.createTrack({ width: 2, length: 6, x: 0, y: 0, z: -37, material: 'metal' });
    level.createGuardrail({ trackLength: 6, x: -1, y: 0.3, z: -37 });
    level.createGuardrail({ trackLength: 6, x: 1, y: 0.3, z: -37 });

    // ===== 磁铁 2 — 第二个吸引点 =====
    level.createMagnet(new THREE.Vector3(0, 1.5, -40), 18, 3);
    level.createTrack({ width: 2, length: 8, x: 0, y: 0, z: -42, material: 'metal' });
    level.createGuardrail({ trackLength: 8, x: -1, y: 0.3, z: -42 });
    level.createGuardrail({ trackLength: 8, x: 1, y: 0.3, z: -42 });

    // ===== 横向连接 =====
    level.createTrack({ width: 2, length: 6, x: -5, y: 0, z: -47, material: 'metal' });
    level.createGuardrail({ trackLength: 6, x: -6, y: 0.3, z: -47 });
    level.createGuardrail({ trackLength: 6, x: -4, y: 0.3, z: -47 });

    // ===== 蛇形通道段 4 =====
    level.createTrack({ width: 2, length: 10, x: -5, y: 0, z: -54, material: 'metal' });
    level.createGuardrail({ trackLength: 10, x: -6, y: 0.3, z: -54 });
    level.createGuardrail({ trackLength: 10, x: -4, y: 0.3, z: -54 });

    // ===== 终点平台 =====
    level.createTrack({ width: 5, length: 5, x: -5, y: 0, z: -62, material: 'concrete' });
    level.createFinishZone(new THREE.Vector3(-5, 0.31, -62));

    // ===== 移动平台 =====
    level.createMovingPlatform({
        width: 2.5, height: 0.2, depth: 2,
        x: -5, y: 0, z: -50,
        range: new THREE.Vector3(0, 0, 2),
        speed: 1.0,
    });

    // ===== 装饰 =====
    level.createPillar(-10, -2, -20, 12);
    level.createPillar(10, -2, -20, 12);
    level.createPillar(-10, -2, -45, 14);
    level.createPillar(10, -2, -45, 14);
    level.createPillar(-10, -2, -60, 10);
    level.createPillar(10, -2, -60, 10);

    level.startPoint = new THREE.Vector3(0, 2, 0);

    return level;
}
