'use client';

import { useEffect, useState } from 'react';

export default function Game() {
  const [score, setScore] = useState(0);
  const [pos, setPos] = useState(1);

  useEffect(() => {
    const key = (e) => {
      if (e.key === 'ArrowLeft') setPos(p => Math.max(0, p - 1));
      if (e.key === 'ArrowRight') setPos(p => Math.min(2, p + 1));
      if (e.key === ' ') setScore(s => s + 1);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);

  return (
    <div style={{ color: 'white', textAlign: 'center' }}>
      <h1>🗿 Concrete Run</h1>
      <p>Score: {score}</p>
      <p>Lane: {pos}</p>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: 50
      }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 80,
            height: 200,
            margin: 10,
            background: i === pos ? '#00f5ff' : '#222'
          }} />
        ))}
      </div>

      <p>Use ← → and SPACE to play</p>
    </div>
  );
}
