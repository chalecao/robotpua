/**
 * @file PostProcessing.js
 * @description 后期处理管线：Bloom（泛光）+ Vignette（暗角）+ 色彩分级。
 *              内联实现，不依赖外部 postprocessing CDN，使用半分辨率 Bloom 优化性能。
 * @module graphics/PostProcessing
 */

import * as THREE from 'https://robotpua.com/cs/lib/three.module.js';

/**
 * 后期处理管理器 — 内联 Bloom + Vignette + ColorGrade
 */
export class PostProcessing {
    /**
     * @param {THREE.WebGLRenderer} renderer
     * @param {number} width
     * @param {number} height
     */
    constructor(renderer, width, height) {
        this.renderer = renderer;
        this.width = width;
        this.height = height;
        this.enabled = true;
        this.bloomResolution = 0.5;  // 半分辨率 Bloom，性能更佳

        // 中间渲染目标（半分辨率用于 Bloom，全分辨率用于合成）
        const halfW0 = Math.max(1, Math.floor(width * this.bloomResolution));
        const halfH0 = Math.max(1, Math.floor(height * this.bloomResolution));
        try {
            this.rtScene = new THREE.WebGLRenderTarget(width, height, {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat,
                depthBuffer: true,
                stencilBuffer: false,
            });
            const halfOpts = {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat,
                depthBuffer: false,
                stencilBuffer: false,
            };
            this.rtBright = new THREE.WebGLRenderTarget(halfW0, halfH0, halfOpts);
            this.rtBlurH = new THREE.WebGLRenderTarget(halfW0, halfH0, halfOpts);
            this.rtBlurV = new THREE.WebGLRenderTarget(halfW0, halfH0, halfOpts);
            this.rtOverlay = new THREE.WebGLRenderTarget(width, height, halfOpts);
        } catch (e) {
            console.warn('PostProcessing render targets failed, disabling PP:', e);
            this.enabled = false;
        }

        // ===== 亮度提取 shader（柔化阈值）=====
        const brightShader = {
            uniforms: {
                tDiffuse: { value: null },
                threshold: { value: 0.55 },
                knee: { value: 0.3 },
            },
            vertexShader: `
                varying vec2 vUv;
                void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float threshold;
                uniform float knee;
                varying vec2 vUv;
                void main() {
                    vec4 texel = texture2D(tDiffuse, vUv);
                    float brightness = max(texel.r, max(texel.g, texel.b));
                    // 柔阈值：threshold 附近平滑过渡
                    float soft = brightness - threshold + knee;
                    soft = clamp(soft, 0.0, 2.0 * knee);
                    soft = soft * soft / (4.0 * knee + 0.00001);
                    float contribution = max(soft, brightness - threshold);
                    contribution = max(0.0, contribution);
                    gl_FragColor = vec4(texel.rgb * contribution, 1.0);
                }
            `,
        };
        this.brightMat = new THREE.ShaderMaterial(brightShader);
        this.brightScene = new THREE.Scene();
        this.brightCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.brightQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.brightMat);
        this.brightScene.add(this.brightQuad);

        // ===== 模糊 shader（9-tap 高斯）=====
        const blurShader = {
            uniforms: {
                tDiffuse: { value: null },
                direction: { value: new THREE.Vector2(1, 0) },
                resolution: { value: new THREE.Vector2(halfW0, halfH0) },
            },
            vertexShader: `
                varying vec2 vUv;
                void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform vec2 direction;
                uniform vec2 resolution;
                varying vec2 vUv;
                void main() {
                    vec4 sum = vec4(0.0);
                    // 9-tap 高斯模糊
                    float weights[9];
                    weights[0] = 0.05; weights[1] = 0.09; weights[2] = 0.12;
                    weights[3] = 0.15; weights[4] = 0.16; weights[5] = 0.15;
                    weights[6] = 0.12; weights[7] = 0.09; weights[8] = 0.05;
                    sum += texture2D(tDiffuse, vUv) * weights[4];
                    for (int i = 0; i < 9; i++) {
                        if (i == 4) continue;
                        float fi = float(i - 4);
                        vec2 off = direction * fi * 3.0 / resolution;
                        sum += texture2D(tDiffuse, vUv + off) * weights[i];
                    }
                    gl_FragColor = sum;
                }
            `,
        };

