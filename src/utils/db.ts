import { GameConfig, GameHistory } from '../types';

const DB_NAME = 'RobotPUA';
const DB_VERSION = 1;
const CONFIG_STORE = 'game_configs';
const HISTORY_STORE = 'game_history';

class Database {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(CONFIG_STORE)) {
          db.createObjectStore(CONFIG_STORE, { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains(HISTORY_STORE)) {
          db.createObjectStore(HISTORY_STORE, { keyPath: 'id' });
        }
      };
    });
  }

  async saveConfig(config: GameConfig): Promise<void> {
    if (!this.db) throw new Error('DB not initialized');
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([CONFIG_STORE], 'readwrite');
      const store = tx.objectStore(CONFIG_STORE);
      const request = store.put(config);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getConfig(id: string): Promise<GameConfig | undefined> {
    if (!this.db) throw new Error('DB not initialized');
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([CONFIG_STORE], 'readonly');
      const store = tx.objectStore(CONFIG_STORE);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllConfigs(): Promise<GameConfig[]> {
    if (!this.db) throw new Error('DB not initialized');
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([CONFIG_STORE], 'readonly');
      const store = tx.objectStore(CONFIG_STORE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveHistory(history: GameHistory): Promise<void> {
    if (!this.db) throw new Error('DB not initialized');
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([HISTORY_STORE], 'readwrite');
      const store = tx.objectStore(HISTORY_STORE);
      const request = store.put(history);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllHistory(): Promise<GameHistory[]> {
    if (!this.db) throw new Error('DB not initialized');
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([HISTORY_STORE], 'readonly');
      const store = tx.objectStore(HISTORY_STORE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new Database();
