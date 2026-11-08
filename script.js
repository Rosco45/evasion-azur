/**
 * ÉVASION AZUR — LUXURY TRAVEL SUITE
 * Three.js 3D Globe, Magnetic Reticle Cursor, Fullscreen Lookbook,
 * Multi-Currency & Language Engine, Haptic Mobile Feedback & Takeoff Physics
 */

document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       1. CURSEUR AÉRONAUTIQUE SUR-MESURE & EFFET MAGNÉTIQUE
       ========================================================================== */
    const aeroCursor = document.getElementById('aeroCursor');
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cursorX = mouseX;
    let cursorY = mouseY;
    let isHoveringTarget = false;

    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            aeroCursor.style.opacity = '1';
        });

        document.addEventListener('mouseleave', () => {
            aeroCursor.style.opacity = '0';
        });

        // Animation loop avec lerp fluide
        function animateCursor() {
            cursorX += (mouseX - cursorX) * 0.18;
            cursorY += (mouseY - cursorY) * 0.18;
            aeroCursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
            requestAnimationFrame(animateCursor);
        }
        animateCursor();

        // Cibles magnétiques
        const magneticTargets = document.querySelectorAll('.magnetic-target, .btn-primary, .btn-secondary, .tab-btn, .destination-card, .btn-card-lookbook');
        magneticTargets.forEach(target => {
            target.addEventListener('mouseenter', () => {
                aeroCursor.classList.add('cursor-hover');
                isHoveringTarget = true;
            });

            target.addEventListener('mousemove', (e) => {
                const rect = target.getBoundingClientRect();
                const targetCenterX = rect.left + rect.width / 2;
                const targetCenterY = rect.top + rect.height / 2;
                // Attraction magnétique légère
                mouseX = targetCenterX + (e.clientX - targetCenterX) * 0.35;
                mouseY = targetCenterY + (e.clientY - targetCenterY) * 0.35;
            });

            target.addEventListener('mouseleave', () => {
                aeroCursor.classList.remove('cursor-hover');
                isHoveringTarget = false;
            });
        });
    }

    /* ==========================================================================
       2. CANVAS D'ARRIÈRE-PLAN: PARTICULES CÉLESTES & TRAÎNÉES AMBIANTES
       ========================================================================== */
    const bgCanvas = document.getElementById('airplaneFlightCanvas');
    const bgCtx = bgCanvas.getContext('2d');
    let bgW, bgH;

    function resizeBgCanvas() {
        bgW = bgCanvas.width = window.innerWidth;
        bgH = bgCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeBgCanvas);
    resizeBgCanvas();

    const particles = [];
    for (let i = 0; i < 26; i++) {
        particles.push({
            x: Math.random() * bgW,
            y: Math.random() * bgH,
            radius: Math.random() * 1.5 + 0.5,
            speedX: Math.random() * 0.3 + 0.08,
            speedY: (Math.random() - 0.5) * 0.08,
            opacity: Math.random() * 0.4 + 0.1,
            color: Math.random() > 0.5 ? 'rgba(2, 132, 199, ' : 'rgba(20, 184, 166, '
        });
    }

    function renderBg() {
        bgCtx.clearRect(0, 0, bgW, bgH);
        for (let p of particles) {
            p.x += p.speedX;
            p.y += p.speedY;
            if (p.x > bgW + 20) p.x = -20;
            if (p.y > bgH + 20) p.y = -20;
            if (p.y < -20) p.y = bgH + 20;

            bgCtx.beginPath();
            bgCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            bgCtx.fillStyle = p.color + p.opacity + ')';
            bgCtx.fill();
        }
        requestAnimationFrame(renderBg);
    }
    renderBg();

    /* ==========================================================================
       3. CANVAS DÉDIÉ: TRAÎNÉE DYNAMIQUE DE DÉCOLLAGE (DÉCLENCHEUR 1)
       ========================================================================== */
    const trailCanvas = document.getElementById('takeoffTrailCanvas');
    const tCtx = trailCanvas.getContext('2d');
    let trailActive = false;
    let trailPuffs = [];

    function resizeTrailCanvas() {
        trailCanvas.width = window.innerWidth;
        trailCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeTrailCanvas);
    resizeTrailCanvas();

    function addContrailPuff(x, y) {
        trailPuffs.push({
            x: x,
            y: y,
            radius: Math.random() * 6 + 4,
            opacity: 0.75,
            color: Math.random() > 0.4 ? 'rgba(6, 182, 212, ' : 'rgba(2, 132, 199, ',
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8
        });
    }

    function renderContrail() {
        tCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
        for (let i = trailPuffs.length - 1; i >= 0; i--) {
            const p = trailPuffs[i];
            p.radius += 0.4;
            p.opacity -= 0.016;
            p.x += p.vx;
            p.y += p.vy;

            if (p.opacity <= 0) {
                trailPuffs.splice(i, 1);
                continue;
            }

            tCtx.beginPath();
            tCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            tCtx.fillStyle = p.color + p.opacity + ')';
            tCtx.fill();
        }

        if (trailPuffs.length > 0 || trailActive) {
            requestAnimationFrame(renderContrail);
        }
    }

    /* ==========================================================================
       4. GLOBE 3D CÉLESTE INTERACTIF (THREE.JS)
       ========================================================================== */
    const globeContainer = document.getElementById('globeCanvasContainer');
    let scene, camera, renderer, globeGroup, routeCurveMesh, planeMarker;
    let isDraggingGlobe = false;
    let previousMousePosition = { x: 0, y: 0 };

    // Coordonnées GPS des salons VIP et sanctuaires
    const CITY_COORDS = {
        lebourget: { name: 'Paris Le Bourget', lat: 48.9698, lon: 2.4414, type: 'dep' },
        geneve: { name: 'Genève VIP', lat: 46.2370, lon: 6.1092, type: 'dep' },
        nice: { name: 'Nice Côte d\'Azur', lat: 43.6653, lon: 7.2150, type: 'dep' },
        dubai: { name: 'Dubaï Al Maktoum', lat: 24.8960, lon: 55.1614, type: 'dep' },
        borabora: { name: 'Bora Bora', lat: -16.5004, lon: -151.7415, dist: '15 720 km', privTime: '18h00', comTime: '26h30', saved: '+ 8h30' },
        capri: { name: 'Capri & Naples', lat: 40.5507, lon: 14.2426, dist: '1 340 km', privTime: '2h15', comTime: '5h45', saved: '+ 3h30' },
        maldives: { name: 'Atoll Noonu Maldives', lat: 5.8500, lon: 73.3000, dist: '8 250 km', privTime: '9h30', comTime: '14h20', saved: '+ 4h50' },
        santorin: { name: 'Santorin Cyclades', lat: 36.3932, lon: 25.4615, dist: '2 380 km', privTime: '3h30', comTime: '7h10', saved: '+ 3h40' },
        kyoto: { name: 'Kyoto & Osaka', lat: 35.0116, lon: 135.7681, dist: '9 850 km', privTime: '11h45', comTime: '17h00', saved: '+ 5h15' },
        fjords: { name: 'Fjords Ålesund', lat: 62.1008, lon: 7.0941, dist: '1 820 km', privTime: '2h40', comTime: '6h30', saved: '+ 3h50' }
    };

    function latLonToVector3(lat, lon, radius) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        const x = -(radius * Math.sin(phi) * Math.cos(theta));
        const z = radius * Math.sin(phi) * Math.sin(theta);
        const y = radius * Math.cos(phi);
        return new THREE.Vector3(x, y, z);
    }

    function initThreeGlobe() {
        if (!globeContainer || typeof THREE === 'undefined') return;

        const w = globeContainer.clientWidth;
        const h = globeContainer.clientHeight;

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
        camera.position.z = 210;

        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        globeContainer.appendChild(renderer.domElement);

        globeGroup = new THREE.Group();
        scene.add(globeGroup);

        const globeRadius = 60;

        // Sphère centrale blanc immaculé
        const sphereGeo = new THREE.SphereGeometry(globeRadius, 36, 36);
        const sphereMat = new THREE.MeshBasicMaterial({
            color: 0xFAFCFE,
            transparent: true,
            opacity: 0.95
        });
        const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
        globeGroup.add(sphereMesh);

        // Anneaux de méridiens & parallèles en filigrane azur
        const wireGeo = new THREE.SphereGeometry(globeRadius + 0.15, 24, 16);
        const wireMat = new THREE.MeshBasicMaterial({
            color: 0xBAE6FD,
            wireframe: true,
            transparent: true,
            opacity: 0.35
        });
        const wireMesh = new THREE.Mesh(wireGeo, wireMat);
        globeGroup.add(wireMesh);

        // Halo atmosphérique turquoise
        const auraGeo = new THREE.SphereGeometry(globeRadius + 3, 28, 28);
        const auraMat = new THREE.MeshBasicMaterial({
            color: 0x2DD4BF,
            wireframe: true,
            transparent: true,
            opacity: 0.12
        });
        const auraMesh = new THREE.Mesh(auraGeo, auraMat);
        globeGroup.add(auraMesh);

        // Ajout des points de villes
        Object.keys(CITY_COORDS).forEach(key => {
            const c = CITY_COORDS[key];
            const pos = latLonToVector3(c.lat, c.lon, globeRadius);
            const dotGeo = new THREE.SphereGeometry(1.4, 12, 12);
            const dotMat = new THREE.MeshBasicMaterial({
                color: c.type === 'dep' ? 0x0284C7 : 0x14B8A6
            });
            const dotMesh = new THREE.Mesh(dotGeo, dotMat);
            dotMesh.position.copy(pos);
            globeGroup.add(dotMesh);
        });

        // Marqueur d'avion sur l'arc
        const pGeo = new THREE.ConeGeometry(1.6, 3.8, 4);
        const pMat = new THREE.MeshBasicMaterial({ color: 0x0284C7 });
        planeMarker = new THREE.Mesh(pGeo, pMat);
        globeGroup.add(planeMarker);

        updateGlobeFlightRoute('lebourget', 'borabora');

        // Drag to rotate
        globeContainer.addEventListener('mousedown', (e) => {
            isDraggingGlobe = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        window.addEventListener('mouseup', () => {
            isDraggingGlobe = false;
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDraggingGlobe) return;
            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;

            globeGroup.rotation.y += deltaX * 0.008;
            globeGroup.rotation.x += deltaY * 0.008;

            previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        // Touch support for mobile
        globeContainer.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                isDraggingGlobe = true;
                previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
        }, { passive: true });

        window.addEventListener('touchend', () => {
            isDraggingGlobe = false;
        });

        window.addEventListener('touchmove', (e) => {
            if (!isDraggingGlobe || e.touches.length !== 1) return;
            const deltaX = e.touches[0].clientX - previousMousePosition.x;
            const deltaY = e.touches[0].clientY - previousMousePosition.y;

            globeGroup.rotation.y += deltaX * 0.01;
            globeGroup.rotation.x += deltaY * 0.01;

            previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }, { passive: true });

        // Animation loop
        let planeProgress = 0;
        function animateGlobe() {
            requestAnimationFrame(animateGlobe);

            if (!isDraggingGlobe) {
                globeGroup.rotation.y += 0.0018;
            }

            // Animer l'avion le long de l'arc parabolique
            if (currentRouteCurve) {
                planeProgress += 0.005;
                if (planeProgress > 1) planeProgress = 0;
                const pointOnCurve = currentRouteCurve.getPoint(planeProgress);
                planeMarker.position.copy(pointOnCurve);
                const tangent = currentRouteCurve.getTangent(planeProgress);
                planeMarker.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
            }

            renderer.render(scene, camera);
        }
        animateGlobe();

        window.addEventListener('resize', () => {
            if (!globeContainer) return;
            const nw = globeContainer.clientWidth;
            const nh = globeContainer.clientHeight;
            camera.aspect = nw / nh;
            camera.updateProjectionMatrix();
            renderer.setSize(nw, nh);
        });
    }

    let currentRouteCurve = null;

    function updateGlobeFlightRoute(depKey, arrKey) {
        if (!globeGroup || typeof THREE === 'undefined') return;

        const dep = CITY_COORDS[depKey];
        const arr = CITY_COORDS[arrKey];
        if (!dep || !arr) return;

        // Supprimer la précédente courbe
        if (routeCurveMesh) {
            globeGroup.remove(routeCurveMesh);
        }

        const globeRadius = 60;
        const vStart = latLonToVector3(dep.lat, dep.lon, globeRadius);
        const vEnd = latLonToVector3(arr.lat, arr.lon, globeRadius);

        // Point culminant parabolique
        const vMid = vStart.clone().add(vEnd).multiplyScalar(0.5);
        const distance = vStart.distanceTo(vEnd);
        const altitude = globeRadius + distance * 0.32;
        vMid.normalize().multiplyScalar(altitude);

        currentRouteCurve = new THREE.QuadraticBezierCurve3(vStart, vMid, vEnd);
        const points = currentRouteCurve.getPoints(50);
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);

        const lineMat = new THREE.LineBasicMaterial({
            color: 0x06B6D4,
            linewidth: 2,
            transparent: true,
            opacity: 0.95
        });

        routeCurveMesh = new THREE.Line(lineGeo, lineMat);
        globeGroup.add(routeCurveMesh);

        // Mettre à jour l'affichage du comparateur
        const routeTitle = document.getElementById('routeTitleDisplay');
        const privTime = document.getElementById('privateTimeVal');
        const comTime = document.getElementById('commercialTimeVal');
        const distVal = document.getElementById('metricDistance');
        const savedVal = document.getElementById('metricTimeSaved');

        if (routeTitle) routeTitle.textContent = `${dep.name} ➔ ${arr.name}`;
        if (privTime) privTime.textContent = arr.privTime || '12h00';
        if (comTime) comTime.textContent = arr.comTime || '19h30';
        if (distVal) distVal.textContent = arr.dist || '10 500 km';
        if (savedVal) savedVal.textContent = arr.saved || '+ 6h00 gagnées';
    }

    initThreeGlobe();

    // Sélecteurs de route du globe
    const globeDepSelect = document.getElementById('globeDepartureSelect');
    const globeArrSelect = document.getElementById('globeArrivalSelect');

    function onGlobeRouteChange() {
        if (globeDepSelect && globeArrSelect) {
            updateGlobeFlightRoute(globeDepSelect.value, globeArrSelect.value);
        }
    }
    if (globeDepSelect) globeDepSelect.addEventListener('change', onGlobeRouteChange);
    if (globeArrSelect) globeArrSelect.addEventListener('change', onGlobeRouteChange);

    /* ==========================================================================
       5. VIDÉO CINÉMATIQUE DU HERO (PLAY/PAUSE TOGGLE)
       ========================================================================== */
    const heroVideo = document.getElementById('heroCinematicVideo');
    const videoToggleBtn = document.getElementById('videoPlayToggle');

    if (heroVideo && videoToggleBtn) {
        videoToggleBtn.addEventListener('click', () => {
            if (heroVideo.paused) {
                heroVideo.play();
                videoToggleBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                videoToggleBtn.title = "Pause vidéo";
            } else {
                heroVideo.pause();
                videoToggleBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                videoToggleBtn.title = "Lire la vidéo";
            }
        });
    }

    /* ==========================================================================
       6. LOOKBOOK PLEIN ÉCRAN (« GALERIE PRIVÉE »)
       ========================================================================== */
    const LOOKBOOK_DATA = {
        borabora: {
            title: "Bora Bora & Taha'a — Atoll Céleste",
            tag: "Polynésie Française • Sanctuaire Océanique",
            img: "https://images.unsplash.com/photo-1512100356356-de1b84283e18?auto=format&fit=crop&w=1400&fm=webp&q=85",
            desc: "Implantation exclusive sur le Motu Tautau, face au Mont Otemanu. Lagon turquoise privé de 12 hectares avec sanctuaire corallien protégé et ponton d'hydravion dédié.",
            specs: [
                "Villa sur pilotis de 340 m² avec piscine à débordement privée",
                "Majordome polynésien dédié 24h/24 & Chef privé étoilé",
                "Accès direct en hydravion privatisé depuis l'aérodrome VIP de Motu Mute",
                "Survol privé en hélicoptère Airbus H130 inclus"
            ]
        },
        capri: {
            title: "Capri & Ravello — L'Azur Mythique",
            tag: "Italie • Méditerranée d'Exception",
            img: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1400&fm=webp&q=85",
            desc: "Palais perché sur les falaises d'Anacapri avec vue plongeante sur les Faraglioni. Héliport privé et amarrage réservé dans la baie de Marina Piccola.",
            specs: [
                "Propriété historique classée de 580 m² avec jardins suspendus",
                "Riva Aquarama Special privatisé avec skipper de haute mer",
                "Transfert en hélicoptère direct depuis l'aéroport de Naples ou Rome",
                "Cave de collection privée et dégustations confidentielles"
            ]
        },
        maldives: {
            title: "Atoll Noonu — Atoll de Lumière",
            tag: "Océan Indien • Réserve UNESCO",
            img: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1400&fm=webp&q=85",
            desc: "Île privée intégrale avec banc de sable éphémère accessible uniquement à marée basse. Plongées nocturnes privées dans le plancton bioluminescent.",
            specs: [
                "Résidence de 4 chambres sur banc de sable avec plage privée",
                "Hydravion Twin Otter privatisé aux couleurs d'Évasion Azur",
                "Biologiste marin dédié et sous-marin de poche biplace",
                "Spa sur pilotis avec rituels ayurvédiques sur-mesure"
            ]
        },
        santorin: {
            title: "Santorin & Milos — Caldeira Secrète",
            tag: "Mer Égée • Falaises Volcaniques",
            img: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1400&fm=webp&q=85",
            desc: "Demeure troglodytique contemporaine taillée dans la roche d'Oia. Piscines taillées dans la lave face à la caldeira et voilier classique privatisé.",
            specs: [
                "Villa de maître d'architecte de 290 m² sans aucun vis-à-vis",
                "Catamaran Sunreef 60 privatisé pour croisière vers Milos et Folegandros",
                "Accès au salon d'aviation d'affaires de Santorin Thira",
                "Chef sommelier dédié spécialisé dans les cépages rares d'Assyrtiko"
            ]
        },
        kyoto: {
            title: "Kyoto & Mer de Seto — Sérénité d'Art",
            tag: "Japon • Pavillons Ancestraux",
            img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1400&fm=webp&q=85",
            desc: "Ryokan centenaire privatisé au cœur de la forêt de bambous d'Arashiyama, complété par une croisière intime sur l'île d'art contemporain de Naoshima.",
            specs: [
                "Pavillon impérial en bois de cèdre avec Onsen privé en plein air",
                "Maître de thé de renommée nationale pour cérémonie privée",
                "Yacht d'architecte privatisé pour naviguer sur la Mer Intérieure",
                "Visites nocturnes privatisées des temples classés UNESCO hors horaires"
            ]
        },
        norvege: {
            title: "Fjords & Ciels Boréaux — Lodges Polaires",
            tag: "Norvège • Sanctuaires Arctiques",
            img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&fm=webp&q=85",
            desc: "Lodges panoramiques en verre thermique suspendus au-dessus du Geirangerfjord. Observation des aurores boréales turquoise depuis votre bain nordique privatif.",
            specs: [
                "Lodge géodésique chauffé par géothermie avec vue à 360°",
                "Yacht d'exploration polaire hybride silencieux privatisé",
                "Safari en traîneau à chiens et survol des glaciers en hélicoptère",
                "Dîners gastronomiques d'inspiration nordique par un chef 3 étoiles"
            ]
        }
    };

    const lookbookModal = document.getElementById('lookbookModal');
    const lookbookBackdrop = document.getElementById('lookbookBackdrop');
    const lookbookCloseBtn = document.getElementById('lookbookCloseBtn');
    const lookbookMainImg = document.getElementById('lookbookMainImg');
    const lookbookTitle = document.getElementById('lookbookTitle');
    const lookbookTag = document.getElementById('lookbookTag');
    const lookbookDesc = document.getElementById('lookbookDesc');
    const lookbookSpecs = document.getElementById('lookbookSpecs');
    const lookbookReserveBtn = document.getElementById('lookbookReserveBtn');

    let lookbookKeys = Object.keys(LOOKBOOK_DATA);
    let currentLookbookIndex = 0;

    function openLookbook(destKey) {
        currentLookbookIndex = lookbookKeys.indexOf(destKey);
        if (currentLookbookIndex === -1) currentLookbookIndex = 0;
        renderLookbookSlide();
        lookbookModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function renderLookbookSlide() {
        const key = lookbookKeys[currentLookbookIndex];
        const d = LOOKBOOK_DATA[key];
        if (!d) return;

        lookbookMainImg.src = d.img;
        lookbookTitle.textContent = d.title;
        lookbookTag.textContent = d.tag;
        lookbookDesc.textContent = d.desc;
        lookbookReserveBtn.setAttribute('data-flight-target', d.title);

        lookbookSpecs.innerHTML = '';
        d.specs.forEach(spec => {
            const item = document.createElement('div');
            item.className = 'lookbook-spec-item';
            item.innerHTML = `<i class="fa-solid fa-check"></i> <span>${spec}</span>`;
            lookbookSpecs.appendChild(item);
        });
    }

    function closeLookbook() {
        lookbookModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (lookbookCloseBtn) lookbookCloseBtn.addEventListener('click', closeLookbook);
    if (lookbookBackdrop) lookbookBackdrop.addEventListener('click', closeLookbook);

    const lookbookPrevBtn = document.getElementById('lookbookPrevBtn');
    const lookbookNextBtn = document.getElementById('lookbookNextBtn');

    if (lookbookPrevBtn) {
        lookbookPrevBtn.addEventListener('click', () => {
            currentLookbookIndex = (currentLookbookIndex - 1 + lookbookKeys.length) % lookbookKeys.length;
            renderLookbookSlide();
        });
    }

    if (lookbookNextBtn) {
        lookbookNextBtn.addEventListener('click', () => {
            currentLookbookIndex = (currentLookbookIndex + 1) % lookbookKeys.length;
            renderLookbookSlide();
        });
    }

    // Boutons des cartes de destination
    const lookbookTriggers = document.querySelectorAll('.btn-card-lookbook');
    lookbookTriggers.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const dest = btn.getAttribute('data-lookbook');
            openLookbook(dest);
        });
    });

    /* ==========================================================================
       7. VIP LEAD MAGNET: « LE CARNET D'ENVOL 2026 »
       ========================================================================== */
    const carnetModal = document.getElementById('carnetModal');
    const carnetBackdrop = document.getElementById('carnetBackdrop');
    const carnetCloseBtn = document.getElementById('carnetCloseBtn');
    const openCarnetBtn = document.getElementById('openCarnetBtn');
    const carnetForm = document.getElementById('carnetForm');

    function openCarnet() {
        carnetModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeCarnet() {
        carnetModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (openCarnetBtn) openCarnetBtn.addEventListener('click', openCarnet);
    if (carnetCloseBtn) carnetCloseBtn.addEventListener('click', closeCarnet);
    if (carnetBackdrop) carnetBackdrop.addEventListener('click', closeCarnet);

    if (carnetForm) {
        carnetForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('carnetEmail').value;
            closeCarnet();
            showToast("Carnet d'Envol 2026 transmis", `Édition haute résolution expédiée à : ${email}`);
            carnetForm.reset();
        });
    }

    /* ==========================================================================
       8. SÉLECTEUR MULTIDEVISE & MULTILINGUE (FR/EN & EUR/USD/CHF)
       ========================================================================== */
    let currentCurrency = 'EUR';
    const CURRENCY_RATES = {
        EUR: { rate: 1.0, symbol: '€', pos: 'after' },
        USD: { rate: 1.09, symbol: '$', pos: 'before' },
        CHF: { rate: 0.97, symbol: 'CHF', pos: 'after' }
    };

    const currencyButtons = document.querySelectorAll('.currency-btn');
    currencyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currencyButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCurrency = btn.getAttribute('data-currency');
            updatePrices();
        });
    });

    function updatePrices() {
        const priceElements = document.querySelectorAll('.price-val[data-base-eur]');
        const curr = CURRENCY_RATES[currentCurrency] || CURRENCY_RATES.EUR;

        priceElements.forEach(el => {
            const baseEur = parseFloat(el.getAttribute('data-base-eur'));
            const converted = Math.round((baseEur * curr.rate) / 100) * 100;
            const formatted = converted.toLocaleString('fr-FR');

            if (curr.pos === 'before') {
                el.innerHTML = `${curr.symbol} ${formatted} <small>/ pers.</small>`;
            } else {
                el.innerHTML = `${formatted} ${curr.symbol} <small>/ pers.</small>`;
            }
        });
    }

    // Traduction multilingue sommaire (FR / EN)
    const DICTIONARY = {
        fr: {
            badge_privilege: "Privilège 2026",
            ticker_text: "Accès exclusif : Collection Confidentielle Atolls & Retraites Privées ouverte aux membres.",
            ticker_cta: "Accéder à l'Atelier",
            brand_subtitle: "HAUTE HORLOGERIE DU VOYAGE",
            nav_home: "Accueil",
            nav_destinations: "Destinations",
            nav_globe: "Globe 3D",
            nav_experiences: "Expériences",
            nav_faq: "Aviation VIP",
            nav_atelier: "L'Atelier",
            cta_takeoff: "Décoller",
            hero_tagline: "Aviation d'Affaires & Sanctuaires Marins",
            hero_title: "L’art de l’envol où <br><span class=\"gradient-text\">l’azur céleste</span> rencontre <br>les mers inviolées.",
            hero_desc: "Maison de haute confection d'odyssées aériennes. Jets privés d'exception, lagons turquoise confidentiels et conciergerie dédiée 24/7 : sublimez votre temps dans une épure totale.",
            hero_cta_primary: "Décoller vers l'Exception",
            hero_cta_secondary: "Explorer nos sanctuaires",
            hero_btn_carnet: "Carnet d'Envol 2026",
            stat_custom: "Confection Sur-Mesure",
            stat_atolls: "Îles & Lagons Secrets",
            stat_concierge: "Concierge Dédié",
            badge_quote: "« Une pureté absolue, du ciel au lagon. »",
            planner_label_dest: "Destination Privilège",
            planner_label_season: "Saison Souhaitée",
            planner_label_jet: "Aviation & Style",
            globe_badge: "Cartographie & Balistique Aérienne",
            globe_title: "Le Globe Céleste des Trajectoires Privées",
            globe_subtitle: "Explorez nos routes d'envol sans escale. Sélectionnez votre salon d'embarquement VIP et visualisez la trajectoire parabolique directe vers votre sanctuaire.",
            route_title: "Simulateur d'Envol Sans Correspondance",
            dest_badge: "Sanctuaires & Horizons",
            dest_title: "Destinations d'Azur Sélectionnées",
            dest_subtitle: "Chaque escale est pensée comme une pièce de haute joaillerie : lagons turquoise translucides, ciels immaculés et retraites confidentielles loin du tumulte.",
            faq_badge: "Protocole & Exigences UHNWI",
            faq_title: "Foire aux Questions — Aviation Privée",
            faq_subtitle: "Toutes les réponses à vos exigences de confidentialité, flexibilité horaire et confort à bord.",
            atelier_badge: "L'Atelier de Confection",
            atelier_title: "Concevez Votre Prochaine Envolée",
            atelier_subtitle: "Configurez en quelques instants les grandes lignes de votre itinéraire de rêve. Notre direction de création vous répondra sous 24h ouvrées."
        },
        en: {
            badge_privilege: "Privilege 2026",
            ticker_text: "Exclusive Access: Confidential Collection of Secret Atolls & Private Retreats open to members.",
            ticker_cta: "Access the Atelier",
            brand_subtitle: "HAUTE HOROLOGY OF TRAVEL",
            nav_home: "Home",
            nav_destinations: "Destinations",
            nav_globe: "3D Globe",
            nav_experiences: "Experiences",
            nav_faq: "VIP Aviation",
            nav_atelier: "The Atelier",
            cta_takeoff: "Take Off",
            hero_tagline: "Business Aviation & Marine Sanctuaries",
            hero_title: "The art of flight where <br><span class=\"gradient-text\">celestial azure</span> meets <br>untouched pristine seas.",
            hero_desc: "Bespoke airborne journeys. Falcon private jets, confidential turquoise lagoons and 24/7 dedicated concierge: elevate your time in total serenity.",
            hero_cta_primary: "Take Off to the Exceptional",
            hero_cta_secondary: "Explore our sanctuaries",
            hero_btn_carnet: "2026 Flight Journal",
            stat_custom: "100% Bespoke Tailoring",
            stat_atolls: "Secret Islands & Atolls",
            stat_concierge: "Dedicated Concierge",
            badge_quote: "“Absolute purity, from skies to lagoons.”",
            planner_label_dest: "Dream Destination",
            planner_label_season: "Preferred Season",
            planner_label_jet: "Aviation & Aircraft",
            globe_badge: "Flight Ballistics & Global Routes",
            globe_title: "The Celestial Globe of Private Trajectories",
            globe_subtitle: "Explore our non-stop private routes. Choose your VIP lounge and preview the parabolic flight path directly into your private sanctuary.",
            route_title: "Non-Stop Flight Simulator",
            dest_badge: "Sanctuaries & Horizons",
            dest_title: "Curated Azure Destinations",
            dest_subtitle: "Each stop is crafted like high jewelry: translucent turquoise lagoons, spotless skies and confidential retreats far from the crowd.",
            faq_badge: "UHNWI Protocol & Requirements",
            faq_title: "Frequently Asked Questions — Private Aviation",
            faq_subtitle: "Every answer to your expectations of privacy, flight schedule flexibility, and in-flight luxury.",
            atelier_badge: "The Bespoke Atelier",
            atelier_title: "Craft Your Next Departure",
            atelier_subtitle: "Shape the blueprint of your dream journey. Our creative directors will respond within 24 business hours."
        }
    };

    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            langButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const lang = btn.getAttribute('data-lang');
            applyLanguage(lang);
        });
    });

    function applyLanguage(lang) {
        const dict = DICTIONARY[lang] || DICTIONARY.fr;
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key]) {
                el.innerHTML = dict[key];
            }
        });
    }

    /* ==========================================================================
       9. FAQ ACCORDION VIP
       ========================================================================== */
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const questionBtn = item.querySelector('.faq-question');
        questionBtn.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            faqItems.forEach(other => other.classList.remove('active'));
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    /* ==========================================================================
       10. GYROSCOPIC MOBILE PARALLAX & HAPTIC VIBRATION
       ========================================================================== */
    const heroVisualCard = document.getElementById('heroVisualCard');
    if (window.DeviceOrientationEvent && heroVisualCard) {
        window.addEventListener('deviceorientation', (e) => {
            if (window.innerWidth <= 768 && e.gamma !== null && e.beta !== null) {
                const tiltX = Math.min(Math.max(e.gamma, -20), 20) * 0.4;
                const tiltY = Math.min(Math.max(e.beta - 45, -20), 20) * 0.4;
                heroVisualCard.style.transform = `perspective(1000px) rotateY(${tiltX}deg) rotateX(${-tiltY}deg)`;
            }
        }, { passive: true });
    }

    function triggerHapticFeedback() {
        if (navigator.vibrate) {
            navigator.vibrate([30, 60, 120]);
        }
    }

    /* ==========================================================================
       11. DÉCLENCHEUR 1 : DÉCOLLAGE DIAGONAL SUR CLIC CTA
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

    function triggerAirplaneTakeoff(buttonElement, targetName = "Votre Destination d'Exception") {
        playTakeoffSound();
        triggerHapticFeedback();

        // Coordonnées de départ du décollage
        let startX, startY;
        if (buttonElement && buttonElement.getBoundingClientRect) {
            const rect = buttonElement.getBoundingClientRect();
            startX = rect.left + rect.width / 2;
            startY = rect.top + rect.height / 2;
        } else {
            startX = window.innerWidth * 0.1;
            startY = window.innerHeight * 0.85;
        }

        if (startX > window.innerWidth * 0.6) startX = window.innerWidth * 0.15;
        if (startY < window.innerHeight * 0.4) startY = window.innerHeight * 0.75;

        screenFlyer.style.setProperty('--start-x', `${startX}px`);
        screenFlyer.style.setProperty('--start-y', `${startY}px`);
        screenFlyer.style.setProperty('--start-angle', '-24deg');

        screenFlyer.classList.remove('active-takeoff');
        void screenFlyer.offsetWidth;
        screenFlyer.classList.add('active-takeoff');

        // Particules sur le canvas
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

        if (buttonElement && buttonElement.style) {
            buttonElement.style.transform = 'scale(0.96)';
            setTimeout(() => {
                buttonElement.style.transform = '';
            }, 250);
        }

        const randomFlightNum = `AZ-${Math.floor(1000 + Math.random() * 9000)}`;
        showToast(`Décollage Autorisé — ${randomFlightNum}`, `Cap sur : ${targetName}`);

        setTimeout(() => {
            modalTargetDestination.textContent = `Destination : ${targetName}`;
            flightCodeVal.textContent = randomFlightNum;
            flightModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }, 850);
    }

    function closeModal() {
        flightModal.classList.remove('active');
        document.body.style.overflow = '';
    }
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
    if (modalConfirmBtn) modalConfirmBtn.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeLookbook();
            closeCarnet();
        }
    });

    const takeoffButtons = document.querySelectorAll('.btn-takeoff');
    takeoffButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (btn.type === 'submit') {
                const form = btn.closest('form');
                if (form && !form.checkValidity()) return;
                e.preventDefault();
            }

            const flightTarget = btn.getAttribute('data-flight-target') || 'Sanctuaire Azur';
            triggerAirplaneTakeoff(btn, flightTarget);
        });
    });

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
       12. WEB AUDIO SYNTHESIZER
       ========================================================================== */
    let audioContext = null;
    let soundEnabled = false;
    const soundToggle = document.getElementById('soundToggle');

    function initAudio() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    if (soundToggle) {
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
    }

    function playTakeoffSound() {
        if (!soundEnabled || !audioContext) return;
        try {
            const now = audioContext.currentTime;
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
        } catch (e) {}
    }

    /* ==========================================================================
       13. DESTINATIONS CARDS: TILT 3D ET FILTRES
       ========================================================================== */
    const destinationCards = document.querySelectorAll('.destination-card');
    destinationCards.forEach(card => {
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
       14. HEADER SCROLL & MOBILE MENU
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

    // Formulaire Atelier
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

    const heroMiniJet = document.getElementById('heroMiniJet');
    if (heroMiniJet) {
        heroMiniJet.addEventListener('click', () => {
            triggerAirplaneTakeoff(heroMiniJet, 'Décollage Piste Privée 09-AZUR');
        });
    }
});
