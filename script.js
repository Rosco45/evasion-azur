/**
 * ÉVASION AZUR — LUXURY TRAVEL INTERACTION SCRIPT
 * High-End Takeoff Animations, Canvas Sky Trails, Web Audio FX & Interactive VIP Drawer
 */

document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       1. CANVAS BACKGROUND: CELESTIAL SKY & SUBTLE AMBIENT FLIGHT CONTRAILS
       ========================================================================== */
    const canvas = document.getElementById('airplaneFlightCanvas');
    const ctx = canvas.getContext('2d');
    let width, height;

    function resizeCanvas() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // High altitude cruising lines & gentle luminous particles
    const skyParticles = [];
    const particleCount = 24;

    for (let i = 0; i < particleCount; i++) {
        skyParticles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 1.5 + 0.5,
            speedX: Math.random() * 0.35 + 0.1,
            speedY: (Math.random() - 0.5) * 0.1,
            opacity: Math.random() * 0.4 + 0.15,
            color: Math.random() > 0.5 ? 'rgba(2, 132, 199, ' : 'rgba(20, 184, 166, '
        });
    }

    // Occasional gentle ambient background jet contrail
    let ambientContrails = [];
    function spawnAmbientContrail() {
        const startY = Math.random() * (height * 0.4) + 40;
        ambientContrails.push({
            x: -80,
            y: startY,
            speedX: Math.random() * 1.4 + 1.1,
            speedY: -Math.random() * 0.3 - 0.15,
            history: []
        });
    }
    setInterval(spawnAmbientContrail, 16000);
    spawnAmbientContrail();

    function renderSky() {
        ctx.clearRect(0, 0, width, height);

        // Draw ambient particles
        for (let p of skyParticles) {
            p.x += p.speedX;
            p.y += p.speedY;

            if (p.x > width + 20) p.x = -20;
            if (p.y > height + 20) p.y = -20;
            if (p.y < -20) p.y = height + 20;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color + p.opacity + ')';
            ctx.fill();
        }

        // Draw ambient cruising jet contrails
        for (let i = ambientContrails.length - 1; i >= 0; i--) {
            const c = ambientContrails[i];
            c.x += c.speedX;
            c.y += c.speedY;
            c.history.push({ x: c.x, y: c.y });

            if (c.history.length > 50) {
                c.history.shift();
            }

            if (c.history.length > 1) {
                ctx.beginPath();
                ctx.moveTo(c.history[0].x, c.history[0].y);
                for (let h = 1; h < c.history.length; h++) {
                    ctx.lineTo(c.history[h].x, c.history[h].y);
                }
                const grad = ctx.createLinearGradient(
                    c.history[0].x, c.history[0].y,
                    c.x, c.y
                );
                grad.addColorStop(0, 'rgba(2, 132, 199, 0)');
                grad.addColorStop(0.7, 'rgba(6, 182, 212, 0.2)');
                grad.addColorStop(1, 'rgba(255, 255, 255, 0.6)');

                ctx.strokeStyle = grad;
                ctx.lineWidth = 1.2;
                ctx.lineCap = 'round';
                ctx.stroke();

                // Draw tiny jet tip
                ctx.save();
                ctx.translate(c.x, c.y);
                ctx.rotate(Math.atan2(c.speedY, c.speedX));
                ctx.fillStyle = '#0284C7';
                ctx.beginPath();
                ctx.moveTo(6, 0);
                ctx.lineTo(-4, -2.5);
                ctx.lineTo(-2, 0);
                ctx.lineTo(-4, 2.5);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }

            if (c.x > width + 200 || c.y < -100) {
                ambientContrails.splice(i, 1);
            }
        }

        requestAnimationFrame(renderSky);
    }
    renderSky();

    /* ==========================================================================
       2. DYNAMIC TAKEOFF CONTRAIL CANVAS (DÉCLENCHEUR 1)
       ========================================================================== */
    const trailCanvas = document.getElementById('takeoffTrailCanvas');
    const tCtx = trailCanvas.getContext('2d');
    let trailActive = false;
    let trailParticles = [];

    function resizeTrailCanvas() {
        trailCanvas.width = window.innerWidth;
        trailCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeTrailCanvas);
    resizeTrailCanvas();

    function addContrailPuff(x, y) {
        trailParticles.push({
            x: x,
            y: y,
            radius: Math.random() * 8 + 4,
            maxRadius: Math.random() * 26 + 18,
            opacity: 0.75,
            color: Math.random() > 0.4 ? 'rgba(6, 182, 212, ' : 'rgba(2, 132, 199, ',
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8
        });
    }

    function renderContrail() {
        tCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);

        for (let i = trailParticles.length - 1; i >= 0; i--) {
            const p = trailParticles[i];
            p.radius += 0.45;
            p.opacity -= 0.016;
            p.x += p.vx;
            p.y += p.vy;

            if (p.opacity <= 0) {
                trailParticles.splice(i, 1);
                continue;
            }

            tCtx.beginPath();
            tCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            tCtx.fillStyle = p.color + p.opacity + ')';
            tCtx.fill();
        }

        if (trailParticles.length > 0 || trailActive) {
            requestAnimationFrame(renderContrail);
        }
    }

    /* ==========================================================================
       3. WEB AUDIO SYNTHESIZER: HARMONIE CRISTALLINE & SOUFFLE DE RÉACTEUR
       ========================================================================== */
    let audioContext = null;
    let soundEnabled = false;
    const soundToggle = document.getElementById('soundToggle');

    function initAudio() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    soundToggle.addEventListener('click', () => {
        initAudio();
        soundEnabled = !soundEnabled;
        if (soundEnabled) {
            soundToggle.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
            soundToggle.style.background = 'var(--azure-600)';
            soundToggle.style.color = '#FFFFFF';
            showToast('Ambiance sonore activée', 'Son de décollage haute fidélité synchronisé');
            playTakeoffSound();
        } else {
            soundToggle.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
            soundToggle.style.background = '';
            soundToggle.style.color = '';
            showToast('Mode silencieux actif', 'Ambiance sonore en sourdine');
        }
    });

    function playTakeoffSound() {
        if (!soundEnabled || !audioContext) return;
        try {
            const now = audioContext.currentTime;

            // Accord cristallin azur (C5, E5, G5, C6)
            const freqs = [523.25, 659.25, 783.99, 1046.50];
            freqs.forEach((freq, idx) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.08);

                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.05 / (idx + 1), now + idx * 0.08 + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5 + idx * 0.1);

                osc.connect(gain);
                gain.connect(audioContext.destination);

                osc.start(now + idx * 0.08);
                osc.stop(now + 1.8);
            });

            // Souffle aérodynamique doux filtré
            const bufferSize = audioContext.sampleRate * 1.5;
            const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = audioContext.createBufferSource();
            noise.buffer = buffer;

            const filter = audioContext.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(300, now);
            filter.frequency.exponentialRampToValueAtTime(1500, now + 1.1);
            filter.Q.setValueAtTime(2.8, now);

            const noiseGain = audioContext.createGain();
            noiseGain.gain.setValueAtTime(0, now);
            noiseGain.gain.linearRampToValueAtTime(0.07, now + 0.25);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(audioContext.destination);

            noise.start(now);
            noise.stop(now + 1.4);
        } catch (e) {
            console.warn('Audio non disponible ou geste requis:', e);
        }
    }

    /* ==========================================================================
       4. DÉCLENCHEUR 1 : DÉCOLLAGE DE L'AVION VECTORIEL EN DIAGONALE (RECHERCHE/CTA)
       ========================================================================== */
    const screenFlyer = document.getElementById('screenFlyer');
    const flightModal = document.getElementById('flightModal');
    const modalTargetDestination = document.getElementById('modalTargetDestination');
    const flightCodeVal = document.getElementById('flightCodeVal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalBackdrop = document.getElementById('modalBackdrop');
    const modalConfirmBtn = document.getElementById('modalConfirmBtn');
    const takeoffToast = document.getElementById('takeoffToast');
    const toastTitle = document.getElementById('toastTitle');
    const toastSub = document.getElementById('toastSub');

    let toastTimer = null;
    function showToast(title, subtitle) {
        if (toastTimer) clearTimeout(toastTimer);
        toastTitle.textContent = title;
        toastSub.textContent = subtitle;
        takeoffToast.classList.add('visible');
        toastTimer = setTimeout(() => {
            takeoffToast.classList.remove('visible');
        }, 4000);
    }

    // Fonction de décollage en diagonale avec traînée dynamique
    function triggerAirplaneTakeoff(buttonElement, targetName = "Votre Destination d'Exception") {
        playTakeoffSound();

        // 1. Déterminer le point de départ du décollage
        let startX, startY;
        if (buttonElement && buttonElement.getBoundingClientRect) {
            const rect = buttonElement.getBoundingClientRect();
            startX = rect.left + rect.width / 2;
            startY = rect.top + rect.height / 2;
        } else {
            startX = window.innerWidth * 0.1;
            startY = window.innerHeight * 0.85;
        }

        // Si le bouton est trop près du haut ou de la droite, ajuster pour une diagonale parfaite
        if (startX > window.innerWidth * 0.6) {
            startX = window.innerWidth * 0.15;
        }
        if (startY < window.innerHeight * 0.4) {
            startY = window.innerHeight * 0.75;
        }

        screenFlyer.style.setProperty('--start-x', `${startX}px`);
        screenFlyer.style.setProperty('--start-y', `${startY}px`);
        screenFlyer.style.setProperty('--start-angle', '-24deg');

        // Réinitialiser la classe d'animation
        screenFlyer.classList.remove('active-takeoff');
        void screenFlyer.offsetWidth; // Forcer reflow DOM
        screenFlyer.classList.add('active-takeoff');

        // Générer des bouffées de condensation sur le Canvas pendant le vol
        trailActive = true;
        renderContrail();
        let frameCount = 0;
        const trailInterval = setInterval(() => {
            const flyerRect = screenFlyer.getBoundingClientRect();
            if (flyerRect.width > 0 && flyerRect.left < window.innerWidth && flyerRect.top > -100) {
                addContrailPuff(flyerRect.left + 10, flyerRect.top + flyerRect.height / 2);
            }
            frameCount++;
            if (frameCount > 35) {
                clearInterval(trailInterval);
                trailActive = false;
            }
        }, 40);

        // Feedback au clic
        if (buttonElement && buttonElement.style) {
            buttonElement.style.transform = 'scale(0.96)';
            setTimeout(() => {
                buttonElement.style.transform = '';
            }, 250);
        }

        // Référence de vol aléatoire haute joaillerie
        const randomFlightNum = `AZ-${Math.floor(1000 + Math.random() * 9000)}`;

        // Toast de confirmation
        showToast(`Décollage Autorisé — ${randomFlightNum}`, `Cap sur : ${targetName}`);

        // Ouverture fluide du Boarding Pass VIP
        setTimeout(() => {
            modalTargetDestination.textContent = `Destination : ${targetName}`;
            flightCodeVal.textContent = randomFlightNum;
            flightModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }, 850);
    }

    // Fermeture du Modal
    function closeModal() {
        flightModal.classList.remove('active');
        document.body.style.overflow = '';
    }
    modalCloseBtn.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', closeModal);
    modalConfirmBtn.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && flightModal.classList.contains('active')) {
            closeModal();
        }
    });

    // Liaison aux boutons avec la classe .btn-takeoff
    const takeoffButtons = document.querySelectorAll('.btn-takeoff');
    takeoffButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (btn.type === 'submit') {
                const form = btn.closest('form');
                if (form && !form.checkValidity()) {
                    return;
                }
                e.preventDefault();
            }

            const flightTarget = btn.getAttribute('data-flight-target') || 'Sanctuaire Azur';
            triggerAirplaneTakeoff(btn, flightTarget);
        });
    });

    // Bouton Décoller de la barre de recherche
    const searchTakeoffBtn = document.getElementById('searchTakeoffBtn');
    const destinationSelect = document.getElementById('flightDestinationSelect');
    if (searchTakeoffBtn && destinationSelect) {
        searchTakeoffBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const chosenDest = destinationSelect.value;
            triggerAirplaneTakeoff(searchTakeoffBtn, chosenDest);
        });
    }

    /* ==========================================================================
       5. DÉCLENCHEUR 2 : ÉLÉVATION ET INCLINAISON AU SURVOL DES CARTES
       ========================================================================== */
    const destinationCards = document.querySelectorAll('.destination-card');

    destinationCards.forEach(card => {
        // Micro-interaction sonore délicate au survol
        card.addEventListener('mouseenter', () => {
            if (soundEnabled && audioContext) {
                try {
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(880, audioContext.currentTime);
                    gain.gain.setValueAtTime(0.012, audioContext.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.12);
                    osc.connect(gain);
                    gain.connect(audioContext.destination);
                    osc.start();
                    osc.stop(audioContext.currentTime + 0.13);
                } catch (e) {}
            }
        });

        // Inclinaison 3D subtile
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -3.5;
            const rotateY = ((x - centerX) / centerX) * 3.5;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });

    /* ==========================================================================
       6. ONGLETS DE FILTRAGE DES DESTINATIONS
       ========================================================================== */
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(tab => {
        tab.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            tab.classList.add('active');

            const filter = tab.getAttribute('data-filter');
            destinationCards.forEach(card => {
                const category = card.getAttribute('data-category');
                if (filter === 'all' || category === filter) {
                    card.style.display = 'flex';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1)';
                    }, 40);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.96)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 280);
                }
            });
        });
    });

    /* ==========================================================================
       7. HEADER DÉROULANT ET MENU MOBILE
       ========================================================================== */
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 30) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            const isOpen = mainNav.style.display === 'flex';
            if (isOpen) {
                mainNav.style.display = '';
            } else {
                mainNav.style.display = 'flex';
                mainNav.style.position = 'absolute';
                mainNav.style.top = '76px';
                mainNav.style.left = '0';
                mainNav.style.width = '100%';
                mainNav.style.background = '#FFFFFF';
                mainNav.style.padding = '2rem';
                mainNav.style.boxShadow = '0 16px 36px rgba(2, 132, 199, 0.12)';
                mainNav.style.borderBottom = '1px solid rgba(2, 132, 199, 0.1)';
                mainNav.querySelector('.nav-links').style.flexDirection = 'column';
                mainNav.querySelector('.nav-links').style.gap = '1.25rem';
            }
        });
    }

    /* ==========================================================================
       8. FORMULAIRE DE L'ATELIER SUR-MESURE
       ========================================================================== */
    const configuratorForm = document.getElementById('flightConfiguratorForm');
    if (configuratorForm) {
        configuratorForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const clientName = document.getElementById('clientName').value;
            const dest = document.getElementById('tripDest').value;
            const submitBtn = document.getElementById('submitTripBtn');
            triggerAirplaneTakeoff(submitBtn, `${dest} (pour ${clientName})`);
            configuratorForm.reset();
        });
    }

    // Mini jet de la piste héroïque au clic
    const heroMiniJet = document.getElementById('heroMiniJet');
    if (heroMiniJet) {
        heroMiniJet.addEventListener('click', () => {
            triggerAirplaneTakeoff(heroMiniJet, 'Décollage Piste Privée 09-AZUR');
        });
    }
});
