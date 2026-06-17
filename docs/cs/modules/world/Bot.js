/**
 * @module Bot
 * @description 机器人实体：巡逻/追击/攻击状态机，Low Poly 外观，生命管理
 */
import * as THREE from 'three';

export class Bot {
  constructor(scene, position, id) {
    this.scene = scene;
    this.id = id;
    this.position = { ...position };
    this.rotation = 0;
    this.health = 100;
    this.isAlive = true;
    this.state = 'patrol';
    this.stateTimer = 0;
    this.patrolTarget = null;
    this.speed = 4;
    this.patrolSpeed = 2;
    this.attackRange = 15;
    this.attackCooldown = 1.0;
    this.attackTimer = 0;
    this.detectionRange = 25;
    this.damage = 5;
    this.radius = 0.5;
    this.velocity = { x: 0, y: 0, z: 0 };

    this._buildMesh();
    this._pickPatrolTarget();
  }

  _buildMesh() {
    this.mesh = new THREE.Group();

    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xcc3333 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.6), bodyMat);
    body.position.y = 0.6;
    body.castShadow = true;
    this.mesh.add(body);

    const headMat = new THREE.MeshLambertMaterial({ color: 0xdd4444 });
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), headMat);
    head.name = 'head';
    head.position.y = 1.45;
    head.castShadow = true;
    this.mesh.add(head);

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.05), eyeMat);
    eyeL.position.set(-0.12, 1.5, -0.25);
    this.mesh.add(eyeL);

    const eyeR = eyeL.clone();
    eyeR.position.x = 0.12;
    this.mesh.add(eyeR);

    const armMat = new THREE.MeshLambertMaterial({ color: 0xbb2222 });
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), armMat);
    armL.position.set(-0.5, 0.7, 0);
    armL.castShadow = true;
    this.mesh.add(armL);

    const armR = armL.clone();
    armR.position.x = 0.5;
    this.mesh.add(armR);

    const legMat = new THREE.MeshLambertMaterial({ color: 0x992222 });
    this.legL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.6, 0.25), legMat);
    this.legL.position.set(-0.2, -0.15, 0);
    this.mesh.add(this.legL);

    this.legR = this.legL.clone();
    this.legR.position.x = 0.2;
    this.mesh.add(this.legR);

    this.mesh.position.set(this.position.x, 0, this.position.z);
    this.scene.add(this.mesh);
  }

  update(dt, playerPos, map) {
    if (!this.isAlive) return;

    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.stateTimer += dt;

    const dx = playerPos.x - this.position.x;
    const dz = playerPos.z - this.position.z;
    const distToPlayer = Math.sqrt(dx * dx + dz * dz);

    if (distToPlayer < this.detectionRange) {
      this.state = distToPlayer < this.attackRange ? 'attack' : 'chase';
    } else if (this.state !== 'patrol') {
      this.state = 'patrol';
      this._pickPatrolTarget();
    }

    switch (this.state) {
      case 'patrol':
        this._doPatrol(dt);
        this._playWalkAnim();
        break;
      case 'chase':
        this._doChase(dt, dx, dz);
        this._playWalkAnim();
        break;
      case 'attack':
        this._doAttack(dt, dx, dz, distToPlayer);
        this._stopWalkAnim();
        break;
    }

    this.position.y = 1.6;
    this.mesh.position.set(this.position.x, 0, this.position.z);
    this.mesh.rotation.y = this.rotation;
  }

  _pickPatrolTarget() {
    const angle = Math.random() * Math.PI * 2;
    const dist = 5 + Math.random() * 15;
    this.patrolTarget = {
      x: this.position.x + Math.cos(angle) * dist,
      z: this.position.z + Math.sin(angle) * dist,
    };
    const limit = 35;
    this.patrolTarget.x = Math.max(-limit, Math.min(limit, this.patrolTarget.x));
    this.patrolTarget.z = Math.max(-limit, Math.min(limit, this.patrolTarget.z));
    this.stateTimer = 0;
  }

  _doPatrol(dt) {
    if (!this.patrolTarget || this.stateTimer > 5) {
      this._pickPatrolTarget();
      return;
    }

    const dx = this.patrolTarget.x - this.position.x;
    const dz = this.patrolTarget.z - this.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 1) {
      this._pickPatrolTarget();
      return;
    }

    this.rotation = Math.atan2(dx, dz);
    this.position.x += (dx / dist) * this.patrolSpeed * dt;
    this.position.z += (dz / dist) * this.patrolSpeed * dt;
  }

  _doChase(dt, dx, dz) {
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 0.1) return;

    this.rotation = Math.atan2(dx, dz);
    this.position.x += (dx / dist) * this.speed * dt;
    this.position.z += (dz / dist) * this.speed * dt;
  }

  _doAttack(dt, dx, dz, distToPlayer) {
    this.rotation = Math.atan2(dx, dz);

    if (distToPlayer > this.attackRange * 0.8) {
      const speed = this.speed * 0.5;
      this.position.x += (dx / distToPlayer) * speed * dt;
      this.position.z += (dz / distToPlayer) * speed * dt;
    }
  }

  _playWalkAnim() {
    const swing = Math.sin(this.stateTimer * 8) * 0.4;
    this.legL.rotation.x = swing;
    this.legR.rotation.x = -swing;
  }

  _stopWalkAnim() {
    this.legL.rotation.x = 0;
    this.legR.rotation.x = 0;
  }

  canAttack() {
    return this.attackTimer <= 0 && this.state === 'attack';
  }

  resetAttackCooldown() {
    this.attackTimer = this.attackCooldown;
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.isAlive = false;
      this.mesh.rotation.z = Math.PI / 2;
      this.mesh.position.y = 0.3;
    }
  }

  respawn(position) {
    this.position = { ...position };
    this.health = 100;
    this.isAlive = true;
    this.state = 'patrol';
    this.mesh.rotation.z = 0;
    this.mesh.position.y = 0;
    this._stopWalkAnim();
    this._pickPatrolTarget();
  }
}
