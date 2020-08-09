import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { ModalPane, ModalHook, ModalName } from './ModalPane';
import GameUIManager from '../board/GameUIManager';
import GameUIManagerContext from '../board/GameUIManagerContext';
import { Planet, PlanetResource } from '../../_types/global/GlobalTypes';
import UIEmitter, { UIEmitterEvent } from '../../utils/UIEmitter';
import { SidebarPane } from '../GameWindowComponents';
import { Sub } from '../../components/Text';
import { getPlanetShortHash, formatNumber } from '../../utils/Utils';
import dfstyles from '../../styles/dfstyles';
import { getPlanetName, getPlanetColors } from '../../utils/ProcgenUtils';
import _ from 'lodash';

const DexWrapperSmall = styled.div`
  max-height: 12em;
  overflow-y: scroll;

  & > span > div {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    &.selected {
      & > span:first-child {
        text-decoration: underline;
        color: ${dfstyles.colors.text};
      }
    }
    &:hover {
      cursor: pointer;
      & > span:first-child {
        color: ${dfstyles.colors.text};
      }
    }
  }
`;

function DexSmallRow({
  planet,
  className,
}: {
  planet: Planet;
  className: string;
}) {
  return (
    <PlanetLink planet={planet}>
      <div className={className}>
        <Sub>{getPlanetShortHash(planet)}</Sub>
        <span>
          <Sub>lv </Sub>
          {planet.planetLevel}
        </span>
      </div>
    </PlanetLink>
  );
}

const DexWrapper = styled.div`
  width: 38em;
  min-height: 15em;
  height: fit-content;
  max-height: 25.2em; // exact size so a row is cut off
  overflow-y: scroll;
`;

const DexRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  height: 30px; // 5 + 3 * 7 + 4px

  & > span {
    &:nth-child(1) {
      display: flex;
      flex-direction: row;
      justify-content: space-around;
      align-items: center;
      width: 3em;
      position: relative; // for planetcircle
    }
    &:nth-child(2) {
      flex-grow: 1;
    }
    &:nth-child(3) {
      // planet level
      margin-right: 1em;
      width: 2em;
    }
    // coords
    &:nth-child(4) {
      text-align: left;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      width: 4em;
    }
    &:nth-child(5) {
      text-align: right;
      width: 4em;
    }
    // score
    &:nth-child(6) {
      text-align: right;
      width: 7em;
    }
  }
  &:hover {
    cursor: pointer;
    & > span:nth-child(2) span:last-child {
      text-decoration: underline;
    }
  }

  &.selected {
    background: ${dfstyles.colors.backgroundlight};
    & > span:nth-child(2) span:last-child {
      text-decoration: underline;
    }
  }
`;
const _PlanetCircle = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  & > span {
    // these guys wrap the icons
    position: absolute;
    width: 100%;
    height: 100%;

    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-around;
  }
`;

function PlanetCircle({ planet }: { planet: Planet }) {
  const radius = 5 + 3 * planet.planetLevel;
  // const radius = 5 + 3 * PlanetLevel.MAX;
  const { baseColor, backgroundColor } = getPlanetColors(planet);

  const ringW = radius * 1.5;
  const ringH = Math.max(2, ringW / 7);

  return (
    <_PlanetCircle>
      <span>
        <span
          style={{
            width: radius + 'px',
            height: radius + 'px',
            borderRadius: radius / 2 + 'px',
            background: baseColor,
          }}
        ></span>
      </span>
      <span>
        <span
          style={{
            width: ringW + 'px',
            height: ringH + 'px',
            borderRadius: ringW * 2 + 'px',
            background:
              planet.planetResource === PlanetResource.SILVER
                ? backgroundColor
                : 'none',
          }}
        ></span>
      </span>
    </_PlanetCircle>
  );
}

const getPlanetScore = (planet: Planet, rank: number) => {
  const baseScore = rank < 10 ? planet.populationCap : 0;
  const totalSilver = planet.silverSpent + planet.silver;
  return baseScore + totalSilver / 10;
};

