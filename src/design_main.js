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
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Cinematic Tone Mapping
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

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
dirLight.position.set(0, 50, 150); 
scene.add(dirLight);

// ==========================================
// 1.5 GENERATE FAKE ENVIRONMENT FOR METAL REFLECTIONS
// ==========================================
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

const envScene = new THREE.Scene();
envScene.background = new THREE.Color(0x050a0f); // Dark studio background

// Create glowing "softboxes" in the hidden environment to reflect off the metal
const envTeal = new THREE.Mesh(new THREE.BoxGeometry(20, 10, 10), new THREE.MeshBasicMaterial({color: 0x00b4d8}));
envTeal.position.set(-20, 10, 20);
envScene.add(envTeal);

const envGold = new THREE.Mesh(new THREE.BoxGeometry(20, 10, 10), new THREE.MeshBasicMaterial({color: 0xffb703}));
envGold.position.set(20, 10, 20);
envScene.add(envGold);

const envWhite = new THREE.Mesh(new THREE.BoxGeometry(40, 5, 5), new THREE.MeshBasicMaterial({color: 0xffffff}));
envWhite.position.set(0, 30, -20);
envScene.add(envWhite);

// Apply the baked environment map to the main scene
scene.environment = pmremGenerator.fromScene(envScene).texture;
scene.environmentIntensity = 1.0; // Controls how strong the reflections are

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
            float state = mod(u_time / 4.0, 3.0); 
            vec2 uvFull = vec2((vWorldPosition.x / 30.0) + 0.5, vUv.y); 
            vec2 uvMirror = vec2(abs(vWorldPosition.x) / 15.0, vUv.y);
            vec2 uvRepeat = vUv;

            vec2 activeUV;
            if (state < 1.0) activeUV = mix(uvFull, uvMirror, smoothstep(0.8, 1.0, state));
            else if (state < 2.0) activeUV = mix(uvMirror, uvRepeat, smoothstep(1.8, 2.0, state));
            else activeUV = mix(uvRepeat, uvFull, smoothstep(2.8, 3.0, state));

            vec2 p = activeUV - 0.5;
            float d = max(abs(p.x), abs(p.y) * 1.77);
            float z = 1.0 / (d + 0.001); 
            
            float pump = pow(fract(u_time / 4.0), 3.0) * 1.2;
            float move = u_time * 2.0 + pump;
            float wave = fract(z - move); 
            
            float thickness = 0.2; 
            float ring = smoothstep(0.0, 0.02, wave) * smoothstep(thickness, thickness - 0.02, wave);
            
            float colorPhase = sin(z * 0.3 - u_time) * 0.5 + 0.5;
            vec3 tealNavy = vec3(0.0, 0.75, 0.95);
            vec3 amberGold = vec3(1.0, 0.50, 0.08);
            vec3 baseColor = mix(tealNavy, amberGold, colorPhase);
            
            vec3 finalColor = baseColor * ring * smoothstep(0.0, 0.8, d * 3.0);
            
            gl_FragColor = vec4(finalColor * 2.5, 1.0); 
        }
    `
});

// ==========================================
// 3. POST-PROCESSING PIPELINE (WITH ANTI-ALIASING)
// ==========================================
const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
    samples: 8,
    format: THREE.RGBAFormat,
});

const composer = new EffectComposer(renderer, renderTarget);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.8, 0.2, 0.95);
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

            if (u_phase < 0.5) {
                float n = rand(uv * u_time) * 0.08;
                finalCol -= n; 
            }

            if (u_transition > 0.0) {
                vec2 warpCoord = uv * 4.2;
                float q = noise(warpCoord + u_time * 0.8);
                float r = noise(warpCoord + vec2(q * 2.0, q * 2.0) + u_time * 0.5);
                
                float sweepPos = (1.0 - u_transition) * 4.2 - 1.25; 
                float wipeLine = uv.y + r * 0.5;
                
                float bandMask = smoothstep(sweepPos - 1.5, sweepPos, wipeLine) * 
                                 smoothstep(sweepPos + 1.5, sweepPos, wipeLine);
                
                float opacity = clamp(bandMask * 2.5, 0.0, 1.0); 

                vec3 colTeal = vec3(0.0, 0.66, 0.80);  
                vec3 colGold = vec3(1.0, 0.60, 0.05);  
                vec3 colHighlight = vec3(1.0, 0.90, 0.50); 

                vec3 fluidColor = mix(colTeal, colGold, smoothstep(-0.3, 0.3, r));
                fluidColor = mix(fluidColor, colHighlight, pow(clamp(bandMask, 0.0, 1.0), 3.0) * 0.8);

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
const fixtureData = { beams: [], washes: [], lasers: [], strobes: [] };
let stageModel = null;
let edgeLines = [];

const loader = new GLTFLoader();

loader.load('./assets/giallovision_stage.glb', (gltf) => {
    stageModel = gltf.scene;
    scene.add(stageModel);
    stageModel.updateMatrixWorld(true);
    
    stageModel.traverse((child) => {
        if (child.isMesh) {
            const matName = child.material.name ? child.material.name.toLowerCase() : "";
            
            if (matName.includes('proxy')) {
                const position = new THREE.Vector3();
                const quaternion = new THREE.Quaternion();
                const scale = new THREE.Vector3();
                
                child.matrixWorld.decompose(position, quaternion, scale);
                
                // AUTO-FLIP: Ensure all lights point towards audience (Positive Z)
                const forwardVec = new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion);
                if (forwardVec.z < 0) {
                    const flipQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
                    quaternion.multiply(flipQuat);
                }
                
                if (matName.includes('beam')) fixtureData.beams.push({ position, quaternion });
                else if (matName.includes('wash')) fixtureData.washes.push({ position, quaternion });
                else if (matName.includes('laser')) fixtureData.lasers.push({ position, quaternion });
                else if (matName.includes('strobe')) fixtureData.strobes.push({ position, quaternion });
                
                child.visible = false; 
            } 
            else {
                const edges = new THREE.EdgesGeometry(child.geometry, 40);
                const lineMat = new THREE.LineBasicMaterial({ color: 0x111111 });
                const line = new THREE.LineSegments(edges, lineMat);
                child.add(line); 
                edgeLines.push(line);

                const isScreen = matName.includes('screen') || matName.includes('led');

                if (isScreen) {
                    child.userData.matFull = screenMaterial;
                    child.userData.matBlue = new THREE.MeshBasicMaterial({ color: 0x010203 }); 
                    child.userData.matWhite = new THREE.MeshBasicMaterial({ color: 0xdddddd, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
                } else {
                    child.userData.matFull = child.material; 
                    child.userData.matBlue = new THREE.MeshStandardMaterial({ color: 0x031525, roughness: 0.7 }); 
                    child.userData.matWhite = new THREE.MeshBasicMaterial({ color: 0xffffff, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }); 
                }
                
                child.material = child.userData.matWhite;
            }
        }
    });

    buildVolumetrics();
    applyPhase(0);
});

// ==========================================
// 5. ADVANCED VOLUMETRICS & KINETICS ENGINE
// ==========================================
let instances = { beams: null, washes: null, lasersSingle: null, lasersMulti: null, lasersFan: null, strobes: null };
const dynamicMaterials = []; 

function createInstancedRig(dataArray, geometry, material) {
    if (dataArray.length === 0) return null;
    const mesh = new THREE.InstancedMesh(geometry, material, dataArray.length);
    const dummy = new THREE.Object3D();
    
    for (let i = 0; i < dataArray.length; i++) {
        dummy.position.copy(dataArray[i].position);
        dummy.quaternion.copy(dataArray[i].quaternion);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.visible = false;
    scene.add(mesh);
    return mesh;
}

const noiseShaderChunk = `
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    float snoise(vec3 v) {
        const vec2  C = vec2(1.0/6.0, 1.0/3.0);
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute( permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
        float n_ = 0.142857142857;
        vec3  ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
    }
`;

const chaseLogicChunk = `
    float getChaseIntensity(int mode, vec3 worldPos, float time, float instanceID) {
        float chase = 1.0;
        if (mode == 1) { 
            float rnd = fract(sin(instanceID * 12.9898) * 43758.5453);
            chase = step(0.85, fract(time * 3.0 + rnd)); 
        } else if (mode == 2) { 
            chase = sin(-abs(worldPos.x) * 0.15 + time * 6.0) * 0.5 + 0.5;
            chase = smoothstep(0.3, 0.7, chase);
        } else if (mode == 3) { 
            chase = sin(abs(worldPos.x) * 0.15 + time * 6.0) * 0.5 + 0.5;
            chase = smoothstep(0.3, 0.7, chase);
        } else if (mode == 4) { 
            float dist = max(abs(worldPos.x), abs(worldPos.y) * 2.0); 
            chase = sin(dist * 0.2 - time * 5.0) * 0.5 + 0.5;
            chase = smoothstep(0.4, 0.6, chase);
        } else if (mode == 5) { 
            chase = sin(worldPos.x * 0.1 + time * 4.0) * 0.5 + 0.5;
            chase = smoothstep(0.4, 0.6, chase);
        }
        return chase;
    }
`;

function getAdvancedFixtureShader(colorHex, maxAlpha, isVolumetric, hasMovement, laserCutMode = 0) {
    const mat = new THREE.ShaderMaterial({
        uniforms: { 
            u_color: { value: new THREE.Color(colorHex) },
            u_time: { value: 0.0 },
            u_chase_mode: { value: 0 } 
        },
        vertexShader: `
            varying float vAlpha;
            varying vec2 vUv;
            varying vec3 vWorldPosition;
            varying float vInstanceID;
            uniform float u_time;
            
            mat4 rotationMatrix(vec3 axis, float angle) {
                axis = normalize(axis);
                float s = sin(angle);
                float c = cos(angle);
                float oc = 1.0 - c;
                return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                            oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                            oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                            0.0,                                0.0,                                0.0,                                1.0);
            }

            void main() {
                vAlpha = uv.y; 
                vUv = uv; 
                
                vec4 worldPos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0); 
                vWorldPosition = worldPos.xyz;
                vInstanceID = float(gl_InstanceID);
                
                vec4 pos = vec4(position, 1.0);
                
                ${hasMovement ? `
                    float pan = sin(u_time * 2.0 + vWorldPosition.x * 0.1) * 0.35; 
                    float tilt = cos(u_time * 1.5 + vWorldPosition.z * 0.1) * 0.2; 
                    mat4 rotPan = rotationMatrix(vec3(0.0, 1.0, 0.0), pan);
                    mat4 rotTilt = rotationMatrix(vec3(1.0, 0.0, 0.0), tilt);
                    pos = rotPan * rotTilt * pos;
                ` : ``}

                gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * pos;
            }
        `,
        fragmentShader: `
            uniform vec3 u_color;
            uniform float u_time;
            uniform int u_chase_mode;
            
            varying float vAlpha;
            varying vec2 vUv;
            varying vec3 vWorldPosition;
            varying float vInstanceID;
            
            ${noiseShaderChunk}
            ${chaseLogicChunk}

            void main() { 
                float chase = getChaseIntensity(u_chase_mode, vWorldPosition, u_time, vInstanceID);
                float finalAlpha = vAlpha * ${maxAlpha};
                
                ${laserCutMode === 1 ? `
                    float cut = sin(vUv.x * 150.0);
                    finalAlpha *= smoothstep(0.6, 0.9, cut);
                ` : ``}
                
                ${isVolumetric ? `
                    vec3 noiseCoord = vWorldPosition * 0.2 + vec3(0.0, -u_time * 3.0, 0.0);
                    float haze = snoise(noiseCoord); 
                    haze = smoothstep(-0.1, 0.8, haze); 
                    finalAlpha *= mix(haze, 1.0, pow(vAlpha, 2.0)); 
                ` : ``}
                
                gl_FragColor = vec4(u_color * chase, finalAlpha * chase); 
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
    });
    
    dynamicMaterials.push(mat);
    return mat;
}

