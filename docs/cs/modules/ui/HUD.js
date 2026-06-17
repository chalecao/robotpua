/**
 * @module HUD
 * @description 游戏界面 HUD：血量条、弹药显示、十字准星、击杀计数、状态提示
 */
export class HUD {
  constructor() {
    this.elements = {
      healthBar: document.getElementById('health-bar'),
      healthText: document.getElementById('health-text'),
      ammoText: document.getElementById('ammo-text'),
      killsText: document.getElementById('kills-text'),
      crosshair: document.getElementById('crosshair'),
      damageFlash: document.getElementById('damage-flash'),
      hitMarker: document.getElementById('hit-marker'),
      startScreen: document.getElementById('start-screen'),
      deathScreen: document.getElementById('death-screen'),
      statusMessage: document.getElementById('status-message'),
      reloadIndicator: document.getElementById('reload-indicator'),
      botsAlive: document.getElementById('bots-alive'),
    };
    this.hitMarkerTimer = 0;
  }

  updateHealth(health) {
    this.elements.healthBar.style.width = `${health}%`;
    this.elements.healthText.textContent = health;

    if (health > 60) {
      this.elements.healthBar.style.background = 'linear-gradient(90deg, #2ecc71, #27ae60)';
    } else if (health > 30) {
      this.elements.healthBar.style.background = 'linear-gradient(90deg, #f39c12, #e67e22)';
    } else {
      this.elements.healthBar.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
    }
  }

  updateAmmo(current, reserve, isReloading) {
    const ammoText = current.toString().padStart(2, '0');
    const reserveText = reserve.toString().padStart(2, '0');
    this.elements.ammoText.innerHTML = `<span class="current">${ammoText}</span> / ${reserveText}`;
    this.elements.reloadIndicator.style.display = isReloading ? 'block' : 'none';
  }

  updateKills(kills) {
    this.elements.killsText.textContent = kills;
  }

  updateBotsAlive(count) {
    this.elements.botsAlive.textContent = count;
  }

  showHitMarker(isHeadshot) {
    this.hitMarkerTimer = 0.15;
    this.elements.hitMarker.style.display = 'block';
    this.elements.hitMarker.style.color = isHeadshot ? '#ff4444' : '#ffffff';
  }

  showDamageFlash() {
    this.elements.damageFlash.style.opacity = '0.4';
  }

  showMessage(text) {
    const el = this.elements.statusMessage;
    el.textContent = text;
    el.style.animation = 'none';
    el.style.display = 'none';
    void el.offsetWidth;
    el.style.display = 'block';
    el.style.animation = '';
  }

  hideMessage() {
    this.elements.statusMessage.style.display = 'none';
  }

  showStartScreen() {
    this.elements.startScreen.style.display = 'flex';
    this.elements.crosshair.style.display = 'none';
  }

  hideStartScreen() {
    this.elements.startScreen.style.display = 'none';
    this.elements.crosshair.style.display = 'block';
  }

  showDeathScreen() {
    this.elements.deathScreen.style.display = 'flex';
  }

  hideDeathScreen() {
    this.elements.deathScreen.style.display = 'none';
  }

  update(dt) {
    if (this.hitMarkerTimer > 0) {
      this.hitMarkerTimer -= dt;
      if (this.hitMarkerTimer <= 0) {
        this.elements.hitMarker.style.display = 'none';
      }
    }

    const flash = this.elements.damageFlash;
    const opacity = parseFloat(flash.style.opacity) || 0;
    if (opacity > 0) {
      flash.style.opacity = Math.max(0, opacity - dt * 2);
    }
  }
}