function DexEntry({
  planet,
  className,
  score,
}: {
  planet: Planet;
  className: string;
  score: number;
}) {
  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);
  const loc = uiManager?.getLocationOfPlanet(planet.locationId);

  let x, y;
  if (loc) {
    x = loc.coords.x;
    y = loc.coords.y;
  } else x = y = 0;

  return (
    <PlanetLink planet={planet}>
      <DexRow className={className}>
        <span>
          <PlanetCircle planet={planet} />
        </span>
        <span>
          <Sub>{getPlanetShortHash(planet)}</Sub>{' '}
          <span>{getPlanetName(planet)}</span>
        </span>
        <span>
          <Sub>lv</Sub> {planet.planetLevel}
        </span>
        <span>
          <span>
            <Sub>(</Sub>
            {x}
          </span>
          <Sub>,</Sub>
        </span>
        <span>
          {y}
          <Sub>)</Sub>
        </span>
        <span>
          {formatNumber(score)}
          <Sub> pts</Sub>
        </span>
      </DexRow>
    </PlanetLink>
  );
}

function PlanetLink({
  planet,
  children,
}: {
  planet: Planet;
  children: React.ReactNode;
}) {
  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);
  const uiEmitter = UIEmitter.getInstance();

  return (
    <span
      onClick={() => {
        uiManager?.setSelectedPlanet(planet);
        uiEmitter.emit(UIEmitterEvent.CenterPlanet, planet);
      }}
    >
      {children}
    </span>
  );
}
export default function PlanetDexPane({
  hook,
  small,
  selected,
  _updater: tick,
}: {
  small?: boolean;
  selected: Planet | null;
  hook: ModalHook;
  _updater: number;
}) {
  const [visible, _setVisible] = hook;
  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);

  const sortingFn = (a: [Planet, number], b: [Planet, number]): number => {
    const [scoreA, scoreB] = [getPlanetScore(...a), getPlanetScore(...b)];
    if (scoreA !== scoreB) return scoreB - scoreA;

    if (!uiManager) return 0;
    const locA = uiManager.getLocationOfPlanet(a[0].locationId);
    const locB = uiManager.getLocationOfPlanet(a[0].locationId);
    if (!locA || !locB) return 0;
    const { x: xA, y: yA } = locA.coords;
    const { x: xB, y: yB } = locB.coords;

    if (xA !== xB) return xA - xB;
    return yA - yB;
  };

  const [planets, setPlanets] = useState<Planet[]>([]);

  // update planet list on open / close
  useEffect(() => {
    if (!uiManager) return;
    const myAddr = uiManager.getAccount();
    if (!myAddr) return;
    const ownedPlanets = uiManager
      .getAllOwnedPlanets()
      .filter((planet) => planet.owner === myAddr);
    setPlanets(ownedPlanets);
  }, [visible, uiManager]);

  useEffect(() => {
    if (tick % 5 !== 0) return;
    if (!uiManager) return;
    const myAddr = uiManager.getAccount();
    if (!myAddr) return;
    const ownedPlanets = uiManager
      .getAllOwnedPlanets()
      .filter((planet) => planet.owner === myAddr);
    setPlanets(ownedPlanets);
  }, [tick, uiManager]);

  if (small)
    return (
      <SidebarPane title='Planet List'>
        <DexWrapperSmall>
          {planets
            .sort((a, b) => b.populationCap - a.populationCap)
            .map((planet, i) => [planet, i]) // pass the index
            .sort(sortingFn) // sort using planet + index
            .map(([planet, i]: [Planet, number]) => (
              <DexSmallRow
                className={
                  selected?.locationId === planet.locationId ? 'selected' : ''
                }
                key={i}
                planet={planet}
              />
            ))}
        </DexWrapperSmall>
      </SidebarPane>
    );
  return (
    <ModalPane hook={hook} title='Planet Dex' name={ModalName.PlanetDex}>
      <DexWrapper>
        {planets
          .sort((a, b) => b.populationCap - a.populationCap)
          .map((planet, i) => [planet, i]) // pass the index
          .sort(sortingFn) // sort using planet + index
          .map(([planet, i]: [Planet, number]) => (
            <DexEntry
              key={i}
              planet={planet}
              score={getPlanetScore(planet, i)}
              className={
                selected?.locationId === planet.locationId ? 'selected' : ''
              }
            />
          ))}
      </DexWrapper>
    </ModalPane>
  );
}