function buildVolumetrics() {
    // 1. BEAMS
    const beamGeo = new THREE.ConeGeometry(1.5, 45, 16, 1, true);
    beamGeo.translate(0, -23.5, 0); 
    beamGeo.rotateX(-Math.PI / 2);  
    instances.beams = createInstancedRig(fixtureData.beams, beamGeo, getAdvancedFixtureShader(0x00b4d8, "0.85", true, true));

    // 2. WASHES
    const washGeo = new THREE.ConeGeometry(4.5, 30, 16, 1, true);
    washGeo.translate(0, -16.0, 0);
    washGeo.rotateX(-Math.PI / 2);
    instances.washes = createInstancedRig(fixtureData.washes, washGeo, getAdvancedFixtureShader(0xffb703, "0.6", true, true)); 

    // --- 3. SPLIT THE LASERS INTO 3 TYPES ---
    const singleLasers = [];
    const multiLasers = [];
    const fanLasers = [];
    
    for (let i = 0; i < fixtureData.lasers.length; i++) {
        if (i % 3 === 0) singleLasers.push(fixtureData.lasers[i]);
        else if (i % 3 === 1) multiLasers.push(fixtureData.lasers[i]);
        else fanLasers.push(fixtureData.lasers[i]);
    }

    // 3a. Single Tight Rays
    const laserSingleGeo = new THREE.CylinderGeometry(0.05, 0.1, 60, 8, 1, true);
    laserSingleGeo.translate(0, -30, 0);
    laserSingleGeo.rotateX(-Math.PI / 2);
    instances.lasersSingle = createInstancedRig(singleLasers, laserSingleGeo, getAdvancedFixtureShader(0xff9900, "1.2", true, false));

    // 3b. Full Flat Fans
    const laserFanGeo = new THREE.ConeGeometry(4.5, 60, 16, 1, true);
    laserFanGeo.scale(1, 1, 0.01); 
    laserFanGeo.translate(0, -30, 0);
    laserFanGeo.rotateX(-Math.PI / 2);
    instances.lasersFan = createInstancedRig(fanLasers, laserFanGeo, getAdvancedFixtureShader(0xff9900, "0.7", true, false));

    // 3c. Multi-Ray Fans
    instances.lasersMulti = createInstancedRig(multiLasers, laserFanGeo, getAdvancedFixtureShader(0xff9900, "1.2", true, false, 1));

    // 4. STROBES
    const strobeGeo = new THREE.BoxGeometry(1.2, 0.3, 0.4);
    instances.strobes = createInstancedRig(fixtureData.strobes, strobeGeo, getAdvancedFixtureShader(0xffffff, "2.0", false, false));
}

