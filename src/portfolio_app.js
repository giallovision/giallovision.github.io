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
    // SCENE 1: Deep Amber / Turquoise Warp
    // ==========================================
    vec3 scene1(vec2 p, float time, float scroll) {
        p.y -= time * 0.06 + scroll; 
        vec2 q = vec2( fbm( p + vec2(1.0, 2.0) ), fbm( p + vec2(3.2,4.3) ) );
        vec2 r = vec2( fbm( p + 3.0*q + vec2(2.7,1.2) + time*0.08 ), fbm( p + 3.0*q + vec2(5.3,6.8) - time*0.06 ) );
        float f = fbm( p + 5.0*r );
        
        vec3 colBase = vec3(0.1, 0.06, 0.03);     
        vec3 colMid = vec3(0.35, 0.22, 0.12);      
        vec3 colGold = vec3(1.0, 0.65, 0.3);     
        vec3 colHighlight = vec3(0.1, 0.95, 0.90);  
        
        vec3 col = mix(colBase, colMid, clamp(f*2.0, 0.0, 1.0));
        col = mix(col, colGold, clamp(length(q) * 1.5, 0.0, 1.0));
        col = mix(col, colHighlight, clamp(length(r.x), 0.0, 1.0) * f * f * 4.2);
        return col;
    }

    // ==========================================
    // SCENE 2: Turquoise Reaction-Diffusion 
    // ==========================================
    vec3 scene2(vec2 p, float time, float scroll) {
        p.y -= time * 0.03 + scroll * 0.5; 
        vec2 q = vec2(fbm(p) * 0.1, fbm(p + 4.2 * vec2(42., 1.3)));
        float n = fbm(p * 0.5 + 4.0 * q + time * 0.025);
        
        float rd = sin(n * 63.0 - time * 0.8);
        float glow = smoothstep(0.8, 0.0, abs(rd));
        float core = smoothstep(0.1, 0.0, abs(rd));
        
        vec3 colBase = vec3(0.01, 0.03, 0.05);   
        vec3 colMid = vec3(0.0, 0.35, 0.55);       
        vec3 colHighlight = vec3(0.1, 0.85, 0.95); 
        
        vec3 col = mix(colBase, colMid, fbm(p + q));
        col += colMid * glow * 1.5;
        col += colHighlight * core * 2.1; 
        return col;
    }

    // ==========================================
    // SCENE 3: Viscous Fluid Sim 
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
        
        vec3 colBase = vec3(0.01, 0.03, 0.05);
        vec3 colMid = vec3(0.0, 0.4, 0.6); 
        vec3 colGold = vec3(0.9, 0.65, 0.1); 
        
        vec3 col = mix(colBase, colMid, smoothstep(0.0, 0.8, n));
        col = mix(col, colGold, smoothstep(0.65, 1.0, n) * 1.5);
        
        float spec = pow(max(0.0, sin(q.x * 4.0) * cos(q.y * 4.0)), 6.0);
        col += vec3(0.8, 0.95, 1.0) * spec * 0.6; 
        return col;
    }

    // ==========================================
    // SCENE 4: ABSTRACT GLASSY FIELD (90% Blue, 5% Teal, 5% Gold)
    // ==========================================
    float g_accum = 0.0; 

    vec3 camPath(float t) {
        float a = sin(t * 0.11);
        float b = cos(t * 0.14);
        return vec3(a * 4.0 - b * 1.5, b * 1.7 + a * 1.5, t);
    }

    float mapGlass(vec3 p) {
        p.xy -= camPath(p.z).xy; 
        p = cos(mod(p * 0.315 * 1.25 + sin(mod(p.zxy * 0.875 * 1.25, 6.2831853)), 6.2831853));
        return (length(p) - 1.025) * 1.33;
    }

    float caoGlass(vec3 p, vec3 n) {
        float sca = 1.0, occ = 0.0;
        for(int i = 0; i < 5; i++) {
            float fi = float(i);
            float hr = 0.01 + fi * 0.35 / 4.0;
            float dd = mapGlass(n * hr + p);
            occ += (hr - dd) * sca;
            sca *= 0.7;
        }
        return clamp(1.0 - occ, 0.0, 1.0);
    }

    vec3 nrGlass(vec3 p) {
        vec2 e = vec2(0.002, 0.0);
        return normalize(vec3(
            mapGlass(p + e.xyy) - mapGlass(p - e.xyy),
            mapGlass(p + e.yxy) - mapGlass(p - e.yxy),
            mapGlass(p + e.yyx) - mapGlass(p - e.yyx)
        ));
    }

    float traceGlass(vec3 ro, vec3 rd) {
        g_accum = 0.0;
        float t = 0.0, h;
        for(int i = 0; i < 80; i++) {
            h = mapGlass(ro + rd * t);
            if(abs(h) < 0.001 * (t * 0.25 + 1.0) || t > 50.0) break;
            t += h; 
            if(abs(h) < 0.35) g_accum += (0.35 - abs(h)) / 24.0;
        }
        return min(t, 50.0);
    }

    vec3 scene4(vec2 p, float time, float scroll) {
        vec2 u = p * 0.25; 
        float speed = 1.2; 
        float tTime = time * speed + scroll * 4.0;

        vec3 o = camPath(tTime);
        vec3 lk = camPath(tTime + 0.25); 
        vec3 l = camPath(tTime + 2.0) + vec3(0.0, 1.0, 0.0); 

        vec3 fwd = normalize(lk - o);
        vec3 rgt = normalize(vec3(fwd.z, 0.0, -fwd.x));
        vec3 up = cross(fwd, rgt);

        float FOV = 2.1; 
        vec3 r = fwd + FOV * (u.x * rgt + u.y * up);
        r = normalize(vec3(r.xy, r.z - length(r.xy) * 0.125));

        float t = traceGlass(o, r);
        vec3 col = vec3(0.0); 

        if(t < 50.0) {
            vec3 sp_p = o + r * t; 
            vec3 n = nrGlass(sp_p); 
            vec3 svn = n;

            vec3 lDir = l - sp_p;
            float d = max(length(lDir), 0.001);
            lDir /= d;
            float at = 1.0 / (1.0 + d * 0.05 + d * d * 0.0125);
            float ao = caoGlass(sp_p, n);

            float di = max(dot(lDir, n), 0.0);
            float sp = pow(max(dot(reflect(r, n), lDir), 0.0), 64.0);
            float fr = clamp(1.0 + dot(r, n), 0.0, 1.0);

            // [90% DOMINANT BLUE]
            vec3 tx = vec3(0.01, 0.04, 0.18); 
            col = tx * (di * 0.1 + ao * 0.25) + vec3(0.0, 0.5, 1.0) * sp * 1.5 + vec3(0.0, 0.8, 1.0) * pow(fr, 4.0) * 0.1;

            vec3 reflVec = normalize(reflect(r, svn * 0.5 + n * 0.5));
            vec3 refrVec = normalize(refract(r, svn * 0.5 + n * 0.5, 1.0 / 1.35));

            vec3 envRefl = mix(vec3(0.01, 0.1, 0.6), vec3(0.0, 0.6, 0.9), smoothstep(-1.0, 1.0, reflVec.y + reflVec.x));
            vec3 envRefr = mix(vec3(0.01, 0.15, 0.7), vec3(0.0, 0.7, 1.0), smoothstep(-1.0, 1.0, refrVec.y + refrVec.x));

            vec3 refCol = mix(envRefr, envRefl, pow(fr, 5.0));
            col += refCol * ((di * di * 0.25 + 0.75) + ao * 0.25) * 1.5;
            col *= (di * 0.85 + 0.15); 

            // [5% TEAL WEIGHT GLOW]
            vec3 glowCol = mix(vec3(0.0, 0.3, 0.8), vec3(0.0, 0.85, 0.95), smoothstep(0.0, 0.8, g_accum));
            col += col * glowCol * g_accum * 8.0;

            // [5% AMBER ARCS]
            float hi = abs(mod(t + tTime * 0.5, 8.0) - 4.0) * 2.0;
            vec3 cCol = mix(vec3(0.0, 0.6, 1.0), vec3(1.0, 0.65, 0.1), fbm(sp_p.xy * 2.0));
            col += cCol * col * 1.0 / (0.001 + hi * hi * 0.2);

            col *= ao * at; 
        }

        vec3 fog = vec3(0.01, 0.03, 0.15); 
        col = mix(col, fog, smoothstep(0.0, 0.95, t / 50.0));
        return col;
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

// Hardcode looping parameters to false to make sure ended event registers natively
vid1.loop = false;
vid2.loop = false;

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
        // Prevent flashing by running class assignment on next layout repaint
        requestAnimationFrame(() => {
            newMediaElement.className = "bg-media active-media";
            activeMedia.className = "bg-media hidden-media";
            
            const oldMedia = activeMedia;
            setTimeout(() => {
                if (oldMedia.tagName === 'VIDEO' && oldMedia !== newMediaElement) {
                    oldMedia.pause();
                    oldMedia.src = ""; // Flush memory pipeline allocation
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
        
        // Fully break out of previous operations before defining source lines
        nextVid.pause();
        nextVid.src = src;
        nextVid.load();
        
        const executePlayback = () => {
            nextVid.play()
                .then(() => triggerFade(nextVid))
                .catch(e => {
                    // Catch execution abort loops natively without halting state progression
                    console.warn("Playback intercept handled, tracking progression safely.");
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
        
        // Handle immediate cached executions
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

function render(time) {
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
    
    requestAnimationFrame(render);
}

requestAnimationFrame(render);