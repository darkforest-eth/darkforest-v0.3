import React, { useContext, useState, useEffect } from 'react';
import { TooltipPane } from './Tooltip';
import { TooltipName } from '../../utils/WindowManager';
import {
  Planet,
  PlanetResource,
  EthAddress,
} from '../../_types/global/GlobalTypes';
import styled from 'styled-components';
import { Sub, Red, White, Green } from '../../components/Text';
import { getPlanetRank, isFullRank } from '../../utils/Utils';
import GameUIManager from '../board/GameUIManager';
import GameUIManagerContext from '../board/GameUIManagerContext';

const TooltipInfo = styled.div`
  & > div {
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    & > span:first-child {
      margin-right: 0.5em;
    }
  }
`;

export function TwitterHandleTooltipPane() {
  return (
    <TooltipPane name={TooltipName.TwitterHandle}>
      <Sub>
        You may connect your account to <White>Twitter</White>
        <br />
        to identify yourself on the <White>Leaderboard</White>.
      </Sub>
    </TooltipPane>
  );
}

export function RankTooltipPane() {
  return (
    <TooltipPane name={TooltipName.Rank}>
      <Sub>
        Your current rank, based on <White>score</White>.
      </Sub>
    </TooltipPane>
  );
}

export function ScoreTooltipTooltipPane() {
  return (
    <TooltipPane name={TooltipName.Score}>
      <Sub>
        Your current score. <White>Score</White> is calculated as the sum of the
        total <br />
        <White>Population Cap</White> of your top 10 planets plus 10 percent of
        your <br />
        planets' <White>total silver value</White>. (Cost of upgrades + current
        silver)
      </Sub>
    </TooltipPane>
  );
}

export function MiningPauseTooltipPane() {
  return (
    <TooltipPane name={TooltipName.MiningPause}>
      <Sub>
        Start / Stop your <White>miner</White>. Your explores the universe in
        chunks of <White>16</White> x <White>16</White>.
      </Sub>
    </TooltipPane>
  );
}

export function MiningTargetTooltipPane() {
  return (
    <TooltipPane name={TooltipName.MiningTarget}>
      <Sub>
        Change the location of your <White>miner</White>. Click anywhere on the{' '}
        <White>Game Screen</White>, <br />
        and your <White>miner</White> will start hashing around that chunk.
      </Sub>
    </TooltipPane>
  );
}

export function HashesPerSecTooltipPane() {
  return (
    <TooltipPane name={TooltipName.HashesPerSec}>
      <Sub>
        The speed of your <White>miner</White>, in <White>hashes</White> per
        second.
      </Sub>
    </TooltipPane>
  );
}

export function CurrentMiningTooltipPane() {
  return (
    <TooltipPane name={TooltipName.CurrentMining}>
      <Sub>
        The current coordinates of your <White>miner</White>.
      </Sub>
    </TooltipPane>
  );
}

export function BonusTooltipPane() {
  return (
    <TooltipPane name={TooltipName.Bonus}>
      <Green>This stat has been randomly doubled!</Green>
    </TooltipPane>
  );
}

export function SilverTooltipPane() {
  return (
    <TooltipPane name={TooltipName.Silver}>
      <Sub>
        <White>Silver:</White> the universe's monetary resource. It allows you
        to buy upgrades. <br />
        Only <White>1/4</White> of planets produce silver. Those that do grow
        linearly until their <White>Silver Cap</White>.<br />
        However, all planets can cache silver up until their{' '}
        <White>Silver Max</White>.
      </Sub>
    </TooltipPane>
  );
}

export function PopulationTooltipPane() {
  return (
    <TooltipPane name={TooltipName.Population}>
      <Sub>
        <White>Population:</White> the number of forces on a planet. Population
        allows you to make moves. <br />
        Population grows following an <White>S-curve</White>, and grows fastest
        at <White>50% capacity</White>.
        <br />
        <Red>Silver won't grow</Red> on planets until you reach{' '}
        <White>50% population</White>.
      </Sub>
    </TooltipPane>
  );
}

export function SelectedPopulationTooltipPane({
  selected,
}: {
  selected: Planet | null;
}) {
  return (
    <TooltipPane name={TooltipName.SelectedPopulation}>
      {selected ? (
        <TooltipInfo>
          <div>
            <Sub>Population:</Sub>
            <span>{selected.population}</span>
          </div>
          <div>
            <Sub>Growth:</Sub>
            <span>{selected.populationGrowth}</span>
          </div>
        </TooltipInfo>
      ) : (
        <>Select a planet to view more about its stats.</>
      )}
    </TooltipPane>
  );
}

