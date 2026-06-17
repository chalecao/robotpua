/**
 * @module GameLoop
 * @description 游戏主循环：协调输入、玩家移动、武器系统、Bot AI、HUD 更新
 */
import * as THREE from 'three';
import { init, getScene, getCamera, getRenderer } from '../core/Init.js';
import { Input } from '../core/Input.js';
import { Player } from '../player/Player.js';
import { CameraController } from '../player/CameraController.js';
import { Gun } from '../weapon/Gun.js';
import { GameMap } from '../world/Map.js';
import { BotManager } from '../world/BotManager.js';
import { HUD } from '../ui/HUD.js';

export class GameLoop {
  constructor() {
    this.container = document.getElementById('game-container');
    this.clock = new THREE.Clock();
    this.player = null;
    this.camera = null;
    this.cameraCtrl = null;
    this.weapon = null;
    this.map = null;
    this.botManager = null;
    this.hud = null;
    this.input = null;
    this.renderer = null;
    this.scene = null;
    this.isRunning = false;
    this.kills = 0;
    this.initialBots = 5;
    this.wave = 1;
    this.waveClearTimer = null;
    this.waveClearDelay = 3.0;
    this._deathShown = false;
    this._gameStarted = false;
  }

  start() {
    const { scene, camera, renderer } = init(this.container);
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.scene.userData.camera = camera;

    const canvas = renderer.domElement;
    this.input = new Input(canvas);

    this.map = new GameMap(scene);
    this.player = new Player();
    this.cameraCtrl = new CameraController(camera, canvas);
    this.weapon = new Gun(scene);
    this.botManager = new BotManager(scene, this.initialBots);

    this.hud = new HUD();
    this.hud.updateHealth(this.player.health);
    this.hud.updateAmmo(this.weapon.ammo, this.weapon.reserveAmmo, false);
    this.hud.updateKills(this.kills);
    this.hud.updateBotsAlive(this.initialBots);
    this.hud.showStartScreen();

    const startScreen = document.getElementById('start-screen');
    startScreen.addEventListener('click', () => {
      this._gameStarted = true;
      this.hud.hideStartScreen();
      const canvas = this.renderer.domElement;
      try { canvas.requestPointerLock(); } catch (e) { /* ignore */ }
    });

    document.addEventListener('click', (e) => {
      if (!this._gameStarted || e.target.id === 'restart-btn') return;
      if (!this.input.pointerLocked) {
        try { this.renderer.domElement.requestPointerLock(); } catch (e) { /* ignore */ }
      }
    });

    document.getElementById('restart-btn').addEventListener('click', () => this.restart());

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.isRunning = false;
      else { this.isRunning = true; this.clock.getDelta(); this.animate(); }
    });

    this.isRunning = true;
    this.animate();
  }

  animate() {
    if (!this.isRunning) return;
    requestAnimationFrame(() => this.animate());

    const dt = Math.min(this.clock.getDelta(), 0.1);
    this.input.update();
    this.hud.update(dt);

    if (this.player.isAlive) {
      this.updateMovement(dt);
      this.cameraCtrl.update();
      this.updateWeapon(dt);
      this.weapon.updatePosition(this.camera);
    }

    this.botManager.update(dt, this.player.position, this.map, (bot) => {
      if (!this.player.isAlive) return;
      const dx = bot.position.x - this.player.position.x;
      const dz = bot.position.z - this.player.position.z;
      if (Math.sqrt(dx * dx + dz * dz) < bot.attackRange) {
        this.player.takeDamage(bot.damage);
        this.hud.showDamageFlash();
        this.hud.updateHealth(this.player.health);
      }
    }, this.map.getWallMeshes());

    this.hud.updateKills(this.kills);
    this.hud.updateBotsAlive(this.botManager.getAliveCount());

    if (this.player.isAlive && this.botManager.getAliveCount() === 0) {
      if (this.waveClearTimer === null) {
        this.waveClearTimer = 0;
        this.hud.showMessage(`Wave ${this.wave} Clear!`);
      }
      this.waveClearTimer += dt;
      if (this.waveClearTimer >= this.waveClearDelay) {
        this.wave++;
        this.botManager.respawnAll();
        this.waveClearTimer = null;
        this.hud.showMessage(`Wave ${this.wave}`);
      }
    } else {
      this.waveClearTimer = null;
    }

    if (!this.player.isAlive && !this._deathShown) {
      this.hud.showDeathScreen();
      this._deathShown = true;
    }

    this.renderer.render(this.scene, this.camera);
  }

  updateMovement(dt) {
    // 不再因指针锁未获取而整体跳过：WASD 应在游戏开始后始终可用；
    // 鼠标视角是否生效取决于 isLocked()，键盘移动与指针锁解耦。

    const keys = this.input.keys;
    const move = { x: 0, z: 0 };
    const sprint = keys['ShiftLeft'] || keys['ShiftRight'];
    const speed = sprint ? 10 : 6;

    const forward = this.cameraCtrl.getForwardDir();
    const right = this.cameraCtrl.getRightDir();
    forward.y = 0; right.y = 0;

    const fLen = Math.sqrt(forward.x ** 2 + forward.z ** 2);
    const rLen = Math.sqrt(right.x ** 2 + right.z ** 2);
    forward.x /= fLen; forward.z /= fLen;
    right.x /= rLen; right.z /= rLen;

    if (keys['KeyW']) { move.x += forward.x; move.z += forward.z; }
    if (keys['KeyS']) { move.x -= forward.x; move.z -= forward.z; }
    if (keys['KeyA']) { move.x -= right.x; move.z -= right.z; }
    if (keys['KeyD']) { move.x += right.x; move.z += right.z; }

    const mLen = Math.sqrt(move.x ** 2 + move.z ** 2);
    if (mLen > 0) { move.x = (move.x / mLen) * speed; move.z = (move.z / mLen) * speed; }

    this.player.velocity.x = move.x;
    this.player.velocity.z = move.z;

    if (keys['Space'] && this.player.isGrounded) {
      this.player.velocity.y = 8;
      this.player.isGrounded = false;
    }

    this.player.velocity.y -= 25 * dt;
    this.player.velocity.y = Math.max(this.player.velocity.y, -30);

    const oldPos = { ...this.player.position };
    this.player.position.x += this.player.velocity.x * dt;
    this.player.position.y += this.player.velocity.y * dt;
    this.player.position.z += this.player.velocity.z * dt;

    const resolved = this.map.resolveCollision(oldPos, this.player.position, this.player.radius);
    this.player.position.x = resolved.x;
    this.player.position.z = resolved.z;

    if (this.player.position.y <= this.player.height) {
      this.player.position.y = this.player.height;
      this.player.velocity.y = 0;
      this.player.isGrounded = true;
    }

    const limit = this.map.size / 2 - 1;
    this.player.position.x = Math.max(-limit, Math.min(limit, this.player.position.x));
    this.player.position.z = Math.max(-limit, Math.min(limit, this.player.position.z));

    this.camera.position.set(this.player.position.x, this.player.position.y, this.player.position.z);
  }

  updateWeapon(dt) {
    this.weapon.update(dt);

    const ammo = this.weapon.getAmmo();
    this.hud.updateAmmo(ammo.current, ammo.reserve, this.weapon.isReloading);

    if (this.input.isMouseDown() && !this.weapon.isReloading) {
      this.weapon.fire(this.botManager.getAllBots(), this.map.getWallMeshes(), (bot, damage, isHead) => {
        bot.takeDamage(damage);
        this.hud.showHitMarker(isHead);
        if (!bot.isAlive) {
          this.kills++;
          this.hud.showMessage('击杀!');
        }
      });
    }

    if (this.input.isJustPressed('KeyR')) this.weapon.reload();

    if (this.weapon.ammo === 0 && !this.weapon.isReloading && this.weapon.reserveAmmo > 0) {
      this.weapon.reload();
    }
  }

  restart() {
    this.player.respawn();
    this.camera.position.set(0, 1.6, 0);
    this.cameraCtrl.pitch = 0;
    this.cameraCtrl.yaw = 0;

    this.weapon.ammo = this.weapon.config.maxAmmo;
    this.weapon.reserveAmmo = this.weapon.config.reserveAmmo;
    this.weapon.isReloading = false;

    this.botManager.fullReset();

    this.kills = 0;
    this.wave = 1;
    this.waveClearTimer = null;
    this._deathShown = false;
    this.hud.hideDeathScreen();
    this.hud.hideMessage();
    this.hud.updateHealth(this.player.health);
    this.hud.updateKills(this.kills);
    this.hud.updateBotsAlive(this.initialBots);
  }
}
