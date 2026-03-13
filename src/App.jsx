import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Players from './pages/Players';
import TeamDraw from './pages/TeamDraw';
import Scores from './pages/Scores';
import Malchance from './pages/Malchance';
import History from './pages/History';

function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/joueurs" element={<Players />} />
              <Route path="/tirage" element={<TeamDraw />} />
              <Route path="/scores" element={<Scores />} />
              <Route path="/malchance" element={<Malchance />} />
              <Route path="/historique" element={<History />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </GameProvider>
  );
}

export default App;
