// Three.js Scene Setup
let scene, camera, renderer, particles, particleSystem;
let mouseX = 0, mouseY = 0;
let time = 0;
let voidIntensity = 0;

// Initialize the void
function initVoid() {
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById('webgl-canvas'),
        antialias: true,
        alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    // Create infinite void with particles
    createParticleVoid();
    
    // Position camera
    camera.position.z = 5;
    
    // Mouse tracking
    document.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', onWindowResize);
    
    // Start animation
    animate();
    
    // Start ghost tweet generation
    generateGhostTweets();
}

// Create particle system for void effect
function createParticleVoid() {
    const particleCount = 2000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const opacities = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
        // Random positions in a sphere
        const radius = Math.random() * 20 + 5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        positions[i] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i + 2] = radius * Math.cos(phi);
        
        // Random velocities for spiral effect
        velocities[i] = (Math.random() - 0.5) * 0.01;
        velocities[i + 1] = (Math.random() - 0.5) * 0.01;
        velocities[i + 2] = (Math.random() - 0.5) * 0.01;
        
        opacities[i / 3] = Math.random() * 0.5 + 0.1;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
    
    // Custom shader material for void particles
    const material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            mouseX: { value: 0 },
            mouseY: { value: 0 },
            voidIntensity: { value: 0 }
        },
        vertexShader: `
            attribute vec3 velocity;
            attribute float opacity;
            varying float vOpacity;
            uniform float time;
            uniform float mouseX;
            uniform float mouseY;
            uniform float voidIntensity;
            
            void main() {
                vOpacity = opacity;
                
                vec3 pos = position;
                
                // Spiral inward effect
                float spiral = sin(time * 0.5 + position.y * 0.1) * 0.1;
                pos.x += spiral;
                pos.z += spiral;
                
                // Mouse interaction
                float mouseInfluence = 0.1;
                pos.x += (mouseX - 0.5) * mouseInfluence;
                pos.y += (mouseY - 0.5) * mouseInfluence;
                
                // Void intensity effect
                float voidPull = voidIntensity * 0.5;
                pos *= (1.0 - voidPull);
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = 2.0 * (1.0 - voidPull);
            }
        `,
        fragmentShader: `
            varying float vOpacity;
            uniform float time;
            uniform float voidIntensity;
            
            void main() {
                float alpha = vOpacity * (1.0 - voidIntensity * 0.5);
                gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);
}

// Generate ghost tweets that fade into the void
function generateGhostTweets() {
    const tweetGhosts = document.getElementById('tweet-ghosts');
    
    function createGhostTweet() {
        const ghost = document.createElement('div');
        ghost.className = 'tweet-ghost';
        
        // Random position across entire screen
        ghost.style.left = Math.random() * (window.innerWidth - 300) + 'px';
        ghost.style.top = Math.random() * (window.innerHeight - 200) + 'px';
        ghost.style.animationDelay = Math.random() * 8 + 's';
        ghost.style.animationDuration = (8 + Math.random() * 4) + 's';
        
        tweetGhosts.appendChild(ghost);
        
        // Remove ghost after animation
        setTimeout(() => {
            if (ghost.parentNode) {
                ghost.parentNode.removeChild(ghost);
            }
        }, 12000);
    }
    
    // Create initial ghosts
    for (let i = 0; i < 5; i++) {
        setTimeout(() => createGhostTweet(), i * 1000);
    }
    
    // Continue generating ghosts
    setInterval(createGhostTweet, 3000);
}

// Mouse movement handler
function onMouseMove(event) {
    mouseX = event.clientX / window.innerWidth;
    mouseY = event.clientY / window.innerHeight;
}

// Window resize handler
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}



// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    time += 0.01;
    
    // Increase void intensity over time
    voidIntensity = Math.min(1, time / 100);
    
    // Update particle system
    if (particleSystem && particleSystem.material) {
        particleSystem.material.uniforms.time.value = time;
        particleSystem.material.uniforms.mouseX.value = mouseX;
        particleSystem.material.uniforms.mouseY.value = mouseY;
        particleSystem.material.uniforms.voidIntensity.value = voidIntensity;
        
        // Rotate particle system for spiral effect
        particleSystem.rotation.y += 0.001;
        particleSystem.rotation.x += 0.0005;
    }
    
    // Update particle positions for spiral effect
    if (particleSystem && particleSystem.geometry) {
        const positions = particleSystem.geometry.attributes.position.array;
        const velocities = particleSystem.geometry.attributes.velocity.array;
        
        for (let i = 0; i < positions.length; i += 3) {
            // Spiral inward effect
            const distance = Math.sqrt(positions[i] ** 2 + positions[i + 1] ** 2 + positions[i + 2] ** 2);
            const spiralSpeed = 0.001 * (1 + voidIntensity);
            
            positions[i] *= (1 - spiralSpeed);
            positions[i + 1] *= (1 - spiralSpeed);
            positions[i + 2] *= (1 - spiralSpeed);
            
            // Reset particles that get too close to center
            if (distance < 1) {
                const radius = Math.random() * 20 + 5;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;
                
                positions[i] = radius * Math.sin(phi) * Math.cos(theta);
                positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
                positions[i + 2] = radius * Math.cos(phi);
            }
        }
        
        particleSystem.geometry.attributes.position.needsUpdate = true;
    }
    
    renderer.render(scene, camera);
}

// Initialize when page loads
window.addEventListener('load', initVoid);

// Prevent context menu
document.addEventListener('contextmenu', e => e.preventDefault());

// Prevent text selection
document.addEventListener('selectstart', e => e.preventDefault()); 