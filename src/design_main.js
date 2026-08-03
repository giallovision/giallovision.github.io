import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// ==========================================
// 1. SCENE SETUP (FOH CAMERA LOCKED)
// ==========================================
const canvas = document.getElementById('design-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 20, 125); 
camera.lookAt(0, 10, 0);

// STAGE LIGHTING FIX: Front-lighting the stage so it isn't pitch black
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffeedd, 3.5);
dirLight.position.set(0, 20, 50); // Moved to FOH to blast the front of the stage
scene.add(dirLight);

// ==========================================
// 2. ULTRA-FAST GEOMETRIC LED SHADER
// ==========================================
const screenUniforms = {
    u_time: { value: 0.0 }
};

const screenMaterial = new THREE.ShaderMaterial({
    uniforms: screenUniforms,
    side: THREE.DoubleSide,
    vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        void main() {
            vUv = uv;
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPos.xyz;
            gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
    `,
    fragmentShader: `
        uniform float u_time;
        varying vec2 vUv;
        varying vec3 vWorldPosition;

        void main() {
            // STAGEFLOW LOGIC (4s repeating cycle just for the screen mapping)
            float state = mod(u_time / 4.0, 3.0); 
            vec2 uvFull = vec2((vWorldPosition.x / 30.0) + 0.5, vUv.y); 
            vec2 uvMirror = vec2(abs(vWorldPosition.x) / 15.0, vUv.y);
            vec2 uvRepeat = vUv;

            vec2 activeUV;
            if (state < 1.0) activeUV = mix(uvFull, uvMirror, smoothstep(0.8, 1.0, state));
            else if (state < 2.0) activeUV = mix(uvMirror, uvRepeat, smoothstep(1.8, 2.0, state));
            else activeUV = mix(uvRepeat, uvFull, smoothstep(2.8, 3.0, state));

            // FAST 2D TUNNEL MATH (No heavy raymarching loops!)
            vec2 p = activeUV - 0.5;
            
            // Concentric geometric squares (16:9 ratio)
            float d = max(abs(p.x), abs(p.y) * 1.77);
            
            // Depth inversion to pull things towards the camera
            float z = 1.0 / (d + 0.001); 
            
            // THE CHILLED OUT PUMP: Dropped the power from 4.0 to 3.0, and the multiplier from 3.0 to 1.2
            float pump = pow(fract(u_time / 4.0), 3.0) * 1.2;
            float move = u_time * 2.0 + pump;
            
            // Square wave generation
            float wave = fract(z - move); 
            
            // Sharp geometric rings
            float thickness = 0.2; 
            float ring = smoothstep(0.0, 0.02, wave) * smoothstep(thickness, thickness - 0.02, wave);
            
            // TEAL/AMBER COLOR SCHEME
            float colorPhase = sin(z * 0.3 - u_time) * 0.5 + 0.5;
            vec3 tealNavy = vec3(0.0, 0.75, 0.95);
            vec3 amberGold = vec3(1.0, 0.50, 0.08);
            vec3 baseColor = mix(tealNavy, amberGold, colorPhase);
            
            // Combine & darken the deep center
            vec3 finalColor = baseColor * ring * smoothstep(0.0, 0.8, d * 3.0);
            
            // EMISSION FIX: Dropped the multiplier from 2.5 to 1.2 so it doesn't blow out
            gl_FragColor = vec4(finalColor * 1.2, 1.0);
        }
    `
});

// ==========================================
// 3. POST-PROCESSING PIPELINE
// ==========================================
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.8, 0.5, 0.85);
composer.addPass(bloomPass);

// Opaque Fluid Teal & Gold Transition Lens
const lensShader = {
    uniforms: {
        "tDiffuse": { value: null },
        "u_time": { value: 0.0 },
        "u_phase": { value: 0.0 },
        "u_transition": { value: 0.0 }
    },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float u_time;
        uniform float u_phase;
        uniform float u_transition;
        varying vec2 vUv;

        // --- NOISE MATH ---
        vec2 hash( vec2 p ) {
            p = vec2( dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)) );
            return -1.0 + 2.0*fract(sin(p)*43758.5453123);
        }

        float noise( in vec2 p ) {
            vec2 i = floor( p ); 
            vec2 f = fract( p ); 
            vec2 u = f*f*f*(f*(f*6.0-15.0)+10.0); 
            return mix( mix( dot( hash( i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ), 
                             dot( hash( i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                        mix( dot( hash( i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ), 
                             dot( hash( i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
        }

        float rand(vec2 n) { return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); }

        void main() {
            vec2 uv = vUv;
            vec4 texCol = texture2D(tDiffuse, uv);
            vec3 finalCol = texCol.rgb;

            // Phase 0: Subtle clean grain
            if (u_phase < 0.5) {
                float n = rand(uv * u_time) * 0.08;
                finalCol -= n; 
            }

            // --- OPAQUE WARPED TEAL/GOLD WIPE ---
            if (u_transition > 0.0) {
                // 1. Organic Domain Warping for curling motion
                vec2 warpCoord = uv * 4.2;
                float q = noise(warpCoord + u_time * 0.8);
                float r = noise(warpCoord + vec2(q * 2.0, q * 2.0) + u_time * 0.5);
                
                // 2. Wave edge calculations
                // u_transition goes 0.0 -> 1.0 (Downwards sweep)
                float sweepPos = (1.0 - u_transition) * 4.2 - 1.25; 
                float wipeLine = uv.y + r * 0.5;
                
                // STRETCHED Y-COVERAGE: Bumped the smoothstep thresholds from 0.6 to 1.5!
                // This dramatically stretches the vertical thickness of the wave.
                float bandMask = smoothstep(sweepPos - 1.5, sweepPos, wipeLine) * 
                                smoothstep(sweepPos + 1.5, sweepPos, wipeLine);
                
                // Clamp to ensure pure opacity at the center of the wave
                float opacity = clamp(bandMask * 2.5, 0.0, 1.0); 

                // 3. Deep Teal & Pure Gold Color Palette
                vec3 colTeal = vec3(0.0, 0.66, 0.80);  // Deep Electric Teal
                vec3 colGold = vec3(1.0, 0.60, 0.05);  // Pure Warm Gold
                vec3 colHighlight = vec3(1.0, 0.90, 0.50); // White-Hot Energy Core

                // Mix colors based on the curl noise (r)
                vec3 fluidColor = mix(colTeal, colGold, smoothstep(-0.3, 0.3, r));
                fluidColor = mix(fluidColor, colHighlight, pow(clamp(bandMask, 0.0, 1.0), 3.0) * 0.8);

                // 4. Completely replace the 3D scene underneath with the fluid color field
                finalCol = mix(finalCol, fluidColor, opacity);
            }
            
            gl_FragColor = vec4(finalCol, 1.0);
        }
    `
};

const lensPass = new ShaderPass(lensShader);
composer.addPass(lensPass);

// ==========================================
// 4. LOAD GLB & PREPARE MATERIALS
// ==========================================
const fixtureData = { beams: [] };
let stageModel = null;
let edgeLines = [];

const loader = new GLTFLoader();

loader.load('./assets/giallovision_stage.glb', (gltf) => {
    stageModel = gltf.scene;
    
    stageModel.traverse((child) => {
        if (child.isMesh) {
            const matName = child.material.name || "";
            
            if (matName.startsWith('Mat_Proxy_')) {
                child.updateMatrixWorld(true);
                if (matName === 'Mat_Proxy_Beam') fixtureData.beams.push(child.matrixWorld.clone());
                child.visible = false;
            } 
            else {
                const edges = new THREE.EdgesGeometry(child.geometry, 40);
                const lineMat = new THREE.LineBasicMaterial({ color: 0x111111 });
                const line = new THREE.LineSegments(edges, lineMat);
                child.add(line); 
                edgeLines.push(line);

                const isScreen = matName.toLowerCase().includes('screen') || matName.toLowerCase().includes('led');

                if (isScreen) {
                    child.userData.matFull = screenMaterial;
                    child.userData.matBlue = new THREE.MeshBasicMaterial({ color: 0x010203 }); 
                    child.userData.matWhite = new THREE.MeshBasicMaterial({ color: 0xdddddd, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
                } else {
                    // STAGE MATERIAL FIX: Brighter, smoother metal so it isn't pitch black
                    child.userData.matFull = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.3, metalness: 0.6 }); 
                    child.userData.matBlue = new THREE.MeshStandardMaterial({ color: 0x031525, roughness: 0.7 }); 
                    child.userData.matWhite = new THREE.MeshBasicMaterial({ color: 0xffffff, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }); 
                }
                
                child.material = child.userData.matWhite;
            }
        }
    });

    scene.add(stageModel);
    buildVolumetrics();
    applyPhase(0);
});

// ==========================================
// 5. VOLUMETRICS ENGINE
// ==========================================
let beamInstances = null;

function buildVolumetrics() {
    if (fixtureData.beams.length === 0) return;

    const coneGeo = new THREE.ConeGeometry(1.5, 40, 16);
    coneGeo.translate(0, -20, 0); 
    
    const volMat = new THREE.ShaderMaterial({
        uniforms: { u_color: { value: new THREE.Color(0x00b4d8) } },
        vertexShader: `
            varying float vGradient;
            void main() {
                vGradient = (position.y + 40.0) / 40.0;
                gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 u_color;
            varying float vGradient;
            void main() { gl_FragColor = vec4(u_color, vGradient * 0.25); }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
    });

    beamInstances = new THREE.InstancedMesh(coneGeo, volMat, fixtureData.beams.length);
    
    for (let i = 0; i < fixtureData.beams.length; i++) {
        beamInstances.setMatrixAt(i, fixtureData.beams[i]);
    }
    
    beamInstances.instanceMatrix.needsUpdate = true;
    beamInstances.visible = false;
    scene.add(beamInstances);
}

// ==========================================
// 6. TIMELINE ENGINE (LINEAR, NO LOOP)
// ==========================================
let currentPhase = 0;
const clock = new THREE.Clock();

function applyPhase(phase) {
    if (!stageModel) return;

    if (phase === 0) { 
        renderer.setClearColor('#f8f9fa');
        ambientLight.intensity = 0.2; hemiLight.intensity = 1.0; dirLight.intensity = 0.0; bloomPass.strength = 0.0;
        if (beamInstances) beamInstances.visible = false;
        edgeLines.forEach(l => { l.visible = true; l.material.color.setHex(0x111111); });
        stageModel.traverse(c => { if (c.isMesh && c.userData.matWhite) c.material = c.userData.matWhite; });
    } 
    else if (phase === 1) { 
        renderer.setClearColor('#050a0f'); 
        ambientLight.intensity = 0.2; hemiLight.intensity = 2.0; dirLight.intensity = 1.5; bloomPass.strength = 0.2;
        if (beamInstances) beamInstances.visible = false;
        edgeLines.forEach(l => { l.visible = true; l.material.color.setHex(0x00b4d8); });
        stageModel.traverse(c => { if (c.isMesh && c.userData.matBlue) c.material = c.userData.matBlue; });
    }
    else if (phase === 2) { 
        renderer.setClearColor('#020202'); 
        ambientLight.intensity = 0.8; 
        hemiLight.intensity = 0.5; 
        dirLight.intensity = 3.5; 
        
        // BLOOM FIX: Dropped from 1.6 down to 0.6
        bloomPass.strength = 2.1; 
        
        if (beamInstances) beamInstances.visible = true;
        edgeLines.forEach(l => l.visible = false); 
        stageModel.traverse(c => { if (c.isMesh && c.userData.matFull) c.material = c.userData.matFull; });
    }
}

// ==========================================
// 7. RENDER LOOP (1.5s Clean Wipe Timeline)
// ==========================================
function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    
    screenUniforms.u_time.value = t;
    lensPass.uniforms.u_time.value = t;

    let wipeProgress = 0.0;

    // Block 1: Napkin Sketch (0s to 4.0s)
    if (t < 4.0) {
        if (t > 2.5) {
            // Calculate wipe from 2.5s to 4.0s (1.5 second duration)
            wipeProgress = (t - 2.5) / 1.5;
            
            // Swap to Phase 1 exactly when the wipe covers the lens
            if (wipeProgress > 0.5 && currentPhase === 0) {
                currentPhase = 1;
                lensPass.uniforms.u_phase.value = currentPhase;
                applyPhase(currentPhase);
            }
        }
    } 
    // Block 2: Blueprint (4.0s to 8.0s)
    else if (t < 8.0) {
        if (t > 6.5) {
            // Calculate wipe from 6.5s to 8.0s (1.5 second duration)
            wipeProgress = (t - 6.5) / 1.5;
            
            // Swap to Phase 2 exactly when the wipe covers the lens
            if (wipeProgress > 0.5 && currentPhase === 1) {
                currentPhase = 2;
                lensPass.uniforms.u_phase.value = currentPhase;
                applyPhase(currentPhase);
            }
        }
    } 
    // Block 3: Volumetric Finale (8s+ Holds Forever)
    else {
        // Safety catch to ensure Phase 2 is perfectly locked
        if (currentPhase !== 2) {
            currentPhase = 2;
            lensPass.uniforms.u_phase.value = currentPhase;
            applyPhase(currentPhase);
        }
        // Dead stop. No more wipes.
        wipeProgress = 0.0; 
    }

    lensPass.uniforms.u_transition.value = wipeProgress;
    composer.render();
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});