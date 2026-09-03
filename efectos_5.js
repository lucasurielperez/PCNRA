window.customFXManager = window.customFXManager || { list: [], register: function(fx) { this.list.push(fx); } };

if (!window.avatarLibrary) {
    window.avatarLibrary = {
        sets: {},
        currentSetIdx: 1,
        totalSetsDetected: 1,
        lastSwitchTime: Date.now(),
        isLoaded: false
    };
}

const partesRequeridas = ["cabeza", "torzo", "brazoizquierdo", "brazoderecho", "pieizquierdo", "piederecho"];
const maxTandasAIntentar = 5;

function precargarImagenesAvatar() {
    if (window.avatarLibrary.isLoaded) return;
    for (let t = 1; t <= maxTandasAIntentar; t++) {
        window.avatarLibrary.sets[t] = {};
        partesRequeridas.forEach(parte => {
            const img = new Image();
            img.src = `imagenes/${parte}_${t}.png`;
            img.onload = () => {
                window.avatarLibrary.sets[t][parte] = img;
                if (t > window.avatarLibrary.totalSetsDetected) window.avatarLibrary.totalSetsDetected = t;
            };
            img.onerror = () => { window.avatarLibrary.sets[t][parte] = null; };
        });
    }
    window.avatarLibrary.isLoaded = true;
}

function dist(a, b) {
    return Math.hypot(b.x - a.x, b.y - a.y);
}

function midpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function clampAngle(angle, center, range) {
    let delta = Math.atan2(Math.sin(angle - center), Math.cos(angle - center));
    delta = clamp(delta, -range, range);
    return center + delta;
}

function worldFromLocal(origin, x, y, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
        x: origin.x + x * cos - y * sin,
        y: origin.y + x * sin + y * cos
    };
}

function pairByNearest(leftSocket, rightSocket, a, b) {
    const normal = { left: a, right: b };
    const swapped = { left: b, right: a };
    const normalCost = dist(leftSocket, normal.left) + dist(rightSocket, normal.right);
    const swappedCost = dist(leftSocket, swapped.left) + dist(rightSocket, swapped.right);
    return swappedCost < normalCost ? swapped : normal;
}


function drawPixelRect(ctx, x, y, w, h, img) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x + 5, y + 6, w, h);
    if (img && img.width > 0) {
        ctx.drawImage(img, x, y, w, h);
    } else {
        ctx.fillStyle = "#13b8b2";
        ctx.fillRect(x, y, w, h);
    }
    ctx.strokeStyle = "rgba(0,0,0,0.75)";
    ctx.lineWidth = Math.max(3, Math.min(w, h) * 0.05);
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
}

function drawBlockSegment(ctx, a, b, thickness, img) {
    const length = Math.max(8, dist(a, b));
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(angle);
    ctx.imageSmoothingEnabled = false;
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.fillRect(5, -thickness / 2 + 5, length, thickness);
    if (img && img.width > 0) {
        ctx.drawImage(img, 0, -thickness / 2, length, thickness);
    } else {
        ctx.fillStyle = "#19bfc0";
        ctx.fillRect(0, -thickness / 2, length, thickness);
    }
    ctx.strokeStyle = "rgba(0,0,0,0.8)";
    ctx.lineWidth = Math.max(3, thickness * 0.08);
    ctx.strokeRect(0, -thickness / 2, length, thickness);
    ctx.restore();
}

function drawMinecraftLimb(ctx, a, b, thickness, mainColor, tipColor) {
    const length = Math.max(8, dist(a, b));
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(angle);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(5, -thickness / 2 + 5, length, thickness);
    ctx.fillStyle = mainColor;
    ctx.fillRect(0, -thickness / 2, length, thickness);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(0, -thickness / 2, length, thickness * 0.28);
    ctx.fillStyle = tipColor;
    ctx.fillRect(length * 0.74, -thickness / 2, length * 0.26, thickness);
    ctx.strokeStyle = "rgba(0,0,0,0.82)";
    ctx.lineWidth = Math.max(3, thickness * 0.1);
    ctx.strokeRect(0, -thickness / 2, length, thickness);
    ctx.restore();
}

function drawJointSquare(ctx, pt, size) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(pt.x - size / 2 + 3, pt.y - size / 2 + 3, size, size);
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(pt.x - size / 2, pt.y - size / 2, size, size);
    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.lineWidth = 2;
    ctx.strokeRect(pt.x - size / 2, pt.y - size / 2, size, size);
    ctx.restore();
}

