/**
 * @module Gun
 * @description 主武器（步枪）：射击逻辑、冷却时间、弹药管理、换弹动画
 */
import * as THREE from 'three';

export class Gun {
  constructor(scene) {
    this.scene = scene;
    this.config = {
      fireRate: 0.1,
      maxAmmo: 30,
      reserveAmmo: 90,
      bodyDamage: 34,
      headDamage: 100,
      reloadTime: 2.0,
    };

    this.ammo = this.config.maxAmmo;
    this.reserveAmmo = this.config.reserveAmmo;
    this.isReloading = false;
    this.reloadTimer = 0;
    this.fireCooldown = 0;
    this.muzzleFlashTimer = 0;
    this.recoilTimer = 0;

    this.group = new THREE.Group();
    this._buildModel();
    scene.add(this.group);

    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      this.audioCtx = null;
    }
  }

  _playFireSound() {
    if (!this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.08);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain).connect(this.audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  _buildModel() {
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const barrelMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const gripMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.5), bodyMat);
    this.group.add(body);

    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.35), barrelMat);
    barrel.position.set(0, 0.01, -0.42);
    this.group.add(barrel);

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.08), gripMat);
    grip.position.set(0, -0.1, 0.1);
    this.group.add(grip);

    const magazine = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.06), bodyMat);
    magazine.position.set(0, -0.1, -0.05);
    this.group.add(magazine);

    const sight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.1), barrelMat);
    sight.position.set(0, 0.06, -0.1);
    this.group.add(sight);

    this.muzzleFlash = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffff44, transparent: true, opacity: 0 })
    );
    this.muzzleFlash.position.set(0, 0.01, -0.6);
    this.group.add(this.muzzleFlash);
  }

  fire(bots, wallMeshes, onHit) {
    if (this.fireCooldown > 0 || this.ammo <= 0 || this.isReloading) return false;

    this.ammo--;
    this.fireCooldown = this.config.fireRate;
    this.muzzleFlashTimer = 0.05;
    this.recoilTimer = 0.08;
    this._playFireSound();

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.scene.userData.camera);

    const botMeshes = bots.map(b => b.mesh).filter(Boolean);
    const allTargets = [...botMeshes, ...wallMeshes];
    const hits = raycaster.intersectObjects(allTargets, true);

    if (hits.length > 0) {
      const hit = hits[0];
      const isWall = wallMeshes.some(w => {
        let obj = hit.object;
        while (obj) {
          if (obj === w) return true;
          obj = obj.parent;
        }
        return false;
      });

      if (!isWall) {
        const bot = bots.find(b => {
          let obj = hit.object;
          while (obj) {
            if (obj === b.mesh) return true;
            obj = obj.parent;
          }
          return false;
        });
        if (bot) {
          const isHead = hit.object.name === 'head';
          const damage = isHead ? this.config.headDamage : this.config.bodyDamage;
          onHit(bot, damage, isHead);
        }
      }
    }

    return true;
  }

  reload() {
    if (this.isReloading || this.ammo >= this.config.maxAmmo || this.reserveAmmo <= 0) return;
    this.isReloading = true;
    this.reloadTimer = this.config.reloadTime;
  }

  update(dt) {
    if (this.fireCooldown > 0) this.fireCooldown -= dt;

    if (this.isReloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        const needed = this.config.maxAmmo - this.ammo;
        const toLoad = Math.min(needed, this.reserveAmmo);
        this.ammo += toLoad;
        this.reserveAmmo -= toLoad;
        this.isReloading = false;
      }
    }

    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= dt;
      this.muzzleFlash.material.opacity = this.muzzleFlashTimer / 0.05;
      this.muzzleFlash.visible = true;
    } else {
      this.muzzleFlash.visible = false;
    }

    if (this.recoilTimer > 0) {
      this.recoilTimer -= dt;
      this.group.rotation.x = (this.recoilTimer / 0.08) * 0.15;
    } else {
      this.group.rotation.x = 0;
    }
  }

  updatePosition(camera) {
    const offset = new THREE.Vector3(0.25, -0.2, -0.5);
    offset.applyEuler(camera.rotation);
    this.group.position.copy(camera.position).add(offset);
    this.group.rotation.y = camera.rotation.y;
    this.group.rotation.x = camera.rotation.x + this.group.rotation.x;
  }

  getAmmo() {
    return { current: this.ammo, reserve: this.reserveAmmo, max: this.config.maxAmmo };
  }
}
