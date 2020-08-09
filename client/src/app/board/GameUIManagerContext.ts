import React from 'react';
import GameUIManager from './GameUIManager';

const GameUIManagerContext = React.createContext<GameUIManager | null>(null);

export default GameUIManagerContext;
