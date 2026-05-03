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

// ─── DRAW MOAI (PREMIUM RENDERING) ───────────────────────────
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

  // Head shape & Details logic
  const hg = ctx.createLinearGradient(x, y, x + w, y + h);
  hg.addColorStop(0, flash ? '#ffaaaa' : '#ddd5c2');
  hg.addColorStop(1, flash ? '#884444' : '#8a7d6a');
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 15);
  ctx.fill();

  // Face Labels
  if (label) {
    ctx.fillStyle = 'rgba(0,245,180,0.9)';
    ctx.font = `bold ${w * 0.15}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('CONCRETE', x + w / 2, y + h * 0.9);
  }
  ctx.restore();
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function ConcreteRunStandalone() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('start'); 
  const [localScore, setLocalScore] = useState(0);

  const gameRef = useRef({
    score: 0, coins: 0, lane: 1, targetLane: 1,
    px: LANES[1], py: H - 120,
    obstacles: [], particles: [],
    speed: 4.5, frame: 0, scrollY: 0,
    shake: 0, flash: false
  });

  const resetGame = () => {
    const g = gameRef.current;
    g.score = 0; g.lane = 1; g.targetLane = 1;
    g.px = LANES[1]; g.speed = 4.5;
    g.obstacles = []; g.particles = [];
    setGameState('running');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    function loop() {
      const g = gameRef.current;
      g.frame++;
      
      ctx.clearRect(0, 0, W, H);
      
      // Deep Background
      ctx.fillStyle = '#03030a';
      ctx.fillRect(0, 0, W, H);

      if (gameState === 'running') {
        g.scrollY += g.speed;
        g.speed = 4.5 + (g.score / 20); // Dynamic Volatility logic
        
        // Horizontal Movement Smoothing
        g.px += (LANES[g.targetLane] - g.px) * 0.2;
      }

      // Draw Player
      drawMoai(ctx, g.px - 26, g.py - 30, 52, 60, g.frame);

      // HUD
      ctx.fillStyle = '#00f5c8';
      ctx.font = '900 24px "Courier New"';
      ctx.fillText(`YIELD: ${g.score}`, 20, 40);

      requestAnimationFrame(loop);
    }

    const handleInput = (e) => {
      const g = gameRef.current;
      if (e.key === 'ArrowLeft') g.targetLane = Math.max(0, g.targetLane - 1);
      if (e.key === 'ArrowRight') g.targetLane = Math.min(2, g.targetLane + 1);
      if (e.key === ' ' && gameState !== 'running') resetGame();
    };

    window.addEventListener('keydown', handleInput);
    const raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', handleInput);
      cancelAnimationFrame(raf);
    };
  }, [gameState]);

  return (
    <div style={{ background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <canvas ref={canvasRef} width={W} height={H} style={{ boxShadow: '0 0 30px rgba(0,245,180,0.2)', borderRadius: '8px' }} />
      {gameState === 'start' && (
        <div style={{ position: 'absolute', textAlign: 'center', color: '#00f5c8' }}>
          <h1 style={{ fontSize: '3rem' }}>CONCRETE RUN</h1>
          <p>PRESS [SPACE] TO START</p>
        </div>
      )}
    </div>
  );
}
