import React, { useContext, useState, useEffect } from 'react';

import GameUIManager from '../board/GameUIManager';
import GameUIManagerContext from '../board/GameUIManagerContext';
import { Planet } from '../../_types/global/GlobalTypes';
import UIEmitter, { UIEmitterEvent } from '../../utils/UIEmitter';

const styles = {
  select: {
    background: '#888',
    border: '1px solid white',
    borderRadius: '2px',
  },
  button: {
    background: '#888',
    border: '1px solid white',
  },
};

export default function UpgradeWindow() {
  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);

  const [planet, setPlanet] = useState<Planet | null>(null);

  const [branch, setBranch] = useState<number>(0);

  useEffect(() => {
    const update = () => {
      if (!uiManager) {
        console.error('GameUIManager context is null');
        return;
      }
      const selectedPlanet = uiManager.getSelectedPlanet();
      setPlanet(selectedPlanet);
    };

    const uiEmitter = UIEmitter.getInstance();
    uiEmitter.on(UIEmitterEvent.GamePlanetSelected, update);

    return () => {
      const uiEmitter = UIEmitter.getInstance();
      uiEmitter.removeListener(UIEmitterEvent.GamePlanetSelected, update);
    };
  }, [uiManager]);

  const sendUpgrade = () => {
    if (!uiManager || !planet) {
      console.error('there was a problem!');
      return;
    }
    uiManager.upgrade(planet, branch);
  };

  const updateBranch = (eventValue: string) => {
    setBranch(parseInt(eventValue));
  };

  const branchIsUpgradeable = (planet: Planet, branch: number) => {
    if (planet.planetLevel === 0) {
      return false;
    }
    if (planet.upgradeState[branch] === 2) {
      // can't upgrade if both other branches are > lvl 2
      const others = [0, 1, 2].filter((x) => x !== branch);
      for (const other of others) {
        if (planet.upgradeState[other] < 3) return true;
      }
      return false;
    }
    return true;
  };

  let currentlyUpgrading: number | null = null;
  if (planet) {
    if (planet.unconfirmedUpgrades.length > 0) {
      currentlyUpgrading = planet.unconfirmedUpgrades[0].upgradeBranch;
    }
  }

  return planet ? (
    <div>
      <p>Current upgrade state: {planet.upgradeState}.</p>
      {currentlyUpgrading !== null ? (
        <p>{`Waiting for upgrade on branch ${currentlyUpgrading}`}</p>
      ) : (
        <div>
          <select
            style={styles.select}
            onChange={(e) => updateBranch(e.currentTarget.value)}
            value={branch}
          >
            {branchIsUpgradeable(planet, 0) ? (
              <option value={0}>0</option>
            ) : null}
            {branchIsUpgradeable(planet, 1) ? (
              <option value={1}>1</option>
            ) : null}
            {branchIsUpgradeable(planet, 2) ? (
              <option value={2}>2</option>
            ) : null}
          </select>

          <button onClick={sendUpgrade} style={styles.button}>
            Upgrade planet
          </button>
        </div>
      )}
    </div>
  ) : (
    <p>Select a planet to view upgrades.</p>
  );
}
