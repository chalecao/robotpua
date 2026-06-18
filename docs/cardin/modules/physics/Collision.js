/**
 * @file Collision.js
 * @description 简单的 AABB 碰撞检测系统
 */
import * as THREE from '../../lib/three.module.js';

const boxA = new THREE.Box3();
const boxB = new THREE.Box3();

export class Collision {
    static check(a, b) {
        boxA.setFromObject(a);
        boxB.setFromObject(b);
        return boxA.intersectsBox(boxB);
    }
}
