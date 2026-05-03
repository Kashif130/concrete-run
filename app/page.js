'use client';
import { useEffect, useRef } from 'react';

const W = 420, H = 700;
const LANES = [90, 210, 330];

export default function Game() {
  const canvasRef = useRef(null);

  const game = useRef({
    lane: 1,
    targetLane: 1,
    x: LANES[1],
    y: H - 120,
    obstacles: [],
    speed: 5,
    frame: 0,
    state: 'start',
    score: 0,
  });

  // 🎮 Controls
  useEffect(() => {
    const key = (e) => {
      if (e.key === 'ArrowLeft' && game.current.targetLane > 0) {
        game.current.targetLane--;
      }
      if (e.key === 'ArrowRight' && game.current.targetLane < 2) {
        game.current.targetLane++;
      }
      if (e.key === 'Enter') {
        startGame();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);

  const startGame = () => {
    const g = game.current;
    g.state = 'running';
    g.obstacles = [];
    g.score = 0;
    g.speed = 5;
  };

  // 🎨 Draw Player 🗿
  const drawPlayer = (ctx, x, y) => {
    ctx.font = "50px serif";
    ctx.textAlign = "center";
    ctx.fillText("🗿", x, y);
  };

  // 🚧 Draw obstacle
  const drawObstacle = (ctx, obs) => {
    ctx.fillStyle = "red";
    ctx.fillRect(obs.x - 25, obs.y, 50, 30);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    function loop() {
      const g = game.current;
      g.frame++;

      ctx.clearRect(0, 0, W, H);

      // background
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, W, H);

      // lanes
      ctx.strokeStyle = "#00f5c8";
      LANES.forEach(l => {
        ctx.beginPath();
        ctx.moveTo(l, 0);
        ctx.lineTo(l, H);
        ctx.stroke();
      });

      if (g.state === 'start') {
        ctx.fillStyle = "#fff";
        ctx.font = "24px sans-serif";
        ctx.fillText("Press ENTER to Start", 80, 300);
        requestAnimationFrame(loop);
        return;
      }

      // smooth lane movement
      g.x += (LANES[g.targetLane] - g.x) * 0.2;

      // spawn obstacles
      if (g.frame % 60 === 0) {
        const lane = Math.floor(Math.random() * 3);
        g.obstacles.push({
          lane,
          x: LANES[lane],
          y: -40
        });
      }

      // update obstacles
      g.obstacles.forEach(o => {
        o.y += g.speed;
        drawObstacle(ctx, o);

        // collision
        if (
          Math.abs(o.x - g.x) < 40 &&
          Math.abs(o.y - g.y) < 40
        ) {
          g.state = 'start';
        }
      });

      // remove offscreen
      g.obstacles = g.obstacles.filter(o => o.y < H);

      // draw player
      drawPlayer(ctx, g.x, g.y);

      // score
      g.score++;
      ctx.fillStyle = "#00f5c8";
      ctx.fillText("Score: " + g.score, 10, 30);

      requestAnimationFrame(loop);
    }

    loop();
  }, []);

  return (
    <div style={{ textAlign: 'center' }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ border: '2px solid #00f5c8', borderRadius: '10px' }}
      />
    </div>
  );
}
