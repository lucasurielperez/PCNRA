// Asegurar contenedor global de efectos
window.customFXManager = window.customFXManager || { list: [], register: function(fx) { this.list.push(fx); } };

if (!window.fx3Particles) window.fx3Particles = [];

// --- MOTOR VISUAL DE NEÓN ANATÓMICO PREMIUM ---
function drawCyberBone(ctx, pt1, pt2, grosor, color) {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const dx = pt2.x - pt1.x;
    const dy = pt2.y - pt1.y;
    const len = Math.max(1, Math.hypot(dx, dy));
    const nx = -dy / len;
    const ny = dx / len;
    const bend = Math.min(22, len * 0.12);
    const mid = {
        x: (pt1.x + pt2.x) / 2 + nx * bend,
        y: (pt1.y + pt2.y) / 2 + ny * bend
    };
    
    // Capa 1: Brillo exterior (Glow)
    ctx.lineWidth = grosor * 2.5;
    ctx.strokeStyle = color;
    ctx.shadowBlur = grosor * 3;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.moveTo(pt1.x, pt1.y);
    ctx.quadraticCurveTo(mid.x, mid.y, pt2.x, pt2.y);
    ctx.stroke();
    const grad = ctx.createLinearGradient(pt1.x, pt1.y, pt2.x, pt2.y);
    grad.addColorStop(0, "rgba(255,255,255,0.9)");
    grad.addColorStop(0.35, color);
    grad.addColorStop(1, "rgba(255,255,255,0.55)");
    ctx.lineWidth = grosor * 1.25;
    ctx.shadowBlur = grosor * 1.4;
    ctx.strokeStyle = grad;
    ctx.beginPath();
    ctx.moveTo(pt1.x, pt1.y);
    ctx.quadraticCurveTo(mid.x, mid.y, pt2.x, pt2.y);
    ctx.stroke();
    
    // Capa 2: Núcleo de luz blanca central
    ctx.shadowBlur = 0;
    ctx.lineWidth = grosor * 0.4;
    ctx.strokeStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(pt1.x, pt1.y);
    ctx.quadraticCurveTo(mid.x, mid.y, pt2.x, pt2.y);
    ctx.stroke();
    ctx.restore();
}

function drawJointNode(ctx, pt, radio, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowBlur = radio * 2.5;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, radio, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, radio * 0.4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
}

