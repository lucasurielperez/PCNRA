window.customFXManager = window.customFXManager || { list: [], register: function(fx) { this.list.push(fx); } };

if (!window.gameState) {
    window.gameState = { score: 0, vidas: 3, gameOver: false, elementos: [], playerY: 400, playerVy: 0, scrollY: 0, ultimoSpawn: 0, resetTimerActive: false };
}

function updateGameUI(texto) {
    const ui = document.getElementById('game-ui');
    if (ui) ui.innerHTML = texto;
}

function drawGameSkeleton(ctx, connections, getPt) {
    ctx.save();
    ctx.lineWidth = 6; ctx.strokeStyle = "#ffffff"; ctx.shadowBlur = 12; ctx.shadowColor = "#ffffff";
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    
    connections.forEach(([p1, p2]) => {
        const pt1 = getPt(p1); const pt2 = getPt(p2);
        ctx.beginPath(); ctx.moveTo(pt1.x, pt1.y); ctx.lineTo(pt2.x, pt2.y); ctx.stroke();
    });
    
    const hombroIzq = getPt(11); const hombroDer = getPt(12);
    const nariz = getPt(0);
    const anchoHombros = Math.hypot(hombroDer.x - hombroIzq.x, hombroDer.y - hombroIzq.y);
    const radioCabeza = Math.max(25, anchoHombros * 0.48); 

    ctx.beginPath(); 
    ctx.arc(nariz.x, nariz.y - (radioCabeza * 0.4), radioCabeza, 0, 2 * Math.PI); 
    ctx.stroke();
    ctx.restore();
}

// Inyección global para que juegovideo.html pueda gatillar el reset limpio
window.resetGameInstance = function(modoNombre) {
    window.gameState = { score: 0, vidas: 3, gameOver: false, elementos: [], playerY: 350, playerVy: 0, scrollY: 0, ultimoSpawn: Date.now(), resetTimerActive: false };
    updateGameUI(modoNombre + "<br>SCORE: 0 | VIDAS: 3");
};

// Lógica de temporizador automático para reset de juegos
function handleAutoReset(modoNombre) {
    if (window.gameState.resetTimerActive) return;
    window.gameState.resetTimerActive = true;
    
    let segundosRestantes = 5;
    const intervalId = setInterval(() => {
        segundosRestantes--;
        if (segundosRestantes <= 0) {
            clearInterval(intervalId);
            window.resetGameInstance(modoNombre);
        } else {
            updateGameUI("GAME OVER<br>SCORE: " + window.gameState.score + `<br><small style='color:#ff0055'>Reiniciando juego en ${segundosRestantes}s...</small>`);
        }
    }, 1000);
}


// --- JUEGO 16: KING KONG VS NAVES ---
window.customFXManager.register({
    id: 16,
    name: "16. Juego: King Kong vs Naves",
    isTrail: false,
    draw: function(ctx, landmarks, width, height, connections, getPt) {
        if (window.gameState.gameOver) {
            updateGameUI("GAME OVER<br>SCORE: " + window.gameState.score + "<br><small style='color:#ff0055'>Reiniciando juego en 5s...</small>");
            handleAutoReset("16. Juego: King Kong vs Naves");
            return;
        }
        drawGameSkeleton(ctx, connections, getPt);
        const mIzq = getPt(15); const mDer = getPt(16);

        if (Date.now() - window.gameState.ultimoSpawn > 1200) {
            window.gameState.elementos.push({ x: Math.random() * (width - 60) + 30, y: -20, vel: Math.random() * 3 + 2, r: 25 });
            window.gameState.ultimoSpawn = Date.now();
        }

        window.gameState.elementos.forEach((nave, idx) => {
            nave.y += nave.vel;
            ctx.strokeStyle = "#ff0055"; ctx.lineWidth = 3; ctx.shadowBlur = 15; ctx.shadowColor = "#ff0055";
            ctx.beginPath(); ctx.moveTo(nave.x, nave.y - 15); ctx.lineTo(nave.x - 20, nave.y + 15); ctx.lineTo(nave.x + 20, nave.y + 15); ctx.closePath(); ctx.stroke();

            if (Math.hypot(mIzq.x - nave.x, mIzq.y - nave.y) < (nave.r + 25) || Math.hypot(mDer.x - nave.x, mDer.y - nave.y) < (nave.r + 25)) {
                ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(nave.x, nave.y, 45, 0, 2*Math.PI); ctx.fill();
                window.gameState.score += 10; window.gameState.elementos.splice(idx, 1);
                updateGameUI("NAVES DESTRUIDAS<br>SCORE: " + window.gameState.score + " | VIDAS: " + window.gameState.vidas);
            }
            if (nave.y > height) {
                window.gameState.vidas--; window.gameState.elementos.splice(idx, 1);
                if (window.gameState.vidas <= 0) window.gameState.gameOver = true;
                updateGameUI("¡PLANETA ATACADO!<br>SCORE: " + window.gameState.score + " | VIDAS: " + window.gameState.vidas);
            }
        });
    }
});


