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
      grenadeThrowCooldown: 1.5,
    };

    this.ammo = this.config.maxAmmo;
    this.reserveAmmo = this.config.reserveAmmo;
    this.isReloading = false;
    this.reloadTimer = 0;
    this.fireCooldown = 0;
    this.muzzleFlashTimer = 0;
    this.recoilTimer = 0;

    // Grenade system
    this.grenades = 5;
    this.grenadeCooldown = 0;
    this.grenadeExplosions = [];

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

  /**
   * Throw a grenade toward the camera's facing direction.
   * @param {THREE.Scene} scene - The Three.js scene
   * @returns {Object|null} Grenade trajectory data, or null if on cooldown / no grenades
   */
  throwGrenade(scene) {
    if (this.grenades <= 0 || this.grenadeCooldown > 0) return null;
    this.grenades--;
    this.grenadeCooldown = this.config.grenadeThrowCooldown;

    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
    } catch (e) { /* ignore */ }

    const cam = scene.userData.camera;
    if (!cam) return null;

    const dir = new THREE.Vector3();
    cam.getWorldDirection(dir);
    const pos = cam.position.clone().add(dir.clone().multiplyScalar(1.0));
    pos.y += 0.3;

    // Create grenade mesh
    const grenadeMat = new THREE.MeshLambertMaterial({ color: 0x4a7a3b });
    const grenadeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), grenadeMat);
    grenadeMesh.position.copy(pos);
    scene.add(grenadeMesh);

    // Create fuse indicator (small emissive sphere)
    const fuseMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
    const fuse = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), fuseMat);
    fuse.position.y = 0.1;
    grenadeMesh.add(fuse);

    return {
      mesh: grenadeMesh,
      velocity: new THREE.Vector3(dir.x * 12, dir.y * 12 + 3, dir.z * 12),
      life: 3.0,
      fuseTimer: 1.5,
      bounced: false,
      scene: scene,
    };
  }

  /**
   * Explode a grenade at the given position with particle effects and area damage.
   * @param {THREE.Scene} scene - The Three.js scene
   * @param {THREE.Vector3} position - Explosion center
   * @param {Array} bots - Bot instances to check for damage
   * @param {number} explosionRadius - Radius of explosion
   * @param {number} explosionDamage - Damage dealt to bots in radius
   */
  explodeGrenade(scene, position, bots, explosionRadius = 8, explosionDamage = 100) {
    // Audio: explosion sound
    this._playExplosionSound();

    // --- Particle explosion effect ---
    const PC = 120;
    const posArr = new Float32Array(PC * 3);
    const colArr = new Float32Array(PC * 3);
    const vels = [];
    for (let i = 0; i < PC; i++) {
      posArr[i*3] = position.x; posArr[i*3+1] = position.y; posArr[i*3+2] = position.z;
      const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      const sp = 2 + Math.random() * 8;
      vels.push(Math.sin(ph)*Math.cos(th)*sp, Math.sin(ph)*Math.sin(th)*sp, Math.cos(ph)*sp);
      const t = Math.random();
      if (t < 0.2) { colArr[i*3]=1; colArr[i*3+1]=1; colArr[i*3+2]=1; }
      else if (t < 0.5) { colArr[i*3]=1; colArr[i*3+1]=0.9; colArr[i*3+2]=0.2; }
      else if (t < 0.8) { colArr[i*3]=1; colArr[i*3+1]=0.4; colArr[i*3+2]=0; }
      else { colArr[i*3]=0.8; colArr[i*3+1]=0.1; colArr[i*3+2]=0; }
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
    const pMat = new THREE.PointsMaterial({ size: 0.15, vertexColors: true, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);
    particles.userData.velocities = vels; particles.userData.age = 0; particles.userData.lifetime = 1.5;
    (scene.userData._explosionParticles = scene.userData._explosionParticles || []).push(particles);

    // --- Central flash sphere ---
    const flash = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 1 }));
    flash.position.copy(position); scene.add(flash);
    flash.userData.age = 0; flash.userData.lifetime = 0.4;
    (scene.userData._explosionFlashes = scene.userData._explosionFlashes || []).push(flash);

    // --- Smoke ring ---
    const smoke = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.4, 8, 16),
      new THREE.MeshBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.5 }));
    smoke.position.copy(position); smoke.rotation.x = Math.PI / 2; scene.add(smoke);
    smoke.userData.age = 0; smoke.userData.lifetime = 2.0;
    (scene.userData._explosionSmoke = scene.userData._explosionSmoke || []).push(smoke);

    // --- Damage bots in radius ---
    for (const bot of bots) {
      if (!bot.isAlive) continue;
      const dx = bot.position.x - position.x;
      const dz = bot.position.z - position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < explosionRadius) {
        const falloff = 1 - (dist / explosionRadius);
        const dmg = Math.round(explosionDamage * falloff);
        bot.takeDamage(dmg);
      }
    }
  }

  _playExplosionSound() {
    if (!this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    const now = this.audioCtx.currentTime;
    // Low rumble
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.5);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain).connect(this.audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
    // Noise burst
    const bufferSize = this.audioCtx.sampleRate * 0.15;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    noise.connect(noiseGain).connect(this.audioCtx.destination);
    noise.start(now);
    noise.stop(now + 0.15);
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

    // Grenade cooldown
    if (this.grenadeCooldown > 0) {
      this.grenadeCooldown -= dt;
    }

    // Update grenade trajectories
    this._updateGrenades(dt);

    // Update explosion visual effects
    this._updateExplosionEffects(dt);
  }

  /**
   * Update explosion particle effects and clean up finished animations.
   * @param {number} dt - Delta time
   */
  _updateExplosionEffects(dt) {
    const scene = this.scene;
    if (!scene || !scene.userData) return;
    const ud = scene.userData;

    // Animate particles
    const pa = ud._explosionParticles || [];
    for (let i = pa.length - 1; i >= 0; i--) {
      const p = pa[i]; p.userData.age += dt;
      if (p.userData.age >= p.userData.lifetime) {
        scene.remove(p); p.geometry.dispose(); p.material.dispose(); pa.splice(i, 1); continue;
      }
      const r = p.userData.age / p.userData.lifetime;
      p.material.opacity = 1 - r;
      const pos = p.geometry.attributes.position.array;
      const vels = p.userData.velocities;
      for (let j = 0; j < vels.length / 3; j++) {
        pos[j*3] += vels[j*3]*dt; pos[j*3+1] += vels[j*3+1]*dt; pos[j*3+2] += vels[j*3+2]*dt;
        vels[j*3+1] -= 5*dt; vels[j*3] *= 0.98; vels[j*3+1] *= 0.98; vels[j*3+2] *= 0.98;
      }
      p.geometry.attributes.position.needsUpdate = true;
    }

    // Animate flash spheres
    const fa = ud._explosionFlashes || [];
    for (let i = fa.length - 1; i >= 0; i--) {
      const f = fa[i]; f.userData.age += dt;
      if (f.userData.age >= f.userData.lifetime) {
        scene.remove(f); f.geometry.dispose(); f.material.dispose(); fa.splice(i, 1); continue;
      }
      const r = f.userData.age / f.userData.lifetime;
      f.material.opacity = 1 - r; f.scale.setScalar(1 + r * 4);
    }

    // Animate smoke rings
    const sa = ud._explosionSmoke || [];
    for (let i = sa.length - 1; i >= 0; i--) {
      const s = sa[i]; s.userData.age += dt;
      if (s.userData.age >= s.userData.lifetime) {
        scene.remove(s); s.geometry.dispose(); s.material.dispose(); sa.splice(i, 1); continue;
      }
      const r = s.userData.age / s.userData.lifetime;
      s.material.opacity = 0.5 * (1 - r); s.scale.setScalar(1 + r * 3);
    }
  }

  /**
   * Update active grenade trajectories and handle explosions.
   * @param {number} dt - Delta time
   */
  _updateGrenades(dt) {
    const explosions = this.grenadeExplosions;
    for (let i = explosions.length - 1; i >= 0; i--) {
      const g = explosions[i];

      // Remove if scene was destroyed
      if (!g.scene || !g.scene.children.includes(g.mesh)) {
        explosions.splice(i, 1);
        continue;
      }

      g.life -= dt;
      g.fuseTimer -= dt;

      if (g.life <= 0) {
        // Remove mesh
        g.scene.remove(g.mesh);
        g.mesh.geometry.dispose();
        g.mesh.material.dispose();
        explosions.splice(i, 1);
        continue;
      }

      // Apply gravity after first bounce or after a short time
      if (!g.bounced) {
        g.velocity.y -= 10 * dt;
        g.mesh.position.x += g.velocity.x * dt;
        g.mesh.position.y += g.velocity.y * dt;
        g.mesh.position.z += g.velocity.z * dt;
        g.mesh.rotation.x += dt * 5;
        g.mesh.rotation.z += dt * 3;

        // Ground bounce
        if (g.mesh.position.y <= 0.08) {
          g.mesh.position.y = 0.08;
          g.velocity.y = Math.abs(g.velocity.y) * 0.3;
          g.velocity.x *= 0.7;
          g.velocity.z *= 0.7;
          g.bounced = true;
          // If velocity is very small, just settle
          if (Math.abs(g.velocity.y) < 0.5) {
            g.velocity.y = 0;
          }
        }
      } else {
        g.mesh.position.y -= 0.02; // slowly sink
      }

      // Fuse countdown: pulse the fuse color
      const fuseScale = g.fuseTimer > 0 ? 1 + Math.sin(g.fuseTimer * 20) * 0.3 : 0.5;
      if (g.mesh.children[0]) {
        g.mesh.children[0].scale.setScalar(fuseScale);
      }

      // Detonate when fuse runs out
      if (g.fuseTimer <= 0) {
        const pos = g.mesh.position.clone();
        g.scene.remove(g.mesh);
        g.mesh.geometry.dispose();
        g.mesh.material.dispose();
        explosions.splice(i, 1);

        // Trigger explosion callback
        if (g.onExplode) {
          g.onExplode(pos);
        }
      }
    }
  }

  /**
   * Add ammo reward (called when a bot is killed).
   * @param {number} count - Number of bullets to add
   */
  addAmmo(count) {
    this.reserveAmmo += count;
  }

  /**
   * Add grenades.
   * @param {number} count - Number of grenades to add
   */
  addGrenades(count) {
    this.grenades += count;
  }

  /**
   * Get current ammo & grenade stats.
   * @returns {Object}
   */
  getAmmo() {
    return {
      current: this.ammo,
      reserve: this.reserveAmmo,
      max: this.config.maxAmmo,
      grenades: this.grenades,
    };
  }

  updatePosition(camera) {
    const offset = new THREE.Vector3(0.25, -0.2, -0.5);
    offset.applyEuler(camera.rotation);
    this.group.position.copy(camera.position).add(offset);
    this.group.rotation.y = camera.rotation.y;
    this.group.rotation.x = camera.rotation.x + this.group.rotation.x;
  }
}