// ==========================================
// 6. TIMELINE ENGINE & DYNAMIC STAGE SPOTLIGHTS
// ==========================================
let currentPhase = 0;
const clock = new THREE.Clock();

const stageSpotlights = [];

function buildStageSpotlights() {
    stageSpotlights.forEach(item => {
        scene.remove(item.light);
        scene.remove(item.target);
    });
    stageSpotlights.length = 0;

    const sources = [
        ...fixtureData.washes.map(f => ({ ...f, color: 0xffb703, intensity: 180 })), 
        ...fixtureData.beams.filter((_, i) => i % 6 === 0).map(f => ({ ...f, color: 0x00b4d8, intensity: 150 })) 
    ];

    sources.forEach(src => {
        const spot = new THREE.SpotLight(src.color, 0, 80, Math.PI / 6, 0.5, 1);
        spot.position.copy(src.position);

        const targetObj = new THREE.Object3D();
        scene.add(targetObj);
        spot.target = targetObj;

        scene.add(spot);

        stageSpotlights.push({
            light: spot,
            target: targetObj,
            basePos: src.position.clone(),
            baseQuat: src.quaternion.clone(),
            baseIntensity: src.intensity
        });
    });
}

function applyPhase(phase) {
    if (!stageModel) return;

    if (phase === 0) { 
        renderer.setClearColor('#f8f9fa');
        scene.environmentIntensity = 0.0;
        ambientLight.intensity = 0.2; hemiLight.intensity = 1.0; dirLight.intensity = 0.0; bloomPass.strength = 0.0;
        
        if (instances.beams) instances.beams.visible = false;
        if (instances.washes) instances.washes.visible = false;
        if (instances.strobes) instances.strobes.visible = false;
        
        stageSpotlights.forEach(s => s.light.intensity = 0);
        edgeLines.forEach(l => { l.visible = true; l.material.color.setHex(0x111111); });
        stageModel.traverse(c => { if (c.isMesh && c.userData.matWhite) c.material = c.userData.matWhite; });
    } 
    else if (phase === 1) { 
        renderer.setClearColor('#050a0f'); 
        scene.environmentIntensity = 0.2;
        ambientLight.intensity = 0.2; hemiLight.intensity = 2.0; dirLight.intensity = 1.5; bloomPass.strength = 0.2;
        
        if (instances.beams) instances.beams.visible = false;
        if (instances.washes) instances.washes.visible = false;
        if (instances.strobes) instances.strobes.visible = false;

        stageSpotlights.forEach(s => s.light.intensity = 0);
        edgeLines.forEach(l => { l.visible = true; l.material.color.setHex(0x00b4d8); });
        stageModel.traverse(c => { if (c.isMesh && c.userData.matBlue) c.material = c.userData.matBlue; });
    }
    else if (phase === 2) { 
        renderer.setClearColor('#020202'); 
        
        renderer.toneMappingExposure = 1.6;
        ambientLight.intensity = 1.8; 
        hemiLight.intensity = 1.5; 
        dirLight.intensity = 2.5; 
        
        if (scene.environment) scene.environmentIntensity = 2.0;
        bloomPass.strength = 1.2; 
        
        if (instances.beams) instances.beams.visible = true;
        if (instances.washes) instances.washes.visible = true;
        if (instances.strobes) instances.strobes.visible = true;
        
        edgeLines.forEach(l => l.visible = false); 
        stageModel.traverse(c => { if (c.isMesh && c.userData.matFull) c.material = c.userData.matFull; });
    }
}

