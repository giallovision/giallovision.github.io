// Grab the canvas element from the HTML DOM
const canvas = document.getElementById("glcanvas");

// Initialize the WebGL context. 
// antialias: false speeds up rendering (we don't need it for pixel shaders)
// depth: false disables the 3D depth buffer (saving memory since we calculate 3D in math, not geometry)
const gl = canvas.getContext("webgl", { antialias: false, depth: false });

// ==========================================
// VERTEX SHADER (The Geometry)
// ==========================================
// This is incredibly basic. It simply takes a 2D coordinate (x,y) from our Javascript
// and tells the GPU exactly where it sits on the screen (gl_Position).
const vsSource = `
    attribute vec2 position;
    void main() { 
        gl_Position = vec4(position, 0.0, 1.0); 
    }
`;

// ==========================================
// FRAGMENT SHADER (The Pixels)
// ==========================================
const fsSource = `
    // Force the GPU to calculate floats with maximum precision to avoid visual banding
    precision highp float;

    // --- UNIFORMS (Variables passed from Javascript to the GPU) ---
    uniform vec2 u_resolution; // The width/height of the screen in pixels
    uniform float u_time;      // The continuously ticking clock (for animation)
    uniform float u_scroll;    // The smoothed scroll position of the webpage
    uniform int u_state;       // The ID of the current scene (0, 1, 2, etc.)
    uniform int u_prevState;   // The ID of the previous scene (for crossfading)
    uniform float u_trans;     // A number from 0.0 to 1.0 driving the transition wipe

    // --- CORE MATH & NOISE ---
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

    mat2 m2 = mat2(0.8, -0.6, 0.6, 0.8);

    float fbm( vec2 p ) {
        float f = 0.0;
        float amp = 0.5; 
        for(int i = 0; i < 5; i++) {
            f += amp * noise(p); 
            p = m2 * p * 2.02;   
            amp *= 0.5;          
        }
        return f / 0.9375; 
    }
    
    mat2 rot2(float a) {
        float s = sin(a), c = cos(a);
        return mat2(c, -s, s, c);
    }

    // ==========================================
    // SCENE 0: Giallovision Blue/Teal Clouds
    // ==========================================
    vec3 scene0(vec2 p, float time, float scroll) {
        p.y -= time * 0.05 + scroll; 
        vec2 q = vec2( fbm( p ), fbm( p + vec2(5.2,1.3) ) );
        vec2 r = vec2( fbm( p + 4.0*q + vec2(1.7,9.2) + time*0.1 ), fbm( p + 4.0*q + vec2(8.3,2.8) + time*0.08 ) );
        float f = fbm( p + 4.0*r );
        
        vec3 colBase = vec3(0.03, 0.06, 0.10);   
        vec3 colMid = vec3(0.08, 0.16, 0.3);    
        vec3 colTeal = vec3(0.0, 0.6, 0.80);     
        vec3 colHighlight = vec3(0.4, 0.95, 1.0); 
        
        vec3 col = mix(colBase, colMid, clamp(f*2.0, 0.0, 1.0));
        col = mix(col, colTeal, clamp(length(q) * 1.2, 0.0, 1.0));
        col = mix(col, colHighlight, clamp(length(r.x), 0.0, 1.0) * f * f * 5.0);
        return col;
    }

    // ==========================================
    // SCENE 1: Fiery Amber / Pure Liquid Gold (Olive-Green Purged)
    // ==========================================
    vec3 scene1(vec2 p, float time, float scroll) {
        p.y -= time * 0.05 + scroll; 
        vec2 q = vec2( fbm( p + vec2(1.0, 2.0) ), fbm( p + vec2(3.2,4.3) ) );
        vec2 r = vec2( fbm( p + 3.0*q + vec2(2.7,1.2) + time*0.08 ), fbm( p + 3.0*q + vec2(5.3,6.8) - time*0.06 ) );
        float f = fbm( p + 5.0*r );
        
        // Tightly restrained Green channel to eliminate olive/mud tones completely
        vec3 colBase = vec3(0.03, 0.01, 0.005);    // Obsidian obsidian-amber dark
        vec3 colMid = vec3(0.92, 0.32, 0.02);     // Deep fiery burnt orange / amber
        vec3 colGold = vec3(1.0, 0.58, 0.08);     // Radiant warm gold
        vec3 colHighlight = vec3(1.0, 0.85, 0.4); // Hot golden white core
        
        vec3 col = mix(colBase, colMid, clamp(f*2.2, 0.0, 1.0));
        col = mix(col, colGold, clamp(length(q) * 1.5, 0.0, 1.0));
        col += colHighlight * clamp(length(r.x), 0.0, 1.0) * f * f * 4.0;
        return col;
    }

    // ==========================================
    // SCENE 2: Broad Turquoise Reaction-Diffusion (Scaled Large)
    // ==========================================
    vec3 scene2(vec2 p, float time, float scroll) {
        // 1. Scale down spatial coordinates (0.45) to widen all visual elements
        vec2 st = p * 0.45;
        st.y -= time * 0.02 + scroll * 0.3; 
        
        vec2 q = vec2(fbm(st) * 0.15, fbm(st + 3.0 * vec2(12.0, 1.3)));
        float n = fbm(st * 0.6 + 2.5 * q + time * 0.02);
        
        // 2. Reduced frequency multiplier (from 63.0 down to 22.0) for sweeping lines
        float rd = sin(n * 22.0 - time * 0.6);
        float glow = smoothstep(0.75, 0.0, abs(rd));
        float core = smoothstep(0.15, 0.0, abs(rd));
        
        vec3 colBase = vec3(0.01, 0.03, 0.06);   
        vec3 colMid = vec3(0.0, 0.45, 0.65);       // Deep electric teal
        vec3 colHighlight = vec3(0.2, 0.9, 1.0);  // High-contrast turquoise core
        
        vec3 col = mix(colBase, colMid, fbm(st + q));
        col += colMid * glow * 1.4;
        col += colHighlight * core * 2.0; 
        return col;
    }

    // ==========================================
    // SCENE 3: Viscous Fluid Sim (Rich Amber & Burnished Gold)
    // ==========================================
    vec3 scene3(vec2 p, float time, float scroll) {
        p.y -= scroll * 0.5;
        vec2 q = p;
        for (int i = 0; i < 5; i++) {
            float t = time * 0.15;
            q += vec2(sin(q.y * 1.5 + t), cos(q.x * 1.5 - t)) * 0.6;
            q = m2 * q * 1.2;
        }
        float n = noise(q * 2.0 + time * 0.1);
        
        vec3 colBase = vec3(0.03, 0.015, 0.005);   // Dark bronze abyss
        vec3 colMid = vec3(0.9, 0.42, 0.05);       // Rich glowing amber
        vec3 colGold = vec3(1.0, 0.82, 0.22);      // Brilliant polished gold
        
        vec3 col = mix(colBase, colMid, smoothstep(0.0, 0.75, n));
        col = mix(col, colGold, smoothstep(0.55, 1.0, n) * 1.8);
        
        float spec = pow(max(0.0, sin(q.x * 4.0) * cos(q.y * 4.0)), 6.0);
        col += vec3(1.0, 0.92, 0.65) * spec * 0.8; // Incandescent specular
        return col;
    }

    // ==========================================
    // SCENE 4: ORGANIC TUNNEL (Wavy Corona, Tiny Core, Deep Shadows)
    // ==========================================
    mat2 rot2D(float a) {
        float c = cos(a), s = sin(a);
        return mat2(c, s, -s, c);
    }

    vec3 scene4(vec2 p_in, float time, float scroll) {
        vec2 st = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
        
        // THE FOV FIX: Changed st * 2.0 to st * 3.3
        // This is a wider-angle virtual lens. It shrinks the center void 
        // and pulls all the wavy "legs" from the edges into the frame.
        vec3 d = normalize(vec3(st * 2.0, 1.0)); 
        
        float T = (time * 0.05) + (scroll * 0.1);
        vec3 p = vec3(0.0);
        p.z = T * 2.0; 
        
        float s = 0.0;
        float dens = 0.0; // Track pure density first, color it later
        
        for (float i = 0.0; i < 25.0; i++) {
            // Re-introduced slightly more twist to help the corona spiral
            p.xy *= rot2D(-p.z * 0.01 - T * 0.15); 
            
            s = 0.6;
            
            // THE GEOMETRY FIX: Shrunk the cylinder radius from 10.0 down to 4.0.
            // This forces the physical walls much closer to the camera.
            s = max(s, 6.3 * (-length(p.xy) + 4.0));
            
            // THE CORONA FIX: Amplified the sine wave deformation.
            // This creates thicker, more aggressive "wavy legs" that jut into the tunnel.
            s += abs(p.y * 0.1 + sin(T - p.x * 1.2) * 2.1 + 0.5);
            
            p += d * s;
            
            // Accumulate pure volumetric density (like the original shader)
            dens += 1.0 / (s * 0.21);
        }
        
        // COLOR MAP FIX: Calculate color based on the final depth traveled (p.z)
        // and apply it to the density all at once for buttery smooth volume blending.
        float phase = -sin(p.z * 0.15 - T * 1.5) * 0.5 + 0.5;
        vec3 tealNavy  = vec3(0.0, 0.75, 0.95);
        vec3 amberGold = vec3(1.0, 0.50, 0.08);
        vec3 colorMap = mix(tealNavy, amberGold, phase);
        
        vec3 accum = (dens / 50.0) * colorMap;
        
        // Vignette to darken the extreme edges
        float l = length(st);
        accum *= max(0.0, 1.2 - l * 2.1);
        
        // Tiny glowing core at the absolute center
        float tinyGlow = smoothstep(0.08, 0.0, l);
        accum += mix(tealNavy, amberGold, sin(T)*0.5+0.5) * tinyGlow * 1.5; 
        
        // --- GIALLOVISION TONE MAP & GAMMA ---
        vec3 col = accum / (accum + 0.55);
        // Deep shadows (pulled back slightly to 1.65 so the dark waves aren't completely lost)
        col = pow(col, vec3(1.65)); 
        
        vec3 bg = vec3(0.001, 0.003, 0.008);
        return clamp(col + bg, 0.0, 1.0);
    }

    vec3 getScene(int id, vec2 p, float time, float scroll) {
        if (id == 1) return scene1(p, time, scroll);
        if (id == 2) return scene2(p, time, scroll);
        if (id == 3) return scene3(p, time, scroll);
        if (id == 4) return scene4(p, time, scroll);
        return scene0(p, time, scroll); 
    }

    void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 p = uv * 3.5; 
        p.x *= u_resolution.x / u_resolution.y;

        vec3 cFrom = getScene(u_prevState, p, u_time, u_scroll);
        vec3 cTo = getScene(u_state, p, u_time, u_scroll);

        float burn = smoothstep(0.0, 0.3, u_trans) * smoothstep(1.0, 0.3, u_trans);
        cFrom += cFrom * burn * 3.5; 

        float nWipe = noise(p * 2.0 + u_time * 2.0);
        float edge = u_trans * 1.5 - 0.25; 
        float wipe = smoothstep(edge - 0.05, edge + 0.05, uv.y + nWipe * 0.3);

        vec3 finalCol = mix(cFrom, cTo, 1.0 - wipe);
        gl_FragColor = vec4(finalCol, 1.0); 
    }
`;

