import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, RotateCcw, ChevronLeft, Trophy } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useConfigStore } from '../store/useConfigStore';

type Direction = 'up' | 'down' | 'left' | 'right';

interface Snake {
  body: { x: number; y: number }[];
  direction: Direction;
  nextDirection: Direction;
  color: string;
  score: number;
  name: string;
  alive: boolean;
}

interface Food {
  x: number;
  y: number;
}

const GRID_SIZE = 20;
const CELL_SIZE = 18;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;

const SnakeGame = () => {
  const { currentConfig } = useConfigStore();
  const canvas1Ref = useRef<HTMLCanvasElement>(null);
  const canvas2Ref = useRef<HTMLCanvasElement>(null);

  const createInitialSnake = (startX: number, startY: number, color: string, name: string): Snake => ({
    body: [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY }
    ],
    direction: 'right',
    nextDirection: 'right',
    color,
    score: 0,
    name,
    alive: true
  });

  const [snake1, setSnake1] = useState<Snake>(
    createInitialSnake(5, 10, '#00ff88', currentConfig.player1.name)
  );
  const [snake2, setSnake2] = useState<Snake>(
    createInitialSnake(14, 10, '#8b5cf6', currentConfig.player2.name)
  );
  const [food1, setFood1] = useState<Food>({ x: 15, y: 5 });
  const [food2, setFood2] = useState<Food>({ x: 5, y: 15 });
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [winner, setWinner] = useState<string | null>(null);

  const generateFood = (snake: Snake): Food => {
    let food: Food;
    let isOnSnake: boolean;
    do {
      food = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      isOnSnake = snake.body.some(segment => segment.x === food.x && segment.y === food.y);
    } while (isOnSnake);
    return food;
  };

  const drawGame = (canvas: HTMLCanvasElement | null, snake: Snake, food: Food) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.strokeStyle = 'rgba(0, 255, 136, 0.1)';
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 10;
    ctx.fillRect(
      food.x * CELL_SIZE + 2,
      food.y * CELL_SIZE + 2,
      CELL_SIZE - 4,
      CELL_SIZE - 4
    );
    ctx.shadowBlur = 0;

    snake.body.forEach((segment, index) => {
      const isHead = index === 0;
      ctx.fillStyle = isHead ? snake.color : `${snake.color}aa`;
      if (isHead) {
        ctx.shadowColor = snake.color;
        ctx.shadowBlur = 10;
      }
      ctx.fillRect(
        segment.x * CELL_SIZE + 1,
        segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );
      ctx.shadowBlur = 0;
    });

    if (!snake.alive) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    }
  };

  useEffect(() => {
    drawGame(canvas1Ref.current, snake1, food1);
  }, [snake1, food1]);

  useEffect(() => {
    drawGame(canvas2Ref.current, snake2, food2);
  }, [snake2, food2]);

  const moveSnake = (snake: Snake): Snake => {
    if (!snake.alive) return snake;

    const newSnake = { ...snake, direction: snake.nextDirection };
    const head = { ...newSnake.body[0] };

    switch (newSnake.direction) {
      case 'up': head.y -= 1; break;
      case 'down': head.y += 1; break;
      case 'left': head.x -= 1; break;
      case 'right': head.x += 1; break;
    }

    if (
      head.x < 0 || head.x >= GRID_SIZE ||
      head.y < 0 || head.y >= GRID_SIZE ||
      newSnake.body.some(segment => segment.x === head.x && segment.y === head.y)
    ) {
      return { ...newSnake, alive: false };
    }

    newSnake.body = [head, ...newSnake.body];
    return newSnake;
  };

  const checkFood = (snake: Snake, food: Food): { ate: boolean; newSnake: Snake } => {
    const head = snake.body[0];
    if (head.x === food.x && head.y === food.y) {
      return {
        ate: true,
        newSnake: { ...snake, score: snake.score + 10 }
      };
    }
    return {
      ate: false,
      newSnake: { ...snake, body: snake.body.slice(0, -1) }
    };
  };

  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const interval = setInterval(() => {
      setSnake1(prev => {
        let newSnake = moveSnake(prev);
        const result = checkFood(newSnake, food1);
        if (result.ate) {
          setFood1(generateFood(result.newSnake));
        }
        return result.newSnake;
      });

      setSnake2(prev => {
        let newSnake = moveSnake(prev);
        const result = checkFood(newSnake, food2);
        if (result.ate) {
          setFood2(generateFood(result.newSnake));
        }
        return result.newSnake;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [gameStatus, food1, food2]);

  useEffect(() => {
    if (gameStatus !== 'playing') return;
    if (!snake1.alive && !snake2.alive) {
      setGameStatus('finished');
      setWinner(snake1.score > snake2.score ? snake1.name : snake1.score < snake2.score ? snake2.name : '平局');
    } else if (!snake1.alive) {
      setGameStatus('finished');
      setWinner(snake2.name);
    } else if (!snake2.alive) {
      setGameStatus('finished');
      setWinner(snake1.name);
    }
  }, [snake1.alive, snake2.alive, snake1.score, snake2.score, gameStatus]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatus !== 'playing') return;

      const gameKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
      if (!gameKeys.includes(e.key.toLowerCase())) return;
      
      e.preventDefault();

      switch (e.key.toLowerCase()) {
        case 'w':
          if (snake1.direction !== 'down') setSnake1(prev => ({ ...prev, nextDirection: 'up' }));
          break;
        case 's':
          if (snake1.direction !== 'up') setSnake1(prev => ({ ...prev, nextDirection: 'down' }));
          break;
        case 'a':
          if (snake1.direction !== 'right') setSnake1(prev => ({ ...prev, nextDirection: 'left' }));
          break;
        case 'd':
          if (snake1.direction !== 'left') setSnake1(prev => ({ ...prev, nextDirection: 'right' }));
          break;
        case 'arrowup':
          if (snake2.direction !== 'down') setSnake2(prev => ({ ...prev, nextDirection: 'up' }));
          break;
        case 'arrowdown':
          if (snake2.direction !== 'up') setSnake2(prev => ({ ...prev, nextDirection: 'down' }));
          break;
        case 'arrowleft':
          if (snake2.direction !== 'right') setSnake2(prev => ({ ...prev, nextDirection: 'left' }));
          break;
        case 'arrowright':
          if (snake2.direction !== 'left') setSnake2(prev => ({ ...prev, nextDirection: 'right' }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus, snake1.direction, snake2.direction]);

  const startGame = () => {
    setSnake1(createInitialSnake(5, 10, '#00ff88', currentConfig.player1.name));
    setSnake2(createInitialSnake(14, 10, '#8b5cf6', currentConfig.player2.name));
    setFood1({ x: 15, y: 5 });
    setFood2({ x: 5, y: 15 });
    setWinner(null);
    setGameStatus('playing');
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-6 py-8">
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
          贪吃蛇对战
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-primary">{snake1.name}</h3>
              <div className="text-3xl font-bold text-white font-mono">
                {snake1.score}
              </div>
            </div>
            <canvas
              ref={canvas1Ref}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="w-full rounded-lg neon-border"
            />
            {!snake1.alive && (
              <p className="text-center mt-4 text-red-400 font-bold text-xl">
                💀 已阵亡
              </p>
            )}
          </div>

          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-secondary">{snake2.name}</h3>
              <div className="text-3xl font-bold text-white font-mono">
                {snake2.score}
              </div>
            </div>
            <canvas
              ref={canvas2Ref}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="w-full rounded-lg neon-border"
              style={{ borderColor: 'rgba(139, 92, 246, 0.3)' }}
            />
            {!snake2.alive && (
              <p className="text-center mt-4 text-red-400 font-bold text-xl">
                💀 已阵亡
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={startGame}
            className="neon-button flex items-center gap-2 rounded-lg"
          >
            <Play size={20} />
            开始 / 重新开始
          </button>
        </div>

        {winner && (
          <div className="glass-card rounded-xl p-8 mt-8 text-center">
            <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-3">
              <Trophy size={32} className="text-yellow-400" />
              {winner} 获胜！
            </h2>
            <p className="text-xl text-gray-300 mb-6">
              {snake1.name}: {snake1.score} 分 | {snake2.name}: {snake2.score} 分
            </p>
            <button
              onClick={startGame}
              className="neon-button flex items-center gap-2 mx-auto rounded-lg"
            >
              <RotateCcw size={20} />
              再来一局
            </button>
          </div>
        )}

        <div className="glass-card rounded-xl p-6 mt-8 max-w-2xl mx-auto">
          <h3 className="text-xl font-bold mb-4 text-white text-center">操作说明</h3>
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <h4 className="font-bold text-primary mb-3">{snake1.name}</h4>
              <div className="flex justify-center gap-4 text-gray-300">
                <span className="font-mono text-primary">W</span>
                <span className="font-mono text-primary">A</span>
                <span className="font-mono text-primary">S</span>
                <span className="font-mono text-primary">D</span>
              </div>
            </div>
            <div className="text-center">
              <h4 className="font-bold text-secondary mb-3">{snake2.name}</h4>
              <div className="flex justify-center gap-4 text-gray-300">
                <span className="font-mono text-secondary">↑</span>
                <span className="font-mono text-secondary">↓</span>
                <span className="font-mono text-secondary">←</span>
                <span className="font-mono text-secondary">→</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SnakeGame;
