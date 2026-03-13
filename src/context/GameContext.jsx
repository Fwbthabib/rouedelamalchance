import { createContext, useContext, useReducer, useEffect } from 'react';

const GameContext = createContext();

const STORAGE_KEY = 'rouedelamalchance_data';

function loadState() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load state:', e);
  }
  return null;
}

const defaultState = {
  players: [],
  gages: [
    'Regarder un film catastrophique (note < 3/10)',
    'Regarder un spectacle de magie gênant',
    'Regarder une comédie musicale en entier',
    'Préparer un exposé de 10 min sur un sujet imposé',
    'Regarder un film de Noël en plein été',
    'Écouter un album entier de musique bizarre',
    'Regarder 2h de télé-réalité',
    'Regarder un documentaire sur les escargots',
  ],
  teamSize: 2,
  drawMode: 'fill',
  scores: {},
  immunePlayer: null,
  currentGameTeams: [],
  teamScores: {},
  losingTeam: null,
  history: [],
  lastLosers: [],
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'ADD_PLAYER':
      if (state.players.includes(action.payload)) return state;
      return { ...state, players: [...state.players, action.payload] };
    case 'REMOVE_PLAYER': {
      const newScores = { ...state.scores };
      delete newScores[action.payload];
      return {
        ...state,
        players: state.players.filter((p) => p !== action.payload),
        scores: newScores,
      };
    }
    case 'ADD_GAGE':
      if (state.gages.includes(action.payload)) return state;
      return { ...state, gages: [...state.gages, action.payload] };
    case 'REMOVE_GAGE':
      return { ...state, gages: state.gages.filter((g) => g !== action.payload) };
    case 'SET_TEAM_SIZE':
      return { ...state, teamSize: action.payload };
    case 'SET_DRAW_MODE':
      return { ...state, drawMode: action.payload };
    case 'SET_SCORE':
      return {
        ...state,
        scores: { ...state.scores, [action.payload.player]: action.payload.score },
      };
    case 'SET_IMMUNE_PLAYER':
      return { ...state, immunePlayer: action.payload };
    case 'SET_CURRENT_GAME_TEAMS':
      return { ...state, currentGameTeams: action.payload };
    case 'SET_TEAM_SCORES':
      return { ...state, teamScores: action.payload };
    case 'SET_LOSING_TEAM':
      return { ...state, losingTeam: action.payload };
    case 'ADD_HISTORY_ENTRY':
      return {
        ...state,
        history: [action.payload, ...state.history],
        lastLosers: action.payload.losers,
      };
    case 'RESET_GAME':
      return {
        ...state,
        scores: {},
        immunePlayer: null,
        currentGameTeams: [],
        teamScores: {},
        losingTeam: null,
      };
    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const saved = loadState();
  const [state, dispatch] = useReducer(gameReducer, saved || defaultState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  }, [state]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
}