// --- WEBGL COMPILE BOILERPLATE ---
function createShader(glCtx, type, source) {
    const shader = glCtx.createShader(type);
    glCtx.shaderSource(shader, source);
    glCtx.compileShader(shader);
    return shader;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

const positionLocation = gl.getAttribLocation(program, "position");
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

const timeLocation = gl.getUniformLocation(program, "u_time");
const resLocation = gl.getUniformLocation(program, "u_resolution");
const scrollLocation = gl.getUniformLocation(program, "u_scroll");
const stateLocation = gl.getUniformLocation(program, "u_state");
const prevStateLocation = gl.getUniformLocation(program, "u_prevState");
const transLocation = gl.getUniformLocation(program, "u_trans");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(resLocation, canvas.width, canvas.height);
}
window.addEventListener('resize', resize);
resize();

// ==========================================
// STATE MACHINE: UNIVERSAL MEDIA PLAYLISTS (BUILDFROOF OMTIMIZED)
// ==========================================
const steps = document.querySelectorAll('.step');
const proxy = document.getElementById('scroll-proxy');

const vid1 = document.getElementById('portfolio-video-1');
const vid2 = document.getElementById('portfolio-video-2');
const img1 = document.getElementById('portfolio-img-1');
const img2 = document.getElementById('portfolio-img-2');

