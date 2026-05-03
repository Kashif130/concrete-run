'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

// ─── CONSTANTS ───────────────────────────────────────────────
const W = 420, H = 700;
const LANES = [90, 210, 330];
const PLAYER_W = 52, PLAYER_H = 60;

export default function ConcreteRunPremium() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('start');
  const [uiScore, setUiScore] = useState(0);

  const gameRef = useRef({
    px: LANES[1], py: H - 120, targetLane: 1,
    obstacles: [], speed: 5, frame: 0, scrollY: 0,
    score: 0, shake: 0
  });

  // ─── RESET GAME ─────────────────────────────────────────────
  const startGame = useCallback(() => {
    const g = gameRef.current;
    g.score = 0; g.targetLane = 1; g.px = LANES[1];
    g.obstacles = []; g.speed = 5; g.frame = 0;
    setGameState('running');
    setUiScore(0);
  }, []);

  // ─── INPUTS ─────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      const g = gameRef.current;
      if (e.key === 'ArrowLeft') g.targetLane = Math.max(0, g.targetLane - 1);
      if (e.key === 'ArrowRight') g.targetLane = Math.min(2, g.targetLane + 1);
      if ((e.key === ' ' || e.key === 'Enter') && gameRef.current.state !== 'running') startGame();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [startGame]);

  // ─── ENGINE ─────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf;

    function loop() {
      const g = gameRef.current;
      g.frame++;
      
      // 1. UPDATE LOGIC
      if (gameState === 'running') {
        g.scrollY += g.speed;
        // Smooth Movement
        g.px += (LANES[g.targetLane] - g.px) * 0.15;

        // Spawn Obstacles
        if (g.frame % 60 === 0) {
          g.obstacles.push({ x: LANES[Math.floor(Math.random() * 3)], y: -100 });
        }

        // Move & Check Collisions
        g.obstacles.forEach((obs, i) => {
          obs.y += g.speed;
          
          // Collision Check
          if (Math.abs(g.px - obs.x) < 40 && Math.abs(g.py - obs.y) < 50) {
            setGameState('dead');
          }

          // Clean up & Score
          if (obs.y > H) {
            g.obstacles.splice(i, 1);
            g.score += 10;
            setUiScore(g.score);
            g.speed += 0.05; // Difficulty scaling
          }
        });
      }

      // 2. DRAWING (Premium Visuals)
      ctx.clearRect(0, 0, W, H);
      
      // Background (Cyber-Brutalist Space)
      ctx.fillStyle = '#03030a';
      ctx.fillRect(0, 0, W, H);
      
      // Draw Road/Lanes
      ctx.strokeStyle = 'rgba(0, 245, 180, 0.2)';
      LANES.forEach(l => {
        ctx.beginPath(); ctx.moveTo(l, 0); ctx.lineTo(l, H); ctx.stroke();
      });

      // Draw Player 🗿
      ctx.save();
      ctx.font = '60px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Glow effect
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 15;
      ctx.fillText('🗿', g.px, g.py);
      ctx.restore();

      // Draw Obstacles 🔴 (Volatility)
      g.obstacles.forEach(obs => {
        ctx.font = '45px serif';
        ctx.fillText('🔴', obs.x, obs.y);
      });

      // UI Text
      if (gameState === 'running') {
        ctx.fillStyle = '#00f5ff';
        ctx.font = 'bold 20px "Courier New"';
        ctx.fillText(`YIELD: ${g.score}`, 20, 40);
      }

      raf = requestAnimationFrame(loop);
    }

    loop();
    return () => cancelAnimationFrame(raf);
  }, [gameState]);

  return (
    <div style={{ background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <canvas 
        ref={canvasRef} 
        width={W} height={H} 
        style={{ border: '2px solid #333', borderRadius: '12px', boxShadow: '0 0 40px rgba(0, 245, 255, 0.1)' }} 
      />
      
      {gameState !== 'running' && (
        <div style={{ position: 'absolute', background: 'rgba(0,0,0,0.9)', padding: '40px', textAlign: 'center', border: '1px solid #00f5ff', color: '#fff', borderRadius: '15px' }}>
          <h1 style={{ fontSize: '32px', color: '#00f5ff' }}>{gameState === 'start' ? 'CONCRETE RUN' : 'LIQUIDATED'}</h1>
          <p style={{ margin: '15px 0' }}>{gameState === 'start' ? 'Protect the Moai' : `Final Yield: ${uiScore}`}</p>
          <button 
            onClick={startGame}
            style={{ padding: '12px 24px', background: '#00f5ff', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
          >
            START MISSION
          </button>
        </div>
      )}
    </div>
  );
}
