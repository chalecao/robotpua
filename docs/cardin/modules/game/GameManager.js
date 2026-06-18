/**
 * @file GameManager.js
 * @description 游戏状态管理、UI 更新、循环控制
 */
export class GameManager {
    constructor(engine) {
        this.engine = engine;
        this.speedDisplay = document.getElementById('speed-display');
        this.nitroBar = document.getElementById('nitro-bar');
        this.lapDisplay = document.getElementById('lap-display');
        this.driftIndicator = document.getElementById('drift-indicator');
        this.hitIndicator = document.getElementById('hit-indicator');
        this.itemGetIndicator = document.getElementById('item-get-indicator');
        this.hitTimer = 0;
        this.itemGetTimer = 0;
    }

    updateUI(physicsState, lapCount = 0) {
        const displaySpeed = Math.floor(Math.abs(physicsState.speed) * 200);
        this.speedDisplay.innerText = displaySpeed;

        const nitroPercent = (physicsState.nitro / (physicsState.nitroMax || 100)) * 100;
        this.nitroBar.style.width = `${nitroPercent}%`;

        if (this.lapDisplay) {
            this.lapDisplay.innerText = lapCount;
        }

        if (this.driftIndicator) {
            this.driftIndicator.style.opacity = physicsState.isDrifting ? '1' : '0';
        }

        if (physicsState.isDrifting) {
            this.speedDisplay.style.color = '#FFD700';
            this.nitroBar.style.background = 'linear-gradient(90deg, #ff6600, #ffcc00)';
        } else {
            this.speedDisplay.style.color = 'white';
            this.nitroBar.style.background = 'linear-gradient(90deg, #ffcc00, #ff0000)';
        }

        if (this.hitTimer > 0) {
            this.hitTimer -= 1 / 60;
            if (this.hitTimer <= 0) {
                this.hitIndicator.style.opacity = '0';
                this.hitIndicator.style.transform = 'translate(-50%, -50%) scale(0.8)';
            }
        }

        if (this.itemGetTimer > 0) {
            this.itemGetTimer -= 1 / 60;
            if (this.itemGetTimer <= 0) {
                if (this.itemGetIndicator) {
                    this.itemGetIndicator.style.opacity = '0';
                    this.itemGetIndicator.style.transform = 'translateX(-50%) scale(0.8)';
                }
            }
        }
    }

    showHit() {
        if (!this.hitIndicator) return;
        this.hitIndicator.style.opacity = '1';
        this.hitIndicator.style.transform = 'translate(-50%, -50%) scale(1.2)';
        this.hitTimer = 1.0;
    }

    showItemGet() {
        if (!this.itemGetIndicator) return;
        this.itemGetIndicator.style.opacity = '1';
        this.itemGetIndicator.style.transform = 'translateX(-50%) scale(1.2)';
        this.itemGetTimer = 1.0;
    }
}
