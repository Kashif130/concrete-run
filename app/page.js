'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

// ─── SETTINGS ───────────────────────────────────────────────
const W = 420, H = 700;
const LANES = [90, 210, 330];
const PLAYER_SIZE = 60;

export default function ConcreteRunMoai() {
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
      if ((e.key === ' ' || e.key === 'Enter') && game.current.state !== 'running') reset();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [reset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;

    function loop() {
      const g = game.current;
      g.frame++;

      if (gameState === 'running') {
        g.scrollY += g.speed;
        // Smooth Movement Logic
        g.px += (LANES[g.targetLane] - g.px) * 0.15;

        // Obstacle Spawning
        if (g.frame % 60 === 0) {
          g.obstacles.push({ x: LANES[Math.floor(Math.random() * 3)], y: -100 });
        }

        g.obstacles.forEach((obs, i) => {
          obs.y += g.speed;
          // Collision Check
          if (Math.abs(g.px - obs.x) < 40 && Math.abs(g.py - obs.y) < 50) {
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

      // ─── RENDERING ───
      ctx.fillStyle = '#03030a'; // Deep background
      ctx.fillRect(0, 0, W, H);

      // Stars/Parallax Effect
      for(let i=0; i<30; i++) {
        let sx = (i * 137) % W;
        let sy = (i * 543 + g.scrollY * 0.2) % H;
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(sx, sy, 2, 2);
      }

      // Draw Lanes
      ctx.strokeStyle = 'rgba(0, 245, 180, 0.15)';
      LANES.forEach(l => {
        ctx.beginPath(); ctx.moveTo(l, 0); ctx.lineTo(l, H); ctx.stroke();
      });

      // ─── CHARACTER 🗿 SETTINGS ───
      ctx.save();
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 20;
      ctx.font = '60px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🗿', g.px, g.py);
      ctx.restore();

      // Draw Obstacles
      g.obstacles.forEach(obs => {
        ctx.font = '40px serif';
        ctx.fillText('🔴', obs.x, obs.y);
      });

      // Score HUD
      ctx.fillStyle = '#00f5ff';
      ctx.font = '900 22px monospace';
      ctx.fillText(`YIELD: ${g.score}`, 20, 40);

      raf = requestAnimationFrame(loop);
    }
    loop();
    return () => cancelAnimationFrame(raf);
  }, [gameState]);

  return (
    <div style={{ background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <canvas ref={canvasRef} width={W} height={H} style={{ border: '2px solid #333', borderRadius: '15px' }} />
      {gameState !== 'running' && (
        <div style={{ position: 'absolute', background: 'rgba(0,0,0,0.9)', padding: '40px', textAlign: 'center', border: '1px solid #00f5ff', color: '#fff', borderRadius: '10px' }}>
          <h1 style={{ color: '#00f5ff' }}>{gameState === 'start' ? 'CONCRETE RUN' : 'LIQUIDATED'}</h1>
          <button onClick={reset} style={{ padding: '12px 24px', background: '#00f5ff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>START MISSION</button>
        </div>
      )}
    </div>
  );
}
