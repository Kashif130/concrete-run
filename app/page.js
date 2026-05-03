'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

// ─── CONSTANTS ───────────────────────────────────────────────
const W = 420, H = 700;
const LANES = [90, 210, 330];
const PLAYER_W = 52, PLAYER_H = 60;
const OBS_W = 56, OBS_H = 36;
const VP = { x: W / 2, y: H * 0.36 };

// ─── DRAW MOAI (THE HERO 🗿) ──────────────────────────────────
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

  // Eye sockets
  const eyeY = y + h * 0.42;
  const eyePositions = [x + w * 0.30, x + w * 0.70];
  eyePositions.forEach((ex) => {
    ctx.fillStyle = '#1a1208';
    ctx.beginPath(); ctx.ellipse(ex, eyeY, w * 0.06, h * 0.07, 0, 0, Math.PI * 2); ctx.fill();
  });

  // Nose
  ctx.fillStyle = '#9a8c7a';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.4, y + h * 0.52);
  ctx.lineTo(x + w * 0.35, y + h * 0.65);
  ctx.lineTo(x + w * 0.65, y + h * 0.65);
  ctx.lineTo(x + w * 0.6, y + h * 0.52);
  ctx.fill();

  // CONCRETE label
  if (label) {
    ctx.fillStyle = flash ? 'rgba(255,160,160,0.9)' : 'rgba(0,245,180,0.9)';
    ctx.font = `bold ${w * 0.155}px "Courier New", monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('CONCRETE', x + w / 2, y + h * 0.925);
  }
  ctx.restore();
}

// ─── DRAW OBSTACLE 🔴 ────────────────────────────────────────
function drawObstacle(ctx, x, y, frame) {
  ctx.save();
  // Red glow
  const og = ctx.createRadialGradient(x, y, 5, x, y, 40);
  og.addColorStop(0, 'rgba(255,60,60,0.4)');
  og.addColorStop(1, 'transparent');
  ctx.fillStyle = og;
  ctx.beginPath(); ctx.arc(x, y, 40, 0, Math.PI * 2); ctx.fill();

  // Red Sphere
  ctx.fillStyle = '#ff4444';
  ctx.font = '40px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🔴', x, y);
  ctx.restore();
}

// ─── BACKGROUND & GRID ───────────────────────────────────────
function drawBG(ctx, frame, scrollY) {
  ctx.fillStyle = '#03030a';
  ctx.fillRect(0, 0, W, H);

  // Road / Lanes
  ctx.strokeStyle = 'rgba(0, 245, 180, 0.15)';
  LANES.forEach(l => {
    ctx.beginPath(); ctx.moveTo(l, 0); ctx.lineTo(l, H); ctx.stroke();
  });

  // Scrolling stars
  for (let i = 0; i < 40; i++) {
    const sx = ((i * 137) % W);
    const sy = ((i * 543 + scrollY * 0.5) % H);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(sx, sy, 2, 2);
  }
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function ConcreteRunHero() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('start');
  const [score, setScore] = useState(0);

  const game = useRef({
    px: LANES[1], py: H - 120, targetLane: 1,
    obstacles: [], speed: 5, frame: 0, scrollY: 0,
    score: 0
  });

  const reset = useCallback(() => {
    game.current = { px: LANES[1], py: H - 120, targetLane: 1, obstacles: [], speed: 5, frame: 0, scrollY: 0, score: 0 };
    setScore(0);
    setGameState('running');
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') game.current.targetLane = Math.max(0, game.current.targetLane - 1);
      if (e.key === 'ArrowRight') game.current.targetLane = Math.min(2, game.current.targetLane + 1);
      if ((e.key === ' ' || e.key === 'Enter') && gameState !== 'running') reset();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState, reset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf;

    function loop() {
      const g = game.current;
      g.frame++;

      if (gameState === 'running') {
        g.scrollY += g.speed;
        g.px += (LANES[g.targetLane] - g.px) * 0.15; // Smooth slide

        if (g.frame % 60 === 0) {
          g.obstacles.push({ x: LANES[Math.floor(Math.random() * 3)], y: -100 });
        }

        g.obstacles.forEach((obs, i) => {
          obs.y += g.speed;
          // Collision Check
          if (Math.abs(g.px - obs.x) < 40 && Math.abs(g.py - obs.y) < 45) {
            setGameState('gameover');
          }
          if (obs.y > H) {
            g.obstacles.splice(i, 1);
            g.score += 10;
            setScore(g.score);
            g.speed += 0.05;
          }
        });
      }

      ctx.clearRect(0, 0, W, H);
      drawBG(ctx, g.frame, g.scrollY);

      // Draw Hero 🗿
      const tilt = (LANES[g.targetLane] - g.px) * 0.005;
      drawMoai(ctx, g.px - 26, g.py - 30, 52, 60, g.frame, { tilt });

      // Draw Obstacles
      g.obstacles.forEach(obs => drawObstacle(ctx, obs.x, obs.y, g.frame));

      // HUD
      ctx.fillStyle = '#00f5c8';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`YIELD: ${g.score}`, 20, 40);

      raf = requestAnimationFrame(loop);
    }
    loop();
    return () => cancelAnimationFrame(raf);
  }, [gameState]);

  return (
    <div style={{ background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <canvas ref={canvasRef} width={W} height={H} style={{ border: '1px solid #333', borderRadius: '15px' }} />
      {gameState !== 'running' && (
        <div style={{ position: 'absolute', textAlign: 'center', background: 'rgba(0,0,0,0.9)', padding: '40px', border: '1px solid #00f5ff', color: '#fff' }}>
          <h1 style={{ color: '#00f5ff' }}>{gameState === 'start' ? 'CONCRETE RUN' : 'LIQUIDATED'}</h1>
          <button onClick={reset} style={{ background: '#00f5ff', border: 'none', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer' }}>
            START MISSION
          </button>
        </div>
      )}
    </div>
  );
}
