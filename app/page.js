'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

// ─── CONSTANTS ───────────────────────────────────────────────
const W = 420, H = 700;
const LANES = [90, 210, 330];
const PLAYER_W = 52, PLAYER_H = 60;
const OBS_W = 56, OBS_H = 36;
const COIN_R = 14;
const VP = { x: W / 2, y: H * 0.36 };

// ─── PARTICLE SYSTEM ─────────────────────────────────────────
function mkParticle(x, y, color) {
  const angle = Math.random() * Math.PI * 2;
  const speed = 1.5 + Math.random() * 3;
  return { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 2, life: 1, color, size: 2 + Math.random() * 3 };
}

// ─── DRAW MOAI ───────────────────────────────────────────────
function drawMoai(ctx, x, y, w, h, frame, options = {}) {
  const { glow = true, label = true, tilt = 0, flash = false } = options;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(tilt);
  ctx.translate(-(x + w / 2), -(y + h / 2));

  if (glow) {
    const gr = ctx.createRadialGradient(x + w / 2, y + h / 2, 4, x + w / 2, y + h / 2, w * 1.1);
    gr.addColorStop(0, flash ? 'rgba(255,80,80,0.5)' : 'rgba(0,245,180,0.28)');
    gr.addColorStop(1, 'transparent');
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, w * 1.1, 0, Math.PI * 2); ctx.fill();
  }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(x + w / 2, y + h + 8, w * 0.42, 8, 0, 0, Math.PI * 2); ctx.fill();

  // Head shape — tapered top
  const hg = ctx.createLinearGradient(x, y, x + w, y + h);
  hg.addColorStop(0, flash ? '#ffaaaa' : '#ddd5c2');
  hg.addColorStop(0.45, flash ? '#cc8888' : '#bfb49e');
  hg.addColorStop(1, flash ? '#884444' : '#8a7d6a');
  ctx.fillStyle = hg;

  ctx.beginPath();
  ctx.moveTo(x + w * 0.28, y);
  ctx.lineTo(x + w * 0.72, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + h * 0.18);
  ctx.lineTo(x + w * 0.96, y + h * 0.75);
  ctx.quadraticCurveTo(x + w, y + h, x + w * 0.82, y + h);
  ctx.lineTo(x + w * 0.18, y + h);
  ctx.quadraticCurveTo(x, y + h, x + w * 0.04, y + h * 0.75);
  ctx.lineTo(x, y + h * 0.18);
  ctx.quadraticCurveTo(x, y, x + w * 0.28, y);
  ctx.closePath();
  ctx.fill();

  // Forehead ridge
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.1, y + h * 0.28);
  ctx.lineTo(x + w * 0.9, y + h * 0.28);
  ctx.lineTo(x + w * 0.85, y + h * 0.35);
  ctx.lineTo(x + w * 0.15, y + h * 0.35);
  ctx.closePath(); ctx.fill();

  // Brow shelf highlight
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.12, y + h * 0.27);
  ctx.lineTo(x + w * 0.88, y + h * 0.27);
  ctx.lineTo(x + w * 0.84, y + h * 0.30);
  ctx.lineTo(x + w * 0.16, y + h * 0.30);
  ctx.closePath(); ctx.fill();

  // Eye sockets (deep set)
  const eyeY = y + h * 0.42;
  const eyePositions = [x + w * 0.30, x + w * 0.70];
  eyePositions.forEach((ex) => {
    ctx.fillStyle = '#4a3d30';
    ctx.beginPath(); ctx.ellipse(ex, eyeY, w * 0.13, h * 0.095, 0, 0, Math.PI * 2); ctx.fill();
    // White
    ctx.fillStyle = '#f0ede8';
    ctx.beginPath(); ctx.ellipse(ex, eyeY, w * 0.095, h * 0.07, 0, 0, Math.PI * 2); ctx.fill();
    // Pupil
    ctx.fillStyle = '#1a1208';
    ctx.beginPath(); ctx.ellipse(ex, eyeY, w * 0.05, h * 0.055, 0, 0, Math.PI * 2); ctx.fill();
    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(ex + w * 0.02, eyeY - h * 0.018, w * 0.018, 0, Math.PI * 2); ctx.fill();
  });

  // Nose — broad, prominent
  ctx.fillStyle = '#9a8c7a';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.38, y + h * 0.52);
  ctx.quadraticCurveTo(x + w * 0.35, y + h * 0.64, x + w * 0.32, y + h * 0.66);
  ctx.lineTo(x + w * 0.68, y + h * 0.66);
  ctx.quadraticCurveTo(x + w * 0.65, y + h * 0.64, x + w * 0.62, y + h * 0.52);
  ctx.closePath(); ctx.fill();
  // Nostrils
  ctx.fillStyle = '#5a4a38';
  ctx.beginPath(); ctx.ellipse(x + w * 0.37, y + h * 0.635, w * 0.04, h * 0.028, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + w * 0.63, y + h * 0.635, w * 0.04, h * 0.028, 0.3, 0, Math.PI * 2); ctx.fill();

  // Lips
  ctx.strokeStyle = '#5a4a38'; ctx.lineWidth = w * 0.04; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x + w * 0.30, y + h * 0.77); ctx.lineTo(x + w * 0.70, y + h * 0.77); ctx.stroke();

  // Chin groove
  ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = w * 0.025;
  ctx.beginPath(); ctx.moveTo(x + w * 0.25, y + h * 0.88); ctx.lineTo(x + w * 0.75, y + h * 0.88); ctx.stroke();

  // CONCRETE label
  if (label) {
    ctx.fillStyle = flash ? 'rgba(255,160,160,0.9)' : 'rgba(0,245,180,0.9)';
    ctx.font = `bold ${w * 0.155}px "Courier New", monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = flash ? '#ff8888' : '#00f5c8'; ctx.shadowBlur = 8;
    ctx.fillText('CONCRETE', x + w / 2, y + h * 0.925);
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}

// ─── DRAW OBSTACLE ───────────────────────────────────────────
function drawObstacle(ctx, x, y, frame) {
  const cx = x - OBS_W / 2, cy = y;

  ctx.save();
  // Red glow
  const og = ctx.createRadialGradient(x, y + OBS_H / 2, 2, x, y + OBS_H / 2, 40);
  og.addColorStop(0, 'rgba(255,60,60,0.35)'); og.addColorStop(1, 'transparent');
  ctx.fillStyle = og;
  ctx.beginPath(); ctx.arc(x, y + OBS_H / 2, 40, 0, Math.PI * 2); ctx.fill();

  // Jersey barrier shape
  ctx.beginPath();
  ctx.moveTo(cx + 6, cy);
  ctx.lineTo(cx + OBS_W - 6, cy);
  ctx.lineTo(cx + OBS_W, cy + OBS_H * 0.35);
  ctx.lineTo(cx + OBS_W - 2, cy + OBS_H);
  ctx.lineTo(cx + 2, cy + OBS_H);
  ctx.lineTo(cx, cy + OBS_H * 0.35);
  ctx.closePath();

  const bg = ctx.createLinearGradient(cx, cy, cx + OBS_W, cy + OBS_H);
  bg.addColorStop(0, '#ff5555');
  bg.addColorStop(0.4, '#cc2222');
  bg.addColorStop(1, '#881111');
  ctx.fillStyle = bg; ctx.fill();

  // Stripe clip
  ctx.save();
  ctx.clip();
  ctx.fillStyle = 'rgba(255,200,0,0.25)';
  for (let s = -2; s < 6; s++) {
    ctx.save(); ctx.translate(s * 16, 0);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(10, 0); ctx.lineTo(-2, OBS_H); ctx.lineTo(-12, OBS_H);
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  ctx.restore();

  // Edge glow
  ctx.strokeStyle = `rgba(255,${80 + Math.sin(frame * 0.15) * 40},80,0.8)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + 6, cy); ctx.lineTo(cx + OBS_W - 6, cy);
  ctx.lineTo(cx + OBS_W, cy + OBS_H * 0.35);
  ctx.lineTo(cx + OBS_W - 2, cy + OBS_H);
  ctx.lineTo(cx + 2, cy + OBS_H);
  ctx.lineTo(cx, cy + OBS_H * 0.35);
  ctx.closePath(); ctx.stroke();

  // Warning icon
  ctx.fillStyle = '#fff'; ctx.font = `bold ${OBS_H * 0.65}px serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = '#ff4444'; ctx.shadowBlur = 10;
  ctx.fillText('⚠', x, y + OBS_H * 0.52);
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ─── DRAW COIN ────────────────────────────────────────────────
function drawCoin(ctx, x, y, frame) {
  const pulse = Math.sin(frame * 0.12 + x) * 2.5;
  ctx.save();
  ctx.translate(x, y);

  // Outer halo
  const halo = ctx.createRadialGradient(0, 0, 4, 0, 0, COIN_R * 2.2 + pulse);
  halo.addColorStop(0, 'rgba(0,245,180,0.35)'); halo.addColorStop(1, 'transparent');
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(0, 0, COIN_R * 2.2 + pulse, 0, Math.PI * 2); ctx.fill();

  // Coin body
  const cg = ctx.createRadialGradient(-COIN_R * 0.3, -COIN_R * 0.3, 1, 0, 0, COIN_R);
  cg.addColorStop(0, '#80fff0'); cg.addColorStop(0.5, '#00f5c8'); cg.addColorStop(1, '#007a64');
  ctx.fillStyle = cg;
  ctx.beginPath(); ctx.arc(0, 0, COIN_R, 0, Math.PI * 2); ctx.fill();

  // Rim
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, 0, COIN_R, 0, Math.PI * 2); ctx.stroke();

  // Hexagon emblem
  ctx.fillStyle = '#003d30'; ctx.font = `bold ${COIN_R * 1.1}px "Courier New"`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = '#00f5c8'; ctx.shadowBlur = 6;
  ctx.fillText('⬡', 0, 1);
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ─── BACKGROUND ───────────────────────────────────────────────
function drawBG(ctx, frame, scrollY) {
  // Deep space bg
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#03030a');
  sky.addColorStop(0.5, '#080818');
  sky.addColorStop(1, '#0d0d1a');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

  // Stars with parallax
  for (let i = 0; i < 60; i++) {
    const sx = ((i * 97 + 23) % W);
    const sy = ((i * 137 + 17 + scrollY * 0.3) % (H * 0.55));
    const blink = 0.4 + Math.sin(frame * 0.05 + i * 1.3) * 0.3;
    const sz = i % 5 === 0 ? 1.8 : i % 3 === 0 ? 1.2 : 0.7;
    ctx.fillStyle = `rgba(255,255,255,${blink})`;
    ctx.beginPath(); ctx.arc(sx, sy, sz, 0, Math.PI * 2); ctx.fill();
  }

  // City skyline layers
  const buildingConfigs = [
    // Back layer (faded)
    { color: '#0c0c18', opacity: 0.7, buildings: [[0,120,55,180],[60,90,40,210],[108,140,60,160],[175,75,45,225],[228,110,50,190],[285,60,55,240],[348,95,45,205],[400,130,55,170]] },
    // Mid layer
    { color: '#0f0f20', opacity: 0.9, buildings: [[15,100,35,200],[55,70,45,230],[108,115,40,185],[156,55,50,245],[215,85,45,215],[268,45,55,255],[330,75,40,225],[378,105,50,195]] },
  ];

  buildingConfigs.forEach(({ color, opacity, buildings }) => {
    ctx.save(); ctx.globalAlpha = opacity;
    buildings.forEach(([bx, bh, bw, by]) => {
      ctx.fillStyle = color;
      ctx.fillRect(bx, by, bw, H * 0.56 - by);
      // Windows
      for (let wy = by + 10; wy < H * 0.53; wy += 16) {
        for (let wx = bx + 5; wx < bx + bw - 5; wx += 12) {
          const lit = Math.sin(frame * 0.008 + wx + wy) > 0.3;
          if (lit) {
            ctx.fillStyle = 'rgba(0,245,180,0.15)';
            ctx.fillRect(wx, wy, 6, 8);
          }
        }
      }
    });
    ctx.restore();
  });

  // Horizon mega-glow
  const hg = ctx.createRadialGradient(W / 2, H * 0.56, 0, W / 2, H * 0.56, 280);
  hg.addColorStop(0, 'rgba(0,245,180,0.18)');
  hg.addColorStop(0.4, 'rgba(0,180,140,0.06)');
  hg.addColorStop(1, 'transparent');
  ctx.fillStyle = hg; ctx.fillRect(0, H * 0.3, W, H * 0.5);

  // Ground plane
  const gnd = ctx.createLinearGradient(0, H * 0.56, 0, H);
  gnd.addColorStop(0, '#0a0a18'); gnd.addColorStop(1, '#050510');
  ctx.fillStyle = gnd; ctx.fillRect(0, H * 0.56, W, H * 0.44);

  // Lane perspective
  const laneBounds = [0, 150, 270, W];
  for (let l = 0; l < 3; l++) {
    const lx1 = VP.x + (laneBounds[l] - VP.x) * 0.12;
    const lx2 = VP.x + (laneBounds[l + 1] - VP.x) * 0.12;
    ctx.beginPath();
    ctx.moveTo(lx1, VP.y); ctx.lineTo(lx2, VP.y);
    ctx.lineTo(laneBounds[l + 1], H); ctx.lineTo(laneBounds[l], H);
    ctx.closePath();
    const lg = ctx.createLinearGradient(0, VP.y, 0, H);
    lg.addColorStop(0, l === 1 ? 'rgba(0,245,180,0.07)' : 'rgba(0,245,180,0.03)');
    lg.addColorStop(1, l === 1 ? 'rgba(0,245,180,0.14)' : 'rgba(0,245,180,0.06)');
    ctx.fillStyle = lg; ctx.fill();
  }

  // Lane lines
  for (let l = 0; l < 4; l++) {
    const vx = VP.x + (laneBounds[l] - VP.x) * 0.12;
    ctx.beginPath();
    ctx.moveTo(vx, VP.y); ctx.lineTo(laneBounds[l], H);
    ctx.strokeStyle = 'rgba(0,245,180,0.22)'; ctx.lineWidth = l === 0 || l === 3 ? 2 : 1.5;
    ctx.stroke();
  }

  // Scrolling road markings
  const dashCount = 12;
  for (let ln = 0; ln < 2; ln++) {
    for (let i = 0; i < dashCount; i++) {
      const t = ((i / dashCount) + (scrollY * 0.006)) % 1;
      const cy2 = VP.y + t * (H - VP.y);
      const prog = (cy2 - VP.y) / (H - VP.y);
      const ex = VP.x + (laneBounds[ln + 1] - VP.x) * (1 - (1 - prog) * 0.88);
      const dashH = prog * 22 + 3;
      const dashW = prog * 3 + 1;
      ctx.fillStyle = `rgba(0,245,180,${prog * 0.55})`;
      ctx.fillRect(ex - dashW / 2, cy2, dashW, dashH);
    }
  }

  // Lane center dots (near field)
  for (let l = 0; l < 3; l++) {
    const dotX = LANES[l];
    for (let i = 0; i < 5; i++) {
      const t = ((i / 5) + (scrollY * 0.009)) % 1;
      const dotY = VP.y + t * (H - VP.y);
      const prog = (dotY - VP.y) / (H - VP.y);
      const r = prog * 3 + 1;
      ctx.fillStyle = `rgba(0,245,180,${prog * 0.2})`;
      ctx.beginPath(); ctx.arc(dotX, dotY, r, 0, Math.PI * 2); ctx.fill();
    }
  }
}

// ─── HUD ──────────────────────────────────────────────────────
function drawHUD(ctx, score, coins, speed, combo, frame) {
  // Top gradient
  const tg = ctx.createLinearGradient(0, 0, 0, 72);
  tg.addColorStop(0, 'rgba(3,3,12,0.92)'); tg.addColorStop(1, 'transparent');
  ctx.fillStyle = tg; ctx.fillRect(0, 0, W, 72);

  // Score
  ctx.fillStyle = '#00f5c8';
  ctx.font = `900 26px "Courier New", monospace`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.shadowColor = '#00f5c8'; ctx.shadowBlur = 12;
  ctx.fillText(score.toLocaleString(), 18, 12);
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(0,245,180,0.45)';
  ctx.font = `700 9px "Courier New", monospace`;
  ctx.letterSpacing = '2px';
  ctx.fillText('SCORE', 18, 42);

  // Coin/points
  ctx.fillStyle = '#ffd700';
  ctx.font = `900 20px "Courier New", monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 10;
  ctx.fillText(`⬡ ${coins}`, W / 2, 14);
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,215,0,0.45)';
  ctx.font = `700 9px "Courier New", monospace`;
  ctx.fillText('POINTS', W / 2, 40);

  // Speed
  ctx.fillStyle = combo > 1 ? '#fb923c' : 'rgba(255,255,255,0.5)';
  ctx.font = `700 13px "Courier New", monospace`;
  ctx.textAlign = 'right'; ctx.textBaseline = 'top';
  ctx.fillText(`x${speed.toFixed(1)}`, W - 18, 14);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = `700 9px "Courier New", monospace`;
  ctx.fillText('SPEED', W - 18, 34);

  // Combo indicator
  if (combo > 1) {
    const pulse = Math.sin(frame * 0.2) * 0.15 + 0.85;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#fb923c';
    ctx.font = `900 12px "Courier New"`;
    ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.shadowColor = '#fb923c'; ctx.shadowBlur = 15;
    ctx.fillText(`🔥 COMBO x${combo}`, W - 18, 52);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // app.concrete.xyz tag
  ctx.fillStyle = 'rgba(0,245,180,0.22)';
  ctx.font = `700 8px "Courier New"`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('APP.CONCRETE.XYZ', W / 2, 56);
}

