window.customFXManager = window.customFXManager || { list: [], register: function(fx) { this.list.push(fx); } };

if (!window.fx11Fuego) window.fx11Fuego = [];
if (!window.fx12Agua) window.fx12Agua = [];
if (!window.fx13Cohetes) window.fx13Cohetes = [];
if (!window.fx13Chispas) window.fx13Chispas = [];
if (!window.fx13Flashes) window.fx13Flashes = [];
if (!window.fx14Rayos) window.fx14Rayos = { izq: [], der: [] };
if (!window.fx15Magia) window.fx15Magia = [];
if (!window.lastManoIzq) window.lastManoIzq = { x: 0, y: 0 };
if (!window.lastManoDer) window.lastManoDer = { x: 0, y: 0 };
if (!window.fx12LastHands) window.fx12LastHands = null;
if (!window.fx13LastHands) window.fx13LastHands = null;
if (!window.fx13Cooldown) window.fx13Cooldown = { izq: 0, der: 0 };

window.resetFXState = function() {
    window.fx11Fuego = [];
    window.fx12Agua = [];
    window.fx13Cohetes = [];
    window.fx13Chispas = [];
    window.fx13Flashes = [];
    window.fx12LastHands = null;
    window.fx13LastHands = null;
    window.fx13Cooldown = { izq: 0, der: 0 };
};

