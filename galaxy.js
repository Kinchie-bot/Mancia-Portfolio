// Canvas & Context Setup
        const canvas = document.getElementById('matrixCanvas');
        const ctx = canvas.getContext('2d');

        // Main Simulation State Config
        const config = {
            hexRadius: 28,
            nodeCount: 180,
            flowSpeed: 1.0,
            bloomStrength: 0.75,
            glitchFreq: 4,
            showHexMesh: true,
            showCircuitNodes: true,
            showHudReticle: true,
            activeTheme: 'synthwave'
        };

        // Theme Definitions
        const themes = {
            synthwave: {
                primary: '#00f0ff',
                secondary: '#ff0077',
                accent: '#bd00ff',
                grid: 'rgba(0, 240, 255, 0.12)',
                node: '#00f0ff',
                pulse: '#ff0077',
                bg: '#03030c'
            },
            matrix: {
                primary: '#00ff66',
                secondary: '#ffd700',
                accent: '#009933',
                grid: 'rgba(0, 255, 102, 0.12)',
                node: '#00ff66',
                pulse: '#ffd700',
                bg: '#020d05'
            },
            obsidian: {
                primary: '#a855f7',
                secondary: '#ef4444',
                accent: '#3b82f6',
                grid: 'rgba(168, 85, 247, 0.12)',
                node: '#ec4899',
                pulse: '#ef4444',
                bg: '#090312'
            },
            toxic: {
                primary: '#a3e635',
                secondary: '#facc15',
                accent: '#22c55e',
                grid: 'rgba(163, 230, 53, 0.12)',
                node: '#a3e635',
                pulse: '#facc15',
                bg: '#050a02'
            },
            cyberVoid: {
                primary: '#e0f2fe',
                secondary: '#38bdf8',
                accent: '#94a3b8',
                grid: 'rgba(224, 242, 254, 0.14)',
                node: '#ffffff',
                pulse: '#38bdf8',
                bg: '#040810'
            }
        };

        // Dimensions & Interactivity State
        let width, height;
        let mouse = { x: -9999, y: -9999, isDown: false, downX: 0, downY: 0 };
        let shockwaves = [];
        let nodes = [];
        let pulses = [];
        let frameCount = 0;
        let fps = 60;
        let lastFpsUpdate = performance.now();

        // Resize Canvas Handler
        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            initNeuralNodes();
        }
        window.addEventListener('resize', resize);

        // Web Audio API Audio Synth Engine (Ambient Cyber Beats)
        let audioCtx = null;
        let isAudioPlaying = false;
        let audioTimer = null;

        function initAudioSynth() {
            if (audioCtx) return;
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();
        }

        function playSynthPulse() {
            if (!isAudioPlaying || !audioCtx) return;

            const now = audioCtx.currentTime;

            // Sub Bass Kick
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(110, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.15);

            // High Synth Arp Ping
            const notes = [440, 554.37, 659.25, 830.61, 987.77];
            const freq = notes[Math.floor(Math.random() * notes.length)];
            const arpOsc = audioCtx.createOscillator();
            const arpGain = audioCtx.createGain();
            arpOsc.type = 'sawtooth';
            arpOsc.frequency.setValueAtTime(freq, now);
            arpGain.gain.setValueAtTime(0.05, now);
            arpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            arpOsc.connect(arpGain);
            arpGain.connect(audioCtx.destination);
            arpOsc.start(now);
            arpOsc.stop(now + 0.3);

            // Trigger visual pulse synced with audio
            triggerPulseWave(width * 0.5, height * 0.5);
        }

        function toggleAudio() {
            initAudioSynth();
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            isAudioPlaying = !isAudioPlaying;
            const audioIcon = document.getElementById('audioIcon');
            const audioStatusText = document.getElementById('audioStatusText');

            if (isAudioPlaying) {
                audioIcon.className = 'fa-solid fa-volume-high';
                audioStatusText.textContent = 'SYNTH AUDIO: ON';
                audioTimer = setInterval(playSynthPulse, 600);
            } else {
                audioIcon.className = 'fa-solid fa-volume-xmark';
                audioStatusText.textContent = 'SYNTH AUDIO: OFF';
                clearInterval(audioTimer);
            }
        }

        document.getElementById('audioToggleBtn').addEventListener('click', toggleAudio);

        // Shockwave Ripple Class
        class Shockwave {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.radius = 0;
                this.maxRadius = Math.max(width, height) * 0.45;
                this.speed = 12 * config.flowSpeed;
                this.alpha = 1.0;
            }

            update() {
                this.radius += this.speed;
                this.alpha = 1.0 - (this.radius / this.maxRadius);
            }

            draw() {
                if (this.alpha <= 0) return;
                const theme = themes[config.activeTheme];
                ctx.save();
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.strokeStyle = theme.secondary;
                ctx.globalAlpha = Math.max(0, this.alpha * 0.8);
                ctx.lineWidth = 2;
                ctx.shadowColor = theme.secondary;
                ctx.shadowBlur = 15;
                ctx.stroke();
                ctx.restore();
            }
        }

        // Neural Node Particle Class
        class NeuralNode {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 1.2;
                this.vy = (Math.random() - 0.5) * 1.2;
                this.radius = Math.random() * 2 + 1.5;
                this.connections = [];
            }

            update() {
                this.x += this.vx * config.flowSpeed;
                this.y += this.vy * config.flowSpeed;

                // Screen Boundary Wrap
                if (this.x < 0) this.x = width;
                if (this.x > width) this.x = 0;
                if (this.y < 0) this.y = height;
                if (this.y > height) this.y = 0;

                // Mouse Repulsion Force
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const dist = Math.hypot(dx, dy);
                if (dist < 140 && dist > 0) {
                    const force = (140 - dist) / 140;
                    this.x -= (dx / dist) * force * 4;
                    this.y -= (dy / dist) * force * 4;
                }
            }
        }

        // Circuit Signal Pulse Transmission
        class DataPulse {
            constructor(startNode, endNode) {
                this.startNode = startNode;
                this.endNode = endNode;
                this.progress = 0;
                this.speed = (Math.random() * 0.02 + 0.01) * config.flowSpeed;
            }

            update() {
                this.progress += this.speed;
            }

            draw() {
                const theme = themes[config.activeTheme];
                const currentX = this.startNode.x + (this.endNode.x - this.startNode.x) * this.progress;
                const currentY = this.startNode.y + (this.endNode.y - this.startNode.y) * this.progress;

                ctx.save();
                ctx.beginPath();
                ctx.arc(currentX, currentY, 3, 0, Math.PI * 2);
                ctx.fillStyle = theme.pulse;
                ctx.shadowColor = theme.pulse;
                ctx.shadowBlur = 10;
                ctx.fill();
                ctx.restore();
            }
        }

        // Initialize Neural Network Nodes
        function initNeuralNodes() {
            nodes = [];
            for (let i = 0; i < config.nodeCount; i++) {
                nodes.push(new NeuralNode());
            }
            pulses = [];
        }

        // Trigger Shockwave Wavefront
        function triggerPulseWave(x, y) {
            shockwaves.push(new Shockwave(x, y));
        }

        document.getElementById('pulseWaveBtn').addEventListener('click', () => {
            triggerPulseWave(width / 2, height / 2);
        });

        // Drawing Isometric Hexagonal Matrix Grid
        function drawHexGrid() {
            if (!config.showHexMesh) return;

            const theme = themes[config.activeTheme];
            const r = config.hexRadius;
            const h = r * Math.sqrt(3);
            const cols = Math.ceil(width / (r * 3)) + 2;
            const rows = Math.ceil(height / h) + 2;

            ctx.save();
            ctx.lineWidth = 1;

            for (let i = -1; i < cols; i++) {
                for (let j = -1; j < rows; j++) {
                    const x = i * r * 3 + (j % 2 === 0 ? 0 : r * 1.5);
                    const y = j * (h / 2);

                    // Dynamic Distortion Offset from Shockwaves & Mouse
                    let distOffset = 0;
                    const dx = mouse.x - x;
                    const dy = mouse.y - y;
                    const mouseDist = Math.hypot(dx, dy);

                    if (mouseDist < 180) {
                        distOffset += (180 - mouseDist) * 0.15;
                    }

                    for (let sw of shockwaves) {
                        const swDist = Math.hypot(sw.x - x, sw.y - y);
                        const diff = Math.abs(swDist - sw.radius);
                        if (diff < 60) {
                            distOffset += (60 - diff) * 0.4 * sw.alpha;
                        }
                    }

                    drawHexagon(x, y, r + distOffset * 0.1, theme.grid, distOffset > 5);
                }
            }
            ctx.restore();
        }

        function drawHexagon(x, y, radius, strokeColor, isHighlighted) {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const hx = x + radius * Math.cos(angle);
                const hy = y + radius * Math.sin(angle);
                if (i === 0) ctx.moveTo(hx, hy);
                else ctx.lineTo(hx, hy);
            }
            ctx.closePath();

            const theme = themes[config.activeTheme];
            if (isHighlighted) {
                ctx.strokeStyle = theme.primary;
                ctx.shadowColor = theme.primary;
                ctx.shadowBlur = 8 * config.bloomStrength;
            } else {
                ctx.strokeStyle = strokeColor;
                ctx.shadowBlur = 0;
            }
            ctx.stroke();
        }

        // Draw Neural Network Nodes & Circuit Traces
        function drawNeuralNetwork() {
            if (!config.showCircuitNodes) return;

            const theme = themes[config.activeTheme];
            const maxConnectDist = 130;

            // Render Node Connections
            for (let i = 0; i < nodes.length; i++) {
                const n1 = nodes[i];
                n1.update();

                for (let j = i + 1; j < nodes.length; j++) {
                    const n2 = nodes[j];
                    const dx = n1.x - n2.x;
                    const dy = n1.y - n2.y;
                    const dist = Math.hypot(dx, dy);

                    if (dist < maxConnectDist) {
                        const alpha = (1 - dist / maxConnectDist) * 0.4;
                        ctx.beginPath();
                        ctx.moveTo(n1.x, n1.y);
                        ctx.lineTo(n2.x, n2.y);
                        ctx.strokeStyle = theme.primary;
                        ctx.globalAlpha = alpha;
                        ctx.lineWidth = 1;
                        ctx.stroke();

                        // Randomly spawn pulses between connected nodes
                        if (Math.random() < 0.0008 * config.flowSpeed) {
                            pulses.push(new DataPulse(n1, n2));
                        }
                    }
                }

                // Draw Node Point
                ctx.save();
                ctx.beginPath();
                ctx.arc(n1.x, n1.y, n1.radius, 0, Math.PI * 2);
                ctx.fillStyle = theme.node;
                ctx.shadowColor = theme.node;
                ctx.shadowBlur = 10 * config.bloomStrength;
                ctx.globalAlpha = 0.8;
                ctx.fill();
                ctx.restore();
            }

            // Update & Draw Active Data Pulses
            for (let i = pulses.length - 1; i >= 0; i--) {
                const p = pulses[i];
                p.update();
                p.draw();
                if (p.progress >= 1) pulses.splice(i, 1);
            }
        }

        // Draw Laser Tether When Mouse Dragging
        function drawLaserTether() {
            if (!mouse.isDown) return;
            const theme = themes[config.activeTheme];

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(mouse.downX, mouse.downY);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = theme.secondary;
            ctx.lineWidth = 2;
            ctx.shadowColor = theme.secondary;
            ctx.shadowBlur = 15;
            ctx.stroke();

            // Laser Ends Target Rings
            ctx.beginPath();
            ctx.arc(mouse.downX, mouse.downY, 6, 0, Math.PI * 2);
            ctx.arc(mouse.x, mouse.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = theme.secondary;
            ctx.fill();
            ctx.restore();
        }

        // Draw Holographic Cyber HUD Reticle Around Cursor
        function drawHudReticle() {
            if (!config.showHudReticle || mouse.x < 0 || mouse.y < 0) return;

            const theme = themes[config.activeTheme];
            const time = frameCount * 0.03;

            ctx.save();
            ctx.translate(mouse.x, mouse.y);

            // Outer Spinning HUD Ring
            ctx.rotate(time);
            ctx.beginPath();
            ctx.arc(0, 0, 24, 0, Math.PI * 1.5);
            ctx.strokeStyle = theme.primary;
            ctx.lineWidth = 1.5;
            ctx.shadowColor = theme.primary;
            ctx.shadowBlur = 10 * config.bloomStrength;
            ctx.stroke();

            // Inner Counter-Spinning Crosshair Ring
            ctx.rotate(-time * 2);
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = theme.secondary;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Center Point Reticle
            ctx.beginPath();
            ctx.arc(0, 0, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            // Dynamic Hex Readout Text
            ctx.setLineDash([]);
            ctx.font = '9px "Share Tech Mono"';
            ctx.fillStyle = theme.primary;
            const hexCode = `0x${Math.floor(mouse.x).toString(16).toUpperCase()}:${Math.floor(mouse.y).toString(16).toUpperCase()}`;
            ctx.fillText(hexCode, 30, -10);

            ctx.restore();
        }

        // Random Digital Glitch Line Sweeps
        function drawGlitchLines() {
            if (config.glitchFreq === 0) return;

            if (Math.random() < config.glitchFreq * 0.015) {
                const theme = themes[config.activeTheme];
                const y = Math.random() * height;
                const h = Math.random() * 4 + 1;

                ctx.save();
                ctx.fillStyle = theme.secondary;
                ctx.globalAlpha = Math.random() * 0.4 + 0.1;
                ctx.fillRect(0, y, width, h);

                // Displaced Digital Block
                const sliceW = Math.random() * 150 + 50;
                const sliceX = Math.random() * (width - sliceW);
                ctx.fillStyle = theme.primary;
                ctx.fillRect(sliceX, y - 2, sliceW, h + 4);
                ctx.restore();
            }
        }

        // Main Frame Render Loop
        function render() {
            // FPS Counter Calculations
            frameCount++;
            const now = performance.now();
            if (now - lastFpsUpdate >= 1000) {
                fps = frameCount;
                frameCount = 0;
                lastFpsUpdate = now;
                document.getElementById('hudFpsCounter').textContent = fps;
            }

            // Clear Screen
            const theme = themes[config.activeTheme];
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
            ctx.shadowBlur = 0;
            ctx.fillStyle = theme.bg;
            ctx.fillRect(0, 0, width, height);

            // Update & Render Shockwaves
            for (let i = shockwaves.length - 1; i >= 0; i--) {
                const sw = shockwaves[i];
                sw.update();
                sw.draw();
                if (sw.alpha <= 0) shockwaves.splice(i, 1);
            }

            // Render Layer Architecture
            drawHexGrid();
            drawNeuralNetwork();
            drawLaserTether();
            drawHudReticle();
            drawGlitchLines();

            requestAnimationFrame(render);
        }

        // Event Listeners for Interaction
        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;

            document.getElementById('hudMouseCoords').textContent = 
                `X: ${Math.floor(e.clientX).toString().padStart(3, '0')} | Y: ${Math.floor(e.clientY).toString().padStart(3, '0')}`;
        });

        window.addEventListener('mousedown', (e) => {
            if (e.target.closest('#controlsPanel, #matrixToolbar, nav, a, button, input, textarea, select, iframe, .modal, .certificate-lightbox')) return;
            mouse.isDown = true;
            mouse.downX = e.clientX;
            mouse.downY = e.clientY;
            triggerPulseWave(e.clientX, e.clientY);
        });

        window.addEventListener('mouseup', () => {
            mouse.isDown = false;
        });

        // Touch Interaction Support
        window.addEventListener('touchstart', (e) => {
            if (e.target.closest('#controlsPanel, #matrixToolbar, nav, a, button, input, textarea, select, iframe, .modal, .certificate-lightbox')) return;
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                mouse.x = touch.clientX;
                mouse.y = touch.clientY;
                triggerPulseWave(touch.clientX, touch.clientY);
            }
        });

        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                mouse.x = e.touches[0].clientX;
                mouse.y = e.touches[0].clientY;
            }
        });

        // Controls Drawer Toggle Logic
        const controlsPanel = document.getElementById('controlsPanel');
        const toggleControlsBtn = document.getElementById('toggleControlsBtn');
        const closeControlsBtn = document.getElementById('closeControlsBtn');

        toggleControlsBtn.addEventListener('click', () => {
            controlsPanel.classList.add('is-open');
            controlsPanel.setAttribute('aria-hidden', 'false');
        });

        closeControlsBtn.addEventListener('click', () => {
            controlsPanel.classList.remove('is-open');
            controlsPanel.setAttribute('aria-hidden', 'true');
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && controlsPanel.classList.contains('is-open')) {
                controlsPanel.classList.remove('is-open');
                controlsPanel.setAttribute('aria-hidden', 'true');
            }
        });

        // Sliders & Controls Binding
        document.getElementById('gridDensitySlider').addEventListener('input', (e) => {
            config.hexRadius = parseInt(e.target.value);
            document.getElementById('gridDensityVal').textContent = `${config.hexRadius}px`;
        });

        document.getElementById('nodeCountSlider').addEventListener('input', (e) => {
            config.nodeCount = parseInt(e.target.value);
            document.getElementById('nodeCountVal').textContent = config.nodeCount;
            document.getElementById('hudNodeCount').textContent = config.nodeCount;
            initNeuralNodes();
        });

        document.getElementById('flowSpeedSlider').addEventListener('input', (e) => {
            config.flowSpeed = parseFloat(e.target.value);
            document.getElementById('flowSpeedVal').textContent = `${config.flowSpeed.toFixed(1)}x`;
        });

        document.getElementById('bloomSlider').addEventListener('input', (e) => {
            config.bloomStrength = parseFloat(e.target.value);
            document.getElementById('bloomVal').textContent = config.bloomStrength.toFixed(2);
        });

        document.getElementById('glitchSlider').addEventListener('input', (e) => {
            config.glitchFreq = parseInt(e.target.value);
            const labels = ['OFF', 'LOW', 'LOW', 'MED', 'MED', 'MED', 'HIGH', 'HIGH', 'MAX', 'MAX', 'EXTREME'];
            document.getElementById('glitchVal').textContent = labels[config.glitchFreq];
        });

        // Checkbox Toggles
        document.getElementById('toggleHexMesh').addEventListener('change', (e) => {
            config.showHexMesh = e.target.checked;
            document.getElementById('hudMeshStatus').textContent = config.showHexMesh ? 'ACTIVE' : 'OFF';
        });

        document.getElementById('toggleCircuitNodes').addEventListener('change', (e) => {
            config.showCircuitNodes = e.target.checked;
        });

        document.getElementById('toggleHudReticle').addEventListener('change', (e) => {
            config.showHudReticle = e.target.checked;
        });

        document.getElementById('toggleScanlines').addEventListener('change', (e) => {
            const scanlinesLayer = document.getElementById('scanlinesLayer');
            if (e.target.checked) scanlinesLayer.classList.remove('hidden');
            else scanlinesLayer.classList.add('hidden');
        });

        // Theme Switcher Buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active-theme'));
                btn.classList.add('active-theme');

                config.activeTheme = btn.getAttribute('data-theme');
                const theme = themes[config.activeTheme];
                document.documentElement.style.setProperty('--neon-primary', theme.primary);
                document.documentElement.style.setProperty('--neon-secondary', theme.secondary);
                document.documentElement.style.setProperty('--bg-base', theme.bg);
            });
        });

        // Randomize Theme Button
        document.getElementById('randomizeThemeBtn').addEventListener('click', () => {
            const themeKeys = Object.keys(themes);
            config.activeTheme = themeKeys[Math.floor(Math.random() * themeKeys.length)];
            document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.toggle('active-theme', btn.dataset.theme === config.activeTheme));
            
            const theme = themes[config.activeTheme];
            document.documentElement.style.setProperty('--neon-primary', theme.primary);
            document.documentElement.style.setProperty('--neon-secondary', theme.secondary);
            document.documentElement.style.setProperty('--bg-base', theme.bg);

            triggerPulseWave(width / 2, height / 2);
        });

        // Fullscreen Toggle Button
        document.getElementById('fullscreenBtn').addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            } else {
                if (document.exitFullscreen) document.exitFullscreen();
            }
        });

        // Canvas Snapshot Export Feature
        document.getElementById('snapshotBtn').addEventListener('click', () => {
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `Cyberpunk_Matrix_${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
        });

        // Start Application
        resize();
        render();
    
