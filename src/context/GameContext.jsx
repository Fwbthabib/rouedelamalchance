import { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';

const GameContext = createContext();

const STORAGE_KEY = 'rouedelamalchance_data';

function loadState() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Migration: si les gages sont encore un tableau de strings, on migre
      if (parsed.gages && parsed.gages.length > 0 && typeof parsed.gages[0] === 'string') {
        parsed.gages = parsed.gages.map((g) => ({ text: g, category: 'Divers' }));
      }
      // Migration: ajouter regularPlayers si absent
      if (!parsed.regularPlayers) {
        parsed.regularPlayers = [...(parsed.players || [])];
      }
      // Migration: ajouter playerGages si absent
      if (!parsed.playerGages) {
        parsed.playerGages = {};
      }
      // Migration: ajouter maxUses aux gages globaux si absent
      if (parsed.gages) {
        parsed.gages = parsed.gages.map((g) => g.maxUses !== undefined ? g : { ...g, maxUses: 1 });
      }
      // Migration: ajouter maxUses/uses aux playerGages si absent
      if (parsed.playerGages) {
        for (const player of Object.keys(parsed.playerGages)) {
          parsed.playerGages[player] = parsed.playerGages[player].map((g) =>
            g.maxUses !== undefined ? g : { ...g, maxUses: 1, uses: g.uses || 0 }
          );
        }
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load state:', e);
  }
  return null;
}

const defaultState = {
  players: [],
  regularPlayers: [],
  gages: [
    { text: 'Regarder un film catastrophique (note < 3/10)', category: 'Films', maxUses: 1 },
    { text: 'Regarder un film de Noël en plein été', category: 'Films', maxUses: 1 },
    { text: 'Regarder un spectacle de magie gênant', category: 'Spectacles', maxUses: 1 },
    { text: 'Regarder une comédie musicale en entier', category: 'Spectacles', maxUses: 1 },
    { text: 'Préparer un exposé de 10 min sur un sujet imposé', category: 'Exposés', maxUses: 1 },
    { text: 'Écouter un album entier de musique bizarre', category: 'Divers', maxUses: 1 },
    { text: 'Regarder 2h de télé-réalité', category: 'Divers', maxUses: 1 },
    { text: 'Regarder un documentaire sur les escargots', category: 'Films', maxUses: 1 },
  ],
  gageCategories: ['Films', 'Spectacles', 'Exposés', 'Divers'],
  playerGages: {},
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
      if (state.players.some((p) => p.toLowerCase() === action.payload.toLowerCase())) return state;
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
    case 'ADD_REGULAR_PLAYER': {
      const name = action.payload;
      if (state.regularPlayers.some((p) => p.toLowerCase() === name.toLowerCase())) return state;
      const newPlayerGages = { ...state.playerGages };
      // Initialize with all global gages if new player
      if (!newPlayerGages[name]) {
        newPlayerGages[name] = state.gages.map((g) => ({ ...g, uses: 0 }));
      }
      return {
        ...state,
        regularPlayers: [...state.regularPlayers, name],
        playerGages: newPlayerGages,
      };
    }
    case 'REMOVE_REGULAR_PLAYER': {
      const newPlayerGages = { ...state.playerGages };
      delete newPlayerGages[action.payload];
      return {
        ...state,
        regularPlayers: state.regularPlayers.filter((p) => p !== action.payload),
        players: state.players.filter((p) => p !== action.payload),
        playerGages: newPlayerGages,
      };
    }
    case 'ADD_PLAYER_GAGE': {
      // payload: { player, gage: { text, category, maxUses } }
      const { player, gage } = action.payload;
      const currentGages = state.playerGages[player] || [];
      if (currentGages.some((g) => g.text === gage.text)) return state;
      return {
        ...state,
        playerGages: { ...state.playerGages, [player]: [...currentGages, { ...gage, maxUses: gage.maxUses ?? 1, uses: 0 }] },
      };
    }
    case 'REMOVE_PLAYER_GAGE': {
      // payload: { player, gageText }
      const { player, gageText } = action.payload;
      const current = state.playerGages[player] || [];
      return {
        ...state,
        playerGages: { ...state.playerGages, [player]: current.filter((g) => g.text !== gageText) },
      };
    }
    case 'CONSUME_PLAYER_GAGE': {
      // payload: { player, gageText } — increment uses, remove only when maxUses reached
      const { player, gageText } = action.payload;
      const curr = state.playerGages[player] || [];
      const updatedGages = curr
        .map((g) => g.text === gageText ? { ...g, uses: (g.uses || 0) + 1 } : g)
        .filter((g) => g.maxUses === 0 || g.uses < g.maxUses); // maxUses 0 = infinite
      return {
        ...state,
        playerGages: { ...state.playerGages, [player]: updatedGages },
      };
    }
    case 'UNCONSUME_PLAYER_GAGE': {
      // payload: { player, gageText, gage } — undo a consume: decrement uses or re-add
      const { player, gageText, gage } = action.payload;
      const currGages = state.playerGages[player] || [];
      const existing = currGages.find((g) => g.text === gageText);
      let updatedGages;
      if (existing) {
        // Gage still in list (infinite or multi-use), decrement uses
        updatedGages = currGages.map((g) => g.text === gageText ? { ...g, uses: Math.max(0, (g.uses || 0) - 1) } : g);
      } else {
        // Gage was removed (maxUses reached), re-add with uses decremented
        updatedGages = [...currGages, { ...gage, uses: Math.max(0, (gage.maxUses || 1) - 1) }];
      }
      return {
        ...state,
        playerGages: { ...state.playerGages, [player]: updatedGages },
      };
    }
    case 'ADD_GAGE':
      if (state.gages.some((g) => g.text === action.payload.text)) return state;
      return { ...state, gages: [...state.gages, { ...action.payload, maxUses: action.payload.maxUses ?? 1 }] };
    case 'REMOVE_GAGE':
      return { ...state, gages: state.gages.filter((g) => g.text !== action.payload) };
    case 'ADD_GAGE_CATEGORY':
      if (state.gageCategories.includes(action.payload)) return state;
      return { ...state, gageCategories: [...state.gageCategories, action.payload] };
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
    case 'RESET_ALL_DATA':
      return { ...defaultState };
    case 'IMPORT_DATA':
      return { ...defaultState, ...action.payload };
    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const saved = loadState();
  const [state, dispatch] = useReducer(gameReducer, saved || defaultState);
  const timerRef = useRef(null);

  // Debounce localStorage writes (300ms)
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error('Failed to save state:', e);
      }
    }, 300);
    return () => clearTimeout(timerRef.current);
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
