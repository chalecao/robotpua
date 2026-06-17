/**
 * @module BotManager
 * @description 机器人管理器：生成、更新、击杀统计、重生逻辑
 */
import * as THREE from 'three';
import { Bot } from './Bot.js';

const SPAWN_POINTS = [
  { x: 20, z: 20 }, { x: -20, z: 20 },
  { x: 20, z: -20 }, { x: -20, z: -20 },
  { x: 30, z: 0 }, { x: -30, z: 0 },
  { x: 0, z: 30 }, { x: 0, z: -30 },
];

export class BotManager {
  constructor(scene, count = 5) {
    this.scene = scene;
    this.bots = [];
    this.initialCount = count;
    this.respawnDelay = 5.0;
    this._raycaster = new THREE.Raycaster();

    for (let i = 0; i < count; i++) {
      const sp = SPAWN_POINTS[i % SPAWN_POINTS.length];
      const bot = new Bot(scene, { x: sp.x, y: 1.6, z: sp.z }, i);
      this.bots.push(bot);
    }
  }

  update(dt, playerPos, map, onBotAttack, wallMeshes) {
    for (const bot of this.bots) {
      if (bot.isAlive) {
        bot.update(dt, playerPos, map);

        const oldX = bot.position.x;
        const oldZ = bot.position.z;
        const resolved = map.resolveCollision(
          { x: oldX, y: 1.6, z: oldZ },
          { x: bot.position.x, y: 1.6, z: bot.position.z },
          bot.radius
        );
        bot.position.x = resolved.x;
        bot.position.z = resolved.z;

        const limit = 38;
        bot.position.x = Math.max(-limit, Math.min(limit, bot.position.x));
        bot.position.z = Math.max(-limit, Math.min(limit, bot.position.z));

        if (bot.canAttack()) {
          bot.resetAttackCooldown();
          if (onBotAttack && this._hasLineOfSight(bot, playerPos, wallMeshes)) {
            onBotAttack(bot);
          }
        }
      }
    }

    const aliveBots = this.bots.filter(b => b.isAlive);
    for (let i = 0; i < aliveBots.length; i++) {
      for (let j = i + 1; j < aliveBots.length; j++) {
        const a = aliveBots[i], b = aliveBots[j];
        const dx = b.position.x - a.position.x;
        const dz = b.position.z - a.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const minDist = a.radius + b.radius;
        if (dist < minDist && dist > 0.001) {
          const push = (minDist - dist) * 0.5;
          const nx = dx / dist, nz = dz / dist;
          a.position.x -= nx * push;
          a.position.z -= nz * push;
          b.position.x += nx * push;
          b.position.z += nz * push;
        }
      }
    }
    for (const bot of aliveBots) {
      const limit = 38;
      bot.position.x = Math.max(-limit, Math.min(limit, bot.position.x));
      bot.position.z = Math.max(-limit, Math.min(limit, bot.position.z));
      bot.mesh.position.set(bot.position.x, 0, bot.position.z);
    }
  }

  getAliveBots() {
    return this.bots.filter(b => b.isAlive);
  }

  getAliveCount() {
    return this.getAliveBots().length;
  }

  getAllBots() {
    return this.bots;
  }

  respawnAll() {
    for (const bot of this.bots) {
      if (!bot.isAlive) {
        const sp = SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)];
        bot.respawn({ x: sp.x, y: 1.6, z: sp.z });
      }
    }
  }

  fullReset() {
    for (const bot of this.bots) {
      const sp = SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)];
      bot.respawn({ x: sp.x, y: 1.6, z: sp.z });
    }
  }

  _hasLineOfSight(bot, playerPos, wallMeshes) {
    if (!wallMeshes || wallMeshes.length === 0) return true;
    const origin = new THREE.Vector3(bot.position.x, 1.0, bot.position.z);
    const target = new THREE.Vector3(playerPos.x, 1.0, playerPos.z);
    const dir = new THREE.Vector3().subVectors(target, origin);
    const dist = dir.length();
    if (dist < 0.01) return true;
    dir.normalize();
    this._raycaster.set(origin, dir);
    this._raycaster.far = dist;
    const hits = this._raycaster.intersectObjects(wallMeshes);
    return hits.length === 0;
  }
}
