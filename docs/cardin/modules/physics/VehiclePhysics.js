/**
 * @file VehiclePhysics.js
 * @description 运动学驾驶物理模拟：速度、转向、漂移、摩擦力
 */
import * as THREE from '../../lib/three.module.js';

export class VehiclePhysics {
    constructor() {
        this.maxSpeed = 0.8;
        this.acceleration = 0.02;
        this.deceleration = 0.01;
        this.friction = 0.005;
        this.turnSpeed = 0.04;

        this.driftFactor = 0.96;
        this.gripFactor = 0.85;

        this.nitroBoost = 0.05;
        this.nitroMax = 100;
        this.currentNitro = 0;
        this.isDrifting = false;
        this.speed = 0;

        this.velocity = new THREE.Vector3();
        this.forwardVector = new THREE.Vector3();
    }

    update(vehicleMesh, input, dt = 1 / 60) {
        const f = dt * 60;

        vehicleMesh.getWorldDirection(this.forwardVector);

        let throttleInput = input.getThrottle();
        let steerInput = input.getSteering();
        let isDrifting = input.isDrifting();
        let isNitroActive = input.isNitro() && this.currentNitro > 0;

        if (throttleInput !== 0) {
            this.speed += throttleInput * this.acceleration * f;
            if (isNitroActive) {
                this.speed += this.nitroBoost * f;
                this.currentNitro -= 1 * f;
            }
        } else {
            this.speed *= Math.pow(1 - this.friction, f);
        }

        let currentMax = this.maxSpeed;
        if (isNitroActive) currentMax *= 1.5;
        this.speed = Math.max(-this.maxSpeed / 2, Math.min(currentMax, this.speed));

        this.isDrifting = isDrifting && Math.abs(this.speed) > 0.1;

        if (steerInput !== 0) {
            let turnMultiplier = this.isDrifting ? 1.2 : 1.0;
            if (this.speed < 0) turnMultiplier *= -1;
            turnMultiplier *= 1.0 - Math.min(Math.abs(this.speed) / currentMax, 0.8) * 0.3;

            vehicleMesh.rotation.y -= steerInput * this.turnSpeed * turnMultiplier * f;

            if (this.isDrifting) {
                this.currentNitro = Math.min(this.nitroMax, this.currentNitro + 0.5 * f);
            }
        }

        const direction = new THREE.Vector3(0, 0, 1);
        direction.applyQuaternion(vehicleMesh.quaternion);

        if (this.isDrifting) {
            const right = new THREE.Vector3().crossVectors(direction, vehicleMesh.up);
            const driftDir = steerInput * 0.1 * f;
            vehicleMesh.position.add(right.multiplyScalar(driftDir));
        }

        vehicleMesh.position.add(direction.multiplyScalar(this.speed * f));

        vehicleMesh.position.y = 0;

        if (steerInput !== 0 && Math.abs(this.speed) > 0.05) {
            vehicleMesh.rotation.z = THREE.MathUtils.lerp(
                vehicleMesh.rotation.z, -steerInput * 0.15, 0.1
            );
        } else {
            vehicleMesh.rotation.z = THREE.MathUtils.lerp(vehicleMesh.rotation.z, 0, 0.1);
        }

        if (this.isDrifting) {
            vehicleMesh.rotation.x = THREE.MathUtils.lerp(vehicleMesh.rotation.x, 0.05, 0.05);
        } else {
            vehicleMesh.rotation.x = THREE.MathUtils.lerp(vehicleMesh.rotation.x, 0, 0.1);
        }

        return {
            speed: this.speed,
            nitro: this.currentNitro,
            nitroMax: this.nitroMax,
            isDrifting: this.isDrifting
        };
    }

    reset() {
        this.speed = 0;
        this.currentNitro = 0;
        this.velocity.set(0, 0, 0);
    }
}
