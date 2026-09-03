window.customFXManager = window.customFXManager || { list: [], register: function(fx) { this.list.push(fx); } };

if (!window.fx6Grosor) window.fx6Grosor = 6;
if (!window.fx7Escala) window.fx7Escala = 1.0;
if (!window.fx8Gotas) window.fx8Gotas = [];
if (!window.fx9Hue) window.fx9Hue = 0;
if (!window.lastLandmarks) window.lastLandmarks = null;

function calcularVelocidadCuerpo(current) {
    if (!window.lastLandmarks || window.lastLandmarks.length !== current.length) {
        window.lastLandmarks = current; return 0;
    }
    let sumaMovimiento = 0;
    const puntosClave = [11, 12, 15, 16, 23, 24, 27, 28];
    puntosClave.forEach(idx => {
        sumaMovimiento += Math.hypot(current[idx].x - window.lastLandmarks[idx].x, current[idx].y - window.lastLandmarks[idx].y);
    });
    window.lastLandmarks = current;
    return sumaMovimiento / puntosClave.length;
}


// --- EFECTO 6: MONIGOTE INFLABLE ---
window.customFXManager.register({
    id: 6,
    name: "6. Monigote Inflable",
    isTrail: false,
    draw: function(ctx, landmarks, width, height, connections, getPt) {
        let vel = calcularVelocidadCuerpo(landmarks);
        window.fx6Grosor = (vel > 0.008) ? window.fx6Grosor - 1.8 : window.fx6Grosor + 0.45;
        window.fx6Grosor = Math.max(4, Math.min(65, window.fx6Grosor));

        ctx.lineWidth = window.fx6Grosor;
        ctx.strokeStyle = '#ffff00';
        ctx.shadowBlur = window.fx6Grosor / 2 + 5; ctx.shadowColor = '#ffff00';
        ctx.lineCap = "round"; ctx.lineJoin = "round";

        connections.forEach(([p1, p2]) => {
            const pt1 = getPt(p1); const pt2 = getPt(p2);
            ctx.beginPath(); ctx.moveTo(pt1.x, pt1.y); ctx.lineTo(pt2.x, pt2.y); ctx.stroke();
        });

        const hIzq = getPt(11); const hDer = getPt(12);
        const anchoHombros = Math.hypot(hDer.x - hIzq.x, hDer.y - hIzq.y);
        const radioCabeza = (anchoHombros * 0.48) + (window.fx6Grosor * 0.4); // Se infla en proporción

        ctx.beginPath();
        ctx.arc(getPt(0).x, getPt(0).y - (radioCabeza * 0.4), radioCabeza, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.lineCap = "butt";
    }
});


// --- EFECTO 7: SILUETA ZOOM ---
window.customFXManager.register({
    id: 7,
    name: "7. Silueta Zoom",
    isTrail: false,
    draw: function(ctx, landmarks, width, height, connections, getPt) {
        let vel = calcularVelocidadCuerpo(landmarks);
        window.fx7Escala = (vel > 0.008) ? window.fx7Escala + 0.06 : window.fx7Escala - 0.035;
        window.fx7Escala = Math.max(1.0, Math.min(2.3, window.fx7Escala));

        ctx.save();
        const hIzq = getPt(11); const hDer = getPt(12);
        const centroX = (hIzq.x + hDer.x) / 2; const centroY = (hIzq.y + hDer.y) / 2;

        ctx.translate(centroX, centroY);
        ctx.scale(window.fx7Escala, window.fx7Escala);
        ctx.translate(-centroX, -centroY);

        ctx.fillStyle = '#00ff55'; ctx.shadowBlur = 25; ctx.shadowColor = '#00ff55';
        ctx.beginPath();
        const ordenSilueta = [11, 13, 15, 13, 11, 23, 25, 27, 28, 26, 24, 12, 14, 16, 14, 12];
        ordenSilueta.forEach((idx, i) => {
            const pt = getPt(idx);
            if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
        });
        ctx.closePath(); ctx.fill();

        const anchoHombros = Math.hypot(hDer.x - hIzq.x, hDer.y - hIzq.y);
        const radioCabeza = anchoHombros * 0.48;
        ctx.beginPath(); ctx.arc(getPt(0).x, getPt(0).y - (radioCabeza * 0.4), radioCabeza, 0, 2 * Math.PI); ctx.fill();
        ctx.restore();
    }
});


// --- EFECTO 8: LLUVIA DE NEÓN ---
window.customFXManager.register({
    id: 8,
    name: "8. Lluvia de Neón",
    isTrail: false,
    draw: function(ctx, landmarks, width, height, connections, getPt) {
        if (window.fx8Gotas.length < 60 && Math.random() > 0.4) {
            window.fx8Gotas.push({ x: Math.random() * width, y: 0, largo: Math.random() * 20 + 15, vel: Math.random() * 8 + 6, color: Math.random() > 0.5 ? '#00ffff' : '#ff00ff' });
        }
        const hIzq = getPt(11); const hDer = getPt(12);
        const limitesCuerpo = { izq: Math.min(hIzq.x, getPt(23).x) - 40, der: Math.max(hDer.x, getPt(24).x) + 40, superior: Math.min(hIzq.y, hDer.y) - 60, inferior: Math.max(getPt(23).y, getPt(24).y) + 100 };

        window.fx8Gotas.forEach((g, idx) => {
            g.y += g.vel;
            if (g.x > limitesCuerpo.izq && g.x < limitesCuerpo.der && g.y > limitesCuerpo.superior && g.y < limitesCuerpo.inferior) {
                g.x += (g.x < (limitesCuerpo.izq + (limitesCuerpo.der - limitesCuerpo.izq)/2)) ? -15 : 15; g.y += 5;
            }
            if (g.y > height) { window.fx8Gotas.splice(idx, 1); } 
            else { ctx.strokeStyle = g.color; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(g.x, g.y + g.largo); ctx.stroke(); }
        });

        // Esqueleto blanco sutil
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 4; ctx.shadowBlur = 0;
        connections.forEach(([p1, p2]) => {
            ctx.beginPath(); ctx.moveTo(getPt(p1).x, getPt(p1).y); ctx.lineTo(getPt(p2).x, getPt(p2).y); ctx.stroke();
        });
        const rCab = Math.hypot(hDer.x - hIzq.x, hDer.y - hIzq.y) * 0.48;
        ctx.beginPath(); ctx.arc(getPt(0).x, getPt(0).y - (rCab*0.4), rCab, 0, 2*Math.PI); ctx.stroke();
    }
});


// --- EFECTO 9: ESTELA ARCOÍRIS ---
window.customFXManager.register({
    id: 9,
    name: "9. Estela Arcoíris",
    isTrail: true,
    draw: function(ctx, landmarks, width, height, connections, getPt) {
        window.fx9Hue = (window.fx9Hue + 2) % 360; 
        ctx.lineWidth = 7; ctx.strokeStyle = `hsl(${window.fx9Hue}, 100%, 50%)`;
        ctx.shadowBlur = 20; ctx.shadowColor = `hsl(${window.fx9Hue}, 100%, 50%)`;

        connections.forEach(([p1, p2]) => {
            ctx.beginPath(); ctx.moveTo(getPt(p1).x, getPt(p1).y); ctx.lineTo(getPt(p2).x, getPt(p2).y); ctx.stroke();
        });

        const hIzq = getPt(11); const hDer = getPt(12);
        const radioCabeza = Math.hypot(hDer.x - hIzq.x, hDer.y - hIzq.y) * 0.48;
        ctx.beginPath(); ctx.arc(getPt(0).x, getPt(0).y - (radioCabeza * 0.4), radioCabeza, 0, 2 * Math.PI); ctx.stroke();
    }
});


// --- EFECTO 10: VÓRTICE ESPEJO ---
window.customFXManager.register({
    id: 10,
    name: "10. Vórtice Espejo",
    isTrail: false,
    draw: function(ctx, landmarks, width, height, connections, getPt) {
        ctx.lineWidth = 3; ctx.shadowBlur = 10;
        const hIzq = getPt(11); const hDer = getPt(12);
        const radioCabeza = Math.hypot(hDer.x - hIzq.x, hDer.y - hIzq.y) * 0.48;

        for (let i = 0; i < 4; i++) {
            ctx.save(); ctx.translate(width / 2, height / 2); ctx.rotate((i * 90 * Math.PI) / 180); ctx.translate(-width / 2, -height / 2);
            const colores = ['#ff00ff', '#00ffff', '#ffff00', '#ff3300'];
            ctx.strokeStyle = colores[i]; ctx.shadowColor = colores[i];

            connections.forEach(([p1, p2]) => {
                ctx.beginPath(); ctx.moveTo(getPt(p1).x, getPt(p1).y); ctx.lineTo(getPt(p2).x, getPt(p2).y); ctx.stroke();
            });
            ctx.beginPath(); ctx.arc(getPt(0).x, getPt(0).y - (radioCabeza * 0.4), radioCabeza, 0, 2 * Math.PI); ctx.stroke();
            ctx.restore();
        }
    }
});