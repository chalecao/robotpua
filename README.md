# ROBOT-PUA - 大模型指挥机器人对战平台

一个纯前端的大模型指挥机器人对战游戏平台，支持多种对战模式。

## 功能特性

- 🎮 **多种对战游戏**
  - 1v1 坦克对战
  - 贪吃蛇对战
  - 俄罗斯方块对战

- 🤖 **AI 指挥**
  - 支持配置本地大模型 API
  - 大模型实时指挥机器人

- 💾 **本地存储**
  - 使用 IndexedDB 存储配置
  - 无需后端服务器

- 🎨 **赛博朋克风格**
  - 霓虹光晕效果
  - 网格背景
  - 渐变配色

## 技术栈

- **框架** - React 18 + TypeScript
- **构建工具** - Vite
- **样式** - Tailwind CSS
- **状态管理** - Zustand
- **游戏引擎** - Canvas 原生绘制
- **数据存储** - IndexedDB

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 即可使用。

### 构建生产版本

```bash
npm run build
```

## 使用说明

### 首页

- 查看项目介绍
- 选择对战游戏
- 查看功能特性

### 模型配置

- 配置双方玩家的大模型参数
- 自定义玩家名称、模型、API 地址
- 保存配置到本地

### 游戏玩法

#### 坦克对战

**玩家1 (绿)**
- W/A/S/D - 移动
- Q/E - 旋转
- 空格 - 开火

**玩家2 (紫)**
- 方向键 - 移动
- ,/. - 旋转
- / - 开火

#### 贪吃蛇对战

**玩家1 (绿)**
- W/A/S/D - 移动

**玩家2 (紫)**
- 方向键 - 移动

#### 俄罗斯方块对战

**玩家1 (绿)**
- W - 旋转
- A/D - 左右移动
- S - 加速下落
- 空格 - 硬降

**玩家2 (紫)**
- ↑ - 旋转
- ←/→ - 左右移动
- ↓ - 加速下落
- 0 - 硬降

## 项目结构

```
robot-pua/
├── src/
│   ├── components/       # 组件
│   │   └── Navbar.tsx
│   ├── pages/           # 页面
│   │   ├── Home.tsx
│   │   ├── Config.tsx
│   │   ├── TankGame.tsx
│   │   ├── SnakeGame.tsx
│   │   └── TetrisGame.tsx
│   ├── store/           # 状态管理
│   │   └── useConfigStore.ts
│   ├── types/           # 类型定义
│   │   └── index.ts
│   ├── utils/           # 工具函数
│   │   └── db.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 未来规划

- [ ] 接入真实的大模型 API
- [ ] 添加更多游戏类型
- [ ] 支持游戏录像回放
- [ ] 添加排行榜功能
- [ ] 支持网络对战

## 许可证

MIT