// Strictly enforce app-driven progression (No native looping)
[vid1, vid2].forEach(video => {
    video.loop = false;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    
    // Auto-Healer: If a video stalls mid-playback, try to kickstart it
    video.addEventListener('stalled', () => {
        if (video === activeMedia && video.src && video.paused) {
            video.load();
            video.play().catch(() => playNextInPlaylist());
        }
    });

    // Auto-Healer: If a file fails to load entirely, skip to the next one instantly
    video.addEventListener('error', () => {
        if (video === activeMedia) {
            console.warn("[GVIS] Media error detected. Skipping node.");
            playNextInPlaylist();
        }
    });
});

let activeMedia = vid1; 

const totalSteps = steps.length;
if(proxy) proxy.style.height = `${totalSteps * 100}vh`;

let currentState = 0;
let prevState = 0;
let transProgress = 0.0;
let isTransitioning = false;

let masterPlaylist = [];
let playlistIndex = 0;
let mediaTimer = null;
const IMAGE_DISPLAY_TIME = 6000; 

function easeInOutQuad(x) {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function playNextInPlaylist() {
    if (masterPlaylist.length > 0) {
        playlistIndex = (playlistIndex + 1) % masterPlaylist.length;
        crossfadeTo(masterPlaylist[playlistIndex]);
    }
}

// ASYNCHRONOUS MEDIA CONNECTOR PIPELINE
function crossfadeTo(src) {
    if (!src) return;
    
    clearTimeout(mediaTimer); 
    const isVideo = src.toLowerCase().endsWith('.mp4') || src.toLowerCase().endsWith('.webm');

    const triggerFade = (newMediaElement) => {
        requestAnimationFrame(() => {
            newMediaElement.className = "bg-media active-media";
            activeMedia.className = "bg-media hidden-media";
            
            const oldMedia = activeMedia;
            setTimeout(() => {
                if (oldMedia.tagName === 'VIDEO' && oldMedia !== newMediaElement) {
                    oldMedia.pause();
                    oldMedia.removeAttribute('src'); // True memory flush
                    oldMedia.load();
                }
            }, 850); 
            
            activeMedia = newMediaElement;
            
            if (!isVideo) {
                mediaTimer = setTimeout(playNextInPlaylist, IMAGE_DISPLAY_TIME);
            }
        });
    };

    if (isVideo) {
        let nextVid = (activeMedia === vid1) ? vid2 : vid1;
        
        nextVid.pause();
        nextVid.src = src;
        nextVid.load();
        
        const executePlayback = () => {
            nextVid.play()
                .then(() => triggerFade(nextVid))
                .catch(e => {
                    console.warn("[GVIS] Playback intercepted, advancing safely.");
                    playNextInPlaylist();
                });
        };

        if (nextVid.readyState >= 3) {
            executePlayback();
        } else {
            nextVid.addEventListener('canplay', executePlayback, { once: true });
        }
    } else {
        let nextImg = (activeMedia === img1) ? img2 : img1;
        
        nextImg.onload = () => triggerFade(nextImg);
        nextImg.src = src; 
        
        if (nextImg.complete) {
            nextImg.onload = null;
            triggerFade(nextImg);
        }
    }
}

function handleVideoEnd(e) {
    if (e.target !== activeMedia) return; 
    playNextInPlaylist();
}

vid1.addEventListener('ended', handleVideoEnd);
vid2.addEventListener('ended', handleVideoEnd);

window.addEventListener('scroll', () => {
    let scrollY = window.scrollY;
    let stepHeight = window.innerHeight;
    let currentFloat = scrollY / stepHeight;
    let newIndex = Math.min(Math.max(Math.floor(currentFloat + 0.5), 0), totalSteps - 1);

    if (newIndex !== currentState && !isTransitioning) {
        prevState = currentState;
        currentState = newIndex;
        isTransitioning = true;
        transProgress = 0.0;

        steps.forEach((s, i) => {
            if (i === currentState) s.classList.add('is-active');
            else s.classList.remove('is-active');
        });
    }
});

// Gathering datasets across all elements
let rawList = [];
steps.forEach(step => {
    const videoListStr = step.getAttribute('data-videos');
    const imgListStr = step.getAttribute('data-img');
    if (videoListStr) rawList.push(...videoListStr.split(',').map(s => s.trim()));
    if (imgListStr) rawList.push(...imgListStr.split(',').map(s => s.trim()));
});

masterPlaylist = [...new Set(rawList.filter(s => s !== ""))];

if(masterPlaylist.length > 0) {
    masterPlaylist = shuffleArray(masterPlaylist);
    crossfadeTo(masterPlaylist[0]);
}

let smoothScrollY = 0;

// --- FRAMERATE LIMITER ---
const FPS = 24; // Change to 24 for a more cinematic feel
const fpsInterval = 1000 / FPS;
let lastTime = 0;

function render(time) {
    // Request the next frame immediately, but we might skip drawing it
    requestAnimationFrame(render);

    // Calculate time since the last frame was drawn
    const elapsed = time - lastTime;

    // If enough time hasn't passed, skip this frame
    if (elapsed < fpsInterval) return;

    // Adjust lastTime to account for slight variations in frame delivery
    lastTime = time - (elapsed % fpsInterval);

    // --- YOUR EXISTING RENDER LOGIC ---
    smoothScrollY += (window.scrollY - smoothScrollY) * 0.1;
    let shaderScroll = smoothScrollY / window.innerHeight;

    gl.useProgram(program);
    gl.uniform1f(timeLocation, time * 0.001); 
    gl.uniform1f(scrollLocation, shaderScroll * 0.5); 
    gl.uniform1i(stateLocation, currentState);
    gl.uniform1i(prevStateLocation, prevState);

    if (isTransitioning) {
        transProgress += 0.012; 
        if (transProgress >= 1.0) {
            transProgress = 1.0;
            isTransitioning = false;
        }
    }
    
    gl.uniform1f(transLocation, easeInOutQuad(transProgress));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

// Kick off the loop
requestAnimationFrame(render);