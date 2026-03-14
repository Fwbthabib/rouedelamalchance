import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Home from './pages/Home';

const Players = lazy(() => import('./pages/Players'));
const TeamDraw = lazy(() => import('./pages/TeamDraw'));
const Scores = lazy(() => import('./pages/Scores'));
const Malchance = lazy(() => import('./pages/Malchance'));
const History = lazy(() => import('./pages/History'));
const Stats = lazy(() => import('./pages/Stats'));

function PageLoader() {
  return <div className="page-loader">Chargement...</div>;
}

function App() {
  return (
    <ErrorBoundary>
      <GameProvider>
        <BrowserRouter>
          <div className="app">
            <Navbar />
            <main className="main-content">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/joueurs" element={<Players />} />
                  <Route path="/tirage" element={<TeamDraw />} />
                  <Route path="/scores" element={<Scores />} />
                  <Route path="/malchance" element={<Malchance />} />
                  <Route path="/historique" element={<History />} />
                  <Route path="/stats" element={<Stats />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </BrowserRouter>
      </GameProvider>
    </ErrorBoundary>
  );
}

export default App;
