import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { ModalPane, ModalHook, ModalName } from './ModalPane';
import GameUIManager from '../board/GameUIManager';
import GameUIManagerContext from '../board/GameUIManagerContext';
import { Planet, PlanetResource } from '../../_types/global/GlobalTypes';
import UIEmitter, { UIEmitterEvent } from '../../utils/UIEmitter';
import { SidebarPane } from '../GameWindowComponents';
import { Sub, Space } from '../../components/Text';
import { getPlanetShortHash, formatNumber } from '../../utils/Utils';
import dfstyles from '../../styles/dfstyles';
import { getPlanetName, getPlanetColors } from '../../utils/ProcgenUtils';
import _ from 'lodash';

const DexWrapperSmall = styled.div`
  max-height: 12em;
  overflow-y: scroll;

  & > span > div {
    // rows
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;

    & > span:last-child {
      width: 2.5em;
      height: 30px;
    }

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
  const getFormatName = (planet: Planet): string => {
    const myName = getPlanetName(planet);
    if (myName.length >= 20) return myName.substring(0, 17) + '...';
    else return myName;
  };
  return (
    <PlanetLink planet={planet}>
      <div className={className}>
        <Sub>{getFormatName(planet)}</Sub>
        <span>
          <PlanetThumb planet={planet} />
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
      // short hash
      margin-right: 0.5em;
    }
    &:nth-child(3) {
      flex-grow: 1;
    }
    &:nth-child(4) {
      // planet level
      margin-right: 1em;
      width: 3em;
    }
    // pop, silver
    &:nth-child(5) {
      width: 4.5em;
    }
    &:nth-child(6) {
      width: 4.5em;
    }
    // score
    &:nth-child(7) {
      width: 7em;
    }
  }

  &.title-row > span {
    color: ${dfstyles.colors.subtext};

    &.selected {
      text-decoration: underline;
      color: ${dfstyles.colors.text};
    }

    &:hover {
      text-decoration: underline;
      cursor: pointer;
    }

    &.selected {
      text-decoration: underline;
    }

    &:nth-child(1),
    &:nth-child(2) {
      text-decoration: none;
      pointer-events: none;
      &:hover {
        text-decoration: none;
      }
    }
  }

  &:hover:not(.title-row) {
    cursor: pointer;
    & > span:nth-child(3) {
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
const _PlanetThumb = styled.div`
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

export function PlanetThumb({ planet }: { planet: Planet }) {
  const radius = 5 + 3 * planet.planetLevel;
  // const radius = 5 + 3 * PlanetLevel.MAX;
  const { baseColor, backgroundColor } = getPlanetColors(planet);

  const ringW = radius * 1.5;
  const ringH = Math.max(2, ringW / 7);

  return (
    <_PlanetThumb>
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
    </_PlanetThumb>
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
  return (
    <PlanetLink planet={planet}>
      <DexRow className={className}>
        <span>
          <PlanetThumb planet={planet} />
        </span>
        <span>
          <Sub>{getPlanetShortHash(planet)}</Sub>
        </span>
        <span>
          <span>{getPlanetName(planet)}</span>
        </span>
        <span>
          <Sub>lv</Sub> {planet.planetLevel}
        </span>
        <span>{formatNumber(planet.population)}</span>
        <span>{formatNumber(planet.silver)}</span>
        <span>
          {formatNumber(score)}
          <Sub> pts</Sub>
        </span>
      </DexRow>
    </PlanetLink>
  );
}

export function PlanetLink({
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

enum Columns {
  Name = 0,
  Level = 1,
  Pop = 2,
  Silver = 3,
  Points = 4,
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

  const [sortBy, setSortBy] = useState<Columns>(Columns.Points);

  const scoreFn = (a: [Planet, number], b: [Planet, number]): number => {
    const [scoreA, scoreB] = [getPlanetScore(...a), getPlanetScore(...b)];
    return scoreB - scoreA;
  };

  const nameFn = (a: [Planet, number], b: [Planet, number]): number => {
    const [nameA, nameB] = [getPlanetName(a[0]), getPlanetName(b[0])];
    return nameA.localeCompare(nameB);
  };

  const popFn = (a: [Planet, number], b: [Planet, number]): number => {
    return b[0].population - a[0].population;
  };

  const silverFn = (a: [Planet, number], b: [Planet, number]): number => {
    return b[0].silver - a[0].silver;
  };

  const levelFn = (a: [Planet, number], b: [Planet, number]): number => {
    return b[0].planetLevel - a[0].planetLevel;
  };

  const sortingFn = (a: [Planet, number], b: [Planet, number]): number => {
    const [scoreA, scoreB] = [getPlanetScore(...a), getPlanetScore(...b)];
    const myFn = [nameFn, levelFn, popFn, silverFn, scoreFn][sortBy];
    if (scoreA !== scoreB) return myFn(a, b);

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
        <DexRow className='title-row'>
          <span></span> {/* empty icon cell */}
          <span>
            <Space length={5} />
          </span>{' '}
          {/* empty icon cell */}
          <span
            className={sortBy === Columns.Name ? 'selected' : ''}
            onClick={() => setSortBy(Columns.Name)}
          >
            Planet Name
          </span>
          <span
            className={sortBy === Columns.Level ? 'selected' : ''}
            onClick={() => setSortBy(Columns.Level)}
          >
            Level
          </span>
          <span
            className={sortBy === Columns.Pop ? 'selected' : ''}
            onClick={() => setSortBy(Columns.Pop)}
          >
            Pop.
          </span>
          <span
            className={sortBy === Columns.Silver ? 'selected' : ''}
            onClick={() => setSortBy(Columns.Silver)}
          >
            Silver
          </span>
          <span
            className={sortBy === Columns.Points ? 'selected' : ''}
            onClick={() => setSortBy(Columns.Points)}
          >
            Points
          </span>
        </DexRow>
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
