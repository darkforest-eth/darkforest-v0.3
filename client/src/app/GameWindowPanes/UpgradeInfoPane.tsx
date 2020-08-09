import _ from 'lodash';
import React from 'react';
import styled from 'styled-components';
import { Sub } from '../../components/Text';
import dfstyles from '../../styles/dfstyles';
import { getPlanetClass, getPlanetRank } from '../../utils/Utils';
import { getPlanetQuote, getPlanetTitle } from '../../utils/ProcgenUtils';
import {
  Planet,
  UpgradeBranch,
  PlanetClass,
} from '../../_types/global/GlobalTypes';
import { ToolbarPane } from '../GameWindowComponents';
import { ModalHook, ModalName } from './ModalPane';
import { BranchIcon } from '../Icons';

const UpgradeInfoWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  width: 18em;

  & .upgrade-quote {
    flex-grow: 1;
    line-height: 1.25em;
    margin-top: 0.2em;
  }

  & .upgrade-vis {
    line-height: 1em;
    font-size: 14pt;
    width: 100%;
    margin: 0.5em 0;
  }
`;

const _UpgradeVis = styled.div`
  width: 100%;
`;

const _VisRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  & > span {
  }
  & > div {
    margin-left: 0.5em;
    display: flex;
    flex-direction: row;
    justify-content: end;
    align-items: center;

    & > span {
      width: 2.5em;
      height: 0.6em;
      display: inline-block;
      outline: 1px solid ${dfstyles.colors.subtext};
      outline-offset: -1px;
      margin-left: 0.2em;

      &.filled {
        background: ${dfstyles.colors.text};
      }
      &.disabled {
        background: ${dfstyles.colors.subbesttext};
        outline: 1px solid ${dfstyles.colors.subbesttext};
      }
      &.none {
      }
    }
  }
`;

export type UpgradeIdx = [number, number];

export const getIconClass = (
  planet: Planet | null,
  idx: UpgradeIdx
): string => {
  const [branch, step] = idx; // step \in [1, 5)

  const upgradeState = (idx: number): number => {
    if (!planet) return 0;
    return planet.upgradeState[idx];
  };
  if (!planet) return 'disabled';
  if (planet.planetLevel === 0) return 'disabled';

  const main = getPlanetClass(planet);

  if (step <= upgradeState(branch)) return 'filled';
  if (main !== PlanetClass.None && branch !== main && step > 2)
    return 'disabled';
  if (step === upgradeState(branch) + 1) return 'available';
  return 'none';
};

function VisRow({ branch, planet }: { branch: number; planet: Planet | null }) {
  return (
    <_VisRow>
      <span>
        <BranchIcon branch={branch} />
      </span>
      <div>
        {_.range(1, 5).map((i) => (
          <span
            key={i}
            className={
              planet && planet.planetLevel === 0
                ? 'disabled'
                : getIconClass(planet, [branch, i])
            }
          ></span>
        ))}
      </div>
    </_VisRow>
  );
}

function UpgradeVis({ planet }: { planet: Planet | null }) {
  return (
    <_UpgradeVis>
      <VisRow planet={planet} branch={UpgradeBranch.Population} />
      <VisRow planet={planet} branch={UpgradeBranch.Silver} />
      <VisRow planet={planet} branch={UpgradeBranch.Range} />
    </_UpgradeVis>
  );
}

export default function UpgradeInfoPane({
  selected,
  hook,
}: {
  selected: Planet | null;
  hook: ModalHook;
}) {
  return (
    <ToolbarPane
      title={'Upgrade Info'}
      headerStyle={{ color: dfstyles.colors.subtext }}
      hook={hook}
      modal={ModalName.UpgradeDetails}
    >
      <UpgradeInfoWrapper>
        <div className='upgrade-title'>
          <p>
            {getPlanetTitle(selected)}{' '}
            <Sub>(Rank {getPlanetRank(selected)})</Sub>
          </p>
        </div>
        <div className='upgrade-vis'>
          <UpgradeVis planet={selected} />
        </div>
        <div className='upgrade-quote'>
          <p>
            <Sub>
              <em>"{getPlanetQuote(selected).quote}"</em>{' '}
            </Sub>
            <Sub>- {getPlanetQuote(selected).author}</Sub>
          </p>
        </div>
      </UpgradeInfoWrapper>
    </ToolbarPane>
  );
}
