import React, { useState, useEffect, useContext } from 'react';
import styled, { keyframes } from 'styled-components';
import { ModalPane, ModalHook, ModalName } from './ModalPane';
import { Sub, White, Red, Green } from '../../components/Text';
import _ from 'lodash';
import {
  Planet,
  Upgrade,
  EthAddress,
  UpgradeBranch,
} from '../../_types/global/GlobalTypes';
import {
  getPlanetRank,
  getPlanetShortHash,
  isFullRank,
} from '../../utils/Utils';
import { BranchIcon, RightarrowIcon } from '../Icons';
import dfstyles from '../../styles/dfstyles';
import GameUIManagerContext from '../board/GameUIManagerContext';
import GameUIManager from '../board/GameUIManager';
import { getIconClass, UpgradeIdx } from './UpgradeInfoPane';
import { getPlanetTitle, getPlanetName } from '../../utils/ProcgenUtils';
import { emptyAddress } from '../../utils/CheckedTypeUtils';
import { TooltipTrigger } from './Tooltip';
import { TooltipName } from '../../utils/WindowManager';

const UpgradeDetailsWrapper = styled.div`
  width: 30em;
  min-height: 20em;
`;
const Message = styled.div`
  height: 100%;
  width: 27em;
  text-align: center;
`;
const SECTION_MARGIN = '0.75em';
const SectionTitle = styled.div`
  display: flex;
  flex-direction: row;
  margin-top: ${SECTION_MARGIN};

  & > span:nth-child(2n + 1) {
    // not the arrow
    flex-grow: 1;
    & > span {
      display: inline-block;
    }
  }

  & > span:nth-child(2) {
    // arrow
    text-align: center;
    & svg path {
      fill: ${dfstyles.colors.subtext};
    }
  }
  & > span:last-child {
    text-align: right;
  }
`;
const SectionVis = styled.div`
  margin-top: ${SECTION_MARGIN};
`;

const fadeBlue = keyframes`
  from {
    background: ${dfstyles.colors.dfblue}; 
    outline: 1px solid ${dfstyles.colors.dfblue};
  }
  to {
    background: ${dfstyles.colors.subtext};
    outline: 1px solid ${dfstyles.colors.subtext};
  }
`;
const fadeBlueOutline = keyframes`
  from {outline: 1px solid ${dfstyles.colors.dfblue};}
  to {outline: 1px solid ${dfstyles.colors.subtext};}
`;
const _VisRow = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  & > div {
    margin-right: 0.5em;
    &:last-child {
      margin-right: 0;
    }
  }

  & .visrow-icon {
    width: 1.5em;
    display: flex;
    flex-direction: row;
    align-items: center;
  }
  & .visrow-name {
    width: 9em;
  }
  & .visrow-bars {
    flex-grow: 1;
    display: flex;
    flex-direction: row;
    & span {
      flex-grow: 1;
      height: 0.6em;
      display: inline-block;
      outline-offset: -1px;
      outline: 1px solid ${dfstyles.colors.subtext};
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
      &.available {
        animation: ${fadeBlueOutline} 1s ${dfstyles.game.styles.animProps};
      }
      &.selected {
        animation: ${fadeBlue} 1s ${dfstyles.game.styles.animProps};
      }
    }
  }
`;

const _VisName = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;
const SectionPreview = styled.div`
  margin-top: ${SECTION_MARGIN};
`;
const StatRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  &.statrow-mtop {
    margin-top: 0.5em;
  }

  & > span {
    margin-left: 0.2em;

    &:nth-child(1) {
      color: ${dfstyles.colors.subtext};
      margin-left: 0;
      width: 9em;
    }
    &:nth-child(2),
    &:nth-child(4) {
      text-align: center;
      width: 6em;
      flex-grow: 1;
    }
    &:nth-child(3) {
      // arrow
      text-align: center;
      width: 1.5em;
      & svg path {
        fill: ${dfstyles.colors.subtext};
      }
    }
    &:nth-child(5) {
      width: 5em;
      text-align: right;
    }
  }

  &.upgrade-willupdate {
    background: ${dfstyles.colors.backgroundlight};
  }
`;

const SectionBuy = styled.div`
  margin-top: ${SECTION_MARGIN};
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  & > span:nth-child(2) {
    flex-grow: 1;
    text-align: right;
  }

  & > span:last-child {
    margin-left: 0.75em;
    text-align: right;
    & .btn-upgrade {
      display: inline-block;
      border-radius: 3px;
      padding: 0 0.3em;
      border: 1px solid ${dfstyles.colors.text};
      transition: background 0.2s, colors 0.2s;
      &:hover {
        color: ${dfstyles.colors.background};
        background: ${dfstyles.colors.text};
        cursor: pointer;
      }
      &:active {
        ${dfstyles.game.styles.active};
      }

      &.btn-disabled,
      &.btn-disabled:hover,
      &.btn-disabled:active {
        color: ${dfstyles.colors.subtext};
        background: none;
        border: 1px solid ${dfstyles.colors.subtext};
        cursor: default;
        filter: none;
      }
    }
  }
`;

