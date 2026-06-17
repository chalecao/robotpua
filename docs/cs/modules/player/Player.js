/**
 * @module Player
 * @description 玩家状态管理：生命值、位置、速度、跳跃状态
 */
export class Player {
  constructor() {
    this.position = { x: 0, y: 1.6, z: 0 };
    this.rotation = { x: 0, y: 0 };
    this.health = 100;
    this.maxHealth = 100;
    this.velocity = { x: 0, y: 0, z: 0 };
    this.isGrounded = true;
    this.isAlive = true;
    this.height = 1.6;
    this.radius = 0.4;
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.isAlive = false;
    }
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  respawn() {
    this.health = this.maxHealth;
    this.isAlive = true;
    this.position = { x: 0, y: 1.6, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
  }
}
