import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Save, RotateCcw, ChevronLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useConfigStore } from '../store/useConfigStore';
import { db } from '../utils/db';

const Config = () => {
  const { currentConfig, setPlayer1Config, setPlayer2Config, resetConfig } = useConfigStore();

  useEffect(() => {
    db.init().catch(console.error);
  }, []);

  const handleSave = async () => {
    await db.saveConfig(currentConfig);
    alert('配置已保存！');
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors"
          >
            <ChevronLeft size={20} />
            <span>返回首页</span>
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-10 text-center text-white">
          模型配置
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="glass-card rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-primary flex items-center gap-2">
              🟢 玩家 1
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  名称
                </label>
                <input
                  type="text"
                  value={currentConfig.player1.name}
                  onChange={(e) => setPlayer1Config({ name: e.target.value })}
                  className="w-full px-4 py-3 bg-surface border border-primary/30 rounded-lg text-white focus:outline-none focus:border-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  模型
                </label>
                <input
                  type="text"
                  value={currentConfig.player1.model}
                  onChange={(e) => setPlayer1Config({ model: e.target.value })}
                  className="w-full px-4 py-3 bg-surface border border-primary/30 rounded-lg text-white focus:outline-none focus:border-primary font-mono"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  API 地址
                </label>
                <input
                  type="text"
                  value={currentConfig.player1.apiUrl}
                  onChange={(e) => setPlayer1Config({ apiUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-surface border border-primary/30 rounded-lg text-white focus:outline-none focus:border-primary font-mono text-sm"
                />
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-secondary flex items-center gap-2">
              🟣 玩家 2
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  名称
                </label>
                <input
                  type="text"
                  value={currentConfig.player2.name}
                  onChange={(e) => setPlayer2Config({ name: e.target.value })}
                  className="w-full px-4 py-3 bg-surface border border-secondary/30 rounded-lg text-white focus:outline-none focus:border-secondary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  模型
                </label>
                <input
                  type="text"
                  value={currentConfig.player2.model}
                  onChange={(e) => setPlayer2Config({ model: e.target.value })}
                  className="w-full px-4 py-3 bg-surface border border-secondary/30 rounded-lg text-white focus:outline-none focus:border-secondary font-mono"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  API 地址
                </label>
                <input
                  type="text"
                  value={currentConfig.player2.apiUrl}
                  onChange={(e) => setPlayer2Config({ apiUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-surface border border-secondary/30 rounded-lg text-white focus:outline-none focus:border-secondary font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-6">
          <button
            onClick={resetConfig}
            className="neon-button neon-button-purple flex items-center gap-2 rounded-lg"
          >
            <RotateCcw size={20} />
            重置
          </button>
          <button
            onClick={handleSave}
            className="neon-button flex items-center gap-2 rounded-lg"
          >
            <Save size={20} />
            保存配置
          </button>
        </div>
      </main>
    </div>
  );
};

export default Config;
