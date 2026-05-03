'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

const LANES = [120, 240, 360];
const GAME_WIDTH = 480;
const GAME_HEIGHT = 600;
const PLAYER_SIZE = 44;
const OBS_WIDTH = 48;
const OBS_HEIGHT = 32;
const COIN_SIZE = 22;

function randomLane() { return Math.floor(Math.random() * 3); }

export default function ConcreteRun() {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    running: false,
    dead: false,
    score: 0,
    points: 0,
    lane: 1,
    targetLane: 1,
    playerY: GAME_HEIGHT - 100,
    playerX: LANES[1],
    obstacles: [],
    coins: [],
    speed: 5,
    frame: 0,
    bobble: 0,
    trail: [],
  });
  const [ui, setUi] = useState({ score: 0, points: 0, dead: false, started: false });
  const animRef = useRef(null);

  const resetGame = useCallback(() => {
    const s = stateRef.current;
    s.running = true;
    s.dead = false;
    s.score = 0;
    s.points = 0;
    s.lane = 1;
    s.targetLane = 1;
    s.playerX = LANES[1];
    s.obstacles = [];
    s.coins = [];
    s.speed = 5;
    s.frame = 0;
    s.bobble = 0;
    s.trail = [];
    setUi({ score: 0, points: 0, dead: false, started: true });
  }, []);

  const moveLeft = useCallback(() => {
    const s = stateRef.current;
    if (!s.running) return;
    if (s.targetLane > 0) s.targetLane--;
  }, []);

  const moveRight = useCallback(() => {
    const s = stateRef.current;
    if (!s.running) return;
    if (s.targetLane < 2) s.targetLane++;
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') moveLeft();
      if (e.key === 'ArrowRight') moveRight();
      if (e.key === ' ' || e.key === 'Enter') {
        if (!stateRef.current.running) resetGame();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moveLeft, moveRight, resetGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Touch swipe
    let touchX = null;
    const onTouchStart = (e) => { touchX = e.touches[0].clientX; };
    const onTouchEnd = (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 30) {
        if (dx < 0) moveLeft(); else moveRight();
      } else {
        if (!stateRef.current.running) resetGame();
      }
      touchX = null;
    };
    canvas.addEventListener('touchstart', onTouchStart);
    canvas.addEventListener('touchend', onTouchEnd);

    function drawBackground(ctx, frame) {
      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT * 0.55);
      sky.addColorStop(0, '#0a0a0f');
      sky.addColorStop(1, '#1a1a2e');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT * 0.55);

      // Ground
      const ground = ctx.createLinearGradient(0, GAME_HEIGHT * 0.55, 0, GAME_HEIGHT);
      ground.addColorStop(0, '#111118');
      ground.addColorStop(1, '#0d0d14');
      ctx.fillStyle = ground;
      ctx.fillRect(0, GAME_HEIGHT * 0.55, GAME_WIDTH, GAME_HEIGHT * 0.45);

      // Horizon glow
      const hglow = ctx.createRadialGradient(GAME_WIDTH / 2, GAME_HEIGHT * 0.55, 0, GAME_WIDTH / 2, GAME_HEIGHT * 0.55, 220);
      hglow.addColorStop(0, 'rgba(0,245,200,0.13)');
      hglow.addColorStop(1, 'transparent');
      ctx.fillStyle = hglow;
      ctx.fillRect(0, GAME_HEIGHT * 0.3, GAME_WIDTH, GAME_HEIGHT * 0.5);

      // Perspective lanes
      const vp = { x: GAME_WIDTH / 2, y: GAME_HEIGHT * 0.38 };
      const laneColors = ['rgba(0,245,180,0.18)', 'rgba(0,245,180,0.10)', 'rgba(0,245,180,0.18)'];
      const laneBounds = [60, 180, 300, 420];

      for (let l = 0; l < 3; l++) {
        ctx.beginPath();
        ctx.moveTo(vp.x + (laneBounds[l] - GAME_WIDTH / 2) * 0.18, vp.y);
        ctx.lineTo(vp.x + (laneBounds[l + 1] - GAME_WIDTH / 2) * 0.18, vp.y);
        ctx.lineTo(laneBounds[l + 1], GAME_HEIGHT);
        ctx.lineTo(laneBounds[l], GAME_HEIGHT);
        ctx.closePath();
        ctx.fillStyle = laneColors[l];
        ctx.fill();
      }

      // Lane dividers with scroll effect
      for (let d = 0; d < 3; d++) {
        const lx = laneBounds[d + 0] + (d === 0 ? 0 : 0);
        // perspective line
        ctx.beginPath();
        ctx.moveTo(vp.x + (laneBounds[d] - GAME_WIDTH / 2) * 0.18, vp.y);
        ctx.lineTo(laneBounds[d], GAME_HEIGHT);
        ctx.strokeStyle = 'rgba(0,245,180,0.25)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      // right edge
      ctx.beginPath();
      ctx.moveTo(vp.x + (laneBounds[3] - GAME_WIDTH / 2) * 0.18, vp.y);
      ctx.lineTo(laneBounds[3], GAME_HEIGHT);
      ctx.strokeStyle = 'rgba(0,245,180,0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Scrolling dashes
      const dashCount = 10;
      for (let ln = 0; ln < 2; ln++) {
        for (let i = 0; i < dashCount; i++) {
          const t = ((i / dashCount) + (frame * 0.012)) % 1;
          const y = vp.y + t * (GAME_HEIGHT - vp.y);
          const prog = (y - vp.y) / (GAME_HEIGHT - vp.y);
          const xBase = laneBounds[ln + 1];
          const xVp = vp.x + (laneBounds[ln + 1] - GAME_WIDTH / 2) * 0.18;
          const x = xVp + (xBase - xVp) * prog;
          const dashH = 18 * prog + 4;
          ctx.fillStyle = `rgba(0,245,180,${0.5 * prog})`;
          ctx.fillRect(x - 1, y, 2, dashH);
        }
      }

      // Stars
      ctx.save();
      for (let i = 0; i < 40; i++) {
        const sx = ((i * 137 + 7) % GAME_WIDTH);
        const sy = ((i * 97 + 13) % (GAME_HEIGHT * 0.48));
        const blink = Math.sin(frame * 0.04 + i) * 0.3 + 0.7;
        ctx.globalAlpha = blink * 0.6;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(sx, sy, i % 3 === 0 ? 1.2 : 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // City silhouette
      ctx.fillStyle = '#0f0f1a';
      const buildings = [
        [20, 80, 40, 120], [70, 60, 30, 140], [110, 90, 50, 110],
        [170, 50, 35, 150], [215, 75, 45, 125], [270, 40, 40, 160],
        [320, 65, 55, 135], [385, 55, 40, 145], [435, 80, 45, 120],
      ];
      buildings.forEach(([x, h, w, y]) => {
        ctx.fillRect(x, y, w, GAME_HEIGHT * 0.55 - y);
        // window glow
        ctx.fillStyle = 'rgba(0,245,180,0.12)';
        for (let wy = y + 8; wy < GAME_HEIGHT * 0.52; wy += 14) {
          for (let wx = x + 5; wx < x + w - 5; wx += 10) {
            if ((wx + wy) % 3 !== 0) {
              ctx.fillRect(wx, wy, 5, 7);
            }
          }
        }
        ctx.fillStyle = '#0f0f1a';
      });
    }

    function drawPlayer(ctx, x, y, bobble) {
      const by = Math.sin(bobble) * 3;

      // Trail
      const s = stateRef.current;
      s.trail.push({ x, y: y + by, alpha: 0.5 });
      if (s.trail.length > 8) s.trail.shift();
      s.trail.forEach((t, i) => {
        const a = (i / s.trail.length) * t.alpha * 0.3;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = '#00f5c8';
        ctx.beginPath();
        ctx.arc(t.x, t.y + PLAYER_SIZE / 2, PLAYER_SIZE / 2 - 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Glow
      const glow = ctx.createRadialGradient(x, y + by + PLAYER_SIZE / 2, 2, x, y + by + PLAYER_SIZE / 2, 36);
      glow.addColorStop(0, 'rgba(0,245,200,0.35)');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y + by + PLAYER_SIZE / 2, 36, 0, Math.PI * 2);
      ctx.fill();

      // Body - Moai style concrete block
      ctx.save();
      ctx.translate(x, y + by);

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(PLAYER_SIZE / 2, PLAYER_SIZE + 6, 18, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Main body
      const bodyGrad = ctx.createLinearGradient(0, 0, PLAYER_SIZE, PLAYER_SIZE);
      bodyGrad.addColorStop(0, '#e8e0d0');
      bodyGrad.addColorStop(0.5, '#c8bfaa');
      bodyGrad.addColorStop(1, '#a09080');
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.roundRect(4, 8, PLAYER_SIZE - 8, PLAYER_SIZE - 8, 6);
      ctx.fill();

      // Moai face
      ctx.fillStyle = '#7a6a5a';
      // eyes
      ctx.beginPath(); ctx.ellipse(14, 20, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(30, 20, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
      // eye shine
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(15, 19, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(31, 19, 1.5, 0, Math.PI * 2); ctx.fill();
      // nose
      ctx.fillStyle = '#7a6a5a';
      ctx.beginPath(); ctx.roundRect(18, 24, 8, 5, 2); ctx.fill();
      // mouth
      ctx.strokeStyle = '#5a4a3a';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(22, 31, 6, 0.2, Math.PI - 0.2); ctx.stroke();

      // CONCRETE logo on chest
      ctx.fillStyle = 'rgba(0,245,180,0.8)';
      ctx.font = 'bold 6px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CONCRETE', PLAYER_SIZE / 2, PLAYER_SIZE - 4);

      ctx.restore();
    }

    function drawObstacle(ctx, obs) {
      ctx.save();
      ctx.translate(obs.x - OBS_WIDTH / 2, obs.y);

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(OBS_WIDTH / 2, OBS_HEIGHT + 4, 22, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Barrier/obstacle - concrete barrier style
      const barGrad = ctx.createLinearGradient(0, 0, 0, OBS_HEIGHT);
      barGrad.addColorStop(0, '#ff4444');
      barGrad.addColorStop(0.3, '#cc2222');
      barGrad.addColorStop(1, '#881111');
      ctx.fillStyle = barGrad;
      ctx.beginPath();
      ctx.roundRect(2, 0, OBS_WIDTH - 4, OBS_HEIGHT, 4);
      ctx.fill();

      // Warning stripes
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(2, 0, OBS_WIDTH - 4, OBS_HEIGHT, 4);
      ctx.clip();
      ctx.fillStyle = 'rgba(255,200,0,0.3)';
      for (let si = -2; si < 6; si++) {
        ctx.save();
        ctx.translate(si * 12, 0);
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(8, 0); ctx.lineTo(0, OBS_HEIGHT); ctx.lineTo(-8, OBS_HEIGHT);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();

      // Glow
      ctx.strokeStyle = 'rgba(255,80,80,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(1, -1, OBS_WIDTH - 2, OBS_HEIGHT + 2, 5);
      ctx.stroke();

      // ⚠ symbol
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚠', OBS_WIDTH / 2, OBS_HEIGHT - 6);

      ctx.restore();
    }

    function drawCoin(ctx, coin, frame) {
      const pulse = Math.sin(frame * 0.1 + coin.x) * 2;
      ctx.save();
      ctx.translate(coin.x, coin.y);

      // Glow
      const cg = ctx.createRadialGradient(0, 0, 2, 0, 0, 20 + pulse);
      cg.addColorStop(0, 'rgba(0,245,180,0.4)');
      cg.addColorStop(1, 'transparent');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(0, 0, 20 + pulse, 0, Math.PI * 2);
      ctx.fill();

      // Coin
      const coinGrad = ctx.createLinearGradient(-COIN_SIZE / 2, -COIN_SIZE / 2, COIN_SIZE / 2, COIN_SIZE / 2);
      coinGrad.addColorStop(0, '#00f5c8');
      coinGrad.addColorStop(0.5, '#00ddb0');
      coinGrad.addColorStop(1, '#00a888');
      ctx.fillStyle = coinGrad;
      ctx.beginPath();
      ctx.arc(0, 0, COIN_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // C symbol
      ctx.fillStyle = '#003322';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('C', 0, 1);

      ctx.restore();
    }

    function drawHUD(ctx, score, points, speed) {
      // Top bar
      const hud = ctx.createLinearGradient(0, 0, 0, 60);
      hud.addColorStop(0, 'rgba(0,0,0,0.8)');
      hud.addColorStop(1, 'transparent');
      ctx.fillStyle = hud;
      ctx.fillRect(0, 0, GAME_WIDTH, 60);

      // Score
      ctx.fillStyle = '#00f5c8';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`SCORE  ${score}`, 16, 22);

      // Points (Concrete points)
      ctx.fillStyle = '#ffd700';
      ctx.fillText(`⬡ POINTS  ${points}`, 16, 42);

      // Speed indicator
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`SPEED x${speed.toFixed(1)}`, GAME_WIDTH - 16, 22);

      // app.concrete.xyz branding
      ctx.fillStyle = 'rgba(0,245,180,0.5)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('app.concrete.xyz', GAME_WIDTH - 16, 40);
    }

    function loop() {
      const s = stateRef.current;
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      drawBackground(ctx, s.frame);

      if (!s.running && !s.dead) {
        // Start screen
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Logo
        ctx.save();
        const lg = ctx.createLinearGradient(0, GAME_HEIGHT * 0.25, 0, GAME_HEIGHT * 0.4);
        lg.addColorStop(0, '#00f5c8');
        lg.addColorStop(1, '#00a888');
        ctx.fillStyle = lg;
        ctx.font = 'bold 42px monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#00f5c8';
        ctx.shadowBlur = 30;
        ctx.fillText('🗿 CONCRETE', GAME_WIDTH / 2, GAME_HEIGHT * 0.32);
        ctx.font = 'bold 28px monospace';
        ctx.fillText('RUN', GAME_WIDTH / 2, GAME_HEIGHT * 0.4);
        ctx.restore();

        ctx.fillStyle = 'rgba(0,245,180,0.7)';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('app.concrete.xyz', GAME_WIDTH / 2, GAME_HEIGHT * 0.47);
        ctx.fillText('points.concrete.xyz', GAME_WIDTH / 2, GAME_HEIGHT * 0.52);

        // Pulse button
        const pulse = Math.sin(s.frame * 0.08) * 4;
        ctx.fillStyle = '#00f5c8';
        ctx.beginPath();
        ctx.roundRect(GAME_WIDTH / 2 - 100, GAME_HEIGHT * 0.62 - pulse / 2, 200, 48 + pulse, 24);
        ctx.fill();
        ctx.fillStyle = '#003322';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('TAP TO RUN', GAME_WIDTH / 2, GAME_HEIGHT * 0.62 + 16 + pulse / 4);

        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '11px monospace';
        ctx.fillText('← → SWIPE TO MOVE', GAME_WIDTH / 2, GAME_HEIGHT * 0.8);

        s.frame++;
        animRef.current = requestAnimationFrame(loop);
        return;
      }

      if (s.dead) {
        drawBackground(ctx, s.frame);
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        ctx.save();
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 20;
        ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT * 0.32);
        ctx.restore();

        ctx.fillStyle = '#00f5c8';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Score: ${s.score}`, GAME_WIDTH / 2, GAME_HEIGHT * 0.43);

        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(`⬡ Points: ${s.points}`, GAME_WIDTH / 2, GAME_HEIGHT * 0.51);

        ctx.fillStyle = 'rgba(0,245,180,0.6)';
        ctx.font = '11px monospace';
        ctx.fillText('Earn real points at points.concrete.xyz', GAME_WIDTH / 2, GAME_HEIGHT * 0.59);

        const pulse = Math.sin(s.frame * 0.1) * 3;
        ctx.fillStyle = '#00f5c8';
        ctx.beginPath();
        ctx.roundRect(GAME_WIDTH / 2 - 90, GAME_HEIGHT * 0.66, 180, 46 + pulse, 23);
        ctx.fill();
        ctx.fillStyle = '#003322';
        ctx.font = 'bold 15px monospace';
        ctx.fillText('PLAY AGAIN', GAME_WIDTH / 2, GAME_HEIGHT * 0.66 + 28 + pulse / 2);

        s.frame++;
        animRef.current = requestAnimationFrame(loop);
        return;
      }

      // Smooth lane transition
      const targetX = LANES[s.targetLane];
      s.playerX += (targetX - s.playerX) * 0.18;
      s.bobble += 0.15;
      s.frame++;
      s.score++;
      s.speed = 5 + Math.floor(s.score / 200) * 0.5;

      // Spawn obstacles
      if (s.frame % Math.max(55, 90 - Math.floor(s.score / 100) * 3) === 0) {
        const lane = randomLane();
        s.obstacles.push({ x: LANES[lane], y: -OBS_HEIGHT });
      }

      // Spawn coins
      if (s.frame % 40 === 0) {
        const lane = randomLane();
        s.coins.push({ x: LANES[lane], y: -COIN_SIZE });
      }

      // Move obstacles
      s.obstacles = s.obstacles.filter(o => {
        o.y += s.speed;
        return o.y < GAME_HEIGHT + 60;
      });

      // Move coins
      s.coins = s.coins.filter(c => {
        c.y += s.speed;
        return c.y < GAME_HEIGHT + 40;
      });

      // Collision - obstacles
      const px = s.playerX, py = s.playerY;
      for (const o of s.obstacles) {
        const dx = Math.abs(px - o.x);
        const dy = Math.abs(py + PLAYER_SIZE / 2 - (o.y + OBS_HEIGHT / 2));
        if (dx < 28 && dy < 28) {
          s.running = false;
          s.dead = true;
          setUi({ score: s.score, points: s.points, dead: true, started: true });
          animRef.current = requestAnimationFrame(loop);
          return;
        }
      }

      // Collect coins
      s.coins = s.coins.filter(c => {
        const dx = Math.abs(px - c.x);
        const dy = Math.abs(py + PLAYER_SIZE / 2 - c.y);
        if (dx < 26 && dy < 26) {
          s.points += 10;
          setUi(u => ({ ...u, points: s.points, score: s.score }));
          return false;
        }
        return true;
      });

      // Draw everything
      s.obstacles.forEach(o => drawObstacle(ctx, o));
      s.coins.forEach(c => drawCoin(ctx, c, s.frame));
      drawPlayer(ctx, s.playerX, s.playerY, s.bobble);
      drawHUD(ctx, s.score, s.points, s.speed);

      if (s.frame % 30 === 0) setUi(u => ({ ...u, score: s.score, points: s.points }));

      animRef.current = requestAnimationFrame(loop);
    }

    animRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [moveLeft, moveRight, resetGame]);

  const handleCanvasClick = () => {
    const s = stateRef.current;
    if (!s.running) resetGame();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050508',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'monospace',
    }}>
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        onClick={handleCanvasClick}
        style={{
          borderRadius: 16,
          border: '1.5px solid rgba(0,245,180,0.25)',
          boxShadow: '0 0 60px rgba(0,245,180,0.15), 0 0 120px rgba(0,0,0,0.8)',
          cursor: 'pointer',
          maxWidth: '100vw',
          maxHeight: '100vh',
          touchAction: 'none',
        }}
      />
      <div style={{ marginTop: 16, display: 'flex', gap: 24 }}>
        <a href="https://app.concrete.xyz" target="_blank" rel="noopener noreferrer"
          style={{ color: '#00f5c8', fontSize: 12, opacity: 0.7, textDecoration: 'none' }}>
          app.concrete.xyz
        </a>
        <a href="https://points.concrete.xyz" target="_blank" rel="noopener noreferrer"
          style={{ color: '#ffd700', fontSize: 12, opacity: 0.7, textDecoration: 'none' }}>
          points.concrete.xyz ⬡
        </a>
      </div>
    </div>
  );
}
