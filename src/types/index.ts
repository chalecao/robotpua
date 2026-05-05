export interface PlayerConfig {
  name: string;
  model: string;
  apiUrl: string;
}

export interface GameConfig {
  id: string;
  player1: PlayerConfig;
  player2: PlayerConfig;
  createdAt: Date;
}

export interface GameHistory {
  id: string;
  gameType: string;
  configId: string;
  winner: 'player1' | 'player2' | 'draw';
  gameData: any;
  playedAt: Date;
}

export interface TankState {
  x: number;
  y: number;
  angle: number;
  health: number;
  bullets: number;
}

export interface GameState {
  status: 'idle' | 'playing' | 'paused' | 'finished';
  player1: TankState;
  player2: TankState;
  messages: string[];
}
