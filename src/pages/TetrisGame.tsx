import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, RotateCcw, ChevronLeft, Trophy } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useConfigStore } from '../store/useConfigStore';

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 25;

const SHAPES = [
  [[1, 1, 1, 1]],
  [[1, 1], [1, 1]],
  [[1, 1, 1], [0, 1, 0]],
  [[1, 1, 1], [1, 0, 0]],
  [[1, 1, 1], [0, 0, 1]],
  [[1, 1, 0], [0, 1, 1]],
  [[0, 1, 1], [1, 1, 0]]
];

const COLORS = ['#00ff88', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#6366f1'];

interface Piece {
  shape: number[][];
  x: number;
  y: number;
  color: string;
}

interface TetrisState {
  board: (string | null)[][];
  piece: Piece;
  score: number;
  level: number;
  gameOver: boolean;
  name: string;
  color: string;
}

const createBoard = () => Array(ROWS).fill(null).map(() => Array(COLS).fill(null));

const createPiece = (): Piece => {
  const index = Math.floor(Math.random() * SHAPES.length);
  return {
    shape: SHAPES[index],
    x: Math.floor((COLS - SHAPES[index][0].length) / 2),
    y: 0,
    color: COLORS[index]
  };
};

const TetrisGame = () => {
  const { currentConfig } = useConfigStore();
  const canvas1Ref = useRef<HTMLCanvasElement>(null);
  const canvas2Ref = useRef<HTMLCanvasElement>(null);

  const createInitialState = (color: string, name: string): TetrisState => ({
    board: createBoard(),
    piece: createPiece(),
    score: 0,
    level: 1,
    gameOver: false,
    name,
    color
  });

  const [state1, setState1] = useState<TetrisState>(
    createInitialState('#00ff88', currentConfig.player1.name)
  );
  const [state2, setState2] = useState<TetrisState>(
    createInitialState('#8b5cf6', currentConfig.player2.name)
  );
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [winner, setWinner] = useState<string | null>(null);

  const rotate = (shape: number[][]) => {
    return shape[0].map((_, i) => shape.map(row => row[i]).reverse());
  };

  const checkCollision = (piece: Piece, board: (string | null)[][]) => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x;
          const newY = piece.y + y;
          if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
          if (newY >= 0 && board[newY][newX]) return true;
        }
      }
    }
    return false;
  };

  const lockPiece = (state: TetrisState): TetrisState => {
    const newBoard = state.board.map(row => [...row]);
    for (let y = 0; y < state.piece.shape.length; y++) {
      for (let x = 0; x < state.piece.shape[y].length; x++) {
        if (state.piece.shape[y][x]) {
          const boardY = state.piece.y + y;
          const boardX = state.piece.x + x;
          if (boardY >= 0) {
            newBoard[boardY][boardX] = state.piece.color;
          }
        }
      }
    }

    let newScore = state.score;
    let newLevel = state.level;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (newBoard[y].every(cell => cell !== null)) {
        newBoard.splice(y, 1);
        newBoard.unshift(Array(COLS).fill(null));
        y++;
        newScore += 100 * newLevel;
        if (newScore >= newLevel * 500) {
          newLevel++;
        }
      }
    }

    const newPiece = createPiece();
    const gameOver = checkCollision(newPiece, newBoard);

    return {
      ...state,
      board: newBoard,
      piece: newPiece,
      score: newScore,
      level: newLevel,
      gameOver
    };
  };

  const drop = (state: TetrisState): TetrisState => {
    if (state.gameOver) return state;
    
    const newPiece = { ...state.piece, y: state.piece.y + 1 };
    if (checkCollision(newPiece, state.board)) {
      return lockPiece(state);
    }
    return { ...state, piece: newPiece };
  };

  const move = (state: TetrisState, dx: number): TetrisState => {
    if (state.gameOver) return state;
    const newPiece = { ...state.piece, x: state.piece.x + dx };
    if (!checkCollision(newPiece, state.board)) {
      return { ...state, piece: newPiece };
    }
    return state;
  };

  const rotatePiece = (state: TetrisState): TetrisState => {
    if (state.gameOver) return state;
    const newPiece = { ...state.piece, shape: rotate(state.piece.shape) };
    if (!checkCollision(newPiece, state.board)) {
      return { ...state, piece: newPiece };
    }
    return state;
  };

  const hardDrop = (state: TetrisState): TetrisState => {
    if (state.gameOver) return state;
    let newState = { ...state };
    while (!newState.gameOver) {
      const next = drop(newState);
      if (next === newState) break;
      newState = next;
    }
    return newState;
  };

  const draw = (canvas: HTMLCanvasElement | null, state: TetrisState) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, COLS * BLOCK_SIZE, ROWS * BLOCK_SIZE);

    ctx.strokeStyle = `${state.color}33`;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * BLOCK_SIZE, 0);
      ctx.lineTo(x * BLOCK_SIZE, ROWS * BLOCK_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * BLOCK_SIZE);
      ctx.lineTo(COLS * BLOCK_SIZE, y * BLOCK_SIZE);
      ctx.stroke();
    }

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (state.board[y][x]) {
          ctx.fillStyle = state.board[y][x]!;
          ctx.fillRect(x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
        }
      }
    }

    for (let y = 0; y < state.piece.shape.length; y++) {
      for (let x = 0; x < state.piece.shape[y].length; x++) {
        if (state.piece.shape[y][x]) {
          const drawX = (state.piece.x + x) * BLOCK_SIZE;
          const drawY = (state.piece.y + y) * BLOCK_SIZE;
          ctx.fillStyle = state.piece.color;
          ctx.shadowColor = state.piece.color;
          ctx.shadowBlur = 10;
          ctx.fillRect(drawX + 1, drawY + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
          ctx.shadowBlur = 0;
        }
      }
    }

    if (state.gameOver) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.fillRect(0, 0, COLS * BLOCK_SIZE, ROWS * BLOCK_SIZE);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px Orbitron';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', COLS * BLOCK_SIZE / 2, ROWS * BLOCK_SIZE / 2);
    }
  };

  useEffect(() => {
    draw(canvas1Ref.current, state1);
  }, [state1]);

  useEffect(() => {
    draw(canvas2Ref.current, state2);
  }, [state2]);

  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const interval1 = setInterval(() => {
      setState1(prev => drop(prev));
    }, Math.max(100, 500 - state1.level * 50));

    const interval2 = setInterval(() => {
      setState2(prev => drop(prev));
    }, Math.max(100, 500 - state2.level * 50));

    return () => {
      clearInterval(interval1);
      clearInterval(interval2);
    };
  }, [gameStatus, state1.level, state2.level]);

  useEffect(() => {
    if (gameStatus !== 'playing') return;
    if (state1.gameOver && state2.gameOver) {
      setGameStatus('finished');
      setWinner(state1.score > state2.score ? state1.name : state1.score < state2.score ? state2.name : '平局');
    } else if (state1.gameOver) {
      setGameStatus('finished');
      setWinner(state2.name);
    } else if (state2.gameOver) {
      setGameStatus('finished');
      setWinner(state1.name);
    }
  }, [state1.gameOver, state2.gameOver, state1.score, state2.score, gameStatus]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatus !== 'playing') return;

      const gameKeys = ['a', 'd', 's', 'w', ' ', 'arrowleft', 'arrowright', 'arrowdown', 'arrowup', '0'];
      if (!gameKeys.includes(e.key.toLowerCase())) return;
      
      e.preventDefault();

      switch (e.key.toLowerCase()) {
        case 'a': setState1(prev => move(prev, -1)); break;
        case 'd': setState1(prev => move(prev, 1)); break;
        case 's': setState1(prev => drop(prev)); break;
        case 'w': setState1(prev => rotatePiece(prev)); break;
        case ' ': setState1(prev => hardDrop(prev)); break;
        case 'arrowleft': setState2(prev => move(prev, -1)); break;
        case 'arrowright': setState2(prev => move(prev, 1)); break;
        case 'arrowdown': setState2(prev => drop(prev)); break;
        case 'arrowup': setState2(prev => rotatePiece(prev)); break;
        case '0': setState2(prev => hardDrop(prev)); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus]);

  const startGame = () => {
    setState1(createInitialState('#00ff88', currentConfig.player1.name));
    setState2(createInitialState('#8b5cf6', currentConfig.player2.name));
    setWinner(null);
    setGameStatus('playing');
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-6 py-8">
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
          俄罗斯方块对战
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-primary">{state1.name}</h3>
              <div className="text-right">
                <div className="text-2xl font-bold text-white font-mono">{state1.score}</div>
                <div className="text-sm text-gray-400">Level {state1.level}</div>
              </div>
            </div>
            <div className="flex justify-center">
              <canvas
                ref={canvas1Ref}
                width={COLS * BLOCK_SIZE}
                height={ROWS * BLOCK_SIZE}
                className="rounded-lg neon-border"
              />
            </div>
          </div>

          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-secondary">{state2.name}</h3>
              <div className="text-right">
                <div className="text-2xl font-bold text-white font-mono">{state2.score}</div>
                <div className="text-sm text-gray-400">Level {state2.level}</div>
              </div>
            </div>
            <div className="flex justify-center">
              <canvas
                ref={canvas2Ref}
                width={COLS * BLOCK_SIZE}
                height={ROWS * BLOCK_SIZE}
                className="rounded-lg neon-border"
                style={{ borderColor: 'rgba(139, 92, 246, 0.3)' }}
              />
            </div>
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
              {state1.name}: {state1.score} 分 | {state2.name}: {state2.score} 分
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

        <div className="glass-card rounded-xl p-6 mt-8 max-w-3xl mx-auto">
          <h3 className="text-xl font-bold mb-4 text-white text-center">操作说明</h3>
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <h4 className="font-bold text-primary mb-3">{state1.name}</h4>
              <div className="grid grid-cols-4 gap-2 justify-items-center text-gray-300">
                <span className="font-mono text-primary">W</span>
                <span className="font-mono text-primary">A</span>
                <span className="font-mono text-primary">S</span>
                <span className="font-mono text-primary">空格</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">旋转 | 左 | 下 | 硬降</div>
            </div>
            <div className="text-center">
              <h4 className="font-bold text-secondary mb-3">{state2.name}</h4>
              <div className="grid grid-cols-4 gap-2 justify-items-center text-gray-300">
                <span className="font-mono text-secondary">↑</span>
                <span className="font-mono text-secondary">←</span>
                <span className="font-mono text-secondary">↓</span>
                <span className="font-mono text-secondary">0</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">旋转 | 左 | 下 | 硬降</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TetrisGame;