function drawCaricatureHead(ctx, nariz, anchoHombros, color, esRelleno) {
    const radioCabeza = Math.max(22, anchoHombros * 0.36); // Cabezón caricaturesco fijo
    const offsetY = radioCabeza * 0.4; // Ajuste para que no tape el cuello

    ctx.save();
    ctx.shadowBlur = radioCabeza * 1.5;
    ctx.shadowColor = color;

    if (esRelleno) {
        const cx = nariz.x;
        const cy = nariz.y - offsetY;
        const grad = ctx.createRadialGradient(cx - radioCabeza * 0.25, cy - radioCabeza * 0.25, 2, cx, cy, radioCabeza);
        grad.addColorStop(0, "rgba(255,255,255,0.9)");
        grad.addColorStop(0.32, color);
        grad.addColorStop(1, "rgba(0, 24, 24, 0.95)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radioCabeza, 0, 2 * Math.PI);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255,255,255,0.78)";
        ctx.lineWidth = Math.max(2, radioCabeza * 0.08);
        ctx.beginPath();
        ctx.arc(cx, cy, radioCabeza * 0.9, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(cx - radioCabeza * 0.42, cy - radioCabeza * 0.08, radioCabeza * 0.84, radioCabeza * 0.2);
    } else {
        ctx.strokeStyle = color;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(nariz.x, nariz.y - offsetY, radioCabeza, 0, 2 * Math.PI);
        ctx.stroke();
    }
    ctx.restore();
    return radioCabeza;
}


// --- EFECTO 1: CYBER MONIGOTE ---
window.customFXManager.register({
    id: 1,
    name: "1. Cyber Monigote",
    isTrail: false,
    draw: function(ctx, landmarks, width, height, connections, getPt) {
        const neonColor = '#00ffcc';
        const grosorLinea = 7;
        
        const hombroIzq = getPt(11); const hombroDer = getPt(12);
        const codoIzq = getPt(13);   const codoDer = getPt(14);
        const manoIzq = getPt(15);   const manoDer = getPt(16);
        const caderaIzq = getPt(23); const caderaDer = getPt(24);
        const rodillaIzq = getPt(25);const rodillaDer = getPt(26);
        const pieIzq = getPt(27);    const pieDer = getPt(28);
        const nariz = getPt(0);

        const anchoHombros = Math.hypot(hombroDer.x - hombroIzq.x, hombroDer.y - hombroIzq.y);
        const centroHombros = { x: (hombroIzq.x + hombroDer.x) / 2, y: (hombroIzq.y + hombroDer.y) / 2 };
        const centroCaderas = { x: (caderaIzq.x + caderaDer.x) / 2, y: (caderaIzq.y + caderaDer.y) / 2 };

        // Extremidades y Tronco
        drawCyberBone(ctx, hombroIzq, codoIzq, grosorLinea, neonColor);
        drawCyberBone(ctx, codoIzq, manoIzq, grosorLinea, neonColor);
        drawCyberBone(ctx, hombroDer, codoDer, grosorLinea, neonColor);
        drawCyberBone(ctx, codoDer, manoDer, grosorLinea, neonColor);
        drawCyberBone(ctx, caderaIzq, rodillaIzq, grosorLinea, neonColor);
        drawCyberBone(ctx, rodillaIzq, pieIzq, grosorLinea, neonColor);
        drawCyberBone(ctx, caderaDer, rodillaDer, grosorLinea, neonColor);
        drawCyberBone(ctx, rodillaDer, pieDer, grosorLinea, neonColor);
        drawCyberBone(ctx, hombroIzq, hombroDer, grosorLinea + 1, neonColor);
        drawCyberBone(ctx, caderaIzq, caderaDer, grosorLinea + 1, neonColor);
        drawCyberBone(ctx, centroHombros, centroCaderas, grosorLinea + 2, neonColor);
        
        // Cabeza y Cuello articulado
        const rCabeza = drawCaricatureHead(ctx, nariz, anchoHombros, neonColor, true);
        drawCyberBone(ctx, centroHombros, { x: nariz.x, y: nariz.y + (rCabeza * 0.2) }, grosorLinea - 1, neonColor);

        // Nodos ópticos
        const nodos = [hombroIzq, hombroDer, codoIzq, codoDer, manoIzq, manoDer, caderaIzq, caderaDer, rodillaIzq, rodillaDer, pieIzq, pieDer];
        nodos.forEach(pt => drawJointNode(ctx, pt, grosorLinea + 2, neonColor));
    }
});


// --- EFECTO 2: ESTELA GHOST ---
window.customFXManager.register({
    id: 2,
    name: "2. Estela Ghost Pro",
    isTrail: true,
    draw: function(ctx, landmarks, width, height, connections, getPt) {
        ctx.save();
        ctx.fillStyle = '#ff0055';
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#ff0055';

        ctx.beginPath();
        const ordenSilueta = [11, 13, 15, 13, 11, 23, 25, 27, 28, 26, 24, 12, 14, 16, 14, 12];
        ordenSilueta.forEach((idx, i) => {
            const pt = getPt(idx);
            if (i === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
        });
        ctx.closePath();
        ctx.fill();
        
        const hombroIzq = getPt(11); const hombroDer = getPt(12);
        const anchoHombros = Math.hypot(hombroDer.x - hombroIzq.x, hombroDer.y - hombroIzq.y);
        drawCaricatureHead(ctx, getPt(0), anchoHombros, '#ff0055', true);
        ctx.restore();
    }
});


// --- EFECTO 3: AURA CORPORAL ---
window.customFXManager.register({
    id: 3,
    name: "3. Aura Corporal",
    isTrail: false,
    draw: function(ctx, landmarks, width, height, connections, getPt) {
        const puntosAura = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
        puntosAura.forEach(idx => {
            const pt = getPt(idx);
            if(Math.random() > 0.75) {
                window.fx3Particles.push({
                    x: pt.x, y: pt.y,
                    vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4 - 3,
                    alpha: 1, size: Math.random() * 6 + 4,
                    color: `hsl(${280 + Math.random() * 50}, 100%, 65%)`
                });
            }
        });

        ctx.save();
        window.fx3Particles.forEach((p, index) => {
            p.x += p.vx; p.y += p.vy; p.alpha -= 0.025;
            if (p.alpha <= 0) {
                window.fx3Particles.splice(index, 1);
            } else {
                ctx.shadowBlur = 10; ctx.shadowColor = p.color;
                ctx.fillStyle = p.color; ctx.globalAlpha = p.alpha;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI); ctx.fill();
            }
        });
        ctx.restore();
    }
});


// --- EFECTO 4: ONDAS Y RITMO ---
let waveRadius = 0;
let waveColor = '#1a0033';
window.customFXManager.register({
    id: 4,
    name: "4. Ondas & Ritmo",
    isCustomBackground: true,
    draw: function(ctx, landmarks, width, height, connections, getPt) {
        const mIzq = getPt(15); const mDer = getPt(16);
        const distManos = Math.hypot(mDer.x - mIzq.x, mDer.y - mIzq.y);

        if (distManos > width * 0.45 && window.waveRadius === 0) {
            window.waveRadius = 1;
            const colors = ['#1a0033', '#002233', '#003311', '#330011'];
            window.waveColor = colors[Math.floor(Math.random() * colors.length)];
        }

        ctx.fillStyle = window.waveColor;
        ctx.fillRect(0, 0, width, height);
        if (window.waveColor !== '#050505') {
            ctx.fillStyle = 'rgba(5,5,5,0.1)'; ctx.fillRect(0, 0, width, height);
        }

        if (window.waveRadius > 0) {
            window.waveRadius += 30;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; ctx.lineWidth = 6;
            ctx.shadowBlur = 40; ctx.shadowColor = '#fff';
            ctx.beginPath(); ctx.arc(width / 2, height / 2, window.waveRadius, 0, 2 * Math.PI); ctx.stroke();
            if (window.waveRadius > width) window.waveRadius = 0;
        }

        // Monigote blanco sutil de soporte
        const hIzq = getPt(11); const hDer = getPt(12);
        const anchoHombros = Math.hypot(hDer.x - hIzq.x, hDer.y - hIzq.y);
        const huesos = [[11,13],[13,15],[12,14],[14,16],[23,25],[25,27],[24,26],[26,28],[11,12],[23,24]];
        huesos.forEach(([p1, p2]) => drawCyberBone(ctx, getPt(p1), getPt(p2), 5, "#ffffff"));
        drawCaricatureHead(ctx, getPt(0), anchoHombros, "#ffffff", false);
    }
});


// --- EFECTO 5: CRISTAL GEOMÉTRICO ---
window.customFXManager.register({
    id: 5,
    name: "5. Cristal 3D",
    isTrail: false,
    draw: function(ctx, landmarks, width, height, connections, getPt) {
        ctx.save(); ctx.shadowBlur = 0;
        const armadura = [
            { pts: [11, 12, 0], color: 'rgba(0, 255, 200, 0.25)' },
            { pts: [11, 12, 23], color: 'rgba(0, 150, 255, 0.2)' },
            { pts: [12, 23, 24], color: 'rgba(0, 100, 255, 0.25)' },
            { pts: [11, 13, 23], color: 'rgba(150, 0, 255, 0.2)' },
            { pts: [12, 14, 24], color: 'rgba(255, 0, 150, 0.2)' },
            { pts: [23, 24, 25], color: 'rgba(255, 0, 100, 0.2)' },
            { pts: [24, 25, 26], color: 'rgba(200, 0, 255, 0.2)' },
            { pts: [25, 26, 27], color: 'rgba(0, 255, 150, 0.2)' },
            { pts: [26, 27, 28], color: 'rgba(0, 200, 255, 0.2)' }
        ];
        armadura.forEach(tri => {
            const p1 = getPt(tri.pts[0]); const p2 = getPt(tri.pts[1]); const p3 = getPt(tri.pts[2]);
            ctx.fillStyle = tri.color; ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y);
            ctx.closePath(); ctx.fill(); ctx.stroke();
        });
        ctx.restore();
    }
});
