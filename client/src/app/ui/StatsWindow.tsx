import React, { useContext, useState, useEffect } from 'react';

import GameUIManager, { GameUIManagerEvent } from '../board/GameUIManager';
import GameUIManagerContext from '../board/GameUIManagerContext';

export default function StatsWindow() {
  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);

  const [energy, setEnergy] = useState<number>(0);

  useEffect(() => {
    const update = () => {
      const energy = uiManager ? uiManager.getEnergy() : NaN;
      setEnergy(energy);
    };
    const intervalId = setInterval(update, 500);
    update();

    uiManager?.on(GameUIManagerEvent.EnergyUpdate, update);

    return () => {
      clearInterval(intervalId);
      uiManager?.removeListener(GameUIManagerEvent.EnergyUpdate, update);
    };
  }, [uiManager]);

  return (
    <React.Fragment>
      <p>User energy: {Math.floor(energy)}</p>
    </React.Fragment>
  );
}
