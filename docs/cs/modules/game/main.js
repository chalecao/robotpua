/**
 * @module main
 * @description 游戏入口文件：初始化 GameLoop 并启动游戏
 */
import { GameLoop } from './GameLoop.js';

const game = new GameLoop();
game.start();
