/**
 * @file Track.js
 * @description 赛道平面生成、道具点管理、场景装饰
 */
import * as THREE from '../../lib/three.module.js';

export class Track {
    constructor(scene) {
        this.scene = scene;
        this.items = [];
        this.animatingItems = [];
        this.radius = 40;
        this.boundaryRadius = 48;
        this.createTrack();
    }

    createTrack() {
        const radius = this.radius;

        const geometry = new THREE.PlaneGeometry(radius * 2.5, radius * 2.5);
        const material = new THREE.MeshStandardMaterial({
            color: 0x4CAF50,
            side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(geometry, material);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        const trackGeo = new THREE.RingGeometry(radius - 5, radius + 5, 64);
        const trackMat = new THREE.MeshStandardMaterial({ color: 0xDDDDDD });
        const track = new THREE.Mesh(trackGeo, trackMat);
        track.rotation.x = -Math.PI / 2;
        track.position.y = 0.01;
        track.receiveShadow = true;
        this.scene.add(track);

        const centerGeo = new THREE.RingGeometry(radius - 0.3, radius + 0.3, 64);
        const centerMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.4
        });
        const centerLine = new THREE.Mesh(centerGeo, centerMat);
        centerLine.rotation.x = -Math.PI / 2;
        centerLine.position.y = 0.02;
        this.scene.add(centerLine);

        const startGeo = new THREE.PlaneGeometry(10, 2);
        const startMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const startLine = new THREE.Mesh(startGeo, startMat);
        startLine.rotation.x = -Math.PI / 2;
        startLine.position.set(radius, 0.02, 0);
        this.scene.add(startLine);

        this.addMarkers(radius + 5.5, 0xff4444, 32);
        this.addMarkers(radius - 5.5, 0xffffff, 32);

        this.addScenery(radius);

        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            this.spawnItem(x, z);
        }
    }

    addMarkers(markerRadius, color, count) {
        const geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const mat = new THREE.MeshStandardMaterial({ color });
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const marker = new THREE.Mesh(geo, mat);
            marker.position.set(
                Math.cos(angle) * markerRadius,
                0.25,
                Math.sin(angle) * markerRadius
            );
            marker.castShadow = true;
            this.scene.add(marker);
        }
    }

    addScenery(trackRadius) {
        const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 2, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const leafGeo = new THREE.ConeGeometry(1.5, 3, 8);
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });

        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = trackRadius + 10 + Math.random() * 20;
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;

            const trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.set(x, 1, z);
            trunk.castShadow = true;
            this.scene.add(trunk);

            const leaves = new THREE.Mesh(leafGeo, leafMat);
            leaves.position.set(x, 3.5, z);
            leaves.castShadow = true;
            this.scene.add(leaves);
        }
    }

    spawnItem(x, z) {
        const geo = new THREE.BoxGeometry(1, 1, 1);
        const mat = new THREE.MeshStandardMaterial({
            color: 0xFFD700,
            emissive: 0xFFD700,
            emissiveIntensity: 0.2
        });
        const item = new THREE.Mesh(geo, mat);
        item.position.set(x, 0.5, z);
        item.userData = { type: 'item', baseY: 0.5 };
        this.scene.add(item);
        this.items.push(item);
    }

    updateItems() {
        const t = Date.now() * 0.003;
        for (const item of this.items) {
            item.rotation.y += 0.02;
            item.position.y = item.userData.baseY + Math.sin(t + item.position.x) * 0.2;
        }

        for (let i = this.animatingItems.length - 1; i >= 0; i--) {
            const anim = this.animatingItems[i];
            anim.elapsed += 1 / 60;
            const progress = Math.min(anim.elapsed / anim.duration, 1);
            const s = 1 + progress;
            anim.item.scale.set(s, s, s);
            anim.item.material.opacity = 1 - progress;
            if (progress >= 1) {
                this.scene.remove(anim.item);
                this.animatingItems.splice(i, 1);
            }
        }
    }

    removeItem(index) {
        const item = this.items[index];
        item.material.transparent = true;
        this.items.splice(index, 1);
        this.animatingItems.push({ item, elapsed: 0, duration: 0.3 });
        setTimeout(() => {
            const angle = Math.random() * Math.PI * 2;
            this.spawnItem(
                Math.cos(angle) * this.radius,
                Math.sin(angle) * this.radius
            );
        }, 8000);
    }
}
