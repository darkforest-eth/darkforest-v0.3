import React, { useContext, useState, useEffect } from 'react';
import { Planet } from '../../_types/global/GlobalTypes';

import GameUIManager from '../board/GameUIManager';
import GameUIManagerContext from '../board/GameUIManagerContext';
import UIEmitter, { UIEmitterEvent } from '../../utils/UIEmitter';

const styles = {
  select: {
    background: '#888',
    border: '1px solid white',
    borderRadius: '2px',
  },
  input: {
    background: '#888',
    border: '1px solid white',
    width: '4em',
  },
};

const DEFAULT_FORCES_PERCENTAGE = 50;
const DEFAULT_SILVER_PERCENTAGE = 0;

export default function FleetWindow() {
  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);
  const [planet, setPlanet] = useState<Planet | null>(null);
  const [forcesPercentage, setForcesPercentage] = useState<number>(
    DEFAULT_FORCES_PERCENTAGE
  );
  const [silverPercentage, setSilverPercentage] = useState<number>(
    DEFAULT_SILVER_PERCENTAGE
  );

  useEffect(() => {
    const update = () => {
      if (!uiManager) {
        console.error('GameUIManager context is null');
        return;
      }
      const selectedPlanet = uiManager.getSelectedPlanet();
      if (selectedPlanet !== null) {
        setPlanet(selectedPlanet);
        setForcesPercentage(
          uiManager.getForcesSending(selectedPlanet.locationId)
        );
        setSilverPercentage(
          uiManager.getSilverSending(selectedPlanet.locationId)
        );
      } else {
        setPlanet(null);
        setForcesPercentage(DEFAULT_FORCES_PERCENTAGE);
        setSilverPercentage(DEFAULT_SILVER_PERCENTAGE);
      }
    };

    const uiEmitter = UIEmitter.getInstance();
    uiEmitter.on(UIEmitterEvent.GamePlanetSelected, update);

    return () => {
      const uiEmitter = UIEmitter.getInstance();
      uiEmitter.removeListener(UIEmitterEvent.GamePlanetSelected, update);
    };
  }, [uiManager]);

  function updateForcesPercentage(eventValue: string) {
    if (uiManager && planet) {
      const forcesPercentage = parseInt(eventValue);
      uiManager.setForcesSending(planet.locationId, forcesPercentage);
      setForcesPercentage(forcesPercentage);
    } else {
      console.error('had trouble connecting to uiManager');
    }
  }

  function updateSilverPercentage(eventValue: string) {
    if (uiManager && planet) {
      const silverPercentage = parseInt(eventValue);
      uiManager.setSilverSending(planet.locationId, silverPercentage);
      setSilverPercentage(silverPercentage);
    } else {
      console.error('had trouble connecting to uiManager');
    }
  }

  function getForcesString(percentage: number, planet: Planet): string {
    return `${percentage}% (${Math.floor(
      (planet.population * percentage) / 100
    )}/
    ${Math.floor(planet.population)})`;
  }

  function getSilverString(percentage: number, planet: Planet): string {
    if (planet.silver === 0) {
      return '-';
    }
    return `${percentage}% (${Math.floor((planet.silver * percentage) / 100)}/
    ${Math.floor(planet.silver)})`;
  }

  return (
    <div>
      {planet ? (
        <div>
          {/* Header */}
          <p>
            Forces Percentage:{' '}
            <select
              style={styles.select}
              onChange={(e) => updateForcesPercentage(e.currentTarget.value)}
              value={forcesPercentage}
            >
              <option value={10}>{getForcesString(10, planet)}</option>
              <option value={25}>{getForcesString(25, planet)}</option>
              <option value={50}>{getForcesString(50, planet)}</option>
              <option value={75}>{getForcesString(75, planet)}</option>
              <option value={90}>{getForcesString(90, planet)}</option>
            </select>
          </p>

          {planet.silver > 0 && (
            <p>
              Silver Percentage:{' '}
              <select
                style={styles.select}
                onChange={(e) => updateSilverPercentage(e.currentTarget.value)}
                value={silverPercentage}
              >
                <option value={0}>{getSilverString(0, planet)}</option>
                <option value={10}>{getSilverString(10, planet)}</option>
                <option value={25}>{getSilverString(25, planet)}</option>
                <option value={50}>{getSilverString(50, planet)}</option>
                <option value={75}>{getSilverString(75, planet)}</option>
                <option value={90}>{getSilverString(90, planet)}</option>
                <option value={100}>{getSilverString(100, planet)}</option>
              </select>
            </p>
          )}
        </div>
      ) : (
        <div>
          <p>Select a planet to manage fleets.</p>
        </div>
      )}
    </div>
  );
}