// --- JUEGO 17: PISAR AUTOS ---
window.customFXManager.register({
    id: 17,
    name: "17. Juego: Pisar Autos",
    isTrail: false,
    draw: function(ctx, landmarks, width, height, connections, getPt) {
        if (window.gameState.gameOver) { 
            updateGameUI("GAME OVER<br>SCORE: " + window.gameState.score + "<br><small style='color:#ff0055'>Reiniciando juego en 5s...</small>"); 
            handleAutoReset("17. Juego: Pisar Autos");
            return; 
        }
        drawGameSkeleton(ctx, connections, getPt);
        const pIzq = getPt(27); const pDer = getPt(28);

        ctx.fillStyle = "rgba(255,255,255,0.05)"; ctx.fillRect(0, height - 80, width, 5);

        if (Date.now() - window.gameState.ultimoSpawn > 1500) {
            const dir = Math.random() > 0.5 ? 1 : -1;
            window.gameState.elementos.push({ x: dir === 1 ? -60 : width + 10, y: height - 65, vel: (Math.random() * 4 + 4) * dir, w: 55, h: 30, color: '#ffff00' });
            window.gameState.ultimoSpawn = Date.now();
        }

        window.gameState.elementos.forEach((auto, idx) => {
            auto.x += auto.vel;
            ctx.fillStyle = auto.color; ctx.shadowBlur = 15; ctx.shadowColor = auto.color;
            ctx.fillRect(auto.x, auto.y, auto.w, auto.h);

            if ((pIzq.x > auto.x && pIzq.x < auto.x + auto.w && pIzq.y > auto.y - 25) || (pDer.x > auto.x && pDer.x < auto.x + auto.w && pDer.y > auto.y - 25)) {
                window.gameState.score += 20; window.gameState.elementos.splice(idx, 1);
                updateGameUI("¡APLASTADO!<br>SCORE: " + window.gameState.score);
            }
            if ((auto.vel > 0 && auto.x > width) || (auto.vel < 0 && auto.x < -70)) {
                window.gameState.vidas--; window.gameState.elementos.splice(idx, 1);
                if (window.gameState.vidas <= 0) window.gameState.gameOver = true;
                updateGameUI("SE ESCAPÓ UN AUTO<br>SCORE: " + window.gameState.score + " | VIDAS: " + window.gameState.vidas);
            }
        });
    }
});


// --- JUEGO 18: SALTO INFINITO ---
window.customFXManager.register({
    id: 18,
    name: "18. Juego: Salto Infinito",
    isTrail: false,
    draw: function(ctx, landmarks, width, height, connections, getPt) {
        const cIzq = getPt(23); const cDer = getPt(24);
        const jugadorX = (cIzq.x + cDer.x) / 2; const jugadorYReal = (cIzq.y + cDer.y) / 2;

        if (window.gameState.elementos.length === 0 && !window.gameState.resetTimerActive) {
            window.resetGameInstance("18. Juego: Salto Infinito");
            for (let i = 0; i < 6; i++) window.gameState.elementos.push({ x: Math.random() * (width - 100), y: height - (i * 130) - 50, w: 90, h: 15 });
        }

        if (window.gameState.playerY > jugadorYReal + 15 && window.gameState.playerVy === 0) window.gameState.playerVy = -14;
        window.gameState.playerVy += 0.45; window.gameState.playerY += window.gameState.playerVy;

        if (window.gameState.playerY < height * 0.4) {
            const diff = (height * 0.4) - window.gameState.playerY; window.gameState.playerY = height * 0.4;
            window.gameState.score += Math.floor(diff); window.gameState.elementos.forEach(p => p.y += diff);
        }

        window.gameState.elementos.forEach((plataforma) => {
            ctx.fillStyle = "#00ffcc"; ctx.shadowBlur = 10; ctx.shadowColor = "#00ffcc";
            ctx.fillRect(plataforma.x, plataforma.y, plataforma.w, plataforma.h);
            if (window.gameState.playerVy > 0 && jugadorX > plataforma.x && jugadorX < plataforma.x + plataforma.w && window.gameState.playerY > plataforma.y - 12 && window.gameState.playerY < plataforma.y + plataforma.h) {
                window.gameState.playerVy = -14;
            }
            if (plataforma.y > height) { plataforma.y = -20; plataforma.x = Math.random() * (width - 100); }
        });

        ctx.fillStyle = "#ffffff"; ctx.shadowBlur = 20; ctx.shadowColor = "#fff";
        ctx.beginPath(); ctx.arc(jugadorX, window.gameState.playerY, 18, 0, 2*Math.PI); ctx.fill();
        drawGameSkeleton(ctx, connections, getPt);
        updateGameUI("TORRE DE SALTOS<br>ALTURA MÁXIMA: " + window.gameState.score);
        
        // Caída libre al fondo del mapa (Game Over automático en esta versión)
        if (window.gameState.playerY > height) {
            window.gameState.gameOver = true;
            updateGameUI("GAME OVER<br>ALTURA MÁXIMA: " + window.gameState.score + "<br><small style='color:#ff0055'>Reiniciando juego en 5s...</small>");
            handleAutoReset("18. Juego: Salto Infinito");
        }
    }
});