export function PlanetRankTooltipPane({
  selected,
}: {
  selected: Planet | null;
}) {
  const rank = getPlanetRank(selected);
  return (
    <TooltipPane name={TooltipName.PlanetRank}>
      <Sub>
        This planet is{' '}
        <White>
          {isFullRank(selected) ? 'fully upgraded' : 'rank ' + rank}
        </White>
        !
      </Sub>
    </TooltipPane>
  );
}

export function MaxLevelTooltipPane() {
  return (
    <TooltipPane name={TooltipName.MaxLevel}>
      <Sub>
        This planet is <White>Level 7</White>, making it one of the <br />
        most powerful planets in the galaxy!
      </Sub>
    </TooltipPane>
  );
}

export function SilverProdTooltipPane() {
  return (
    <TooltipPane name={TooltipName.SilverProd}>
      <Sub>
        This planet produces <White>Silver</White>! Use it to buy upgrades!
      </Sub>
    </TooltipPane>
  );
}

export function SelectedSilverTooltipPane({
  selected,
}: {
  selected: Planet | null;
}) {
  return (
    <TooltipPane name={TooltipName.SelectedSilver}>
      {selected ? (
        <TooltipInfo>
          <div>
            <Sub>Silver:</Sub>
            <span>{selected.silver}</span>
          </div>
          <div>
            <Sub>Max:</Sub>
            <span>{selected.silverMax}</span>
          </div>
          {selected.planetResource === PlanetResource.SILVER ? (
            <>
              <div>
                <Sub>Cap:</Sub>
                <span>{selected.silverCap}</span>
              </div>
              <div>
                <Sub>Growth:</Sub>
                <span>{selected.silverGrowth * 60}</span>
              </div>
            </>
          ) : (
            <div>
              <Red>This planet does not produce silver.</Red>
            </div>
          )}
        </TooltipInfo>
      ) : (
        <>Select a planet to view more about its stats.</>
      )}
    </TooltipPane>
  );
}

export function RangeTooltipPane() {
  return (
    <TooltipPane name={TooltipName.Range}>
      <Sub>
        <White>Range:</White> how far you can send your forces.{' '}
        <White>Forces decay</White> the farther out you send them. <br />
        Higher range means that you can send forces the same distance with less
        decay.
      </Sub>
    </TooltipPane>
  );
}

export function MinPopTooltipPane() {
  return (
    <TooltipPane name={TooltipName.MinPop}>
      <Sub>
        The minimum population you need to send a move from this planet. <br />
        Moves incur a base cost of 5% of the planet's{' '}
        <White>Population Cap</White>.
      </Sub>
    </TooltipPane>
  );
}

export function Time50TooltipPane() {
  return (
    <TooltipPane name={TooltipName.Time50}>
      <Sub>
        Time to <White>50%</White> of full population. On silver-producing
        planets, <br /> silver starts growing at <White>50%</White>.
      </Sub>
    </TooltipPane>
  );
}

export function Time90TooltipPane() {
  return (
    <TooltipPane name={TooltipName.Time90}>
      <Sub>
        Time to <White>90%</White> of full population. Since population grows on
        an <br />
        s-curve, population growth slows drastically by this point.
      </Sub>
    </TooltipPane>
  );
}

export function PopGrowthTooltipPane() {
  return (
    <TooltipPane name={TooltipName.PopulationGrowth}>
      <Sub>
        <White>Population Growth:</White> the maximum growth rate of this
        planet's population <br />
        representing the rate at the middle of the <White>s-curve</White>.
      </Sub>
    </TooltipPane>
  );
}

export function SilverGrowthTooltipPane() {
  return (
    <TooltipPane name={TooltipName.PopulationGrowth}>
      <Sub>
        <White>Silver Growth</White>: the per-minute linear growth rate of this
        planet's silver.
      </Sub>
    </TooltipPane>
  );
}

export function SilverCapTooltipPane() {
  return (
    <TooltipPane name={TooltipName.SilverGrowth}>
      <Sub>
        <White>Silver Cap</White>: the maximum silver that this{' '}
        <White>silver-producing</White> planet <br />
        can grow to on its own.
      </Sub>
    </TooltipPane>
  );
}

export function SilverMaxTooltipPane() {
  return (
    <TooltipPane name={TooltipName.SilverMax}>
      <Sub>
        <White>Silver Max</White>: the maximum silver that this planet can hold.
        <br />
        Non <White>silver-producing</White> planets can still have silver moved
        onto them.
      </Sub>
    </TooltipPane>
  );
}

