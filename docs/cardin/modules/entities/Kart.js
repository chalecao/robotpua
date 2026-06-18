/**
 * @file Kart.js
 * @description 卡丁车 3D 模型组装
 */
import * as THREE from '../../lib/three.module.js';

export class Kart {
    constructor(color = 0xff0000) {
        this.mesh = new THREE.Group();
        this.originalColor = color;

        const bodyGeo = new THREE.BoxGeometry(1, 0.5, 2);
        const bodyMat = new THREE.MeshStandardMaterial({ color: color });
        this.body = new THREE.Mesh(bodyGeo, bodyMat);
        this.body.position.y = 0.5;
        this.body.castShadow = true;
        this.mesh.add(this.body);

        const cockpitGeo = new THREE.BoxGeometry(0.6, 0.4, 1);
        const cockpitMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
        cockpit.position.set(0, 0.9, -0.2);
        this.mesh.add(cockpit);

        const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

        const positions = [
            [-0.6, 0.3, 0.6], [0.6, 0.3, 0.6],
            [-0.6, 0.3, -0.6], [0.6, 0.3, -0.6]
        ];

        positions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(...pos);
            this.mesh.add(wheel);
        });

        this.mesh.position.set(0, 0, 0);
    }

    getMesh() {
        return this.mesh;
    }

    flashRed() {
        this.body.material.color.setHex(0xff0000);
        this.body.material.emissive.setHex(0xff0000);
        this.body.material.emissiveIntensity = 0.5;
    }

    restoreColor() {
        this.body.material.color.setHex(this.originalColor);
        this.body.material.emissive.setHex(0x000000);
        this.body.material.emissiveIntensity = 0;
    }
}