const originalBuildVolumetrics = buildVolumetrics;
buildVolumetrics = function() {
    originalBuildVolumetrics();
    buildStageSpotlights();
};

// ==========================================
// 7. RENDER LOOP & RESPONSIVE FIT
// ==========================================
let lastChaseCycle = -1;
let activeLaserType = 0; 

function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    
    screenUniforms.u_time.value = t;
    lensPass.uniforms.u_time.value = t;

    // --- TIMELINE WIPE LOGIC ---
    let wipeProgress = 0.0;

    if (t < 4.0) {
        if (t > 2.5) {
            wipeProgress = (t - 2.5) / 1.5;
            if (wipeProgress > 0.5 && currentPhase === 0) {
                currentPhase = 1;
                lensPass.uniforms.u_phase.value = currentPhase;
                applyPhase(currentPhase);
            }
        }
    } 
    else if (t < 8.0) {
        if (t > 6.5) {
            wipeProgress = (t - 6.5) / 1.5;
            if (wipeProgress > 0.5 && currentPhase === 1) {
                currentPhase = 2;
                lensPass.uniforms.u_phase.value = currentPhase;
                applyPhase(currentPhase);
            }
        }
    } 
    else {
        if (currentPhase !== 2) {
            currentPhase = 2;
            lensPass.uniforms.u_phase.value = currentPhase;
            applyPhase(currentPhase);
        }
        wipeProgress = 0.0; 
    }
    
    lensPass.uniforms.u_transition.value = wipeProgress;

    // --- CHASE LOGIC & SPOTLIGHT KINETICS ---
    let activeChaseMode = 0; 
    
    if (currentPhase === 2) {
        const chaseCycle = Math.floor((t - 8.0) / 4.0); 
        
        if (chaseCycle !== lastChaseCycle) {
            lastChaseCycle = chaseCycle;
            activeLaserType = Math.floor(Math.random() * 3); 
        }

        activeChaseMode = (chaseCycle % 5) + 1; 

        if (instances.lasersSingle) instances.lasersSingle.visible = (activeLaserType === 0);
        if (instances.lasersFan) instances.lasersFan.visible = (activeLaserType === 1);
        if (instances.lasersMulti) instances.lasersMulti.visible = (activeLaserType === 2);

        stageSpotlights.forEach(item => {
            const pan = Math.sin(t * 2.0 + item.basePos.x * 0.1) * 0.35;
            const tilt = Math.cos(t * 1.5 + item.basePos.z * 0.1) * 0.2;

            const forward = new THREE.Vector3(0, 0, 40);
            
            const euler = new THREE.Euler(tilt, pan, 0, 'YXZ');
            forward.applyEuler(euler);
            forward.applyQuaternion(item.baseQuat);

            item.target.position.copy(item.basePos).add(forward);
            item.target.updateMatrixWorld();

            item.light.intensity = item.baseIntensity;
        });

    } else {
        if (instances.lasersSingle) instances.lasersSingle.visible = false;
        if (instances.lasersFan) instances.lasersFan.visible = false;
        if (instances.lasersMulti) instances.lasersMulti.visible = false;
        stageSpotlights.forEach(item => item.light.intensity = 0);
    }

    for (let i = 0; i < dynamicMaterials.length; i++) {
        dynamicMaterials[i].uniforms.u_time.value = t;
        dynamicMaterials[i].uniforms.u_chase_mode.value = activeChaseMode;
    }

    composer.render();
}

// --- DYNAMIC RESPONSIVE CAMERA FITTER ---
function updateResponsiveCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    const targetAspect = 1.77; // Base 16:9 target

    if (aspect < targetAspect) {
        // Expand Vertical FOV on mobile/narrow viewports so the full horizontal stage width remains visible
        const defaultFovRad = 35 * (Math.PI / 180);
        const horizontalFov = 2 * Math.atan(Math.tan(defaultFovRad / 2) * targetAspect);
        const calculatedVFov = 2 * Math.atan(Math.tan(horizontalFov / 2) / aspect);

        camera.fov = calculatedVFov * (180 / Math.PI);
    } else {
        camera.fov = 35;
    }

    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

// Initial calculation and event listener setup
updateResponsiveCamera();
window.addEventListener('resize', updateResponsiveCamera);

animate();