export function PiratesTooltipPane() {
  return (
    <TooltipPane name={TooltipName.Pirates}>
      <Sub>
        <Red>This planet has space pirates!</Red> Unoccupied planets must first
        be defeated <br /> before they can be conquered.
      </Sub>
    </TooltipPane>
  );
}

export function UpgradesTooltipPane() {
  return (
    <TooltipPane name={TooltipName.Upgrades}>
      <Sub>
        <White>Planet Rank</White>: The highest upgrade of your planet. Note
        that <br />
        <White>Rank 3</White> planets cannot upgrade other branches to Level 3.{' '}
        <br />
        Once you've chosen a stat, you're stuck with it!
      </Sub>
    </TooltipPane>
  );
}

export function ModalHelpTooltipPane() {
  return (
    <TooltipPane name={TooltipName.ModalHelp}>
      View patch notes and instruction
    </TooltipPane>
  );
}

export function ModalPlanetDetailsTooltipPane() {
  return (
    <TooltipPane name={TooltipName.ModalPlanetDetails}>
      View detailed information about the selected planet
    </TooltipPane>
  );
}

export function ModalLeaderboardTooltipPane() {
  return (
    <TooltipPane name={TooltipName.ModalLeaderboard}>
      View the top players, and their top planets
    </TooltipPane>
  );
}

export function ModalPlanetDexTooltipPane() {
  return (
    <TooltipPane name={TooltipName.ModalPlanetDex}>
      View a list of your planets
    </TooltipPane>
  );
}

export function ModalUpgradeDetailsTooltipPane() {
  return (
    <TooltipPane name={TooltipName.ModalUpgradeDetails}>
      Upgrade the selected planet
    </TooltipPane>
  );
}

export function ModalTwitterVerificationTooltipPane() {
  return (
    <TooltipPane name={TooltipName.ModalTwitterVerification}>
      Connect your address to Twitter
    </TooltipPane>
  );
}

export function ModalTwitterBroadcastTooltipPane() {
  return (
    <TooltipPane name={TooltipName.ModalTwitterBroadcast}>
      Broadcast the selected planet's coordinates to Twitter
    </TooltipPane>
  );
}

export function BonusPopCapTooltipPane() {
  return (
    <TooltipPane name={TooltipName.BonusPopCap}>
      <Green>
        This planet's <White>Population Cap</White> has been randomly doubled!
      </Green>
    </TooltipPane>
  );
}

export function BonusPopGroTooltipPane() {
  return (
    <TooltipPane name={TooltipName.BonusPopGro}>
      <Green>
        This planet's <White>Population Growth</White> has been randomly
        doubled!
      </Green>
    </TooltipPane>
  );
}

export function BonusSilCapTooltipPane({
  selected,
}: {
  selected: Planet | null;
}) {
  return (
    <TooltipPane name={TooltipName.BonusSilCap}>
      <Green>
        This planet's <White>Silver Cap</White> has been randomly doubled!
        <br />
        {selected?.planetResource !== PlanetResource.SILVER && (
          <Sub>
            <em>Unfortunately, it doesn't produce any silver...</em>
          </Sub>
        )}
      </Green>
    </TooltipPane>
  );
}

export function BonusSilGroTooltipPane({
  selected,
}: {
  selected: Planet | null;
}) {
  return (
    <TooltipPane name={TooltipName.BonusSilGro}>
      <Green>
        This planet's <White>Silver Growth</White> has been randomly doubled!
        <br />
        {selected?.planetResource !== PlanetResource.SILVER && (
          <Sub>
            <em>Unfortunately, it doesn't produce any silver...</em>
          </Sub>
        )}
      </Green>
    </TooltipPane>
  );
}

export function BonusRangeTooltipPane() {
  return (
    <TooltipPane name={TooltipName.BonusRange}>
      <Green>
        This planet's <White>Range</White> has been randomly doubled!
      </Green>
    </TooltipPane>
  );
}

export function ClownTooltipPane({ selected }: { selected: Planet | null }) {
  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);
  const [account, setAccount] = useState<EthAddress | null>(null);

  // sync account and twitter
  useEffect(() => {
    if (!uiManager) return;
    setAccount(uiManager.getAccount());
  }, [uiManager]);

  return (
    <TooltipPane name={TooltipName.Clowntown}>
      <span>
        {selected?.owner === account
          ? `You are the proud mayor of Clown Town!`
          : `It's a town of clowns...`}
      </span>
    </TooltipPane>
  );
}