// ─── SCREEN SHAKE ─────────────────────────────────────────────
function applyShake(ctx, intensity) {
  if (intensity <= 0) return;
  ctx.translate((Math.random() - 0.5) * intensity, (Math.random() - 0.5) * intensity);
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function ConcreteRunPremium() {
  const canvasRef = useRef(null);
  const gameRef = useRef({
    state: 'start', // 'start' | 'running' | 'dead'
    score: 0, coins: 0, lane: 1, targetLane: 1,
    px: LANES[1], py: H - 120,
    obstacles: [], coinObjs: [], particles: [],
    speed: 4.5, frame: 0, scrollY: 0,
    bobble: 0, trail: [],
    combo: 1, lastCoinFrame: -999,
    shake: 0, flash: false, flashTimer: 0,
    deathTilt: 0,
  });
  const rafRef = useRef(null);
  const [uiScore, setUiScore] = useState(0);
  const [uiCoins, setUiCoins] = useState(0);

  const startGame = useCallback(() => {
    const g = gameRef.current;
    g.state = 'running'; g.score = 0; g.coins = 0;
    g.lane = 1; g.targetLane = 1; g.px = LANES[1]; g.py = H - 120;
    g.obstacles = []; g.coinObjs = []; g.particles = [];
    g.speed = 4.5; g.frame = 0; g.scrollY = 0;
    g.bobble = 0; g.trail = []; g.combo = 1;
    g.lastCoinFrame = -999; g.shake = 0; g.flash = false; g.flashTimer = 0; g.deathTilt = 0;
    setUiScore(0); setUiCoins(0);
  }, []);

  const moveLeft = useCallback(() => {
    const g = gameRef.current;
    if (g.state !== 'running') return;
    if (g.targetLane > 0) g.targetLane--;
  }, []);

  const moveRight = useCallback(() => {
    const g = gameRef.current;
    if (g.state !== 'running') return;
    if (g.targetLane < 2) g.targetLane++;
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); moveLeft(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); moveRight(); }
      if ((e.key === ' ' || e.key === 'Enter') && gameRef.current.state !== 'running') startGame();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moveLeft, moveRight, startGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let touchStartX = null, touchStartY = null;

    const onTouchStart = (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };
    const onTouchEnd = (e) => {
      if (touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 25) {
        if (dx < 0) moveLeft(); else moveRight();
      } else if (gameRef.current.state !== 'running') {
        startGame();
      }
      touchStartX = null;
    };
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd, { passive: true });

    // ─── GAME LOOP ──────────────────────────────────────────
    function loop() {
      const g = gameRef.current;
      g.frame++;
      g.scrollY += g.state === 'running' ? g.speed : 0;

      ctx.save();
      ctx.clearRect(0, 0, W, H);

      // Screen shake
      if (g.shake > 0) { applyShake(ctx, g.shake); g.shake *= 0.75; if (g.shake < 0.5) g.shake = 0; }

      drawBG(ctx, g.frame, g.scrollY);

      // ── START SCREEN ──
      if (g.state === 'start') {
        // Animate a demo moai
        const bob = Math.sin(g.frame * 0.04) * 6;
        drawMoai(ctx, W / 2 - 50, H * 0.22 + bob, 100, 115, g.frame);

        // Title
        ctx.save();
        const tg2 = ctx.createLinearGradient(0, H * 0.44, 0, H * 0.54);
        tg2.addColorStop(0, '#00f5c8'); tg2.addColorStop(1, '#00a888');
        ctx.fillStyle = tg2;
        ctx.font = `900 42px "Courier New", monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = '#00f5c8'; ctx.shadowBlur = 28;
        ctx.fillText('CONCRETE', W / 2, H * 0.47);
        ctx.fillText('RUN', W / 2, H * 0.535);
        ctx.shadowBlur = 0;
        ctx.restore();

        ctx.fillStyle = 'rgba(0,245,180,0.5)';
        ctx.font = `700 10px "Courier New"`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('APP.CONCRETE.XYZ  ·  POINTS.CONCRETE.XYZ', W / 2, H * 0.60);

        // Pulse button
        const bp = Math.sin(g.frame * 0.07) * 5;
        ctx.save();
        ctx.shadowColor = '#00f5c8'; ctx.shadowBlur = 20 + bp;
        const btn = ctx.createLinearGradient(W / 2 - 110, 0, W / 2 + 110, 0);
        btn.addColorStop(0, '#00f5c8'); btn.addColorStop(1, '#00a888');
        ctx.fillStyle = btn;
        ctx.beginPath(); ctx.roundRect(W / 2 - 110, H * 0.67 - bp / 2, 220, 52 + bp, 26); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#002a20';
        ctx.font = `900 16px "Courier New"`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🗿  TAP TO RUN', W / 2, H * 0.67 + 26 + bp * 0.1);
        ctx.restore();

        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.font = `700 11px "Courier New"`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('← SWIPE TO DODGE →', W / 2, H * 0.80);

        ctx.restore();
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // ── DEAD SCREEN ──
      if (g.state === 'dead') {
        g.deathTilt = Math.min(g.deathTilt + 0.04, 0.45);

        // Show tilted fallen moai
        ctx.save();
        ctx.translate(W / 2, H * 0.32);
        ctx.rotate(g.deathTilt * 1.2);
        ctx.translate(-W / 2, -H * 0.32);
        drawMoai(ctx, W / 2 - 52, H * 0.22, 104, 118, g.frame, { flash: true, glow: true });
        ctx.restore();

        // Overlay
        const dov = ctx.createLinearGradient(0, H * 0.45, 0, H);
        dov.addColorStop(0, 'transparent'); dov.addColorStop(0.2, 'rgba(3,3,12,0.92)');
        ctx.fillStyle = dov; ctx.fillRect(0, 0, W, H);

        ctx.save();
        ctx.fillStyle = '#ff4455';
        ctx.font = `900 38px "Courier New"`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = '#ff2233'; ctx.shadowBlur = 25;
        ctx.fillText('WIPED OUT', W / 2, H * 0.56);
        ctx.shadowBlur = 0;
        ctx.restore();

        ctx.fillStyle = '#00f5c8';
        ctx.font = `900 22px "Courier New"`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = '#00f5c8'; ctx.shadowBlur = 12;
        ctx.fillText(g.score.toLocaleString(), W / 2, H * 0.635);
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(0,245,180,0.4)'; ctx.font = `700 10px "Courier New"`;
        ctx.fillText('FINAL SCORE', W / 2, H * 0.675);

        ctx.fillStyle = '#ffd700';
        ctx.font = `700 18px "Courier New"`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`⬡  ${g.coins} POINTS`, W / 2, H * 0.72);

        ctx.fillStyle = 'rgba(0,245,180,0.35)';
        ctx.font = `700 9px "Courier New"`;
        ctx.fillText('CLAIM REWARDS AT POINTS.CONCRETE.XYZ', W / 2, H * 0.755);

        const bp2 = Math.sin(g.frame * 0.09) * 4;
        ctx.save();
        ctx.shadowColor = '#00f5c8'; ctx.shadowBlur = 18;
        const btn2 = ctx.createLinearGradient(W / 2 - 100, 0, W / 2 + 100, 0);
        btn2.addColorStop(0, '#00f5c8'); btn2.addColorStop(1, '#00a888');
        ctx.fillStyle = btn2;
        ctx.beginPath(); ctx.roundRect(W / 2 - 100, H * 0.80 - bp2 / 2, 200, 48 + bp2, 24); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#002a20'; ctx.font = `900 14px "Courier New"`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🗿  RUN AGAIN', W / 2, H * 0.80 + 24 + bp2 * 0.1);
        ctx.restore();

        ctx.restore();
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // ── RUNNING ──
      // Smooth player X
      g.px += (LANES[g.targetLane] - g.px) * 0.2;
      g.bobble += 0.13;
      g.speed = 4.5 + Math.floor(g.score / 300) * 0.4;
      g.score++;
      if (g.score % 60 === 0) setUiScore(g.score);

      // Flash timer
      if (g.flashTimer > 0) g.flashTimer--;

      // Spawn obstacles
      const spawnInterval = Math.max(48, 85 - Math.floor(g.score / 150) * 3);
      if (g.frame % spawnInterval === 0) {
        const lane = Math.floor(Math.random() * 3);
        g.obstacles.push({ x: LANES[lane], y: -OBS_H - 20, lane });
      }

      // Spawn coins (clusters)
      if (g.frame % 38 === 0) {
        const lane = Math.floor(Math.random() * 3);
        const count = Math.random() > 0.6 ? 3 : 1;
        for (let ci = 0; ci < count; ci++) {
          g.coinObjs.push({ x: LANES[lane], y: -COIN_R * 2 - ci * 45 });
        }
      }

      // Move obstacles
      g.obstacles = g.obstacles.filter(o => { o.y += g.speed; return o.y < H + 60; });

      // Move coins
      g.coinObjs = g.coinObjs.filter(c => { c.y += g.speed; return c.y < H + 40; });

      // Move particles
      g.particles = g.particles.filter(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.life -= 0.028; return p.life > 0;
      });

      // Collision detection
      const pcx = g.px, pcy = g.py + PLAYER_H / 2;
      let died = false;
      for (const o of g.obstacles) {
        const dx = Math.abs(pcx - o.x);
        const dy = Math.abs(pcy - (o.y + OBS_H / 2));
        if (dx < 30 && dy < 34) {
          died = true;
          g.shake = 18;
          // Death particles
          for (let pi = 0; pi < 20; pi++) g.particles.push(mkParticle(g.px, g.py + PLAYER_H / 2, '#ff4444'));
          break;
        }
      }

      // Coin collection
      let coinCollected = false;
      g.coinObjs = g.coinObjs.filter(c => {
        const dx2 = Math.abs(pcx - c.x);
        const dy2 = Math.abs(pcy - c.y);
        if (dx2 < 28 && dy2 < 28) {
          g.coins += 10;
          coinCollected = true;
          // Coin particles
          for (let pi = 0; pi < 8; pi++) g.particles.push(mkParticle(c.x, c.y, '#00f5c8'));
          return false;
        }
        return true;
      });

      if (coinCollected) {
        if (g.frame - g.lastCoinFrame < 90) g.combo = Math.min(g.combo + 1, 8);
        else g.combo = 1;
        g.lastCoinFrame = g.frame;
        setUiCoins(g.coins);
      } else if (g.frame - g.lastCoinFrame > 120) {
        g.combo = 1;
      }

      // Player trail
      const bob = Math.sin(g.bobble) * 4;
      g.trail.push({ x: g.px, y: g.py + bob, a: 0.45 });
      if (g.trail.length > 10) g.trail.shift();

      // Draw trail
      g.trail.forEach((t, ti) => {
        const prog = ti / g.trail.length;
        ctx.save(); ctx.globalAlpha = prog * t.a * 0.35;
        ctx.fillStyle = '#00f5c8';
        ctx.beginPath(); ctx.ellipse(t.x, t.y + PLAYER_H * 0.55, PLAYER_W * 0.38 * prog, PLAYER_H * 0.1 * prog, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });

      // Draw game objects
      g.coinObjs.forEach(c => drawCoin(ctx, c.x, c.y, g.frame));
      g.obstacles.forEach(o => drawObstacle(ctx, o.x, o.y, g.frame));

      // Draw particles
      g.particles.forEach(p => {
        ctx.save(); ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.vy * 0 + p.x * 0, p.size * p.life, 0, Math.PI * 2);
        // fixed
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });

      // Draw player moai
      drawMoai(ctx, g.px - PLAYER_W / 2, g.py + bob, PLAYER_W, PLAYER_H, g.frame, {
        glow: true, label: true, flash: g.flashTimer > 0
      });

      drawHUD(ctx, g.score, g.coins, g.speed, g.combo, g.frame);

      if (died) { g.state = 'dead'; g.lane = 1; }

      ctx.restore();
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [moveLeft, moveRight, startGame]);

  const handleClick = () => {
    if (gameRef.current.state !== 'running') startGame();
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#02020a',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Courier New", monospace',
    }}>
      {/* Ambient bg */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(0,245,180,0.04) 0%, transparent 65%)', pointerEvents: 'none' }} />

      <canvas ref={canvasRef} width={W} height={H} onClick={handleClick}
        style={{
          borderRadius: 20,
          border: '1px solid rgba(0,245,180,0.18)',
          boxShadow: '0 0 80px rgba(0,245,180,0.12), 0 0 200px rgba(0,0,0,0.9), inset 0 0 60px rgba(0,0,0,0.5)',
          cursor: 'pointer', touchAction: 'none',
          maxWidth: '100vw', maxHeight: '95vh',
          display: 'block',
        }}
      />

      {/* Footer links */}
      <div style={{ display: 'flex', gap: 28, marginTop: 18 }}>
        {[
          { href: 'https://app.concrete.xyz', label: 'app.concrete.xyz', color: '#00f5c8' },
          { href: 'https://points.concrete.xyz', label: '⬡ points.concrete.xyz', color: '#ffd700' },
        ].map(({ href, label, color }) => (
          <a key={href} href={href} target="_blank" rel="noopener noreferrer" style={{
            color, fontSize: 11, opacity: 0.55, textDecoration: 'none',
            letterSpacing: 1, fontFamily: '"Courier New", monospace',
            transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => e.target.style.opacity = '1'}
            onMouseLeave={e => e.target.style.opacity = '0.55'}
          >{label}</a>
        ))}
      </div>
    </div>
  );
}
