import React, { useContext, useState } from 'react';
import {
  SpiralPattern,
  MiningPatternType,
  MiningPattern,
} from '../../utils/MiningPatterns';

import GameUIManager from '../board/GameUIManager';
import GameUIManagerContext from '../board/GameUIManagerContext';

import CoordsWindow from './CoordsWindow';
import { WorldCoords } from '../../utils/Coordinates';
import { MIN_CHUNK_SIZE } from '../../utils/constants';

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

export default function MiningWindow() {
  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);

  // TODO: don't do this, this is bad
  const homeCoords: WorldCoords = uiManager
    ? uiManager.getHomeCoords()
    : { x: 0, y: 0 };

  const homePattern: MiningPattern = new SpiralPattern(
    homeCoords,
    MIN_CHUNK_SIZE
  );

  const [patternType, setPatternType] = useState<MiningPatternType>(
    MiningPatternType.Home
  );
  /*
  // const [pattern, setPattern] = useState<MiningPattern>(homePattern);

  const homeCoords = new WorldCoords(
    homeChunk.chunkX * MIN_CHUNK_SIZE,
    homeChunk.chunkY * MIN_CHUNK_SIZE
  );
  const [spiralCoords, setSpiralCoords] = useState<WorldCoords>(homeCoords);
  */
  const [spiralCenter, setSpiralCenter] = useState<WorldCoords>(homeCoords);

  function updateSpiralChunk(index: number, value: string) {
    const numberValue: number = parseInt(value) || 0;
    const newCenter = { x: spiralCenter.x, y: spiralCenter.y };

    if (index === 0) {
      // coming from x
      newCenter.x = numberValue;
    } /* if index == 1 */ else {
      // coming from y
      newCenter.y = numberValue;
    }

    const myPattern = new SpiralPattern(newCenter, MIN_CHUNK_SIZE);
    setSpiralCenter(newCenter);
    if (uiManager) uiManager.setMiningPattern(myPattern);
  }

  function updatePattern(eventValue: string) {
    const myType: MiningPatternType = parseInt(eventValue) as MiningPatternType;
    setPatternType(myType);

    let myPattern: MiningPattern = homePattern; // default to home
    if (myType === MiningPatternType.Target) {
      myPattern = new SpiralPattern(spiralCenter, MIN_CHUNK_SIZE);
    }

    if (uiManager) uiManager.setMiningPattern(myPattern);
  }

  const getVisible: (MiningPatternType) => string = (myType) => {
    return myType === patternType ? 'block' : 'none';
  };

  return (
    <div>
      <p>
        Hovering over: <CoordsWindow />
      </p>

      <br />

      {/* Header */}
      <p>
        Pattern:{' '}
        <select
          style={styles.select}
          onChange={(e) => updatePattern(e.currentTarget.value)}
          value={patternType}
        >
          <option value={MiningPatternType.Home}>Home</option>
          <option value={MiningPatternType.Target}>Target</option>
        </select>
      </p>

      <br />

      {/* Description */}
      <div>
        <div style={{ display: getVisible(MiningPatternType.Home) }}>
          <p>
            Your HOME is ({homeCoords.x}, {homeCoords.y}).
          </p>
        </div>

        <div style={{ display: getVisible(MiningPatternType.Target) }}>
          <p>Target coordinates:</p>

          <p>
            (
            <input
              style={styles.input}
              type='text'
              onKeyUp={(e) => updateSpiralChunk(0, e.currentTarget.value)}
            />
            ,{' '}
            <input
              style={styles.input}
              type='text'
              onKeyUp={(e) => updateSpiralChunk(1, e.currentTarget.value)}
            />
            )
          </p>
        </div>
      </div>
    </div>
  );
}
