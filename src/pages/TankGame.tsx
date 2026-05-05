import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, RotateCcw, ChevronLeft, MessageSquare } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useConfigStore } from '../store/useConfigStore';

interface Tank {
  x: number;
  y: number;
  angle: number;
  health: number;
  bullets: number;
  color: string;
  name: string;
}

interface Bullet {
  x: number;
  y: number;
  angle: number;
  owner: 'player1' | 'player2';
}

const FIRE_COOLDOWN = 500;

const TankGame = () => {
  const { currentConfig } = useConfigStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastFireTime1 = useRef(0);
  const lastFireTime2 = useRef(0);
  
  // 使用 ref 保存最新的坦克状态
  const tank1Ref = useRef<Tank>({
    x: 150, y: 300, angle: 0, health: 100, bullets: 10, color: '#00ff88',
    name: currentConfig.player1.name
  });
  const tank2Ref = useRef<Tank>({
    x: 650, y: 300, angle: Math.PI, health: 100, bullets: 10, color: '#8b5cf6',
    name: currentConfig.player2.name
  });
  
  const [tank1, setTank1] = useState<Tank>(tank1Ref.current);
  const [tank2, setTank2] = useState<Tank>(tank2Ref.current);
  
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'paused' | 'finished'>('idle');
  const [winner, setWinner] = useState<string | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [autoPlay, setAutoPlay] = useState(false);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  useEffect(() => {
    draw();
  }, [tank1, tank2, bullets]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = 'rgba(0, 255, 136, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < CANVAS_WIDTH; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let i = 0; i < CANVAS_HEIGHT; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_WIDTH, i);
      ctx.stroke();
    }

    drawTank(ctx, tank1);
    drawTank(ctx, tank2);

    bullets.forEach(bullet => {
      ctx.fillStyle = bullet.owner === 'player1' ? '#00ff88' : '#8b5cf6';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = bullet.owner === 'player1' ? '#00ff88' : '#8b5cf6';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  };

  const drawTank = (ctx: CanvasRenderingContext2D, tank: Tank) => {
    ctx.save();
    ctx.translate(tank.x, tank.y);
    ctx.rotate(tank.angle);

    ctx.fillStyle = tank.color;
    ctx.shadowColor = tank.color;
    ctx.shadowBlur = 15;
    
    ctx.fillRect(-20, -12, 40, 24);
    ctx.fillRect(-25, -15, 10, 30);
    ctx.fillRect(15, -15, 10, 30);
    ctx.fillRect(0, -4, 30, 8);
    
    ctx.shadowBlur = 0;
    ctx.restore();

    ctx.fillStyle = '#fff';
    ctx.font = '12px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText(tank.name, tank.x, tank.y - 35);
    
    const healthWidth = 50;
    ctx.fillStyle = '#333';
    ctx.fillRect(tank.x - healthWidth/2, tank.y - 30, healthWidth, 6);
    ctx.fillStyle = tank.health > 50 ? '#00ff88' : tank.health > 25 ? '#f59e0b' : '#ef4444';
    ctx.fillRect(tank.x - healthWidth/2, tank.y - 30, (tank.health / 100) * healthWidth, 6);
  };

  const moveTank = (player: 'player1' | 'player2', dx: number, dy: number) => {
    const ref = player === 'player1' ? tank1Ref : tank2Ref;
    const setTank = player === 'player1' ? setTank1 : setTank2;
    
    const newTank = {
      ...ref.current,
      x: Math.max(30, Math.min(CANVAS_WIDTH - 30, ref.current.x + dx)),
      y: Math.max(30, Math.min(CANVAS_HEIGHT - 30, ref.current.y + dy))
    };
    
    ref.current = newTank;
    setTank(newTank);
  };

  const rotateTank = (player: 'player1' | 'player2', angle: number) => {
    const ref = player === 'player1' ? tank1Ref : tank2Ref;
    const setTank = player === 'player1' ? setTank1 : setTank2;
    
    const newTank = {
      ...ref.current,
      angle: ref.current.angle + angle
    };
    
    ref.current = newTank;
    setTank(newTank);
  };

  const fireBullet = (player: 'player1' | 'player2') => {
    const now = Date.now();
    const lastFireTime = player === 'player1' ? lastFireTime1 : lastFireTime2;
    const ref = player === 'player1' ? tank1Ref : tank2Ref;
    const setTank = player === 'player1' ? setTank1 : setTank2;
    const tank = ref.current;
    
    if (now - lastFireTime.current < FIRE_COOLDOWN) return;
    if (tank.bullets <= 0) return;
    
    lastFireTime.current = now;
    
    // 使用最新的状态发射子弹
    setBullets(prev => [...prev, {
      x: tank.x + Math.cos(tank.angle) * 35,
      y: tank.y + Math.sin(tank.angle) * 35,
      angle: tank.angle,
      owner: player
    }]);
    
    const newTank = { ...tank, bullets: tank.bullets - 1 };
    ref.current = newTank;
    setTank(newTank);
    
    addMessage(`${tank.name} 开火！`);
  };

  const addMessage = (msg: string) => {
    setMessages(prev => [...prev.slice(-9), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const checkCollision = (bullet: Bullet, tank: Tank) => {
    const dx = bullet.x - tank.x;
    const dy = bullet.y - tank.y;
    return Math.sqrt(dx * dx + dy * dy) < 30;
  };

  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const interval = setInterval(() => {
      setBullets(prev => {
        const newBullets: Bullet[] = [];
        
        prev.forEach(bullet => {
          const newBullet = {
            ...bullet,
            x: bullet.x + Math.cos(bullet.angle) * 8,
            y: bullet.y + Math.sin(bullet.angle) * 8
          };
          
          if (newBullet.x < 0 || newBullet.x > CANVAS_WIDTH || 
              newBullet.y < 0 || newBullet.y > CANVAS_HEIGHT) {
            return;
          }
          
          if (bullet.owner === 'player1' && checkCollision(newBullet, tank2Ref.current)) {
            const newHealth = tank2Ref.current.health - 20;
            
            if (newHealth <= 0) {
              setGameStatus('finished');
              setWinner(tank1Ref.current.name);
              addMessage(`${tank2Ref.current.name} 被击毁！${tank1Ref.current.name} 获胜！`);
            }
            
            const newTank = { ...tank2Ref.current, health: Math.max(0, newHealth) };
            tank2Ref.current = newTank;
            setTank2(newTank);
            return;
          }
          
          if (bullet.owner === 'player2' && checkCollision(newBullet, tank1Ref.current)) {
            const newHealth = tank1Ref.current.health - 20;
            
            if (newHealth <= 0) {
              setGameStatus('finished');
              setWinner(tank2Ref.current.name);
              addMessage(`${tank1Ref.current.name} 被击毁！${tank2Ref.current.name} 获胜！`);
            }
            
            const newTank = { ...tank1Ref.current, health: Math.max(0, newHealth) };
            tank1Ref.current = newTank;
            setTank1(newTank);
            return;
          }
          
          newBullets.push(newBullet);
        });
        
        return newBullets;
      });
    }, 1000 / 60);

    return () => clearInterval(interval);
  }, [gameStatus]);

  useEffect(() => {
    if (!autoPlay || gameStatus !== 'playing') return;

    const interval = setInterval(() => {
      const actions = ['up', 'down', 'left', 'right', 'rotate_left', 'rotate_right', 'fire'];
      const randomAction1 = actions[Math.floor(Math.random() * actions.length)];
      const randomAction2 = actions[Math.floor(Math.random() * actions.length)];
      
      handleTankAction('player1', randomAction1);
      handleTankAction('player2', randomAction2);
    }, 800);

    return () => clearInterval(interval);
  }, [autoPlay, gameStatus]);

  const handleTankAction = (player: 'player1' | 'player2', action: string) => {
    switch (action) {
      case 'up': moveTank(player, 0, -15); break;
      case 'down': moveTank(player, 0, 15); break;
      case 'left': moveTank(player, -15, 0); break;
      case 'right': moveTank(player, 15, 0); break;
      case 'rotate_left': rotateTank(player, -0.3); break;
      case 'rotate_right': rotateTank(player, 0.3); break;
      case 'fire': fireBullet(player); break;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatus !== 'playing') return;
      
      let handled = false;
      
      switch (e.key.toLowerCase()) {
        case 'w': moveTank('player1', 0, -10); handled = true; break;
        case 's': moveTank('player1', 0, 10); handled = true; break;
        case 'a': moveTank('player1', -10, 0); handled = true; break;
        case 'd': moveTank('player1', 10, 0); handled = true; break;
        case 'q': rotateTank('player1', -0.2); handled = true; break;
        case 'e': rotateTank('player1', 0.2); handled = true; break;
        case ' ': fireBullet('player1'); handled = true; break;
        case 'arrowup': moveTank('player2', 0, -10); handled = true; break;
        case 'arrowdown': moveTank('player2', 0, 10); handled = true; break;
        case 'arrowleft': moveTank('player2', -10, 0); handled = true; break;
        case 'arrowright': moveTank('player2', 10, 0); handled = true; break;
        case ',': rotateTank('player2', -0.2); handled = true; break;
        case '.': rotateTank('player2', 0.2); handled = true; break;
        case '/': fireBullet('player2'); handled = true; break;
      }
      
      if (handled) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus]);

  const startGame = () => {
    lastFireTime1.current = 0;
    lastFireTime2.current = 0;
    
    const newTank1 = { x: 150, y: 300, angle: 0, health: 100, bullets: 10, color: '#00ff88', name: currentConfig.player1.name };
    const newTank2 = { x: 650, y: 300, angle: Math.PI, health: 100, bullets: 10, color: '#8b5cf6', name: currentConfig.player2.name };
    
    tank1Ref.current = newTank1;
    tank2Ref.current = newTank2;
    
    setTank1(newTank1);
    setTank2(newTank2);
    setBullets([]);
    setWinner(null);
    setMessages([]);
    setGameStatus('playing');
    addMessage('游戏开始！');
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors"
          >
            <ChevronLeft size={20} />
            <span>返回首页</span>
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-8 text-center text-white">
          1v1 坦克对战
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="glass-card rounded-xl p-6">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="w-full rounded-lg neon-border"
              />
              
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={startGame}
                  className="neon-button flex items-center gap-2 rounded-lg"
                >
                  <Play size={20} />
                  开始 / 重新开始
                </button>
                <button
                  onClick={() => setGameStatus(gameStatus === 'paused' ? 'playing' : 'paused')}
                  disabled={gameStatus === 'idle' || gameStatus === 'finished'}
                  className="neon-button neon-button-purple flex items-center gap-2 rounded-lg disabled:opacity-50"
                >
                  <Pause size={20} />
                  {gameStatus === 'paused' ? '继续' : '暂停'}
                </button>
                <label className="flex items-center gap-2 text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoPlay}
                    onChange={(e) => setAutoPlay(e.target.checked)}
                    className="w-4 h-4"
                  />
                  自动演示
                </label>
              </div>
            </div>
            
            {winner && (
              <div className="glass-card rounded-xl p-8 mt-6 text-center">
                <h2 className="text-3xl font-bold mb-4 text-primary">
                  🎉 {winner} 获胜！
                </h2>
                <button
                  onClick={startGame}
                  className="neon-button flex items-center gap-2 mx-auto rounded-lg"
                >
                  <RotateCcw size={20} />
                  再来一局
                </button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary">
                <MessageSquare size={20} />
                战斗日志
              </h3>
              <div className="bg-surface rounded-lg p-4 h-80 overflow-y-auto font-mono text-sm">
                {messages.length === 0 ? (
                  <p className="text-gray-500">等待游戏开始...</p>
                ) : (
                  messages.map((msg, i) => (
                    <p key={i} className="text-gray-300 mb-1">{msg}</p>
                  ))
                )}
              </div>
            </div>

            <div className="glass-card rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4 text-white">操作说明</h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span className="text-primary font-mono">WASD</span>
                  <span>玩家1 移动</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary font-mono">Q/E</span>
                  <span>玩家1 旋转</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary font-mono">空格</span>
                  <span>玩家1 开火</span>
                </div>
                <hr className="border-gray-700" />
                <div className="flex justify-between">
                  <span className="text-secondary font-mono">↑↓←→</span>
                  <span>玩家2 移动</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary font-mono">, / .</span>
                  <span>玩家2 旋转</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary font-mono">/</span>
                  <span>玩家2 开火</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TankGame;
