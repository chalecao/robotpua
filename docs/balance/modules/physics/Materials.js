/**
 * @file Materials.js
 * @description 物理材质定义：纸球、木球、铁球的物理参数（质量、摩擦力、弹性、空气阻力等）。
 * @module physics/Materials
 */

export const PHYSICS_MATERIALS = {
    paper: {
        mass: 0.1,            // 极轻
        friction: 0.9,        // 高摩擦
        restitution: 0.1,     // 低弹性
        airResistance: 0.02,  // 高空气阻力
        windMultiplier: 5.0,  // 风力影响倍率
        maxSpeed: 8.0,        // 最大速度限制
        controlForce: 2.0,    // 控制力
        radius: 0.5,          // 半径（与其他球一致）
        color: 0xffffff,
        roughness: 1.0,
        metalness: 0.0,
        bumpScale: 0.3,       // 表面噪点强度
    },
    wood: {
        mass: 1.0,            // 中等
        friction: 0.6,        // 标准摩擦
        restitution: 0.3,     // 中等弹性
        airResistance: 0.005, // 低空气阻力
        windMultiplier: 1.0,  // 标准风力影响
        maxSpeed: 15.0,
        controlForce: 5.0,
        radius: 0.5,
        color: 0x8B6914,
        roughness: 0.8,
        metalness: 0.0,
        grainIntensity: 1.0,
    },
    iron: {
        mass: 5.0,            // 极重
        friction: 0.3,        // 低摩擦
        restitution: 0.7,     // 高弹性
        airResistance: 0.001, // 极低空气阻力
        windMultiplier: 0.1,  // 几乎不受风影响
        maxSpeed: 25.0,
        controlForce: 10.0,
        radius: 0.5,
        color: 0x444455,
        roughness: 0.1,
        metalness: 1.0,
        envMapIntensity: 2.0,
    }
};

/**
 * 根据球类型获取物理参数
 * @param {'paper'|'wood'|'iron'} type 
 * @returns {object}
 */
export function getPhysicsParams(type) {
    return { ...PHYSICS_MATERIALS[type] };
}