window.customFXManager.register({
    id: 21,
    name: "21. Minecraft Avatar",
    isTrail: false,
    draw: function(ctx, landmarks, width, height, connections, getPt) {
        precargarImagenesAvatar();

        if (Date.now() - window.avatarLibrary.lastSwitchTime > 20000) {
            window.avatarLibrary.currentSetIdx = (window.avatarLibrary.currentSetIdx % window.avatarLibrary.totalSetsDetected) + 1;
            window.avatarLibrary.lastSwitchTime = Date.now();
        }

        const setActivo = window.avatarLibrary.sets[window.avatarLibrary.currentSetIdx];
        if (!setActivo || !setActivo["torzo"]) return;

        const shoulderL = getPt(11);
        const shoulderR = getPt(12);
        const elbowL = getPt(13);
        const elbowR = getPt(14);
        const handL = getPt(15);
        const handR = getPt(16);
        const hipL = getPt(23);
        const hipR = getPt(24);
        const kneeL = getPt(25);
        const kneeR = getPt(26);
        const footL = getPt(27);
        const footR = getPt(28);

        const shoulderCenter = midpoint(shoulderL, shoulderR);
        const hipCenter = midpoint(hipL, hipR);
        const rawScale = clamp((dist(shoulderL, shoulderR) + dist(shoulderCenter, hipCenter) * 0.78) * 0.5, 76, width * 0.2);
        if (!window.minecraftRigState) window.minecraftRigState = { scale: rawScale };
        window.minecraftRigState.scale = window.minecraftRigState.scale * 0.88 + rawScale * 0.12;
        const unit = window.minecraftRigState.scale;

        const torsoW = unit * 0.72;
        const torsoH = unit * 1.08;
        const headSize = unit * 0.56;
        const limbW = unit * 0.2;
        const armL = unit * 0.86;
        const legL = unit * 0.94;

        const torsoAngleRaw = Math.atan2(hipCenter.y - shoulderCenter.y, hipCenter.x - shoulderCenter.x) - Math.PI / 2;
        const torsoAngle = clamp(torsoAngleRaw, -0.28, 0.28);
        const torsoCenter = midpoint(shoulderCenter, hipCenter);

        ctx.save();
        ctx.imageSmoothingEnabled = false;

        const leftArmSocket = worldFromLocal(torsoCenter, -torsoW * 0.43, -torsoH * 0.34, torsoAngle);
        const rightArmSocket = worldFromLocal(torsoCenter, torsoW * 0.43, -torsoH * 0.34, torsoAngle);
        const leftLegSocket = worldFromLocal(torsoCenter, -torsoW * 0.24, torsoH * 0.5, torsoAngle);
        const rightLegSocket = worldFromLocal(torsoCenter, torsoW * 0.24, torsoH * 0.5, torsoAngle);
        const headSocket = worldFromLocal(torsoCenter, 0, -torsoH * 0.5 - headSize * 0.48, torsoAngle);

        const downAngle = torsoAngle + Math.PI / 2;
        const pairedHands = pairByNearest(leftArmSocket, rightArmSocket, handL, handR);
        const pairedFeet = pairByNearest(leftLegSocket, rightLegSocket, footL, footR);
        const leftArmTarget = Math.atan2(pairedHands.left.y - leftArmSocket.y, pairedHands.left.x - leftArmSocket.x);
        const rightArmTarget = Math.atan2(pairedHands.right.y - rightArmSocket.y, pairedHands.right.x - rightArmSocket.x);
        const leftLegTarget = Math.atan2(pairedFeet.left.y - leftLegSocket.y, pairedFeet.left.x - leftLegSocket.x);
        const rightLegTarget = Math.atan2(pairedFeet.right.y - rightLegSocket.y, pairedFeet.right.x - rightLegSocket.x);

        const leftArmAngle = clampAngle(leftArmTarget, downAngle + 0.32, 1.45);
        const rightArmAngle = clampAngle(rightArmTarget, downAngle - 0.32, 1.45);
        const leftLegAngle = clampAngle(leftLegTarget, downAngle + 0.14, 0.62);
        const rightLegAngle = clampAngle(rightLegTarget, downAngle - 0.14, 0.62);

        const leftArmEnd = { x: leftArmSocket.x + Math.cos(leftArmAngle) * armL, y: leftArmSocket.y + Math.sin(leftArmAngle) * armL };
        const rightArmEnd = { x: rightArmSocket.x + Math.cos(rightArmAngle) * armL, y: rightArmSocket.y + Math.sin(rightArmAngle) * armL };
        const leftLegEnd = { x: leftLegSocket.x + Math.cos(leftLegAngle) * legL, y: leftLegSocket.y + Math.sin(leftLegAngle) * legL };
        const rightLegEnd = { x: rightLegSocket.x + Math.cos(rightLegAngle) * legL, y: rightLegSocket.y + Math.sin(rightLegAngle) * legL };

        // Fixed-size limbs: camera perspective can rotate them, but never stretch or detach them.
        drawMinecraftLimb(ctx, leftLegSocket, leftLegEnd, limbW * 1.08, "#3430c9", "#2dd3c8");
        drawMinecraftLimb(ctx, rightLegSocket, rightLegEnd, limbW * 1.08, "#3430c9", "#2dd3c8");
        drawMinecraftLimb(ctx, leftArmSocket, leftArmEnd, limbW, "#19bfc0", "#d99a73");
        drawMinecraftLimb(ctx, rightArmSocket, rightArmEnd, limbW, "#19bfc0", "#d99a73");

        // Torso follows the real body axis but stays rectangular and blocky.
        ctx.save();
        ctx.translate(torsoCenter.x, torsoCenter.y);
        ctx.rotate(torsoAngle);
        drawPixelRect(ctx, -torsoW / 2, -torsoH / 2, torsoW, torsoH, setActivo["torzo"]);
        ctx.restore();

        // The head is hard-attached to the torso socket; landmarks cannot make it float away.
        const headAngle = torsoAngle;
        ctx.save();
        ctx.translate(headSocket.x, headSocket.y);
        ctx.rotate(headAngle);
        drawPixelRect(ctx, -headSize / 2, -headSize / 2, headSize, headSize, setActivo["cabeza"]);
        ctx.restore();

        ctx.restore();
    }
});

precargarImagenesAvatar();
