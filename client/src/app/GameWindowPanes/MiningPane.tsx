import React, { useContext, useState, useEffect } from 'react';
import { SidebarPane } from '../GameWindowComponents';
import styled from 'styled-components';
import GameUIManager from '../board/GameUIManager';
import GameUIManagerContext from '../board/GameUIManagerContext';
import { TargetIcon, PlayIcon, PauseIcon } from '../Icons';
import { formatNumber } from '../../utils/Utils';
import WindowManager, {
  CursorState,
  WindowManagerEvent,
} from '../../utils/WindowManager';
import UIEmitter, { UIEmitterEvent } from '../../utils/UIEmitter';
import { WorldCoords } from '../../utils/Coordinates';
import { SpiralPattern } from '../../utils/MiningPatterns';
import { MIN_CHUNK_SIZE } from '../../utils/constants';
import { Sub } from '../../components/Text';
import { IconButton } from './ModalPane';
import dfstyles from '../../styles/dfstyles';

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  &.mining-mtop {
    margin-top: 0.5em;
  }

  & > span:first-child {
    margin-right: 6pt;
  }

  & p:last-child {
    flex-grow: 1;
    text-align: right;
  }

  & .fill-target {
    & > div {
      background: ${dfstyles.colors.text};
    }
    & svg path {
      fill: ${dfstyles.colors.background};
    }
  }
`;

export default function MiningPane({ _updater: ticks }: { _updater: number }) {
  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);
  const windowManager = WindowManager.getInstance();
  const uiEmitter = UIEmitter.getInstance();

  // const [patternType, setPatternType] = useState<MiningPatternType>(
  //   MiningPatternType.Home
  // );

  const [mining, setMining] = useState<boolean>(true);
  useEffect(() => {
    if (mining) uiManager?.startExplore();
    else uiManager?.stopExplore();
  }, [mining, uiManager]);

  const [pattern, setPattern] = useState<SpiralPattern | null>(null);
  useEffect(() => {
    if (!uiManager) return;
    setPattern(uiManager.getMiningPattern() as SpiralPattern | null);
  }, [uiManager]);

  useEffect(() => {
    const doMouseDown = (worldCoords) => {
      if (windowManager.getCursorState() === CursorState.Targeting) {
        windowManager.acceptInputForTarget(worldCoords);
      }
    };

    const updatePattern = (worldCoords: WorldCoords) => {
      const newpattern = new SpiralPattern(worldCoords, MIN_CHUNK_SIZE);
      uiManager?.setMiningPattern(newpattern);
      setPattern(newpattern);
    };

    uiEmitter.on(UIEmitterEvent.WorldMouseDown, doMouseDown);
    windowManager.on(WindowManagerEvent.MiningCoordsUpdate, updatePattern);
    return () => {
      uiEmitter.removeListener(UIEmitterEvent.WorldMouseDown, doMouseDown);
      windowManager.removeListener(
        WindowManagerEvent.MiningCoordsUpdate,
        updatePattern
      );
    };
  }, [uiEmitter, windowManager, uiManager]);

  const doTarget = (_e) => {
    if (windowManager.getCursorState() === CursorState.Targeting)
      windowManager.setCursorState(CursorState.Normal);
    else windowManager.setCursorState(CursorState.Targeting);
  };

  const getCorner = (pattern: SpiralPattern) => ({
    x: pattern.fromChunk.bottomLeft.x,
    y: pattern.fromChunk.bottomLeft.y,
  });

  return (
    <SidebarPane
      title={`Mining${mining ? '.'.repeat((ticks % 3) + 1) : ''}`}
      headerItems={
        <>
          <span
            className={
              'clickable' +
              (windowManager.getCursorState() === CursorState.Targeting
                ? ' fill-target'
                : '')
            }
            onClick={doTarget}
          >
            <IconButton>
              <TargetIcon />
            </IconButton>
          </span>
          <span onClick={() => setMining((b) => !b)} className='clickable'>
            <IconButton>{mining ? <PauseIcon /> : <PlayIcon />}</IconButton>
          </span>
        </>
      }
    >
      <Row>
        <p>
          <Sub># / sec</Sub>
        </p>
        <p>
          {mining && uiManager
            ? formatNumber(uiManager.getHashesPerSec())
            : '0'}
        </p>
      </Row>
      <Row className='mining-mtop'>
        <p>
          <Sub>Current</Sub>
        </p>
        <p>
          {pattern
            ? `(${getCorner(pattern).x}, ${getCorner(pattern).y})`
            : '(0, 0)'}
        </p>
      </Row>
      {/* <Row className='mining-mtop'>
        <span>
          <Sub>Coords</Sub>
        </span>
        <span>
          {pattern
            ? `(${getCorner(pattern).x}, ${getCorner(pattern).y})`
            : '(0, 0)'}
        </span>
      </Row>
      <Row>
        <span>
          <Sub>Chunk Size</Sub>
        </span>
        <span>{pattern ? pattern.chunkSideLength : '0'}</span>
      </Row> */}
    </SidebarPane>
  );
}
