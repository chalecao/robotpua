/**
 * @module Map
 * @description 地图生成与碰撞盒管理，包含地面、墙体、掩体障碍物
 */
import * as THREE from 'three';

export class GameMap {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.wallMeshes = [];
    this.size = 80;

    this._buildGround();
    this._buildWalls();
    this._buildObstacles();
  }

  _buildGround() {
    const geo = new THREE.PlaneGeometry(this.size, this.size, 20, 20);
    const mat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const gridMat = new THREE.MeshLambertMaterial({ color: 0x6b5b3a });
    for (let i = -this.size / 2; i <= this.size / 2; i += 10) {
      const lineX = new THREE.Mesh(new THREE.BoxGeometry(this.size, 0.02, 0.1), gridMat);
      lineX.position.set(0, 0.01, i);
      this.scene.add(lineX);

      const lineZ = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, this.size), gridMat);
      lineZ.position.set(i, 0.01, 0);
      this.scene.add(lineZ);
    }
  }

  _buildWalls() {
    const half = this.size / 2;
    const wallH = 5;
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });

    const walls = [
      { pos: [0, wallH / 2, -half], size: [this.size, wallH, 1] },
      { pos: [0, wallH / 2, half], size: [this.size, wallH, 1] },
      { pos: [-half, wallH / 2, 0], size: [1, wallH, this.size] },
      { pos: [half, wallH / 2, 0], size: [1, wallH, this.size] },
    ];

    walls.forEach(w => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...w.size), wallMat);
      mesh.position.set(...w.pos);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.colliders.push(new THREE.Box3().setFromObject(mesh));
      this.wallMeshes.push(mesh);
    });
  }

  _buildObstacles() {
    const matA = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
    const matB = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });

    const obstacles = [
      { pos: [0, 1.5, -15], size: [8, 3, 1.5] },
      { pos: [0, 1.5, 15], size: [8, 3, 1.5] },
      { pos: [-15, 1.5, 0], size: [1.5, 3, 8] },
      { pos: [15, 1.5, 0], size: [1.5, 3, 8] },
      { pos: [-10, 1, -10], size: [3, 2, 3] },
      { pos: [10, 1, -10], size: [3, 2, 3] },
      { pos: [-10, 1, 10], size: [3, 2, 3] },
      { pos: [10, 1, 10], size: [3, 2, 3] },
      { pos: [-20, 1.5, -5], size: [2, 3, 6] },
      { pos: [20, 1.5, 5], size: [2, 3, 6] },
      { pos: [-5, 1, -20], size: [6, 2, 2] },
      { pos: [5, 1, 20], size: [6, 2, 2] },
      { pos: [-25, 1, 15], size: [4, 2, 4] },
      { pos: [25, 1, -15], size: [4, 2, 4] },
      { pos: [-30, 1, 0], size: [3, 2, 3] },
      { pos: [30, 1, 0], size: [3, 2, 3] },
      { pos: [0, 1, -30], size: [3, 2, 3] },
      { pos: [0, 1, 30], size: [3, 2, 3] },
    ];

    obstacles.forEach((o, i) => {
      const mat = i % 2 === 0 ? matA : matB;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...o.size), mat);
      mesh.position.set(...o.pos);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.colliders.push(new THREE.Box3().setFromObject(mesh));
      this.wallMeshes.push(mesh);
    });
  }

  checkCollision(position, radius) {
    const playerBox = new THREE.Box3(
      new THREE.Vector3(position.x - radius, position.y - 1.6, position.z - radius),
      new THREE.Vector3(position.x + radius, position.y + 0.2, position.z + radius)
    );
    for (const box of this.colliders) {
      if (playerBox.intersectsBox(box)) return true;
    }
    return false;
  }

  resolveCollision(oldPos, newPos, radius) {
    if (!this.checkCollision(newPos, radius)) return newPos;

    const slideX = { x: newPos.x, y: newPos.y, z: oldPos.z };
    if (!this.checkCollision(slideX, radius)) return slideX;

    const slideZ = { x: oldPos.x, y: newPos.y, z: newPos.z };
    if (!this.checkCollision(slideZ, radius)) return slideZ;

    return oldPos;
  }

  getWallMeshes() {
    return this.wallMeshes;
  }
}
