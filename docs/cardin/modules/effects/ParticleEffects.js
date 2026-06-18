/**
 * @file ParticleEffects.js
 * @description 粒子特效系统：漂移火花、氮气尾焰
 */
import * as THREE from '../../lib/three.module.js';

const PARTICLE_GEO = new THREE.SphereGeometry(0.06, 4, 4);
const DRIFT_COLORS = [
    new THREE.Color(0xff6600),
    new THREE.Color(0xffcc00),
    new THREE.Color(0xff3300),
];
const NITRO_COLORS = [
    new THREE.Color(0x0066ff),
    new THREE.Color(0x00ccff),
    new THREE.Color(0x88eeff),
];

export class ParticleEffects {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.maxParticles = 200;
    }

    emitDriftSparks(position, steerInput, quaternion) {
        if (this.particles.length >= this.maxParticles) return;
        const count = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < count; i++) {
            const sideOffset = new THREE.Vector3(
                (steerInput > 0 ? -0.5 : 0.5) + (Math.random() - 0.5) * 0.3,
                0.1,
                0.6
            );
            sideOffset.applyQuaternion(quaternion);

            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.15,
                Math.random() * 0.15 + 0.05,
                (Math.random() - 0.5) * 0.15
            );

            const color = DRIFT_COLORS[Math.floor(Math.random() * DRIFT_COLORS.length)].clone();
            this._spawn(position.clone().add(sideOffset), velocity, color, 0.3 + Math.random() * 0.3);
        }
    }

    emitNitroFlame(position, quaternion) {
        if (this.particles.length >= this.maxParticles) return;
        const backOffset = new THREE.Vector3(0, 0.3, -1.0);
        backOffset.applyQuaternion(quaternion);

        const velocity = new THREE.Vector3(0, 0, -1)
            .applyQuaternion(quaternion)
            .multiplyScalar(0.2 + Math.random() * 0.1);
        velocity.x += (Math.random() - 0.5) * 0.05;
        velocity.y += (Math.random() - 0.5) * 0.05;

        const color = NITRO_COLORS[Math.floor(Math.random() * NITRO_COLORS.length)].clone();
        this._spawn(position.clone().add(backOffset), velocity, color, 0.2 + Math.random() * 0.15);
    }

    emitHitBurst(position) {
        const hitColors = [
            new THREE.Color(0xff0000),
            new THREE.Color(0xff3300),
            new THREE.Color(0xff6600),
        ];
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const speed = 0.08 + Math.random() * 0.08;
            const velocity = new THREE.Vector3(
                Math.cos(angle) * speed,
                Math.random() * 0.15 + 0.05,
                Math.sin(angle) * speed
            );
            const color = hitColors[Math.floor(Math.random() * hitColors.length)].clone();
            this._spawn(
                position.clone().add(new THREE.Vector3(0, 0.5, 0)),
                velocity,
                color,
                0.4 + Math.random() * 0.3
            );
        }
    }

    _spawn(pos, vel, color, life) {
        const mat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 1,
        });
        const mesh = new THREE.Mesh(PARTICLE_GEO, mat);
        mesh.position.copy(pos);
        this.scene.add(mesh);
        this.particles.push({ mesh, velocity: vel, life, maxLife: life, startColor: color.clone() });
    }

    update(dt) {
        const f = dt * 60;
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.material.dispose();
                this.particles.splice(i, 1);
                continue;
            }
            p.mesh.position.add(p.velocity.clone().multiplyScalar(f));
            p.velocity.y -= 0.005 * f;
            const t = p.life / p.maxLife;
            p.mesh.material.opacity = t;
            p.mesh.scale.setScalar(t * 0.8 + 0.2);
            p.mesh.material.color.lerpColors(p.startColor, new THREE.Color(0x333333), 1 - t);
        }
    }

    dispose() {
        for (const p of this.particles) {
            this.scene.remove(p.mesh);
            p.mesh.material.dispose();
        }
        this.particles.length = 0;
    }
}
