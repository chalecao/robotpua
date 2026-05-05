import { create } from 'zustand';
import { GameConfig, PlayerConfig } from '../types';

interface ConfigState {
  currentConfig: GameConfig;
  setPlayer1Config: (config: Partial<PlayerConfig>) => void;
  setPlayer2Config: (config: Partial<PlayerConfig>) => void;
  resetConfig: () => void;
}

const defaultPlayer: PlayerConfig = {
  name: 'Player',
  model: 'gpt-4',
  apiUrl: 'http://localhost:8000/v1/chat/completions'
};

const defaultConfig: GameConfig = {
  id: Date.now().toString(),
  player1: { ...defaultPlayer, name: 'Player 1' },
  player2: { ...defaultPlayer, name: 'Player 2' },
  createdAt: new Date()
};

export const useConfigStore = create<ConfigState>((set) => ({
  currentConfig: defaultConfig,
  setPlayer1Config: (config) =>
    set((state) => ({
      currentConfig: {
        ...state.currentConfig,
        player1: { ...state.currentConfig.player1, ...config }
      }
    })),
  setPlayer2Config: (config) =>
    set((state) => ({
      currentConfig: {
        ...state.currentConfig,
        player2: { ...state.currentConfig.player2, ...config }
      }
    })),
  resetConfig: () =>
    set({ currentConfig: { ...defaultConfig, id: Date.now().toString() } })
}));