const VisName = ({
  planet,
  branch,
}: {
  planet: Planet | null;
  branch: number;
}) => {
  if (!planet) return <Sub>oops</Sub>;
  return (
    <_VisName>
      <Sub>{['Silver', 'Population', 'Range'][branch]}</Sub>
      <Sub>
        (Lv<White>{planet.upgradeState[branch]}</White>)
      </Sub>
    </_VisName>
  );
};

// this is [branch, level] - max is [i, 4]
type UpgradeIdxHook = [UpgradeIdx | null, (idx: UpgradeIdx | null) => void];

const compareIdx = (
  idx1: UpgradeIdx | null,
  idx2: UpgradeIdx | null
): boolean => {
  if (idx1 === null && idx2 === null) return true;
  if (idx1 === null || idx2 === null) return false;

  return idx1[0] === idx2[0] && idx1[1] === idx2[1];
};

function VisRow({
  branch,
  planet,
  idxHook: [idx, setIdx],
}: {
  branch: number;
  planet: Planet | null;
  idxHook: UpgradeIdxHook;
}) {
  return (
    <_VisRow>
      <div className='visrow-icon'>
        <BranchIcon branch={branch} />
      </div>
      <div className='visrow-name'>
        <VisName planet={planet} branch={branch} />
      </div>
      <div className='visrow-bars'>
        {_.range(1, 5).map((i) => (
          <span
            key={i}
            className={
              compareIdx([branch, i], idx)
                ? 'selected'
                : getIconClass(planet, [branch, i])
            }
            onClick={() => {
              const toClass = getIconClass(planet, [branch, i]);
              if (toClass === 'available') setIdx([branch, i]);
            }}
          />
        ))}
      </div>
    </_VisRow>
  );
}
export default function UpgradeDetailsPane({
  hook,
  selected,
}: {
  selected: Planet | null;
  hook: ModalHook;
}) {
  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);

  // this guy gets reused in diff windows; consider putting it into a parent
  const [account, setAccount] = useState<EthAddress | null>(null); // consider moving this one to parent

  useEffect(() => {
    if (!uiManager) return;
    setAccount(uiManager.getAccount());
  }, [uiManager]);

  // this is the actively "selected" upgrade
  const idxHook = useState<UpgradeIdx | null>(null);
  const [idx, setIdx] = idxHook;

  // try to make sure idx always points at a valid upgrade
  useEffect(() => {
    if (isFullRank(selected)) {
      setIdx(null);
      return;
    }

    if (!selected || selected.planetLevel === 0) {
      setIdx(null);
      return;
    }
    if (!idx || getIconClass(selected, idx) !== 'available') {
      for (const branch of _.range(0, 3)) {
        for (const step of _.range(1, 5)) {
          if (getIconClass(selected, [branch, step]) === 'available') {
            setIdx([branch, step]);
            return;
          }
        }
      }
    }
  }, [idx, selected, setIdx]);

  const [upgrade, setUpgrade] = useState<Upgrade | null>(null);
  useEffect(() => {
    if (!uiManager) return;
    if (!idx) {
      setUpgrade(null);
      return;
    }

    setUpgrade(uiManager.getUpgrade(idx[0], idx[1] - 1));
  }, [idx, uiManager]);

  const getStat = (stat: string): number => {
    if (!selected) return 0;
    if (stat === 'silverGrowth') return selected[stat] * 60;
    else return selected[stat];
  };
  const stat = (stat: string): string => {
    const num = getStat(stat);
    if (num % 1.0 === 0) return num.toFixed(0);
    else return num.toFixed(2);
  };
  const getStatFuture = (stat: string): number => {
    if (!selected) return 0;
    if (!upgrade) return selected[stat];

    let mult = 1;
    if (stat === 'populationCap') {
      mult = upgrade.popCapMultiplier / 100;
    } else if (stat === 'populationGrowth') {
      mult = upgrade.popGroMultiplier / 100;
    } else if (stat === 'silverCap') {
      mult = upgrade.silverCapMultiplier / 100;
    } else if (stat === 'silverGrowth') {
      mult = upgrade.silverGroMultiplier / 100;
    } else if (stat === 'silverMax') {
      mult = upgrade.silverMaxMultiplier / 100;
    } else if (stat === 'range') {
      mult = upgrade.rangeMultiplier / 100;
    }

    return getStat(stat) * mult;
  };
  const statFuture = (stat: string): string => {
    const num = getStatFuture(stat);
    if (num % 1.0 === 0) return num.toFixed(0);
    else return num.toFixed(2);
  };
  const getStatDiff = (stat: string): number => {
    return getStatFuture(stat) - getStat(stat);
  };
  const statDiff = (stat: string): React.ReactNode => {
    const diff: number = getStatDiff(stat);
    if (diff < 0) return <Red>{diff.toFixed(2)}</Red>;
    else if (diff > 0) return <Green>+{diff.toFixed(2)}</Green>;
    else return <Sub>0</Sub>;
  };

  const updateClass = (stat: string): string => {
    if (getStat(stat) !== getStatFuture(stat)) return 'upgrade-willupdate';
    return '';
  };

  const getSilver = (): number => {
    if (!selected) return 0;
    return selected.silver;
  };

  const getSilverNeeded = (): number => {
    if (!selected || !uiManager || !upgrade) return 0;
    return (
      uiManager.getDefaultSilver(selected) *
      (upgrade.silverCostMultiplier / 100)
    );
  };

  const canUpgrade = (): boolean => {
    if (!selected) return false;
    const silverNeeded = getSilverNeeded();
    const silver = getSilver();
    if (silverNeeded === 0) return false;
    if (isFullRank(selected)) return false;
    return silver >= silverNeeded;
  };

  const isPending = (): boolean => {
    if (!selected) return true;
    if (!selected.unconfirmedUpgrades) return false;
    return selected.unconfirmedUpgrades.length > 0;
  };

  const StatRowFilled = ({
    title,
    stat: myStat,
    className,
  }: {
    title: string;
    stat: string;
    className?: string;
  }) => {
    return (
      <StatRow className={[className, updateClass(myStat)].join(' ')}>
        <span>{title}</span>
        <span>{stat(myStat)}</span>
        <span>
          <RightarrowIcon />
        </span>
        <span>{statFuture(myStat)}</span>
        <span>{statDiff(myStat)}</span>
      </StatRow>
    );
  };

  const doUpgrade = (_e) => {
    if (!canUpgrade() || !uiManager || !selected || !idx) return;
    uiManager.upgrade(selected, idx[0]);
  };

  const getRank = (): number => {
    return getPlanetRank(selected);
  };

  const getRankFuture = (): number => {
    if (!idx || !selected) return getRank();
    const myObj = _.cloneDeep(selected);
    myObj.upgradeState[idx[0]]++;
    return getPlanetRank(myObj);
  };

  const getTitle = (): string => {
    return getPlanetTitle(selected);
  };

  const getTitleFuture = (): string => {
    if (!idx || !selected) return getTitle();
    const myObj = _.cloneDeep(selected);
    myObj.upgradeState[idx[0]]++;
    return getPlanetTitle(myObj);
  };

  const windowName = (): string => {
    const str = 'Upgrade Details';
    if (!uiManager) return str;
    if (!selected || !account) return str;
    const planetname = getPlanetName(selected);
    const shorthash = getPlanetShortHash(selected);
    const twitter = uiManager.getTwitter(selected.owner);

    if (selected.owner === emptyAddress)
      return `Unclaimed ${shorthash} ${planetname} - ${str}`;

    if (!twitter) return `${shorthash} ${planetname} - ${str}`;
    else return `@${twitter}'s ${shorthash} ${planetname} - ${str}`;
  };

  return (
    <ModalPane hook={hook} title={windowName()} name={ModalName.UpgradeDetails}>
      {selected && account && selected.owner === account ? (
        <UpgradeDetailsWrapper>
          <SectionTitle>
            <span>
              <span>{getTitle()}</span>
              <br />
              <Sub>
                (Rank{' '}
                <TooltipTrigger needsShift name={TooltipName.Upgrades}>
                  {getRank()}
                </TooltipTrigger>
                )
              </Sub>
            </span>
            <span>
              <RightarrowIcon />
            </span>
            <span>
              <span>{getTitleFuture()}</span>
              <br />
              <Sub>
                (Rank{' '}
                <TooltipTrigger needsShift name={TooltipName.Upgrades}>
                  {getRankFuture()}
                </TooltipTrigger>
                )
              </Sub>
            </span>
          </SectionTitle>

          <SectionVis>
            <VisRow
              branch={UpgradeBranch.Population}
              planet={selected}
              idxHook={idxHook}
            />
            <VisRow
              branch={UpgradeBranch.Silver}
              planet={selected}
              idxHook={idxHook}
            />
            <VisRow
              branch={UpgradeBranch.Range}
              planet={selected}
              idxHook={idxHook}
            />
          </SectionVis>

          <SectionPreview>
            <StatRowFilled stat='populationCap' title='Population Cap' />
            <StatRowFilled stat='populationGrowth' title='Population Growth' />
            <StatRowFilled
              className='statrow-mtop'
              stat='silverCap'
              title='Silver Cap'
            />
            <StatRowFilled title='Silver Max' stat='silverMax' />
            <StatRowFilled title='Silver Growth' stat='silverGrowth' />
            <StatRowFilled
              className='statrow-mtop'
              title='Range'
              stat='range'
            />
          </SectionPreview>

          <SectionBuy>
            <span>
              <Sub>Silver Cost</Sub>
            </span>
            <span>
              {Math.floor(getSilver())} <Sub>/</Sub>{' '}
              {Math.ceil(getSilverNeeded())}
            </span>
            <span>
              <span
                className={[
                  'btn-upgrade',
                  !canUpgrade() || isPending() ? 'btn-disabled' : undefined,
                ].join(' ')}
                onClick={doUpgrade}
              >
                {isPending() ? 'Pending' : 'Upgrade'}
              </span>
            </span>
          </SectionBuy>
        </UpgradeDetailsWrapper>
      ) : (
        <Message>
          <p>Please select a planet you own to view upgrades.</p>
        </Message>
      )}
    </ModalPane>
  );
}
