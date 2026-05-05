import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Config from './pages/Config'
import TankGame from './pages/TankGame'
import SnakeGame from './pages/SnakeGame'
import TetrisGame from './pages/TetrisGame'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/config" element={<Config />} />
        <Route path="/game/tank" element={<TankGame />} />
        <Route path="/game/snake" element={<SnakeGame />} />
        <Route path="/game/tetris" element={<TetrisGame />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
