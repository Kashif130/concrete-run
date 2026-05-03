'use client';
import { useEffect, useRef, useState } from 'react';

const W = 420, H = 700;
const LANES = [90, 210, 330];

export default function ConcreteRunPro() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('start');
  const [score, setScore] = useState(0);

  const game = useRef({
    px: LANES[1], // Player X
    py: H - 120,   // Player Y (Fixed)
    targetLane: 1,
    obstacles: [],
    speed: 5,
    frame: 0,
    score: 0
  });

  // Character Setting Logic
  const drawPlayer = (ctx, x, y) => {
    ctx.save();
    // Shadow nichey
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y + 10, 25, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Moai Character
    ctx.font = '60px serif'; // Size thora bara kiya hai
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Tilt effect movement ke waqt
    const tilt = (game.current.targetLane - (game.current.px === LANES[game.current.targetLane] ? game.current.targetLane : (game.current.px / 140))) * 0.2;
    ctx.translate(x, y);
    ctx.rotate(tilt);
    ctx.fillText('🗿', 0, 0);
    ctx.restore();
  };

  const reset = () => {
    game.current = { px: LANES[1], py: H - 120, targetLane: 1, obstacles: [], speed: 5, frame: 0, score: 0 };
    setScore(0);
    setGameState('running');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    function loop() {
      const g = game.current;
      g.frame++;

      if (gameState === 'running') {
        // Smooth horizontal movement (Interpolation)
        g.px += (LANES[g.targetLane] - g.px) * 0.15;

        // Obstacle logic
        if (g.frame % 50 === 0) {
          g.obstacles.push({ x: LANES[Math.floor(Math.random() * 3)], y: -50 });
        }

        g.obstacles.forEach((obs, i) => {
          obs.y += g.speed;
          
          // Accurate Collision (Hitbox set kiya hai)
          if (Math.abs(g.px - obs.x) < 45 && Math.abs(g.py - obs.y) < 45) {
            setGameState('gameover');
          }

          if (obs.y > H) {
            g.obstacles.splice(i, 1);
            g.score += 10;
            setScore(g.score);
            g.speed += 0.1;
          }
        });
      }

      // Drawing
      ctx.fillStyle = '#050510'; 
      ctx.fillRect(0, 0, W, H);

      // Roads
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.15)';
      ctx.setLineDash([10, 10]);
      LANES.forEach(l => {
        ctx.beginPath(); ctx.moveTo(l, 0); ctx.lineTo(l, H); ctx.stroke();
      });
      ctx.setLineDash([]);

      // Draw Character
      drawPlayer(ctx, g.px, g.py);

      // Draw Obstacles
      g.obstacles.forEach(obs => {
        ctx.font = '40px Arial';
        ctx.fillText('🔴', obs.x, obs.y); // Bad blocks
      });

      if (gameState === 'running') requestAnimationFrame(loop);
    }

    const handleInput = (e) => {
      if (e.key === 'ArrowLeft') game.current.targetLane = Math.max(0, game.current.targetLane - 1);
      if (e.key === 'ArrowRight') game.current.targetLane = Math.max(0, Math.min(2, game.current.targetLane + 1));
      if (e.key === ' ' && gameState !== 'running') reset();
    };

    window.addEventListener('keydown', handleInput);
    const raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('keydown', handleInput);
      cancelAnimationFrame(raf);
    };
  }, [gameState]);

  return (
    <div style={{ background: '#000', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#00f5ff', fontSize: '20px', fontFamily: 'monospace', marginBottom: '10px' }}>YIELD_LEVEL: {score}</div>
      <canvas ref={canvasRef} width={W} height={H} style={{ border: '1px solid #333', borderRadius: '15px', background: '#000' }} />
      
      {gameState !== 'running' && (
        <div style={{ position: 'absolute', textAlign: 'center', color: '#fff', background: 'rgba(0,0,0,0.9)', padding: '30px', border: '1px solid #00f5ff' }}>
          <h1 style={{ fontSize: '32px' }}>{gameState === 'start' ? 'CONCRETE RUN' : 'LIQUIDATED'}</h1>
          <button onClick={reset} style={{ padding: '10px 20px', background: '#00f5ff', cursor: 'pointer', border: 'none', fontWeight: 'bold' }}>START MISSION</button>
        </div>
      )}
    </div>
  );
}
