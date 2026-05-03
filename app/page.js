'use client';
import { useEffect, useRef, useState } from 'react';

const W = 420, H = 700;
const LANES = [90, 210, 330];

export default function GamePage() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('start');
  const [score, setScore] = useState(0);

  const game = useRef({
    px: LANES[1], targetLane: 1, py: H - 120,
    obstacles: [], speed: 5, frame: 0, score: 0
  });

  const reset = () => {
    game.current = { px: LANES[1], targetLane: 1, py: H - 120, obstacles: [], speed: 5, frame: 0, score: 0 };
    setScore(0);
    setGameState('running');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;

    function loop() {
      const g = game.current;
      g.frame++;

      if (gameState === 'running') {
        g.px += (LANES[g.targetLane] - g.px) * 0.15;

        if (g.frame % 60 === 0) {
          g.obstacles.push({ x: LANES[Math.floor(Math.random() * 3)], y: -50 });
        }

        g.obstacles.forEach((obs, i) => {
          obs.y += g.speed;
          if (Math.abs(g.px - obs.x) < 40 && Math.abs(g.py - obs.y) < 40) {
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

      // Render
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, W, H);

      // Draw Character 🗿
      ctx.font = '55px serif';
      ctx.textAlign = 'center';
      ctx.fillText('🗿', g.px, g.py);

      // Draw Obstacles 🔴
      g.obstacles.forEach(obs => {
        ctx.font = '40px serif';
        ctx.fillText('🔴', obs.x, obs.y);
      });

      animationFrameId = requestAnimationFrame(loop);
    }

    const handleInput = (e) => {
      if (e.key === 'ArrowLeft') game.current.targetLane = Math.max(0, game.current.targetLane - 1);
      if (e.key === 'ArrowRight') game.current.targetLane = Math.min(2, game.current.targetLane + 1);
      if (e.key === ' ' && gameState !== 'running') reset();
    };

    window.addEventListener('keydown', handleInput);
    loop();

    return () => {
      window.removeEventListener('keydown', handleInput);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState]);

  return (
    <div style={{ background: '#000', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#00f5ff', fontFamily: 'monospace' }}>
      <h2 style={{ marginBottom: 10 }}>YIELD: {score}</h2>
      <canvas ref={canvasRef} width={W} height={H} style={{ border: '2px solid #333', borderRadius: '10px' }} />
      
      {gameState !== 'running' && (
        <div style={{ position: 'absolute', background: 'rgba(0,0,0,0.9)', padding: '40px', border: '1px solid #00f5ff', textAlign: 'center' }}>
          <h1>{gameState === 'start' ? 'CONCRETE RUN' : 'LIQUIDATED'}</h1>
          <button onClick={reset} style={{ padding: '10px 20px', background: '#00f5ff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
            START MISSION
          </button>
        </div>
      )}
    </div>
  );
}
