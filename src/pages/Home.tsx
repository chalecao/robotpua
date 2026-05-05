import { Link } from 'react-router-dom';
import { Target, Zap, Square, Trophy } from 'lucide-react';
import Navbar from '../components/Navbar';

const games = [
  {
    id: 'tank',
    title: '1v1 坦克对战',
    description: '两辆坦克在战场上对决，看谁的大模型更有战术',
    icon: Target,
    color: 'text-primary',
    route: '/game/tank'
  },
  {
    id: 'snake',
    title: '贪吃蛇对战',
    description: '双方各自操作贪吃蛇，比谁吃得更多',
    icon: Zap,
    color: 'text-secondary',
    route: '/game/snake'
  },
  {
    id: 'tetris',
    title: '俄罗斯方块对战',
    description: '经典的俄罗斯方块，看谁坚持得更久',
    icon: Square,
    color: 'text-accent',
    route: '/game/tetris'
  }
];

const Home = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 py-16">
        <section className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            大模型指挥机器人对战
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            让不同的大模型指挥机器人进行各种趣味对战，体验 AI 的策略思维
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/config"
              className="neon-button text-lg px-8 py-4 rounded-lg"
            >
              配置模型
            </Link>
            <Link
              to="/game/tank"
              className="neon-button neon-button-purple text-lg px-8 py-4 rounded-lg"
            >
              开始游戏
            </Link>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-10 text-white">
            <span className="text-primary">⚡</span> 对战游戏
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {games.map((game) => {
              const Icon = game.icon;
              return (
                <Link
                  key={game.id}
                  to={game.route}
                  className="glass-card rounded-xl p-8 hover:scale-105 transition-all duration-300 group"
                >
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon size={32} className={game.color} />
                  </div>
                  <h3 className="text-2xl font-bold text-center mb-4 text-white">
                    {game.title}
                  </h3>
                  <p className="text-gray-400 text-center">
                    {game.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="glass-card rounded-xl p-8 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6 text-white">
            <Trophy className="inline mr-2" /> 特色亮点
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">🎮</div>
              <h3 className="font-semibold text-white mb-2">多种游戏</h3>
              <p className="text-gray-400">支持多种对战模式</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-secondary mb-2">🤖</div>
              <h3 className="font-semibold text-white mb-2">AI 指挥</h3>
              <p className="text-gray-400">大模型实时指挥机器人</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-accent mb-2">💾</div>
              <h3 className="font-semibold text-white mb-2">本地存储</h3>
              <p className="text-gray-400">无需服务器，纯前端</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
