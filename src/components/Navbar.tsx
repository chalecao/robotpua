import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="glass-card border-b border-primary/30 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            ROBOT-PUA
          </div>
        </Link>
        
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-300 hover:text-primary transition-colors"
          >
            <span>🏠</span>
            <span>首页</span>
          </Link>
          <Link
            to="/config"
            className="flex items-center gap-2 text-gray-300 hover:text-primary transition-colors"
          >
            <span>⚙️</span>
            <span>模型配置</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