// --- JUEGO 19: BEAT CUTTER ---
window.customFXManager.register({
    id: 19,
    name: "19. Juego: Beat Cutter",
    isTrail: false,
    draw: function(ctx, landmarks, width, height, connections, getPt) {
        drawGameSkeleton(ctx, connections, getPt);
        const mIzq = getPt(15); const mDer = getPt(16);

        if (window.gameState.elementos.length < 4 && Math.random() > 0.95) {
            const angulo = Math.random() * Math.PI * 2;
            window.gameState.elementos.push({ x: width / 2, y: height / 2, vx: Math.cos(angulo) * 5, vy: Math.sin(angulo) * 5, size: 10, color: Math.random() > 0.5 ? '#ff00ff' : '#00ffff' });
        }

        window.gameState.elementos.forEach((bloque, idx) => {
            bloque.x += bloque.vx; bloque.y += bloque.vy; bloque.size += 0.5;
            ctx.fillStyle = bloque.color; ctx.shadowBlur = bloque.size; ctx.shadowColor = bloque.color;
            ctx.fillRect(bloque.x - bloque.size/2, bloque.y - bloque.size/2, bloque.size, bloque.size);

            if (Math.hypot(mIzq.x - bloque.x, mIzq.y - bloque.y) < (bloque.size + 20) || Math.hypot(mDer.x - bloque.x, mDer.y - bloque.y) < (bloque.size + 20)) {
                window.gameState.score += 5; window.gameState.elementos.splice(idx, 1);
                updateGameUI("¡RITMO CORTE!<br>SCORE: " + window.gameState.score);
            }
            if (bloque.x < 0 || bloque.x > width || bloque.y < 0 || bloque.y > height) window.gameState.elementos.splice(idx, 1);
        });
    }
});


// --- JUEGO 20: ESQUIVAR PAREDES ---
let barraY = -50; let barraVel = 6; let tipoBarra = 0;
window.customFXManager.register({
    id: 20,
    name: "20. Juego: Esquivar Paredes",
    isTrail: false,
    draw: function(ctx, landmarks, width, height, connections, getPt) {
        drawGameSkeleton(ctx, connections, getPt);
        const cabezaY = getPt(0).y;
        barraY += barraVel;

        if (barraY > height) {
            barraY = -40; barraVel = Math.random() * 4 + 6; tipoBarra = Math.random() > 0.5 ? 0 : 1; window.gameState.score += 50;
        }

        if (tipoBarra === 0) {
            ctx.fillStyle = "rgba(255, 0, 0, 0.4)"; ctx.strokeStyle = "#ff0000"; ctx.lineWidth = 4;
            ctx.fillRect(0, 100, width, 120); ctx.strokeRect(0, 100, width, 120);
            updateGameUI("¡AGACHATE! (SQUAT)<br>PUNTOS: " + window.gameState.score);
            if (barraY > 100 && barraY < 220 && cabezaY < 220) window.gameState.score = Math.max(0, window.gameState.score - 2);
        } else {
            ctx.fillStyle = "rgba(0, 150, 255, 0.4)"; ctx.strokeStyle = "#0096ff"; ctx.lineWidth = 4;
            ctx.fillRect(0, height - 180, width, 100); ctx.strokeRect(0, height - 180, width, 100);
            updateGameUI("¡SALTA!<br>PUNTOS: " + window.gameState.score);
            if (barraY > height - 180 && getPt(28).y > height - 180) window.gameState.score = Math.max(0, window.gameState.score - 1);
        }
        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, barraY); ctx.lineTo(width, barraY); ctx.stroke();
    }
});