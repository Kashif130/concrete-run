'use client';
import { useState, useEffect, useRef } from 'react';

const LEADERBOARD = [
  { rank: 1, name: 'CryptoMoai', score: 48920, points: 12400, games: 312, best: 48920 },
  { rank: 2, name: 'ConcreteKing', score: 41205, points: 9800, games: 245, best: 41205 },
  { rank: 3, name: 'BlockRunner', score: 38770, points: 8950, games: 198, best: 38770 },
  { rank: 4, name: 'MoaiMaxx', score: 31440, points: 7200, games: 167, best: 31440 },
  { rank: 5, name: 'StoneGod', score: 28330, points: 6100, games: 143, best: 28330 },
  { rank: 6, name: 'RunnerX', score: 24110, points: 5400, games: 121, best: 24110 },
  { rank: 7, name: 'Kashif130', score: 19850, points: 4200, games: 98, best: 19850 },
  { rank: 8, name: 'DeFiDash', score: 15620, points: 3100, games: 76, best: 15620 },
  { rank: 9, name: 'Web3Ghost', score: 12480, points: 2400, games: 54, best: 12480 },
  { rank: 10, name: 'ConcreteFan', score: 9340, points: 1800, games: 41, best: 9340 },
];

const STATS = [
  { label: 'Total Runners', value: '24,891', icon: '\ud83d\uddff', color: '#00f5c8' },
  { label: 'Points Earned', value: '1.2M', icon: '\u2b21', color: '#ffd700' },
  { label: 'Games Played', value: '847K', icon: '\ud83c\udfae', color: '#a78bfa' },
  { label: 'Top Score', value: '48,920', icon: '\ud83c\udfc6', color: '#fb923c' },
];

function MoaiCanvas({ size = 80 }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    let frame = 0;
    let raf;
    function draw() {
      ctx.clearRect(0, 0, size, size);
      const bob = Math.sin(frame * 0.05) * 2;
      // Glow
      const glow = ctx.createRadialGradient(size/2, size/2+bob, 2, size/2, size/2+bob, size*0.55);
      glow.addColorStop(0, 'rgba(0,245,180,0.3)');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(size/2, size/2+bob, size*0.55, 0, Math.PI*2); ctx.fill();
      // Body
      const bg = ctx.createLinearGradient(0, 0, size, size);
      bg.addColorStop(0, '#e8e0d0'); bg.addColorStop(1, '#a09080');
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.roundRect(size*0.12, size*0.1+bob, size*0.76, size*0.8, size*0.1); ctx.fill();
      // Eyes
      ctx.fillStyle = '#6a5a4a';
      ctx.beginPath(); ctx.ellipse(size*0.33, size*0.38+bob, size*0.1, size*0.075, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(size*0.67, size*0.38+bob, size*0.1, size*0.075, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(size*0.35, size*0.365+bob, size*0.04, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(size*0.69, size*0.365+bob, size*0.04, 0, Math.PI*2); ctx.fill();
      // Nose
      ctx.fillStyle = '#6a5a4a';
      ctx.beginPath(); ctx.roundRect(size*0.4, size*0.5+bob, size*0.2, size*0.13, 4); ctx.fill();
      // Mouth
      ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = size*0.04;
      ctx.beginPath(); ctx.arc(size/2, size*0.72+bob, size*0.14, 0.2, Math.PI-0.2); ctx.stroke();
      // Logo
      ctx.fillStyle = 'rgba(0,245,180,0.9)'; ctx.font = `bold ${size*0.13}px monospace`;
      ctx.textAlign = 'center'; ctx.fillText('CONCRETE', size/2, size*0.9+bob);
      frame++; raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size]);
  return <canvas ref={ref} width={size} height={size} style={{ display: 'block' }} />;
}

function FloatingMoai({ x, y, size, delay, opacity }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    let frame = delay;
    let raf;
    function draw() {
      ctx.clearRect(0, 0, size, size);
      const bob = Math.sin(frame * 0.03) * 4;
      ctx.globalAlpha = opacity;
      const bg = ctx.createLinearGradient(0, 0, size, size);
      bg.addColorStop(0, '#e8e0d0'); bg.addColorStop(1, '#a09080');
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.roundRect(size*0.12, size*0.1+bob, size*0.76, size*0.8, size*0.1); ctx.fill();
      ctx.fillStyle = '#6a5a4a';
      ctx.beginPath(); ctx.ellipse(size*0.33, size*0.38+bob, size*0.1, size*0.075, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(size*0.67, size*0.38+bob, size*0.1, size*0.075, 0, 0, Math.PI*2); ctx.fill();
      frame++; raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size, delay, opacity]);
  return (
    <canvas ref={ref} width={size} height={size}
      style={{ position: 'absolute', left: x, top: y, pointerEvents: 'none' }} />
  );
}

export default function Home() {
  const [tab, setTab] = useState('leaderboard');
  const [searchName