        this.blurMat = new THREE.ShaderMaterial(blurShader);
        this.blurScene = new THREE.Scene();
        this.blurCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.blurQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.blurMat);
        this.blurScene.add(this.blurQuad);

        // ===== 合成 + 色彩分级 shader =====
        const overlayShader = {
            uniforms: {
                tScene: { value: null },
                tBloom: { value: null },
                bloomStrength: { value: 0.75 },
                exposure: { value: 1.0 },
                contrast: { value: 1.05 },
                saturation: { value: 1.1 },
                tintR: { value: 1.02 },
                tintG: { value: 1.0 },
                tintB: { value: 0.98 },
            },
            vertexShader: `
                varying vec2 vUv;
                void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
            `,
            fragmentShader: `
                uniform sampler2D tScene;
                uniform sampler2D tBloom;
                uniform float bloomStrength;
                uniform float exposure;
                uniform float contrast;
                uniform float saturation;
                uniform float tintR;
                uniform float tintG;
                uniform float tintB;
                varying vec2 vUv;
                void main() {
                    vec3 scene = texture2D(tScene, vUv).rgb;
                    vec3 bloom = texture2D(tBloom, vUv).rgb;
                    vec3 result = scene + bloom * bloomStrength;

                    // 曝光
                    result *= exposure;
                    // 对比度
                    result = (result - 0.5) * contrast + 0.5;
                    // 饱和度
                    float lum = dot(result, vec3(0.2126, 0.7152, 0.0722));
                    result = mix(vec3(lum), result, saturation);
                    // 色调微调（暖色）
                    result.r *= tintR;
                    result.g *= tintG;
                    result.b *= tintB;

                    gl_FragColor = vec4(max(result, 0.0), 1.0);
                }
            `,
        };
        this.overlayMat = new THREE.ShaderMaterial(overlayShader);
        this.overlayScene = new THREE.Scene();
        this.overlayCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.overlayQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.overlayMat);
        this.overlayScene.add(this.overlayQuad);

        // ===== Vignette + 胶片颗粒 shader =====
        const vignetteShader = {
            uniforms: {
                tDiffuse: { value: null },
                darkness: { value: 0.55 },
                offset: { value: 1.15 },
                grainIntensity: { value: 0.04 },
                time: { value: 0 },
            },
            vertexShader: `
                varying vec2 vUv;
                void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float darkness;
                uniform float offset;
                uniform float grainIntensity;
                uniform float time;
                varying vec2 vUv;
                // 简单伪随机函数
                float rand(vec2 co) {
                    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
                }
                void main() {
                    vec4 texel = texture2D(tDiffuse, vUv);
                    vec2 coord = vUv - 0.5;
                    // 椭圆 vignette（更自然）
                    float dist = length(coord * vec2(1.0, 0.85));
                    float vig = 1.0 - smoothstep(0.3, 0.95, dist * offset);
                    vig = mix(darkness, 1.0, vig);
                    vec3 color = texel.rgb * vig;
                    // 边缘加极淡的冷色调
                    color = mix(color, color * vec3(0.92, 0.94, 1.05), (1.0 - vig) * 0.4);
                    // 胶片颗粒
                    float grain = rand(vUv * vec2(800.0, 600.0) + time * 0.001) - 0.5;
                    color += grain * grainIntensity;
                    gl_FragColor = vec4(color, texel.a);
                }
            `,
        };
        this.vignetteMat = new THREE.ShaderMaterial(vignetteShader);
        this.vignetteScene = new THREE.Scene();
        this.vignetteCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.vignetteQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.vignetteMat);
        this.vignetteScene.add(this.vignetteQuad);

        this._time = 0;
    }

    /**
     * 执行后期处理渲染
     * @param {THREE.Scene} scene
     * @param {THREE.Camera} camera
     */
    render(scene, camera) {
        const r = this.renderer;
        if (!this.enabled) {
            r.setRenderTarget(null);
            r.render(scene, camera);
            return;
        }

        try {
            r.autoClear = true;
            this._time += 0.016;

            // Step 1: 渲染场景到 rtScene（全分辨率）
            r.setRenderTarget(this.rtScene);
            r.clear();
            r.render(scene, camera);

            // Step 2: 提取明亮区域 → rtBright（半分辨率）
            this.brightMat.uniforms.tDiffuse.value = this.rtScene.texture;
            r.setRenderTarget(this.rtBright);
            r.clear();
            r.render(this.brightScene, this.brightCam);

            // Step 3: 水平模糊 → rtBlurH
            this.blurMat.uniforms.tDiffuse.value = this.rtBright.texture;
            this.blurMat.uniforms.direction.value.set(1, 0);
            r.setRenderTarget(this.rtBlurH);
            r.clear();
            r.render(this.blurScene, this.blurCam);

            // Step 4: 垂直模糊 → rtBlurV
            this.blurMat.uniforms.tDiffuse.value = this.rtBlurH.texture;
            this.blurMat.uniforms.direction.value.set(0, 1);
            r.setRenderTarget(this.rtBlurV);
            r.clear();
            r.render(this.blurScene, this.blurCam);

            // Step 5: 合成 + 色彩分级 → rtOverlay（全分辨率）
            this.overlayMat.uniforms.tScene.value = this.rtScene.texture;
            this.overlayMat.uniforms.tBloom.value = this.rtBlurV.texture;
            r.setRenderTarget(this.rtOverlay);
            r.clear();
            r.render(this.overlayScene, this.overlayCam);

            // Step 6: Vignette + 颗粒 → 屏幕
            this.vignetteMat.uniforms.tDiffuse.value = this.rtOverlay.texture;
            this.vignetteMat.uniforms.time.value = this._time;
            r.setRenderTarget(null);
            r.clear();
            r.render(this.vignetteScene, this.vignetteCam);

            this._failCount = 0;
        } catch (e) {
            this._failCount = (this._failCount || 0) + 1;
            if (this._failCount > 2) {
                this.enabled = false;
                console.warn('PostProcessing disabled after repeated failures:', e);
            }
            r.setRenderTarget(null);
            r.render(scene, camera);
        }
    }

    setSize(w, h) {
        w = Math.max(1, Math.floor(w));
        h = Math.max(1, Math.floor(h));
        this.width = w;
        this.height = h;
        if (this.rtScene) this.rtScene.setSize(w, h);
        if (this.rtOverlay) this.rtOverlay.setSize(w, h);
        const halfW = Math.max(1, Math.floor(w * this.bloomResolution));
        const halfH = Math.max(1, Math.floor(h * this.bloomResolution));
        if (this.rtBright) this.rtBright.setSize(halfW, halfH);
        if (this.rtBlurH) this.rtBlurH.setSize(halfW, halfH);
        if (this.rtBlurV) this.rtBlurV.setSize(halfW, halfH);
        this.blurMat.uniforms.resolution.value.set(halfW, halfH);
    }

    setBloomStrength(s) { this.overlayMat.uniforms.bloomStrength.value = s; }
    setVignetteDarkness(d) { this.vignetteMat.uniforms.darkness.value = d; }
    setExposure(e) { this.overlayMat.uniforms.exposure.value = e; }
    setSaturation(s) { this.overlayMat.uniforms.saturation.value = s; }
    setContrast(c) { this.overlayMat.uniforms.contrast.value = c; }

    dispose() {
        if (this.rtScene) this.rtScene.dispose();
        if (this.rtBright) this.rtBright.dispose();
        if (this.rtBlurH) this.rtBlurH.dispose();
        if (this.rtBlurV) this.rtBlurV.dispose();
        if (this.rtOverlay) this.rtOverlay.dispose();
        if (this.blurMat) this.blurMat.dispose();
        if (this.brightMat) this.brightMat.dispose();
        if (this.overlayMat) this.overlayMat.dispose();
        if (this.vignetteMat) this.vignetteMat.dispose();
    }
}