function drawSubtleBody(ctx, connections, getPt) {
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.shadowBlur = 0;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    connections.forEach(([p1, p2]) => {
        const pt1 = getPt(p1);
        const pt2 = getPt(p2);
        ctx.beginPath();
        ctx.moveTo(pt1.x, pt1.y);
        ctx.lineTo(pt2.x, pt2.y);
        ctx.stroke();
    });
    const nariz = getPt(0);
    ctx.beginPath();
    ctx.arc(nariz.x, nariz.y - 15, 20, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function drawHandGlow(ctx, pt, color, radius = 15) {
    ctx.save();
    const grad = ctx.createRadialGradient(pt.x, pt.y, 1, pt.x, pt.y, radius * 2.8);
    grad.addColorStop(0, "rgba(255,255,255,0.95)");
    grad.addColorStop(0.25, color);
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, radius * 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

window.customFXManager.register({
    id: 11,
    name: "11. Lanzallamas",
    isTrail: false,
    draw: function(ctx, landmarks, width, height, connections, getPt) {
        drawSubtleBody(ctx, connections, getPt);
        const mIzq = getPt(15);
        const mDer = getPt(16);
        const vxIzq = clamp((mIzq.x - window.lastManoIzq.x) * 0.8, -18, 18);
        const vyIzq = clamp((mIzq.y - window.lastManoIzq.y) * 0.8, -18, 18);
        const vxDer = clamp((mDer.x - window.lastManoDer.x) * 0.8, -18, 18);
        const vyDer = clamp((mDer.y - window.lastManoDer.y) * 0.8, -18, 18);

        [{ pt: mIzq, vx: vxIzq, vy: vyIzq }, { pt: mDer, vx: vxDer, vy: vyDer }].forEach(mano => {
            for (let i = 0; i < 4 && window.fx11Fuego.length < 240; i++) {
                window.fx11Fuego.push({
                    x: mano.pt.x,
                    y: mano.pt.y,
                    vx: mano.vx * 0.55 + (Math.random() - 0.5) * 5,
                    vy: mano.vy * 0.35 - (Math.random() * 4 + 3),
                    size: Math.random() * 12 + 8,
                    alpha: 1,
                    hue: Math.random() * 35
                });
            }
        });

        ctx.save();
        for (let idx = window.fx11Fuego.length - 1; idx >= 0; idx--) {
            const p = window.fx11Fuego[idx];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.98;
            p.alpha -= 0.025;
            p.size += 0.42;
            if (p.alpha <= 0) {
                window.fx11Fuego.splice(idx, 1);
            } else {
                const grad = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, p.size);
                grad.addColorStop(0, `hsla(52, 100%, 78%, ${p.alpha})`);
                grad.addColorStop(0.45, `hsla(${p.hue}, 100%, 55%, ${p.alpha * 0.8})`);
                grad.addColorStop(1, `hsla(0, 100%, 45%, 0)`);
                ctx.fillStyle = grad;
                ctx.shadowBlur = p.size;
                ctx.shadowColor = `hsl(${p.hue}, 100%, 55%)`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
        ctx.restore();

        drawHandGlow(ctx, mIzq, "rgba(255,90,0,0.65)");
        drawHandGlow(ctx, mDer, "rgba(255,90,0,0.65)");
        window.lastManoIzq = { x: mIzq.x, y: mIzq.y };
        window.lastManoDer = { x: mDer.x, y: mDer.y };
    }
});

window.customFXManager.register({
    id: 12,
    name: "12. Chorros de Agua",
    isTrail: false,
    draw: function(ctx, landmarks, width, height, connections, getPt) {
        drawSubtleBody(ctx, connections, getPt);
        const mIzq = getPt(15);
        const mDer = getPt(16);
        const cIzq = getPt(13);
        const cDer = getPt(14);
        const hIzq = getPt(11);
        const hDer = getPt(12);
        const last = window.fx12LastHands || { izq: mIzq, der: mDer };

        const emitWater = (hand, elbow, shoulder, prev, side) => {
            const dx = hand.x - elbow.x;
            const dy = hand.y - elbow.y;
            const len = Math.max(1, Math.hypot(dx, dy));
            const armX = dx / len;
            const armY = dy / len;
            const speedX = clamp((hand.x - prev.x) * 0.2, -7, 7);
            const speedY = clamp((hand.y - prev.y) * 0.2, -7, 7);
            const raised = hand.y < shoulder.y + height * 0.13;
            const openArm = Math.abs(hand.x - shoulder.x) > width * 0.08;
            const count = raised || openArm ? 5 : 2;

            for (let i = 0; i < count && window.fx12Agua.length < 260; i++) {
                const spread = (Math.random() - 0.5) * 2.4;
                window.fx12Agua.push({
                    x: hand.x + (Math.random() - 0.5) * 8,
                    y: hand.y + (Math.random() - 0.5) * 8,
                    px: hand.x,
                    py: hand.y,
                    vx: armX * (8 + Math.random() * 5) + speedX + side * 1.2 + spread,
                    vy: armY * (8 + Math.random() * 5) + speedY - 3 + Math.random() * 1.5,
                    size: Math.random() * 3.5 + 2,
                    alpha: 0.95,
                    life: 46 + Math.random() * 18
                });
            }
        };

        emitWater(mIzq, cIzq, hIzq, last.izq, -1);
        emitWater(mDer, cDer, hDer, last.der, 1);

        ctx.save();
        ctx.lineCap = "round";
        for (let idx = window.fx12Agua.length - 1; idx >= 0; idx--) {
            const g = window.fx12Agua[idx];
            g.px = g.x;
            g.py = g.y;
            g.x += g.vx;
            g.y += g.vy;
            g.vx *= 0.985;
            g.vy += 0.18;
            g.life -= 1;
            g.alpha = Math.min(g.alpha, g.life / 42);
            if (g.y > height + 40 || g.x < -80 || g.x > width + 80 || g.life <= 0) {
                window.fx12Agua.splice(idx, 1);
            } else {
                const grad = ctx.createLinearGradient(g.px, g.py, g.x, g.y);
                grad.addColorStop(0, `rgba(255,255,255,${g.alpha * 0.85})`);
                grad.addColorStop(0.45, `rgba(0,210,255,${g.alpha})`);
                grad.addColorStop(1, `rgba(0,90,255,${g.alpha * 0.35})`);
                ctx.strokeStyle = grad;
                ctx.lineWidth = g.size;
                ctx.shadowBlur = 12;
                ctx.shadowColor = "#38d8ff";
                ctx.beginPath();
                ctx.moveTo(g.px, g.py);
                ctx.lineTo(g.x, g.y);
                ctx.stroke();
            }
        }
        ctx.restore();

        drawHandGlow(ctx, mIzq, "rgba(0,210,255,0.62)", 12);
        drawHandGlow(ctx, mDer, "rgba(0,210,255,0.62)", 12);
        window.fx12LastHands = { izq: { x: mIzq.x, y: mIzq.y }, der: { x: mDer.x, y: mDer.y } };
    }
});

window.customFXManager.register({
    id: 13,
    name: "13. Fuegos Artificiales",
    isTrail: false,
    draw: function(ctx, landmarks, width, height, connections, getPt) {
        drawSubtleBody(ctx, connections, getPt);
        const mIzq = getPt(15);
        const mDer = getPt(16);
        const hIzq = getPt(11);
        const hDer = getPt(12);
        const last = window.fx13LastHands || { izq: mIzq, der: mDer };

        window.fx13Cooldown.izq = Math.max(0, window.fx13Cooldown.izq - 1);
        window.fx13Cooldown.der = Math.max(0, window.fx13Cooldown.der - 1);

        const launch = (hand, shoulder, prev, key) => {
            const upwardFlick = hand.y - prev.y < -16;
            const heldHigh = hand.y < shoulder.y - height * 0.06;
            if ((upwardFlick || heldHigh) && window.fx13Cooldown[key] === 0 && window.fx13Cohetes.length < 5) {
                window.fx13Cohetes.push({
                    x: hand.x,
                    y: hand.y,
                    px: hand.x,
                    py: hand.y,
                    vx: clamp((hand.x - prev.x) * 0.08, -3, 3),
                    vy: -10 - Math.random() * 4,
                    targetY: Math.random() * (height * 0.28) + height * 0.08,
                    color: Math.random() * 360,
                    trail: []
                });
                window.fx13Cooldown[key] = heldHigh ? 34 : 22;
            }
        };

        launch(mIzq, hIzq, last.izq, "izq");
        launch(mDer, hDer, last.der, "der");

        ctx.save();
        ctx.lineCap = "round";
        for (let idx = window.fx13Cohetes.length - 1; idx >= 0; idx--) {
            const c = window.fx13Cohetes[idx];
            c.px = c.x;
            c.py = c.y;
            c.x += c.vx;
            c.y += c.vy;
            c.vy += 0.05;
            c.trail.push({ x: c.x, y: c.y, a: 1 });
            if (c.trail.length > 14) c.trail.shift();

            c.trail.forEach((p, i) => {
                const alpha = (i / c.trail.length) * 0.65;
                ctx.fillStyle = `hsla(${c.color}, 100%, 70%, ${alpha})`;
                ctx.shadowBlur = 14;
                ctx.shadowColor = `hsl(${c.color}, 100%, 65%)`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2 + i * 0.22, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 3;
            ctx.shadowBlur = 16;
            ctx.shadowColor = "#fff";
            ctx.beginPath();
            ctx.moveTo(c.px, c.py);
            ctx.lineTo(c.x, c.y);
            ctx.stroke();

            if (c.y <= c.targetY || c.vy > -1) {
                window.fx13Flashes.push({ x: c.x, y: c.y, hue: c.color, radius: 18, alpha: 1 });
                for (let i = 0; i < 96; i++) {
                    const angle = (Math.PI * 2 * i) / 96 + (Math.random() - 0.5) * 0.12;
                    const force = 3.5 + Math.random() * 9.5;
                    window.fx13Chispas.push({
                        x: c.x,
                        y: c.y,
                        px: c.x,
                        py: c.y,
                        vx: Math.cos(angle) * force,
                        vy: Math.sin(angle) * force,
                        hue: c.color + (Math.random() - 0.5) * 40,
                        alpha: 1,
                        life: 82 + Math.random() * 30,
                        size: 2.5 + Math.random() * 3.5
                    });
                }
                window.fx13Cohetes.splice(idx, 1);
            }
        }

        for (let idx = window.fx13Flashes.length - 1; idx >= 0; idx--) {
            const flash = window.fx13Flashes[idx];
            flash.radius += 12;
            flash.alpha -= 0.08;
            if (flash.alpha <= 0) {
                window.fx13Flashes.splice(idx, 1);
            } else {
                const grad = ctx.createRadialGradient(flash.x, flash.y, 1, flash.x, flash.y, flash.radius);
                grad.addColorStop(0, `rgba(255,255,255,${flash.alpha})`);
                grad.addColorStop(0.35, `hsla(${flash.hue},100%,68%,${flash.alpha * 0.75})`);
                grad.addColorStop(1, "rgba(255,255,255,0)");
                ctx.fillStyle = grad;
                ctx.shadowBlur = 35;
                ctx.shadowColor = `hsl(${flash.hue}, 100%, 68%)`;
                ctx.beginPath();
                ctx.arc(flash.x, flash.y, flash.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        for (let idx = window.fx13Chispas.length - 1; idx >= 0; idx--) {
            const ch = window.fx13Chispas[idx];
            ch.px = ch.x;
            ch.py = ch.y;
            ch.x += ch.vx;
            ch.y += ch.vy;
            ch.vx *= 0.985;
            ch.vy = ch.vy * 0.985 + 0.08;
            ch.life -= 1;
            ch.alpha = ch.life / 80;
            if (ch.life <= 0) {
                window.fx13Chispas.splice(idx, 1);
            } else {
                ch.alpha = Math.min(1, ch.life / 56);
                ctx.strokeStyle = `hsla(${ch.hue}, 100%, 68%, ${ch.alpha})`;
                ctx.lineWidth = ch.size;
                ctx.shadowBlur = 18;
                ctx.shadowColor = `hsl(${ch.hue}, 100%, 68%)`;
                ctx.beginPath();
                ctx.moveTo(ch.px, ch.py);
                ctx.lineTo(ch.x, ch.y);
                ctx.stroke();
            }
        }
        ctx.restore();

        drawHandGlow(ctx, mIzq, "rgba(255,255,255,0.62)", 11);
        drawHandGlow(ctx, mDer, "rgba(255,255,255,0.62)", 11);
        window.fx13LastHands = { izq: { x: mIzq.x, y: mIzq.y }, der: { x: mDer.x, y: mDer.y } };
    }
});

window.customFXManager.register({
    id: 14,
    name: "14. Tormenta Electrica",
    isTrail: false,
    draw: function(ctx, landmarks, width, height, connections, getPt) {
        drawSubtleBody(ctx, connections, getPt);
        const mIzq = getPt(15);
        const mDer = getPt(16);
        const cadera = getPt(23);

        const generarRayo = (x1, y1, x2, y2) => {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            let curX = x1;
            let curY = y1;
            while (curY < y2) {
                curX += (Math.random() - 0.5) * 45;
                curY += Math.random() * 40 + 20;
                ctx.lineTo(curX, curY);
            }
            ctx.lineTo(x2, y2);
            ctx.stroke();
        };

        ctx.save();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#00ffff";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#00ffff";
        if (mIzq.y < cadera.y && Math.random() > 0.6) generarRayo(mIzq.x, mIzq.y, mIzq.x + (Math.random() - 0.5) * 100, height);
        if (mDer.y < cadera.y && Math.random() > 0.6) generarRayo(mDer.x, mDer.y, mDer.x + (Math.random() - 0.5) * 100, height);
        drawHandGlow(ctx, mIzq, "rgba(0,255,255,0.62)");
        drawHandGlow(ctx, mDer, "rgba(0,255,255,0.62)");
        ctx.restore();
    }
});

window.customFXManager.register({
    id: 15,
    name: "15. Espirales Magicos",
    isTrail: true,
    draw: function(ctx, landmarks, width, height, connections, getPt) {
        const mIzq = getPt(15);
        const mDer = getPt(16);
        if (!window.fx15Angulo) window.fx15Angulo = 0;
        window.fx15Angulo += 0.15;

        ctx.save();
        ctx.lineWidth = 4;
        ctx.shadowBlur = 12;
        [{ pt: mIzq, color: "#ff00aa" }, { pt: mDer, color: "#00ffcc" }].forEach(mano => {
            ctx.strokeStyle = mano.color;
            ctx.shadowColor = mano.color;
            for (let i = 0; i < 3; i++) {
                const radio = i * 15 + 10;
                const offsetX = Math.cos(window.fx15Angulo + i * 0.5) * radio;
                const offsetY = Math.sin(window.fx15Angulo + i * 0.5) * radio;
                ctx.beginPath();
                ctx.arc(mano.pt.x + offsetX, mano.pt.y + offsetY, 4 + i, 0, 2 * Math.PI);
                ctx.stroke();
            }
        });
        ctx.restore();
    }
});
